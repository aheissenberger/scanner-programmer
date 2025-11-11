import BarcodeComponent from 'react-barcode';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { replaceSpecialChars } from '@/lib/utils';

type Barcode = {
  id: string;
  value: string;
  note?: string;
};

interface ProgramDisplayProps {
  barcodes: Barcode[];
  delay: number;
  onDelayChange: (delay: number) => void;
}

function ProgramDisplay({ barcodes, delay, onDelayChange }: ProgramDisplayProps) {
  const [programmMode, setProgrammMode] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const programmTimer = useRef<NodeJS.Timeout | null>(null);

  // Ignore key events in program mode
  useEffect(() => {
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

  // Start program mode
  const startProgrammMode = () => {
    setProgrammMode(true);
    setCurrentIdx(0);
    if (programmTimer.current) clearTimeout(programmTimer.current);
    setPaused(false);
  };

  // Stop program mode
  const stopProgrammMode = () => {
    setProgrammMode(false);
    setCurrentIdx(0);
    if (programmTimer.current) clearTimeout(programmTimer.current);
    setPaused(false);
    setShowEmpty(false);
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

  useEffect(() => {
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

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (programmTimer.current) clearTimeout(programmTimer.current);
    };
  }, []);

  return (
    <>
      <h2>Program Mode</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, alignItems: 'center' }}>
        <Button
          variant={programmMode ? 'destructive' : 'default'}
          onClick={programmMode ? stopProgrammMode : startProgrammMode}
          disabled={barcodes.length === 0}
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
            onChange={e => onDelayChange(Math.max(1, Math.min(30, Number(e.target.value))))}
            style={{ width: 60 }}
            disabled={programmMode}
          />
          <span style={{ fontSize: '0.95em' }}>sec</span>
        </div>
      </div>

      <Card style={{ minHeight: 200, padding: '1rem', marginTop: '1rem' }}>
        {barcodes.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No barcodes to display. Please add some barcodes in the management view.
          </div>
        ) : programmMode ? (
          showEmpty || currentIdx === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', minHeight: 120 }}></div>
          ) : barcodes.length > 0 && currentIdx <= barcodes.length && currentIdx > 0 && currentIdx <= barcodes.length ? (
            currentIdx <= barcodes.length ? (
              <div style={{ textAlign: 'center', fontSize: '1.5em', minHeight: 120 }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                  <BarcodeComponent value={replaceSpecialChars(barcodes[currentIdx - 1].value)} format="CODE128" height={80} displayValue={false} />
                </div>
                <div>{barcodes[currentIdx - 1].value}</div>
                {barcodes[currentIdx - 1].note && (
                  <div style={{ fontSize: '1em', color: '#888', marginTop: 8 }}>{barcodes[currentIdx - 1].note}</div>
                )}
                <div style={{ fontSize: '0.8em', color: '#aaa', marginTop: 12 }}>
                  {currentIdx} / {barcodes.length}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#888', minHeight: 120 }}></div>
            )
          ) : (
            <div style={{ textAlign: 'center', color: '#888', minHeight: 120 }}></div>
          )
        ) : (
          <div style={{ textAlign: 'center', color: '#888', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>
              <div style={{ marginBottom: 8 }}>Ready to start program mode</div>
              <div style={{ fontSize: '0.9em' }}>{barcodes.length} barcode{barcodes.length !== 1 ? 's' : ''} loaded</div>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

export default ProgramDisplay;