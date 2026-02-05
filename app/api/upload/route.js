// FORCE UPDATE: Native ShelbyNet Mode
import { NextResponse } from 'next/server';
import { encrypt } from '../../../utils/crypto';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { ShelbyClient } from "@shelby-protocol/sdk/node"; 

export async function POST(request) {
  try {
    const { message, duration } = await request.json();

    console.log("🚀 Starting Upload...");

    // 1. Encrypt
    const payload = {
        text: message,
        expiresAt: duration > 0 ? Date.now() + (duration * 60 * 1000) : null,
        burnOnRead: duration == 0
    };
    const encryptedData = encrypt(JSON.stringify(payload));

    const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
    const owner = Account.fromPrivateKey({ privateKey });

    // 2. Upload to Shelby (THE FIX)
    // We use the native "shelbynet" mode. The SDK knows the URLs automatically.
    // We provide a dummy API Key because the constructor requires it.
    const client = new ShelbyClient({ 
        network: "shelbynet",
        apiKey: "beta-access-key" // Dummy key to bypass validation
    });

    console.log("📤 Sending Blob to Shelby...");
    const blobTx = await client.upload({
        blobData: Buffer.from(encryptedData),
        signer: owner,
        blobName: "secret.ghost",
        expirationMicros: Date.now() * 1000 + (24 * 60 * 60 * 1000000) 
    });
    console.log("✅ Blob Sent! Hash:", blobTx.hash);

    // 3. Wait for Confirmation
    // We create a separate connection just to "watch" the transaction
    const watchConfig = new AptosConfig({ 
        network: Network.CUSTOM, 
        fullnode: "https://api.shelbynet.shelby.xyz/v1" 
    });
    const watcher = new Aptos(watchConfig);

    console.log("⏳ Waiting for confirmation...");
    await watcher.waitForTransaction({ transactionHash: blobTx.hash });
    console.log("✅ Confirmed!");

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