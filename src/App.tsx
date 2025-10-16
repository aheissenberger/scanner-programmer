
import ProgrammerMode from './components/ProgrammerMode';
import { QRTestMode } from './components/QRTestMode';
import { useState } from 'react';

type Mode = 'programmer' | 'qrtest';

function App() {
  const [mode, setMode] = useState<Mode>('programmer');
  const [qrText, setQrText] = useState('');

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: '1rem' }}>
      {/* Simple navbar with hamburger menu for mode switching */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 20 }}>Scanner Programmer</div>
        <div style={{ position: 'relative' }}>
          <button
            aria-label="Open menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 6 }}
            onClick={e => {
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
                background: mode === 'programmer' ? '#f6f6f6' : 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: mode === 'programmer' ? 600 : 400,
                borderRadius: 8,
              }}
              onClick={() => {
                setMode('programmer');
                const menu = document.getElementById('main-menu');
                if (menu) menu.style.display = 'none';
              }}
            >
              Programmer Mode
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
      {mode === 'programmer' ? (
        <ProgrammerMode />
      ) : (
        <QRTestMode qrText={qrText} setQrText={setQrText} />
      )}
    </div>
  );
}

export default App;
