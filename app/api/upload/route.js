import { NextResponse } from 'next/server';
import { encrypt } from '../../../utils/crypto';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { ShelbyClient } from "@shelby-protocol/sdk/node"; 

export async function POST(request) {
  try {
    const { message, duration } = await request.json();

    // 1. Encrypt
    const payload = {
        text: message,
        expiresAt: duration > 0 ? Date.now() + (duration * 60 * 1000) : null,
        burnOnRead: duration == 0
    };
    const encryptedData = encrypt(JSON.stringify(payload));

    // 2. Setup Connection
    const config = new AptosConfig({ 
        network: Network.CUSTOM, 
        fullnode: "https://api.shelbynet.shelby.xyz/v1" 
    });
    const aptos = new Aptos(config); // Standard client for waiting
    
    const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
    const owner = Account.fromPrivateKey({ privateKey });

    console.log("🚀 Uploading Blob...");

    // 3. Upload to Shelby
    const client = new ShelbyClient(config);
    const blobTx = await client.upload({
        blobData: Buffer.from(encryptedData),
        signer: owner,
        blobName: "secret.ghost",
        expirationMicros: Date.now() * 1000 + (24 * 60 * 60 * 1000000) 
    });

    console.log("⏳ Waiting for confirmation... Tx:", blobTx.hash);

    // --- THE FIX: Wait for the blockchain to finish ---
    await aptos.waitForTransaction({ transactionHash: blobTx.hash });
    console.log("✅ Confirmed!");

    // 4. Create Link
    const origin = new URL(request.url).origin;
    const finalLink = `${origin}/view/${blobTx.blobId}`;

    return NextResponse.json({ 
        link: finalLink, 
        txHash: blobTx.hash 
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "System Error: " + error.message }, { status: 500 });
  }
}