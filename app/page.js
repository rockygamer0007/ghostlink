"use client";
import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  
  // UI State
  const [mode, setMode] = useState('text'); 
  const [customMinutes, setCustomMinutes] = useState(10); 

  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
        // LIMIT: 3MB to allow for Base64 expansion (33%) within Vercel's 4.5MB limit
        if (selected.size > 3 * 1024 * 1024) {
            alert("⚠️ File too large! Max 3MB for this showcase.");
            e.target.value = ""; 
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

        const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: payloadContent, 
                duration: Number(customMinutes) 
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
        alert("Upload Failed: File might be too large.");
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link);
    alert("Copied!");
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
                            accept="image/*,video/*,audio/*,.pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <span className="text-3xl mb-2">☁️</span>
                        <span className="text-sm">{file ? file.name : "Click to Upload (Max 3MB)"}</span>
                    </div>
                )}
            </div>

            <div className="mb-6">
                <label className="block text-gray-500 text-xs mb-2 uppercase tracking-wider">Self-Destruct Timer (Minutes)</label>
                <div className="flex gap-2 items-center">
                    <input 
                        type="number" 
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        className="flex-1 bg-black border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none"
                    />
                    <span className="text-gray-500 text-sm">min</span>
                </div>
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
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 bg-green-900/30 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/50">
              <span className="text-2xl">🔒</span>
            </div>
            
            <h2 className="text-2xl font-bold text-green-400 mb-2">Secret Encrypted!</h2>
            <p className="text-gray-400 text-sm mb-6">Secured on IPFS & Shelby.</p>
            
            <div className="bg-black p-4 rounded border border-gray-700 break-all text-gray-400 text-xs mb-6 relative group">
                {link}
            </div>

            <button 
              onClick={copyToClipboard}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded mb-3 transition shadow-lg shadow-green-900/20"
            >
              Copy Link
            </button>

            {txHash && (
                <div className="mt-4 space-y-2">
                    <p className="text-gray-500 text-[10px] mb-2 italic">
                        *Anchored on Shelby Blockchain*
                    </p>
                    
                    {/* FIX: Using Aptos Explorer with Shelby Network param */}
                    <a 
                        href={`https://explorer.aptoslabs.com/txn/${txHash}/userTxnOverview?network=shelbynet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-2 border border-purple-500/30 text-purple-300 hover:bg-purple-900/20 text-sm font-bold rounded transition text-center"
                    >
                        🔍 View on Aptos Explorer
                    </a>

                    <a 
                        href={`https://explorer.shelby.xyz/shelbynet/account/0xc63d6a5efb0080a6029403131715bd4971e1149f7cc099aac69bb0069b3ddbf5`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-2 bg-purple-900/10 text-purple-400 text-xs rounded transition text-center hover:bg-purple-900/30"
                    >
                        📂 Account History (Backup)
                    </a>
                </div>
            )}
            
            <button 
              onClick={() => { setLink(null); setMessage(''); setFile(null); }}
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