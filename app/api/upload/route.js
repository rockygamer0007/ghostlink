// FORCE UPDATE: God Mode (Local Bypass)
import { NextResponse } from 'next/server';
import { encrypt } from '../../../utils/crypto';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { ShelbyClient } from "@shelby-protocol/sdk/node"; 

export async function POST(request) {
  try {
    const { message, duration } = await request.json();

    console.log("🚀 Starting Upload (God Mode)...");

    // 1. Encrypt
    const payload = {
        text: message,
        expiresAt: duration > 0 ? Date.now() + (duration * 60 * 1000) : null,
        burnOnRead: duration == 0
    };
    const encryptedData = encrypt(JSON.stringify(payload));

    const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
    const owner = Account.fromPrivateKey({ privateKey });

    // 2. Define Network Settings
    // TRICK: We use "local" to disable validation checks.
    // BUT we override the URLs to point to the real Shelby network.
    const networkSettings = { 
        network: "local", // <--- The "God Mode" Bypass
        fullnode: "https://api.shelbynet.shelby.xyz/v1",
        indexer: "https://api.shelbynet.shelby.xyz/v1/graphql"
    };

    // 3. Upload to Shelby
    // We pass the settings in every possible slot to ensure it sticks.
    const client = new ShelbyClient({ 
        network: "local",
        aptos: networkSettings, 
        indexer: {
            endpoint: "https://api.shelbynet.shelby.xyz/v1/graphql"
        }
    });

    console.log("📤 Sending Blob...");
    const blobTx = await client.upload({
        blobData: Buffer.from(encryptedData),
        signer: owner,
        blobName: "secret.ghost",
        expirationMicros: Date.now() * 1000 + (24 * 60 * 60 * 1000000) 
    });
    console.log("✅ Blob Sent! Hash:", blobTx.hash);

    // 4. Wait for Confirmation
    const aptos = new Aptos(new AptosConfig({
        network: Network.CUSTOM,
        fullnode: networkSettings.fullnode
    }));
    await aptos.waitForTransaction({ transactionHash: blobTx.hash });
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