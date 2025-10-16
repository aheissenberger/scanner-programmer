
import React, { useState } from 'react';
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { QRCodeCanvas } from 'qrcode.react';
import { EyeOpenIcon, Pencil2Icon, TrashIcon } from '@radix-ui/react-icons';



interface QRTestModeProps {
    qrText: string;
    setQrText: React.Dispatch<React.SetStateAction<string>>;
}


export function QRTestMode({ qrText, setQrText }: QRTestModeProps) {
    // editMode: true = show input, false = show QR/text only
    const [editMode, setEditMode] = useState(qrText === '');
    // For logging key presses in view mode
    const [keyLog, setKeyLog] = useState<string[]>([]);
    const logAreaRef = React.useRef<HTMLDivElement>(null);

    // If text is cleared, always go to edit mode
    React.useEffect(() => {
        if (!qrText) setEditMode(true);
    }, [qrText]);

    // Key event handler for view mode
    React.useEffect(() => {
        if (!editMode && qrText) {
            const handleKeyDown = (e: KeyboardEvent) => {
                // Requirement 6: do not output the shift key
                if (e.key === 'Shift' || e.key === 'ShiftLeft' || e.key === 'ShiftRight') return;
                let display = '';
                if (e.key.length === 1 && e.key.charCodeAt(0) >= 32 && e.key.charCodeAt(0) !== 127) {
                    display = e.key;
                } else {
                    // Map special keys
                    const code = e.keyCode || e.which;
                    const keyMap: Record<string, string> = {
                        'Escape': `<Esc=27>`,
                        'Enter': `<LF=10>`,
                        'Tab': `<Tab=9>`,
                        'Backspace': `<BS=8>`,
                        'ArrowUp': `<Up=38>`,
                        'ArrowDown': `<Down=40>`,
                        'ArrowLeft': `<Left=37>`,
                        'ArrowRight': `<Right=39>`,
                        'Delete': `<Del=46>`,
                        'Insert': `<Ins=45>`,
                        'Home': `<Home=36>`,
                        'End': `<End=35>`,
                        'PageUp': `<PgUp=33>`,
                        'PageDown': `<PgDn=34>`,
                        'F1': `<F1=112>`,
                        'F2': `<F2=113>`,
                        'F3': `<F3=114>`,
                        'F4': `<F4=115>`,
                        'F5': `<F5=116>`,
                        'F6': `<F6=117>`,
                        'F7': `<F7=118>`,
                        'F8': `<F8=119>`,
                        'F9': `<F9=120>`,
                        'F10': `<F10=121>`,
                        'F11': `<F11=122>`,
                        'F12': `<F12=123>`,
                    };
                    display = keyMap[e.key] || `<${e.key}=${code}>`;
                }
                setKeyLog(log => [...log, display]);
                // Scroll to bottom
                setTimeout(() => {
                    if (logAreaRef.current) {
                        logAreaRef.current.scrollTop = logAreaRef.current.scrollHeight;
                    }
                }, 0);
            };
            window.addEventListener('keydown', handleKeyDown, true);
            return () => window.removeEventListener('keydown', handleKeyDown, true);
        }
    }, [editMode, qrText]);

    // Clear log when switching to input mode or text changes
    React.useEffect(() => {
        if (editMode) setKeyLog([]);
    }, [editMode, qrText]);

    return (
        <>
            <h2>Scanner Output Tester</h2>
            <Card style={{ minHeight: 200, padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, minHeight: 200 }}>
                    {/* Input mode: only show input if no text or in edit mode */}
                    {(editMode || !qrText) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center' }}>
                            <Input
                                placeholder="Enter text to generate QR code"
                                value={qrText}
                                onChange={e => setQrText(e.target.value)}
                                style={{ maxWidth: 320, marginBottom: 0 }}
                            />
                            {/* Only show switch-to-view icon if there is text */}
                            {qrText && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Show QR code only"
                                    onClick={() => setEditMode(false)}
                                    style={{ marginLeft: 4 }}
                                >
                                    <EyeOpenIcon />
                                </Button>
                            )}
                        </div>
                    ) : (
                        // View mode: show QR and text, and icon to switch to input
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
                            <QRCodeCanvas value={qrText} size={200} />
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: 18, margin: '8px 0' }}>
                                <span>{qrText}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Edit QR text"
                                    onClick={() => setEditMode(true)}
                                    style={{ marginLeft: 8 }}
                                >
                                    <Pencil2Icon />
                                </Button>
                            </div>
                            {/* Key log area with trash icon to clear */}
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 340, marginTop: 16 }}>
                                <div
                                    ref={logAreaRef}
                                    style={{
                                        flex: 1,
                                        minHeight: 40,
                                        maxHeight: 120,
                                        overflowY: 'auto',
                                        background: '#f6f6f6',
                                        borderRadius: 6,
                                        padding: 8,
                                        fontFamily: 'monospace',
                                        fontSize: 15,
                                        color: '#333',
                                        boxSizing: 'border-box',
                                    }}
                                    aria-label="Key log"
                                >
                                    {keyLog.length === 0 ? (
                                        <span style={{ color: '#aaa' }}>Scan the Code to log the Output...</span>
                                    ) : (
                                        keyLog.map((k, i) => <span key={i}>{k}</span>)
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Clear key log"
                                    onClick={() => setKeyLog([])}
                                    style={{ marginLeft: 8 }}
                                >
                                    <TrashIcon />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </>
    );
}
