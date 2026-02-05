import { decrypt } from '../../../utils/crypto';

// This is a Server Component (No "use client")
// It runs securely on the server, so it can access your Private Keys.
export default async function ViewSecret({ params }) {
  // 1. Unwrap params (Next.js 13+ standard)
  const resolvedParams = await params; // Await required for newer Next.js versions
  const cid = resolvedParams.id;
  
  let decryptedMessage = null;
  let error = null;
  let isBurned = false;

  try {
    console.log("🔍 Server Fetching IPFS CID:", cid);

    // 2. Fetch from IPFS (Server-side fetch)
    // We try the Pinata gateway first, then fallback
    let res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`, { cache: 'no-store' });
    
    if (!res.ok) {
        console.log("⚠️ Pinata slow, trying fallback...");
        res = await fetch(`https://ipfs.io/ipfs/${cid}`, { cache: 'no-store' });
    }

    if (!res.ok) throw new Error("File not found on IPFS network");

    // 3. Get Text & Clean it
    const encryptedText = (await res.text()).trim();
    
    // 4. Decrypt (Now works because we are on the Server!)
    const jsonPayload = decrypt(encryptedText);
    const payload = JSON.parse(jsonPayload);

    // 5. Check Expiry
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
        error = "🔥 This secret has expired and burned.";
        isBurned = true;
    } else {
        decryptedMessage = payload.text;
    }

  } catch (err) {
    console.error("View Error:", err);
    error = "❌ Invalid Key or Corrupted Data.";
  }

  const isImage = (text) => text && text.startsWith("data:image");

  // --- RENDER UI ---
  if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-red-500 font-mono p-4 text-center">
            <div className="text-6xl mb-4">{isBurned ? '🔥' : '⚠️'}</div>
            <h2 className="text-2xl font-bold mb-2">{isBurned ? 'Secret Burned' : 'Access Denied'}</h2>
            <p>{error}</p>
            <a href="/" className="mt-8 px-6 py-2 border border-gray-700 rounded text-gray-400 hover:text-white transition">
              Create New Secret
            </a>
        </div>
      );
  }

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
            <span>📦 Fetched via Server-Side</span>
            <span>🔒 Security: Verified</span>
        </div>
      </div>
    </div>
  );
}