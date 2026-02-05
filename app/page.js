"use client";
import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  
  // UI State
  const [mode, setMode] = useState('text'); // 'text' or 'file'
  const [timerMode, setTimerMode] = useState('burn'); // 'burn' or 'timer'
  const [customMinutes, setCustomMinutes] = useState(10); // Default 10 mins if timer selected

  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
        if (selected.size > 5 * 1024 * 1024) {
            alert("File is too big! Max 5MB.");
            return;
        }
        setFile(selected);
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
  };

  const createGhostLink = async () => {
    if (!message && !file) return;
    setLoading(true);

    try {
        let payloadContent = message;
        if (mode === 'file' && file) {
            payloadContent = await convertFileToBase64(file);
        }

        // Calculate Duration based on Mode
        // If 'burn' mode, duration is 0. If 'timer' mode, use the input value.
        const finalDuration = timerMode === 'burn' ? 0 : Number(customMinutes);

        const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: payloadContent, 
                duration: finalDuration
            }),
        });

        const data = await res.json();
        if (data.link) {
            setLink(data.link);
            setTxHash(data.txHash);
        } else {
            alert("Error: " + JSON.stringify(data));
        }

    } catch (error) {
        console.error(error);
        alert("System Error");
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link);
    alert("Copied to clipboard! 👻");
  };

  return (
    <div className="min-h-screen bg-black text-green-400 flex flex-col items-center justify-center p-4 font-mono">
      
      <h1 className="text-6xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 animate-pulse">
        GhostLink
      </h1>
      <div className="mb-8 px-4 py-1 rounded-full bg-purple-900/30 border border-purple-500/50 text-xs text-purple-300 tracking-widest uppercase">
        ● Powered by Shelby
      </div>

      <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl max-w-md w-full relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-purple-500 to-pink-500"></div>

        {!link ? (
          <>
            {/* TABS (Text vs File) */}
            <div className="flex mb-6 border-b border-gray-700 pb-2">
                <button 
                    onClick={() => setMode('text')}
                    className={`flex-1 pb-2 text-center transition ${mode === 'text' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    📝 Text
                </button>
                <button 
                    onClick={() => setMode('file')}
                    className={`flex-1 pb-2 text-center transition ${mode === 'file' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    📂 File
                </button>
            </div>

            {/* INPUT AREA */}
            <div className="mb-6">
                {mode === 'text' ? (
                    <textarea 
                        className="w-full h-32 bg-black border border-gray-700 rounded p-4 text-green-400 focus:outline-none focus:border-green-500 transition resize-none"
                        placeholder="Write your secret here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                ) : (
                    <div className="w-full h-32 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-purple-500 hover:text-purple-400 transition cursor-pointer relative">
                        <input 
                            type="file" 
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <span className="text-3xl mb-2">☁️</span>
                        <span className="text-sm">{file ? file.name : "Click to Upload (Max 5MB)"}</span>
                    </div>
                )}
            </div>

            {/* DESIGN RESTORED: Red/Blue Toggle Buttons */}
            <div className="mb-6">
                <div className="flex bg-gray-950 rounded p-1 border border-gray-800">
                    <button
                        onClick={() => setTimerMode('burn')}
                        className={`flex-1 py-2 rounded text-sm font-bold transition flex items-center justify-center gap-2
                            ${timerMode === 'burn' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        🔥 Burn on Read
                    </button>
                    <button
                        onClick={() => setTimerMode('timer')}
                        className={`flex-1 py-2 rounded text-sm font-bold transition flex items-center justify-center gap-2
                            ${timerMode === 'timer' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        ⏳ Set Timer
                    </button>
                </div>

                {/* Conditional Input: Only shows if "Set Timer" is clicked */}
                {timerMode === 'timer' && (
                    <div className="mt-4 animate-fade-in flex gap-2 items-center">
                        <input 
                            type="number" 
                            value={customMinutes}
                            onChange={(e) => setCustomMinutes(e.target.value)}
                            className="flex-1 bg-black border border-gray-700 rounded p-2 text-white text-center focus:border-blue-500 outline-none"
                        />
                        <span className="text-gray-500 text-sm">minutes</span>
                    </div>
                )}
            </div>

            <button 
              onClick={createGhostLink}
              disabled={loading || (!message && !file)}
              className={`w-full py-4 rounded font-bold text-black transition transform hover:scale-[1.02] active:scale-95
                ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-green-400 to-emerald-600 hover:shadow-[0_0_20px_rgba(52,211,153,0.5)]'}
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Encrypting...
                </span>
              ) : "Create GhostLink"}
            </button>
          </>
        ) : (
          /* SUCCESS SCREEN */
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 bg-green-900/30 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/50">
              <span className="text-2xl">🔒</span>
            </div>
            
            <h2 className="text-2xl font-bold text-green-400 mb-2">Secret Encrypted!</h2>
            <p className="text-gray-400 text-sm mb-6">Your data is secured on the Shelby Network.</p>
            
            <div className="bg-black p-4 rounded border border-gray-700 break-all text-gray-400 text-xs mb-6 relative group">
                {link}
            </div>

            <button 
              onClick={copyToClipboard}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded mb-3 transition shadow-lg shadow-green-900/20"
            >
              Copy GhostLink
            </button>

            {txHash && (
                <a 
                    href={`https://explorer.shelby.xyz/shelbynet/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 border border-purple-500/50 text-purple-300 hover:bg-purple-900/20 font-bold rounded transition text-center"
                >
                    🔍 View on Shelby Explorer
                </a>
            )}
            
            <button 
              onClick={() => { setLink(null); setMessage(''); setFile(null); setTimerMode('burn'); }}
              className="mt-6 text-gray-600 hover:text-gray-400 text-sm transition"
            >
              ← Create New Secret
            </button>
          </div>
        )}
      </div>
    </div>
  );
}