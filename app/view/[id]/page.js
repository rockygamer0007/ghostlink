"use client";
import { useState, useEffect } from 'react';
import { decrypt } from '../../../utils/crypto';

export default function ViewSecret({ params }) {
  // 1. Unwrap params safely
  const [cid, setCid] = useState(null);

  useEffect(() => {
    // Handling params unwrapping for different Next.js versions
    if (params && params.id) {
        setCid(params.id);
    } else if (params instanceof Promise) {
        params.then(p => setCid(p.id));
    }
  }, [params]);

  const [decryptedMessage, setDecryptedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cid) return;

    async function fetchSecret() {
        try {
            console.log("🔍 Fetching from IPFS:", cid);
            
            // Try Pinata Gateway first
            let res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
            
            // Fallback to public gateway if Pinata is slow
            if (!res.ok) {
                console.log("⚠️ Pinata slow, trying fallback...");
                res = await fetch(`https://ipfs.io/ipfs/${cid}`);
            }

            if (!res.ok) throw new Error("File not found on IPFS network");

            const encryptedText = await res.text();
            
            // Decrypt
            try {
                const jsonPayload = decrypt(encryptedText);
                const payload = JSON.parse(jsonPayload);

                // Check Expiry
                if (payload.expiresAt && Date.now() > payload.expiresAt) {
                    setError("❌ This secret has expired and burned.");
                    setLoading(false);
                    return;
                }

                setDecryptedMessage(payload.text);
            } catch (cryptoError) {
                console.error("Decryption failed:", cryptoError);
                setError("❌ Invalid Key or Corrupted Data");
            }

            setLoading(false);

        } catch (err) {
            console.error(err);
            setError("❌ Secret not found yet. It might be propagating through IPFS. Refresh in 10s.");
            setLoading(false);
        }
    }

    fetchSecret();
  }, [cid]);

  const isImage = (text) => text && text.startsWith("data:image");

  if (!cid || loading) return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-400 font-mono">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="animate-pulse">Searching the Decentralized Web...</p>
      </div>
  );

  if (error) return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-red-500 font-mono p-4 text-center">
          <h1 className="text-4xl mb-4">⚠️</h1>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="mt-8 px-6 py-2 border border-red-500 rounded hover:bg-red-900/20 transition">
            🔄 Try Again
          </button>
      </div>
  );

  return (
    <div className="min-h-screen bg-black text-green-400 flex flex-col items-center justify-center p-4 font-mono">
      <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
        GhostLink
      </h1>

      <div className="bg-gray-900 p-8 rounded-lg border border-gray-800 shadow-2xl max-w-3xl w-full text-center">
        <div className="mb-6 flex justify-center">
            <div className="p-4 bg-green-900/30 rounded-full border border-green-500/30">
                <span className="text-4xl">🔓</span>
            </div>
        </div>
        
        <h2 className="text-2xl text-white font-bold mb-4">Secret Decrypted</h2>
        
        <div className="bg-black p-6 rounded border border-green-500/30 text-left overflow-auto max-h-[500px] flex justify-center">
            {isImage(decryptedMessage) ? (
                <img src={decryptedMessage} alt="Secret" className="max-w-full rounded shadow-lg" />
            ) : (
                <div className="whitespace-pre-wrap break-words w-full text-gray-300">
                    {decryptedMessage}
                </div>
            )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800 flex justify-between items-center text-xs text-gray-500">
            <span>📦 Storage: IPFS (Decentralized)</span>
            <span>🔒 Security: AES-256</span>
        </div>
      </div>
    </div>
  );
}