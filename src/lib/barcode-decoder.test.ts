import { describe, it, expect } from 'vitest';
import { decodeCode128Values } from './barcode-decoder';

describe('decodeCode128Values', () => {
  it('decodes the provided example input', () => {
    const input = Uint8Array.from([105,1,60,2,60,3,10,4,100,5,96,6,25,7,6,8,106]);
    expect(decodeCode128Values(input)).toBe('606010{FNC3}9');
  });

  it('returns empty string for empty input', () => {
    expect(decodeCode128Values(Uint8Array.from([]))).toBe('');
  });

  it('returns empty string for non-array input', () => {
    // @ts-expect-error
    expect(decodeCode128Values(null)).toBe('');
    // @ts-expect-error
    expect(decodeCode128Values(undefined)).toBe('');
    // @ts-expect-error
    expect(decodeCode128Values('not an array')).toBe('');
  });

  it('decodes a simple Code 128 C sequence', () => {
    // [START_C, 12, 34, 56, checksum, STOP]
    const input = Uint8Array.from([105, 12, 34, 56, 0, 106]);
    expect(decodeCode128Values(input)).toBe('123456');
  });

  it('decodes a sequence with FNC1, FNC2, FNC3', () => {
    // [START_B, FNC1, 10, FNC2, 20, FNC3, 30, checksum, STOP]
    const input = Uint8Array.from([104, 102, 10, 97, 20, 96, 30, 0, 106]);
    expect(decodeCode128Values(input)).toBe('{FNC1}J{FNC2}T{FNC3>'); // 10+32=J, 20+32=T, 30+32=>
  });

  it('handles redundant CODE_B as FNC4 if enabled', () => {
    // [START_B, 10, CODE_B, 20, checksum, STOP]
    const input = Uint8Array.from([104, 10, 100, 20, 0, 106]);
    expect(decodeCode128Values(input)).toBe('J{FNC4}T');
  });

  it('does not emit FNC4 on redundant CODE_B if disabled', () => {
    const input = Uint8Array.from([104, 10, 100, 20, 0, 106]);
    expect(decodeCode128Values(input, { emitFNC4OnRedundantSwitch: false })).toBe('JT');
  });

  it('handles CODE_A and SHIFT correctly', () => {
    // [START_B, 10, SHIFT, 65, 20, CODE_A, 30, checksum, STOP]
    const input = Uint8Array.from([104, 10, 98, 65, 20, 101, 30, 0, 106]);
    // 10+32=J, SHIFT 65 as Set A (A), 20+32=T, switch to Set A, 30 as Set A (\x1e)
    expect(decodeCode128Values(input)).toBe('JA T\\x1e');
  });

  it('returns empty string for invalid start code', () => {
    const input = Uint8Array.from([99, 10, 20, 30, 0, 106]);
    expect(decodeCode128Values(input)).toBe('');
  });
});