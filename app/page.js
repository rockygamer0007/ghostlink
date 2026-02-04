'use client';
import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');
  const [burnMode, setBurnMode] = useState('instant'); 
  const [customMinutes, setCustomMinutes] = useState('10');
  
  const [link, setLink] = useState('');
  const [txHash, setTxHash] = useState(''); // Stores the blockchain receipt
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBurn = async () => {
    if (!message) return;
    setLoading(true);
    setError('');
    setLink('');
    setTxHash('');

    const finalDuration = burnMode === 'instant' ? 0 : Number(customMinutes);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, duration: finalDuration }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setLink(data.link);
      setTxHash(data.txHash); 
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
          GhostLink
        </h1>

        <div className="flex justify-center mb-8">
            <div className="px-3 py-1 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center gap-2 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                <span className="text-[10px] font-mono text-purple-300 tracking-wider">
                    POWERED BY SHELBY
                </span>
            </div>
        </div>

        {!link ? (
          <div className="flex flex-col gap-4">
            <textarea
              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors min-h-[120px]"
              placeholder="Write your secret here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2 bg-gray-900 p-1 rounded-lg border border-gray-800">
                <button 
                    onClick={() => setBurnMode('instant')}
                    className={`py-2 rounded-md text-sm font-bold transition-all ${
                        burnMode === 'instant' 
                        ? 'bg-red-500 text-white shadow-lg' 
                        : 'text-gray-500 hover:text-white'
                    }`}
                >
                    🔥 Burn on Read
                </button>
                <button 
                    onClick={() => setBurnMode('timer')}
                    className={`py-2 rounded-md text-sm font-bold transition-all ${
                        burnMode === 'timer' 
                        ? 'bg-purple-600 text-white shadow-lg' 
                        : 'text-gray-500 hover:text-white'
                    }`}
                >
                    ⏳ Set Timer
                </button>
            </div>

            {burnMode === 'timer' && (
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg p-3 animate-fade-in">
                    <span className="text-gray-400 text-sm">Self-destruct in:</span>
                    <input 
                        type="number" 
                        min="1"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        className="bg-black border border-gray-700 rounded px-2 py-1 text-white w-20 text-center focus:border-purple-500 outline-none"
                    />
                    <span className="text-gray-400 text-sm">minutes</span>
                </div>
            )}

            <button
              onClick={handleBurn}
              disabled={loading || !message}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-all mt-2 ${
                loading || !message
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : burnMode === 'instant'
                    ? 'bg-white text-red-600 hover:bg-gray-200'
                    : 'bg-white text-purple-600 hover:bg-gray-200'
              }`}
            >
              {loading ? 'Encrypting...' : 'Encrypt & Burn'}
            </button>

            {error && <div className="text-red-400 text-sm">{error}</div>}
          </div>
        ) : (
          <div className="bg-gray-900 border border-green-900 rounded-xl p-6 animate-fade-in">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center text-2xl">
                🔒
              </div>
              <h3 className="text-xl font-bold text-green-400">Secret Encrypted!</h3>
              
              <div className="w-full bg-black p-3 rounded border border-gray-800 break-all text-sm text-gray-400 font-mono">
                {link}
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => navigator.clipboard.writeText(link)}
                  className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold transition-all"
                >
                  Copy GhostLink
                </button>

                {/* THE CORRECTED EXPLORER BUTTON */}
                {txHash && (
                    <a 
                      href={`https://explorer.aptoslabs.com/txn/${txHash}/userTxnOverview?network=shelbynet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full border border-purple-500/50 hover:bg-purple-500/10 text-purple-400 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                    >
                      🔍 View on Shelby Explorer
                    </a>
                )}

                <button
                  onClick={() => { setLink(''); setMessage(''); setTxHash(''); }}
                  className="w-full text-xs text-gray-600 hover:text-white py-2 transition-colors mt-2"
                >
                  ← Create New Secret
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}