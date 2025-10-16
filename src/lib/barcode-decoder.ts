export function decodeCode128Values(values: Uint8Array, { emitFNC4OnRedundantSwitch = true } = {}) {
  if (!values || values.length === 0) return '';

  // 1) Normalize: strip interleaved position markers like [105,1,60,2, ... ,106]
  // Heuristic: after START (103/104/105) if we see small increasing integers alternating,
  // treat odd items as "position counters" and drop them.
  const START_A = 103, START_B = 104, START_C = 105, STOP = 106;
  let seq = values.slice();

  const isStart = seq[0] === START_A || seq[0] === START_B || seq[0] === START_C;
  if (isStart && seq.length >= 4) {
    // Check pattern: [START, tiny, code, tiny, code, ..., maybe tiny, STOP]
    let looksInterleaved = true;
    for (let i = 1; i < seq.length - 1; i += 2) {
      const maybePos = seq[i];
      if (!(Number.isInteger(maybePos) && maybePos >= 0 && maybePos <= 64)) {
        looksInterleaved = false; break;
      }
    }
    if (looksInterleaved) {
      const cleaned = [seq[0]];
      for (let i = 2; i < seq.length; i += 2) {
        cleaned.push(seq[i]);
      }
      // If last two were [pos, STOP], ensure STOP present
      if (cleaned[cleaned.length - 1] !== STOP && seq[seq.length - 1] === STOP) {
        cleaned.push(STOP);
      }
      seq = Uint8Array.from(cleaned);
    }
  }

  // 2) Constants per Code 128 spec
  const CODE_C = 99, CODE_B = 100, CODE_A = 101;
  const FNC1 = 102, FNC2 = 97, FNC3 = 96, SHIFT = 98;
  // NOTE on FNC4:
  // In Code 128, FNC4 shares code values with the "CODE A/B" functions and is rarely used.
  // Practically: if 100 appears *while already in Code B*, many generators use it as FNC4.
  // We'll expose {FNC4} on redundant "CODE B" (or redundant "CODE A") if enabled.
  const POSSIBLE_FNC4 = 100;

  // 3) Determine starting code set
  let idx = 0;
  let set;
  const start = seq[idx++];
  if (start === START_A) set = 'A';
  else if (start === START_B) set = 'B';
  else if (start === START_C) set = 'C';
  else return ''; // invalid

  // 4) Walk codes until STOP (last code before STOP is the checksum; ignore it)
  // Find STOP and trim checksum if present
  const stopPos = seq.lastIndexOf(STOP);
  const end = stopPos === -1 ? seq.length : stopPos;
  // If checksum exists, it's the code just before STOP
  const lastDataIdx = (stopPos !== -1 && end - 2 >= 0) ? end - 2 : end - 1;

  let out = '';
  // Helper to append one symbol (A/B mapping)
function appendSetA(codeVal: number): void {
    // Set A maps 0–95 → ASCII 0–95
    const ch: number = codeVal;
    out += ch >= 32 ? String.fromCharCode(ch) : `\\x${ch.toString(16).padStart(2, '0')}`;
}
  function appendSetB(codeVal:number) {
    // Set B maps 0–95 → ASCII 32–127
    const ch = codeVal + 32;
    out += String.fromCharCode(ch);
  }

  while (idx <= lastDataIdx) {
    const code = seq[idx++];

    if (code === FNC1) { out += '{FNC1}'; continue; }
    if (code === FNC2) { out += '{FNC2}'; continue; }
    if (code === FNC3) { out += '{FNC3}'; continue; }

    if (code === SHIFT) {
      // SHIFT: temporary switch A<->B for ONE character
      if (idx > lastDataIdx) break;
      const next = seq[idx++];
      if (set === 'A') {
        // Next is encoded as if set B (0–95 -> ASCII 32–127)
        appendSetB(next);
      } else if (set === 'B') {
        // Next is encoded as if set A (0–95 -> ASCII 0–95)
        appendSetA(next);
      } else {
        // SHIFT not meaningful in set C; ignore or treat as no-op
      }
      continue;
    }

    if (code === CODE_A) { 
      // If we're already in A, this *may* be FNC4 in some generators
      if (set === 'A' && emitFNC4OnRedundantSwitch) { out += '{FNC4}'; continue; }
      set = 'A'; 
      continue; 
    }
    if (code === CODE_B) { 
      // If we're already in B, this *may* be FNC4 in some generators
      if (set === 'B' && emitFNC4OnRedundantSwitch) { out += '{FNC4}'; continue; }
      set = 'B'; 
      continue; 
    }
    if (code === CODE_C) { set = 'C'; continue; }

    // Data per current set
    if (set === 'C') {
      // In set C, 0–99 → "00".."99"
      if (code < 0 || code > 99) continue; // guard
      out += code.toString().padStart(2, '0');
    } else if (set === 'A') {
      // 0–95 map to ASCII 0–95
      if (code < 0 || code > 95) continue;
      appendSetA(code);
    } else { // set B
      // 0–95 map to ASCII 32–127
      if (code < 0 || code > 95) {
        // Special case: some encoders treat 100 in B as FNC4; handled above when redundant
        continue;
      }
      appendSetB(code);
    }
  }

  return out;
}
