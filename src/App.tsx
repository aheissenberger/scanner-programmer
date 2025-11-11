
import BarcodeManager from './components/BarcodeManager';
import ProgramDisplay from './components/ProgramDisplay';
import { QRTestMode } from './components/QRTestMode';
import { useState, useEffect } from 'react';

type Mode = 'manager' | 'program' | 'qrtest';

type Barcode = {
  id: string;
  value: string;
  note?: string;
};

function App() {
  const [mode, setMode] = useState<Mode>('manager');
  const [qrText, setQrText] = useState('');

  // Shared barcode list state
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

  // Shared delay state
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

  // Save barcodes and delay to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('barcode-list', JSON.stringify({ barcodes, delay }));
  }, [barcodes, delay]);

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: '1rem' }}>
      {/* Simple navbar with hamburger menu for mode switching */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 20 }}>Scanner Programmer</div>
        <div style={{ position: 'relative' }}>
          <button
            aria-label="Open menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 6 }}
            onClick={_e => {
              const menu = document.getElementById('main-menu');
              if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            }}
          >
            {/* Hamburger icon */}
            <span style={{ display: 'block', width: 24, height: 3, background: '#333', marginBottom: 4, borderRadius: 2 }}></span>
            <span style={{ display: 'block', width: 24, height: 3, background: '#333', marginBottom: 4, borderRadius: 2 }}></span>
            <span style={{ display: 'block', width: 24, height: 3, background: '#333', borderRadius: 2 }}></span>
          </button>
          <div
            id="main-menu"
            style={{
              display: 'none',
              position: 'absolute',
              right: 0,
              top: 36,
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              zIndex: 10,
              minWidth: 180,
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.display = 'none';
            }}
          >
            <button
              style={{
                width: '100%',
                padding: '12px 16px',
                background: mode === 'manager' ? '#f6f6f6' : 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: mode === 'manager' ? 600 : 400,
                borderRadius: 8,
              }}
              onClick={() => {
                setMode('manager');
                const menu = document.getElementById('main-menu');
                if (menu) menu.style.display = 'none';
              }}
            >
              Barcode Manager
            </button>
            <button
              style={{
                width: '100%',
                padding: '12px 16px',
                background: mode === 'program' ? '#f6f6f6' : 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: mode === 'program' ? 600 : 400,
                borderRadius: 8,
              }}
              onClick={() => {
                setMode('program');
                const menu = document.getElementById('main-menu');
                if (menu) menu.style.display = 'none';
              }}
            >
              Program Mode
            </button>
            <button
              style={{
                width: '100%',
                padding: '12px 16px',
                background: mode === 'qrtest' ? '#f6f6f6' : 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: mode === 'qrtest' ? 600 : 400,
                borderRadius: 8,
              }}
              onClick={() => {
                setMode('qrtest');
                const menu = document.getElementById('main-menu');
                if (menu) menu.style.display = 'none';
              }}
            >
              Scanner Output Tester
            </button>
          </div>
        </div>
      </nav>
      {mode === 'manager' ? (
        <BarcodeManager barcodes={barcodes} onBarcodesChange={setBarcodes} />
      ) : mode === 'program' ? (
        <ProgramDisplay barcodes={barcodes} delay={delay} onDelayChange={setDelay} />
      ) : (
        <QRTestMode qrText={qrText} setQrText={setQrText} />
      )}
    </div>
  );
}

export default App;
