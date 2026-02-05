"use client";
import { useState, useEffect } from 'react';
import { decrypt } from '../../../utils/crypto';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
// FIX 1: Use the browser version of the SDK
import { ShelbyClient } from "@shelby-protocol/sdk/browser"; 

export default function ViewSecret({ params }) {
  const [decryptedMessage, setDecryptedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSecret() {
        try {
            const blobId = params.id;
            
            const config = new AptosConfig({ 
                network: Network.CUSTOM, 
                fullnode: "https://api.shelbynet.shelby.xyz/v1" 
            });
            const client = new ShelbyClient(config);

            console.log("🔍 Fetching Blob:", blobId);
            const blobData = await client.download({ blobId });
            
            const encryptedText = blobData.toString();
            const jsonPayload = decrypt(encryptedText);
            const payload = JSON.parse(jsonPayload);

            if (payload.expiresAt && Date.now() > payload.expiresAt) {
                setError("❌ This secret has expired.");
                setLoading(false);
                return;
            }

            setDecryptedMessage(payload.text);
            setLoading(false);

        } catch (err) {
            console.error(err);
            setError("❌ Secret not found or invalid.");
            setLoading(false);
        }
    }

    if (params.id) fetchSecret();
  }, [params.id]);

  // FIX 2: Helper to check if the text is actually an image
  const isImage = (text) => text && text.startsWith("data:image");

  if (loading) return <div className="text-white text-center mt-20 font-mono animate-pulse">🔓 Decrypting from Blockchain...</div>;
  if (error) return <div className="text-red-500 text-center mt-20 font-bold text-2xl font-mono">{error}</div>;

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
        
        {/* LOGIC: Show Image OR Text */}
        <div className="bg-black p-6 rounded border border-green-500/30 text-left overflow-auto max-h-[500px] flex justify-center">
            {isImage(decryptedMessage) ? (
                <img src={decryptedMessage} alt="Secret" className="max-w-full rounded shadow-lg" />
            ) : (
                <div className="whitespace-pre-wrap break-words w-full">
                    {decryptedMessage}
                </div>
            )}
        </div>

        <p className="mt-6 text-gray-500 text-sm">
            This data was retrieved securely from the Shelby Network.
        </p>
      </div>
    </div>
  );
}