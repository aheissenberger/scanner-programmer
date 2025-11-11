// @ts-ignore
import Quagga from 'quagga';
import BarcodeComponent from 'react-barcode';
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TrashIcon, Pencil2Icon } from "@radix-ui/react-icons";
import { Save, FolderOpen, Share2, RotateCcw } from 'lucide-react';
import { replaceSpecialChars } from '@/lib/utils';
import { decodeCode128Values } from '@/lib/barcode-decoder';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { generateBarcodeListUrl } from '@/lib/barcodelist2url';

type Barcode = {
  id: string;
  value: string;
  note?: string;
};

interface BarcodeManagerProps {
  barcodes: Barcode[];
  onBarcodesChange: (barcodes: Barcode[]) => void;
  delay: number;
}

function BarcodeManager({ barcodes, onBarcodesChange, delay }: BarcodeManagerProps) {
  // Camera barcode scan state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  // Track which barcode is in edit mode
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Preview state for clipboard image
  const [clipboardImageUrl, setClipboardImageUrl] = useState<string | null>(null);

  // State for share feedback
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  // Start camera and scan barcode
  const handleStartCameraScan = () => {
    setCameraError(null);
    setCameraActive(true);
    setTimeout(() => {
      if (!videoRef.current) return;
      Quagga.init({
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: videoRef.current,
          constraints: {
            facingMode: 'environment',
          },
        },
        decoder: {
          readers: ['code_128_reader'],
        },
        locate: true,
      }, (err: any) => {
        if (err) {
          setCameraError('Camera initialization failed: ' + err);
          setCameraActive(false);
          return;
        }
        Quagga.start();
      });
      Quagga.onDetected((data: any) => {
        if (data && data.codeResult && data.codeResult.code) {
          const rawData = data.codeResult.decodedCodes.map((c: any) => c.code);
          setInput(decodeCode128Values(Uint8Array.from(rawData)));
          setCameraActive(false);
          Quagga.stop();
        }
      });
    }, 100);
  };

  // Stop camera scan
  const handleStopCameraScan = () => {
    setCameraActive(false);
    Quagga.stop();
  };

  // Reset List
  const resetList = () => {
    onBarcodesChange([]);
  };

  // Barcode image upload and scan
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = new window.Image();
      let imgUrl;
      img.onload = async () => {
        try {
          let width = img.width;
          let height = img.height;
          // Resize if width or height > 600px
          if (width > 600 || height > 600) {
            const scale = Math.min(600 / width, 600 / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, width, height);
          imgUrl = canvas.toDataURL();
          const hints = new Map();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
          hints.set(DecodeHintType.TRY_HARDER, true);
          const codeReader = new BrowserMultiFormatReader(hints);
          try {
            // Use decodeFromImageElement only if not resized, otherwise decode from canvas
            if (width !== img.width || height !== img.height) {
              const result = await codeReader.decodeFromCanvas(canvas);
              setInput(decodeCode128Values(result.getRawBytes()));
            } else {
              const result = await codeReader.decodeFromImageElement(img);
              setInput(decodeCode128Values(result.getRawBytes()));
            }
          } catch {
            setClipboardImageUrl(imgUrl);
            alert('No barcode found in image.');
          }
        } catch {
          alert('Failed to process image.');
        }
      };
      img.onerror = () => alert('Failed to load image.');
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Barcode image paste from clipboard
  const handlePasteFromClipboard = async () => {
    try {
      const clipboardItems = await (navigator.clipboard as any).read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            let imgUrl = URL.createObjectURL(blob);
            const img = new window.Image();
            img.onload = async () => {
              try {
                let canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.drawImage(img, 0, 0, img.width, img.height);
                const hints = new Map();
                hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
                hints.set(DecodeHintType.TRY_HARDER, true);
                const codeReader = new BrowserMultiFormatReader(hints);
                try {
                  //const result = await codeReader.decodeFromImageElement(img);
                  const result = await ((img.width < 300) ? codeReader.decodeFromCanvas(canvas) : codeReader.decodeFromImageElement(img));
                  setInput(decodeCode128Values(result.getRawBytes()));
                  setClipboardImageUrl(null); // clear preview if barcode found
                } catch {
                  setClipboardImageUrl(imgUrl); // show preview if no barcode found
                  alert('No barcode found in image. Image Size: ' + img.width + 'x' + img.height);
                }
              } catch {
                setClipboardImageUrl(imgUrl); // show preview if failed to process
                alert('Failed to process image.');
              }
            };
            img.onerror = () => {
              setClipboardImageUrl(imgUrl);
              alert('Failed to load image.');
            };
            img.src = imgUrl;
            return;
          }
        }
      }
      alert('No image found in clipboard.');
    } catch {
      alert('Failed to read clipboard. Your browser may not support image clipboard access.');
    }
  };

  // Add barcode
  const handleAdd = () => {
    if (input.trim()) {
      onBarcodesChange([...barcodes, { id: Date.now().toString(), value: input.trim(), note: noteInput.trim() }]);
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
    onBarcodesChange(updated);
    setDraggedIdx(null);
  };

  // Save list
  const handleSave = () => {
    const data = JSON.stringify({ barcodes });
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
          onBarcodesChange(loaded);
        } else if (loaded && Array.isArray(loaded.barcodes)) {
          onBarcodesChange(loaded.barcodes);
        }
      } catch {
        // failed to parse
      }
    };
    reader.readAsText(file);
  };

  // Share list as URL
  const handleShare = async () => {
    try {
      const shareData = { barcodes, delay };
      const shareUrl = generateBarcodeListUrl(shareData);
      
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('URL copied to clipboard!');
      
      // Clear the status message after 3 seconds
      setTimeout(() => setShareStatus(null), 3000);
    } catch {
      setShareStatus('Failed to copy URL to clipboard');
      setTimeout(() => setShareStatus(null), 3000);
    }
  };

  return (
    <>
      <h2>Barcode List Manager</h2>
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
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Button
            variant="outline"
            onClick={handleStartCameraScan}
            aria-label="Scan barcode from camera"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 4 }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </span>
            Scan Barcode
          </Button>
          {cameraActive && (
            <div style={{ marginTop: 12, marginBottom: 8 }}>
              <div ref={videoRef} style={{ width: 320, height: 240, background: '#222', borderRadius: 8, overflow: 'hidden' }} />
              <Button variant="destructive" style={{ marginTop: 8 }} onClick={handleStopCameraScan}>Stop Camera</Button>
              {cameraError && <div style={{ color: 'red', marginTop: 4 }}>{cameraError}</div>}
            </div>
          )}

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
            <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 4 }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 5 17 10" />
                <line x1="12" y1="5" x2="12" y2="19" />
              </svg>
            </span>
            Barcode Image
          </Button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Button
              variant="outline"
              onClick={handlePasteFromClipboard}
              aria-label="Paste barcode image from clipboard"
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 4 }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  <path d="M12 11v6" />
                  <path d="M9 14l3 3 3-3" />
                </svg>
              </span>
              Paste Image
            </Button>
            {clipboardImageUrl && (
              <div style={{ marginTop: 8, maxWidth: 180 }}>
                <span style={{ fontSize: '0.9em', color: '#888' }}>Clipboard Image Preview:</span>
                <img src={clipboardImageUrl} alt="Clipboard preview" style={{ width: '100%', borderRadius: 4, border: '1px solid #ccc', marginTop: 4 }} />
              </div>
            )}
          </div>
        </div>

        <Button onClick={handleAdd}>Add Barcode</Button>

        <input
          type="file"
          accept="image/*"
          ref={imageInputRef}
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
      </Card>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, alignItems: 'center' }}>
        <Button onClick={handleSave}>
          <Save size={16} style={{ marginRight: 6 }} />
          Save List
        </Button>
        <Button onClick={() => fileInputRef.current?.click()}>
          <FolderOpen size={16} style={{ marginRight: 6 }} />
          Load List
        </Button>
        <Button onClick={handleShare} disabled={barcodes.length === 0}>
          <Share2 size={16} style={{ marginRight: 6 }} />
          Share List
        </Button>
        <Button onClick={resetList}>
          <RotateCcw size={16} style={{ marginRight: 6 }} />
          Reset List
        </Button>
        {shareStatus && (
          <span style={{ 
            fontSize: '0.9em', 
            color: shareStatus.includes('Failed') ? '#dc3545' : '#28a745',
            marginLeft: 8 
          }}>
            {shareStatus}
          </span>
        )}
        <input
          type="file"
          accept="application/json"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleLoad}
        />
      </div>

      <Card style={{ minHeight: 200, padding: '1rem', marginTop: '1rem' }}>
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
                        onBarcodesChange(updated);
                      }}
                      onBlur={e => {
                        const updated = [...barcodes];
                        updated[idx] = { ...updated[idx], value: e.target.value.trim() };
                        onBarcodesChange(updated);
                      }}
                    />
                    <Input
                      value={barcode.note || ''}
                      style={{ fontSize: '0.9em', color: '#888', marginTop: 2 }}
                      placeholder="Note"
                      onChange={e => {
                        const updated = [...barcodes];
                        updated[idx] = { ...updated[idx], note: e.target.value };
                        onBarcodesChange(updated);
                      }}
                      onBlur={e => {
                        const updated = [...barcodes];
                        updated[idx] = { ...updated[idx], note: e.target.value.trim() };
                        onBarcodesChange(updated);
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
              <Button variant="ghost" size="icon" aria-label="Delete barcode" onClick={() => onBarcodesChange(barcodes.filter((_, i) => i !== idx))}>
                <TrashIcon />
              </Button>
            </li>
          ))}
        </ul>
        {barcodes.length === 0 && (
          <div style={{ textAlign: 'center', color: '#888', marginTop: 32 }}>
            No barcodes added yet. Use the form above to add barcodes to your list.
          </div>
        )}
      </Card>
    </>
  );
}

export default BarcodeManager;