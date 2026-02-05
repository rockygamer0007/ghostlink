"use client";
import { useState, useEffect } from 'react';
import { decrypt } from '../../../utils/crypto';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { ShelbyClient } from "@shelby-protocol/sdk"; // New Import

export default function ViewSecret({ params }) {
  const [decryptedMessage, setDecryptedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSecret() {
        try {
            // 1. Get the Blob ID from the URL
            const blobId = params.id;
            
            // 2. Connect to Shelby
            const config = new AptosConfig({ 
                network: Network.CUSTOM, 
                fullnode: "https://api.shelbynet.shelby.xyz/v1" 
            });
            const client = new ShelbyClient(config);

            console.log("🔍 Fetching Blob:", blobId);

            // 3. Download the Encrypted Data
            const blobData = await client.download({ blobId });
            
            // Convert Buffer back to String
            const encryptedText = blobData.toString();

            // 4. Decrypt Locally
            const jsonPayload = decrypt(encryptedText);
            const payload = JSON.parse(jsonPayload);

            // 5. Check Expiry/Burn Logic
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

  if (loading) return <div className="text-white text-center mt-20">🔓 Decrypting from Blockchain...</div>;
  if (error) return <div className="text-red-500 text-center mt-20 font-bold text-2xl">{error}</div>;

  return (
    <div className="min-h-screen bg-black text-green-400 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
        GhostLink
      </h1>

      <div className="bg-gray-900 p-8 rounded-lg border border-gray-800 shadow-2xl max-w-2xl w-full text-center">
        <div className="mb-6 flex justify-center">
            <div className="p-4 bg-green-900/30 rounded-full">
                <span className="text-4xl">🔓</span>
            </div>
        </div>
        
        <h2 className="text-2xl text-white font-bold mb-4">Secret Decrypted</h2>
        
        <div className="bg-black p-6 rounded border border-green-500/30 text-left overflow-auto max-h-96 whitespace-pre-wrap">
            {decryptedMessage}
        </div>

        <p className="mt-6 text-gray-500 text-sm">
            This message was retrieved securely from the Shelby Network.
        </p>
      </div>
    </div>
  );
}