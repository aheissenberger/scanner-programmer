import BarcodeComponent from 'react-barcode';

import React, { useState, useRef, useCallback } from 'react';
// @ts-ignore
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TrashIcon, Pencil2Icon } from "@radix-ui/react-icons";
import { replaceSpecialChars } from '@/lib/utils';
import { decodeCode128Values } from '@/lib/barcode-decoder';

type Barcode = {
  id: string;
  value: string;
  note?: string;
};

function ProgrammerMode() {

  const [programmMode, setProgrammMode] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const programmTimer = useRef<NodeJS.Timeout | null>(null);

  // Ignore key events in programm mode
  React.useEffect(() => {
    if (!programmMode) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', handler, true);
    return () => {
      window.removeEventListener('keydown', handler, true);
    };
  }, [programmMode]);

  // Reset List
  const resetList = () => {
    setBarcodes([]);
    setDelay(1);
  }

  // Start programm mode
  const startProgrammMode = () => {
    setProgrammMode(true);
    setCurrentIdx(0);
    if (programmTimer.current) clearTimeout(programmTimer.current);
    setPaused(false);
  };

  // Stop programm mode
  const stopProgrammMode = () => {
    setProgrammMode(false);
    setCurrentIdx(0);
    if (programmTimer.current) clearTimeout(programmTimer.current);
    setPaused(false);
    setShowEmpty(false);
  };

  const [barcodes, setBarcodes] = useState<Barcode[]>(() => {
    const saved = localStorage.getItem('barcode-list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.barcodes)) {
          return parsed.barcodes;
        }
      } catch {
        // ignore parse error
      }
    }
    return [];
  });
  // Track which barcode is in edit mode
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [delay, setDelay] = useState(() => {
    const saved = localStorage.getItem('barcode-list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.delay === 'number' && parsed.delay >= 1 && parsed.delay <= 30) {
          return parsed.delay;
        }
      } catch {
        // ignore parse error
      }
    }
    return 1;
  });
  const [input, setInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // Barcode image upload and scan
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = new window.Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const codeReader = new BrowserMultiFormatReader();
          try {
            const result = await codeReader.decodeFromImageElement(img);
            setInput(decodeCode128Values(result.getRawBytes()));
          } catch (err) {
            alert('No barcode found in image.');
          }
        } catch (err) {
          alert('Failed to process image.');
        }
      };
      img.onerror = () => alert('Failed to load image.');
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Save barcodes and delay to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('barcode-list', JSON.stringify({ barcodes, delay }));
  }, [barcodes, delay]);

  // Add barcode
  const handleAdd = () => {
    if (input.trim()) {
      setBarcodes([...barcodes, { id: Date.now().toString(), value: input.trim(), note: noteInput.trim() }]);
      setInput('');
      setNoteInput('');
    }
  };

  // Drag and drop
  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    const updated = [...barcodes];
    const [removed] = updated.splice(draggedIdx, 1);
    updated.splice(idx, 0, removed);
    setBarcodes(updated);
    setDraggedIdx(null);
  };

  // Save list
  const handleSave = () => {
    const data = JSON.stringify({ barcodes, delay });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'barcodes.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load list
  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const loaded = JSON.parse(ev.target?.result as string);
        if (Array.isArray(loaded)) {
          setBarcodes(loaded);
        } else if (loaded && Array.isArray(loaded.barcodes)) {
          setBarcodes(loaded.barcodes);
          if (typeof loaded.delay === 'number' && loaded.delay >= 1 && loaded.delay <= 30) {
            setDelay(loaded.delay);
          }
        }
      } catch {
        // failed to parse
      }
    };
    reader.readAsText(file);
  };

  const nextBarcode = useCallback((idx: number) => {
    setShowEmpty(true);
    if (programmTimer.current) clearTimeout(programmTimer.current);
    programmTimer.current = setTimeout(() => {
      setShowEmpty(false);
      // Only advance if not at last barcode
      if (idx < barcodes.length - 1) {
        setCurrentIdx(idx + 1);
        const ms = Math.max(1, Math.min(delay, 30)) * 1000;
        programmTimer.current = setTimeout(() => {
          nextBarcode(idx + 1);
        }, ms);
      } else {
        // Stay on last barcode, do not advance out of bounds
        setCurrentIdx(barcodes.length); // show last barcode
      }
    }, 500); // 0.5s empty screen before barcode
  }, [barcodes.length, delay]);

  React.useEffect(() => {
    if (!programmMode) return;
    if (programmTimer.current) clearTimeout(programmTimer.current);
    // Fix: always start with currentIdx = 1 after initial delay
    if (!paused && barcodes.length > 0 && currentIdx >= 0 && currentIdx < barcodes.length) {
      const ms = Math.max(1, Math.min(delay, 30)) * 1000;
      programmTimer.current = setTimeout(() => {
        nextBarcode(currentIdx);
      }, ms);
    }
    return () => {
      if (programmTimer.current) clearTimeout(programmTimer.current);
    };
  }, [programmMode, paused, currentIdx, barcodes.length, delay, nextBarcode]);

  return (
    <>
      <h2>Scanner Programcodes Manager</h2>
  <Card style={{ marginBottom: '2rem', padding: '1rem', gap: 8 }}>
    <Input
      placeholder="Enter barcode value"
      value={input}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleAdd();
      }}
    />
    <Input
      placeholder="Add a note (optional)"
      value={noteInput}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNoteInput(e.target.value)}
    />
    <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button onClick={handleAdd}>Add Barcode</Button>

      <Button
        variant="outline"
        onClick={() => {
          // ensure file picker (no camera) by removing capture attribute if present
          if (imageInputRef.current) {
            imageInputRef.current.removeAttribute('capture');
            imageInputRef.current.click();
          }
        }}
        aria-label="Upload barcode image"
      >
        Upload Barcode Image
      </Button>

      <Button
        variant="secondary"
        onClick={() => {
          // request camera capture (mobile browsers will open camera)
          if (imageInputRef.current) {
            imageInputRef.current.setAttribute('capture', 'environment');
            imageInputRef.current.click();
            // cleanup attribute shortly after click to avoid affecting next upload
            setTimeout(() => imageInputRef.current?.removeAttribute('capture'), 500);
          }
        }}
        aria-label="Take photo with camera"
      >
        Take Photo
      </Button>
    </div>

    <input
      type="file"
      accept="image/*"
      ref={imageInputRef}
      style={{ display: 'none' }}
      onChange={handleImageUpload}
    />
  </Card>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, alignItems: 'center' }}>
        <Button onClick={handleSave}>Save List</Button>
        <Button onClick={() => fileInputRef.current?.click()}>Load List</Button>
        <Button onClick={resetList}>Reset List</Button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4, alignItems: 'center' }}>
        <Button
          variant={programmMode ? 'destructive' : 'default'}
          onClick={programmMode ? stopProgrammMode : startProgrammMode}
        >
          {programmMode ? 'Stop Program Mode' : 'Start Program Mode'}
        </Button>
        {programmMode && (
          <Button
            variant={paused ? 'outline' : 'secondary'}
            onClick={() => setPaused(p => !p)}
          >
            {paused ? 'Resume' : 'Pause'}
          </Button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <label htmlFor="delay" style={{ fontSize: '0.95em' }}>Delay:</label>
          <Input
            id="delay"
            type="number"
            min={1}
            max={30}
            value={delay}
            onChange={e => setDelay(Math.max(1, Math.min(30, Number(e.target.value))))}
            style={{ width: 60 }}
            disabled={programmMode}
          />
          <span style={{ fontSize: '0.95em' }}>sec</span>
        </div>
        <input
          type="file"
          accept="application/json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleLoad}
        />
      </div>
      <Card style={{ minHeight: 200, padding: '1rem', marginTop: '1rem' }}>
        {programmMode ? (
          showEmpty || currentIdx === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', minHeight: 120 }}></div>
          ) : barcodes.length > 0 && currentIdx <= barcodes.length && currentIdx > 0 && currentIdx <= barcodes.length ? (
            currentIdx <= barcodes.length ? (
              <div style={{ textAlign: 'center', fontSize: '1.5em', minHeight: 120 }}>
                <div style={{ marginBottom: 16 }}>
                  <BarcodeComponent value={replaceSpecialChars(barcodes[currentIdx - 1].value)} format="CODE128" height={80} displayValue={false} />
                </div>
                <div>{barcodes[currentIdx - 1].value}</div>
                {barcodes[currentIdx - 1].note && (
                  <div style={{ fontSize: '1em', color: '#888', marginTop: 8 }}>{barcodes[currentIdx - 1].note}</div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#888', minHeight: 120 }}></div>
            )
          ) : (
            <div style={{ textAlign: 'center', color: '#888', minHeight: 120 }}></div>
          )
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {barcodes.map((barcode, idx) => (
              <li
                key={barcode.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  marginBottom: '4px',
                  background: '#f6f6f6',
                  borderRadius: 4,
                  cursor: 'grab',
                  border: draggedIdx === idx ? '2px dashed #888' : '1px solid #ddd',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 4 }}>
                    <BarcodeComponent value={replaceSpecialChars(barcode.value)} format="CODE128" height={32} width={1.5} displayValue={false} />
                  </div>
                  {editIdx === idx ? (
                    <>
                      <Input
                        value={barcode.value}
                        style={{ marginBottom: 2 }}
                        onChange={e => {
                          const updated = [...barcodes];
                          updated[idx] = { ...updated[idx], value: e.target.value };
                          setBarcodes(updated);
                        }}
                        onBlur={e => {
                          const updated = [...barcodes];
                          updated[idx] = { ...updated[idx], value: e.target.value.trim() };
                          setBarcodes(updated);
                        }}
                      />
                      <Input
                        value={barcode.note || ''}
                        style={{ fontSize: '0.9em', color: '#888', marginTop: 2 }}
                        placeholder="Note"
                        onChange={e => {
                          const updated = [...barcodes];
                          updated[idx] = { ...updated[idx], note: e.target.value };
                          setBarcodes(updated);
                        }}
                        onBlur={e => {
                          const updated = [...barcodes];
                          updated[idx] = { ...updated[idx], note: e.target.value.trim() };
                          setBarcodes(updated);
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 500 }}>{barcode.value}</div>
                      {barcode.note && (
                        <div style={{ fontSize: '0.9em', color: '#888', marginTop: 2 }}>{barcode.note}</div>
                      )}
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={editIdx === idx ? "Preview barcode" : "Edit barcode"}
                  onClick={() => setEditIdx(editIdx === idx ? null : idx)}
                  style={{ marginRight: 4 }}
                >
                  <Pencil2Icon />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Delete barcode" onClick={() => setBarcodes(barcodes.filter((_, i) => i !== idx))}>
                  <TrashIcon />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

export default ProgrammerMode;
