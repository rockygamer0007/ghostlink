'use client';
import { useState, useEffect, useRef } from 'react';

export default function ViewPage({ params }) {
  const [status, setStatus] = useState('Loading'); 
  const [secretContent, setSecretContent] = useState('');
  const [expirationMsg, setExpirationMsg] = useState('');
  
  // Prevent double-fetching in React Strict Mode
  const hasFetched = useRef(false);

  useEffect(() => {
    async function revealSecret() {
      if (hasFetched.current) return;
      hasFetched.current = true;

      const resolvedParams = await params;
      const encryptedId = decodeURIComponent(resolvedParams.id);

      try {
        // Ask the Server to decrypt and validate
        const res = await fetch('/api/reveal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: encryptedId })
        });
        
        const data = await res.json();
        setStatus(data.status);

        if (data.status === 'Decrypted') {
            setSecretContent(data.text);
            if (data.expiresAt) {
                const mins = Math.ceil((data.expiresAt - Date.now()) / 60000);
                setExpirationMsg(`Destructs in ~${mins} minutes`);
            } else {
                setExpirationMsg('Standard Encryption');
            }
        } 
        else if (data.status === 'One-Time') {
            setSecretContent(data.text);
            setExpirationMsg('This message has been destroyed. Do not reload.');
        }
        else if (data.status === 'Expired') {
            setExpirationMsg('Time limit exceeded.');
        }
        else if (data.status === 'Burnt') {
            setExpirationMsg('This one-time link has already been viewed.');
        }

      } catch (e) {
        setStatus('Corrupted');
      }
    }

    revealSecret();
  }, [params]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
          GhostLink
        </h1>

        {/* SHELBY BADGE */}
        <div className="flex justify-center mb-8">
            <span className="text-[10px] font-mono text-gray-500 border border-gray-800 rounded px-2 py-1 uppercase">
                SECURED BY SHELBY
            </span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl relative overflow-hidden transition-all duration-500">
            
            {/* DESTROYED STATE */}
            {(status === 'Expired' || status === 'Burnt') && (
                <div className="py-8 animate-pulse">
                    <div className="text-6xl mb-4">💥</div>
                    <h2 className="text-2xl font-bold text-red-500 mb-2">Note Destroyed</h2>
                    <p className="text-gray-500">{expirationMsg}</p>
                </div>
            )}

            {/* LOADING / ERROR STATE */}
            {(status === 'Loading') && <div className="text-gray-500 animate-pulse">Unlocking secure payload...</div>}
            {(status === 'Corrupted') && <div className="text-red-500">❌ Invalid or Broken Link</div>}

            {/* SUCCESS STATE */}
            {(status === 'Decrypted' || status === 'One-Time') && (
                <>
                    <div className={`absolute top-0 left-0 w-full h-1 ${status === 'One-Time' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                    
                    <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                        <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${status === 'One-Time' ? 'text-orange-500' : 'text-green-500'}`}>
                            <span className={`w-2 h-2 rounded-full animate-pulse ${status === 'One-Time' ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                            {status === 'One-Time' ? 'Self-Destructing Message' : 'Secure Message'}
                        </span>
                        <span className="text-xs font-mono text-gray-400">
                           {expirationMsg}
                        </span>
                    </div>
                    
                    <div className="font-mono text-3xl text-white break-words leading-relaxed p-4">
                        {secretContent}
                    </div>

                    <div className="mt-8 text-xs text-gray-600 flex justify-center gap-4">
                        <span>AES-256 Encrypted</span>
                        <span>•</span>
                        <span>Server Verified</span>
                    </div>
                </>
            )}
        </div>

        <a href="/" className="mt-8 inline-block text-gray-500 hover:text-white transition-colors">
          ← Create New Secret
        </a>
      </div>
    </div>
  );
}