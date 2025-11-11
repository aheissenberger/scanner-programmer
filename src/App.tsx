
import BarcodeManager from './components/BarcodeManager';
import ProgramDisplay from './components/ProgramDisplay';
import { QRTestMode } from './components/QRTestMode';
import { useState, useEffect } from 'react';
import { loadFromCurrentUrl, clearUrlCache } from './lib/barcodelist2url';

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
  const [barcodes, setBarcodes] = useState<Barcode[]>([]);

  // Shared delay state
  const [delay, setDelay] = useState(1);

  // Track if initial data has been loaded to prevent localStorage overwrite
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    // Skip if we've already loaded initial data (prevents double-run in StrictMode)
    if (initialDataLoaded) {
      return;
    }

    const loadInitialData = () => {
      // Check if URL has compressed data using cached function
      const urlData = loadFromCurrentUrl();
      console.log('Loaded data from URL:', urlData);
      
      if (urlData) {
        try {
          const data = urlData as { barcodes: Barcode[]; delay: number };
          if (data && Array.isArray(data.barcodes)) {
            const validDelay = typeof data.delay === 'number' && data.delay >= 1 && data.delay <= 30 ? data.delay : 1;
            setBarcodes(data.barcodes);
            setDelay(validDelay);
            setInitialDataLoaded(true);
            // Switch to program mode when loading from URL
            if (data.barcodes.length > 0) {
              setMode('program');
            }
            return;
          }
        } catch (error) {
          // Failed to process URL data, fall back to localStorage
          console.warn('Failed to process URL data, falling back to localStorage:', error);
        }
      }

      // Fall back to localStorage if no URL data or URL parsing failed
      const saved = localStorage.getItem('barcode-list');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.barcodes)) {
            const validDelay = typeof parsed.delay === 'number' && parsed.delay >= 1 && parsed.delay <= 30 ? parsed.delay : 1;
            setBarcodes(parsed.barcodes);
            setDelay(validDelay);
            setInitialDataLoaded(true);
            // Switch to program mode when loading from localStorage with barcodes
            if (parsed.barcodes.length > 0) {
              setMode('program');
            }
            return;
          }
        } catch {
          console.warn('Failed to parse localStorage data');
        }
      }
      
      // No data found anywhere, use defaults
      setBarcodes([]);
      setDelay(1);
      setInitialDataLoaded(true);
    };

    loadInitialData();
  }, [initialDataLoaded]);

  // Clear the URL after data is loaded (separate effect to avoid timing issues)
  useEffect(() => {
    if (initialDataLoaded && window.location.pathname.includes('/bcl/')) {
      // Clear the URL after loading from it and clear the cache
      window.history.replaceState({}, '', '/');
      clearUrlCache();
    }
  }, [initialDataLoaded]);

  // Save barcodes and delay to localStorage whenever they change (but only after initial load)
  useEffect(() => {
    if (initialDataLoaded) {
      console.log('Saving barcode list and delay to localStorage');
      localStorage.setItem('barcode-list', JSON.stringify({ barcodes, delay }));
    }
  }, [barcodes, delay, initialDataLoaded]);

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
        <BarcodeManager barcodes={barcodes} onBarcodesChange={setBarcodes} delay={delay} />
      ) : mode === 'program' ? (
        <ProgramDisplay barcodes={barcodes} delay={delay} onDelayChange={setDelay} />
      ) : (
        <QRTestMode qrText={qrText} setQrText={setQrText} />
      )}
    </div>
  );
}

export default App;
