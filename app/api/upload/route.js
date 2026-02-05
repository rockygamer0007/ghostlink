import { NextResponse } from 'next/server';
import { encrypt } from '../../../utils/crypto';

export async function POST(request) {
  try {
    const { message, duration } = await request.json();

    // 1. Encrypt the data
    const payload = {
        text: message,
        expiresAt: duration > 0 ? Date.now() + (duration * 60 * 1000) : null,
        burnOnRead: duration == 0
    };
    const encryptedData = encrypt(JSON.stringify(payload));

    // 2. Prepare for IPFS (Pinata)
    const formData = new FormData();
    // We create a "File" from our encrypted string
    const blob = new Blob([encryptedData], { type: "text/plain" });
    formData.append("file", blob, "secret.ghost");

    // 3. Upload to Pinata
    console.log("🚀 Uploading to IPFS...");
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: formData,
    });

    const ipfsData = await res.json();
    
    if (!ipfsData.IpfsHash) {
        throw new Error("Pinata Upload Failed");
    }

    console.log("✅ Uploaded! CID:", ipfsData.IpfsHash);

    // 4. Return the Link
    const origin = new URL(request.url).origin;
    const finalLink = `${origin}/view/${ipfsData.IpfsHash}`;

    return NextResponse.json({ 
        link: finalLink, 
        txHash: null // IPFS doesn't use Tx Hash, just CID
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "System Error: " + error.message }, { status: 500 });
  }
}