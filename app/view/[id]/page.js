import { decrypt } from '../../../utils/crypto';

export default async function ViewSecret({ params }) {
  const resolvedParams = await params;
  const cid = resolvedParams.id;
  
  let decryptedData = null;
  let error = null;
  let isBurned = false;
  let fileType = 'text'; // text, image, video, audio, pdf, other

  try {
    // 1. Fetch from IPFS
    console.log("🔍 Server Fetching CID:", cid);
    let res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`, { cache: 'no-store' });
    
    if (!res.ok) {
        res = await fetch(`https://ipfs.io/ipfs/${cid}`, { cache: 'no-store' });
    }

    if (!res.ok) throw new Error("File not found on IPFS");

    const encryptedText = (await res.text()).trim();
    
    // 2. Decrypt
    const jsonPayload = decrypt(encryptedText);
    const payload = JSON.parse(jsonPayload);

    // 3. Check Timer Expiry
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
        error = "⏳ This secret has expired.";
        isBurned = true;
    } else {
        decryptedData = payload.text;
        
        // 4. Detect File Type
        if (decryptedData.startsWith('data:image/')) fileType = 'image';
        else if (decryptedData.startsWith('data:video/')) fileType = 'video';
        else if (decryptedData.startsWith('data:audio/')) fileType = 'audio';
        else if (decryptedData.startsWith('data:application/pdf')) fileType = 'pdf';
        else if (decryptedData.startsWith('data:')) fileType = 'other';
    }

  } catch (err) {
    console.error("View Error:", err);
    error = "❌ Invalid Key or Corrupted Data.";
  }

  // --- RENDERER COMPONENT ---
  const renderContent = () => {
    if (!decryptedData) return null;

    if (fileType === 'image') {
        return <img src={decryptedData} alt="Secret" className="max-w-full rounded shadow-lg mx-auto" />;
    }
    if (fileType === 'video') {
        return (
            <video controls className="w-full rounded shadow-lg">
                <source src={decryptedData} />
                Your browser does not support the video tag.
            </video>
        );
    }
    if (fileType === 'audio') {
        return (
            <audio controls className="w-full mt-4">
                <source src={decryptedData} />
                Your browser does not support the audio element.
            </audio>
        );
    }
    if (fileType === 'pdf' || fileType === 'other') {
        return (
            <div className="text-center">
                <div className="text-6xl mb-4">📄</div>
                <p className="mb-4 text-gray-400 text-sm">File type: {decryptedData.split(';')[0].split(':')[1]}</p>
                <a 
                    href={decryptedData} 
                    download="secret-file"
                    className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-500 transition"
                >
                    ⬇️ Download File
                </a>
            </div>
        );
    }
    // Default: Text
    return <div className="whitespace-pre-wrap break-words w-full text-gray-300 text-left">{decryptedData}</div>;
  };

  if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-red-500 font-mono p-4 text-center">
            <div className="text-6xl mb-4">{isBurned ? '⏳' : '⚠️'}</div>
            <h2 className="text-2xl font-bold mb-2">{isBurned ? 'Expired' : 'Access Denied'}</h2>
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
        
        <div className="bg-black p-6 rounded border border-green-500/30 overflow-auto max-h-[600px] flex justify-center items-center">
            {renderContent()}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800 flex justify-between items-center text-xs text-gray-500">
            <span>📦 Storage: IPFS Hybrid</span>
            <span>🔒 Security: Verified</span>
        </div>
      </div>
    </div>
  );
}