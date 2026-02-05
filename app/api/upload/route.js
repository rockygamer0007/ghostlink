// FORCE UPDATE: Shelby Showcase Mode
import { NextResponse } from 'next/server';
import { encrypt } from '../../../utils/crypto';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { ShelbyClient } from "@shelby-protocol/sdk/node"; 

export async function POST(request) {
  try {
    const { message, duration } = await request.json();

    console.log("🚀 Starting Shelby Upload...");

    // 1. Encrypt
    const payload = {
        text: message,
        expiresAt: duration > 0 ? Date.now() + (duration * 60 * 1000) : null,
        burnOnRead: duration == 0
    };
    const encryptedData = encrypt(JSON.stringify(payload));

    // 2. Setup Connection (The Universal Config)
    // We put the Indexer URL everywhere to satisfy all SDK checks.
    const universalSettings = {
        network: Network.CUSTOM, 
        fullnode: "https://api.shelbynet.shelby.xyz/v1",
        indexer: "https://api.shelbynet.shelby.xyz/v1/graphql",
        indexerConfig: { url: "https://api.shelbynet.shelby.xyz/v1/graphql" }
    };

    // 3. Setup Aptos Client (For waiting)
    const config = new AptosConfig(universalSettings);
    const aptos = new Aptos(config);
    
    const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
    const owner = Account.fromPrivateKey({ privateKey });

    // 4. Upload to Shelby
    // We pass the settings wrapped in "aptos" (for the bypass)
    // AND explicitly as "indexer" (for the validation check)
    const client = new ShelbyClient({ 
        aptos: universalSettings,
        indexer: {
            endpoint: "https://api.shelbynet.shelby.xyz/v1/graphql"
        }
    });

    console.log("📤 Sending Blob to Shelby Blockchain...");
    const blobTx = await client.upload({
        blobData: Buffer.from(encryptedData),
        signer: owner,
        blobName: "secret.ghost",
        expirationMicros: Date.now() * 1000 + (24 * 60 * 60 * 1000000) 
    });

    console.log("⏳ Waiting for Block Confirmation... Tx:", blobTx.hash);

    // CRITICAL: We wait for the blockchain to index the transaction
    await aptos.waitForTransaction({ transactionHash: blobTx.hash });
    console.log("✅ Confirmed on-chain!");

    // 5. Generate Explorer Link
    const origin = new URL(request.url).origin;
    const finalLink = `${origin}/view/${blobTx.blobId}`;

    return NextResponse.json({ 
        link: finalLink, 
        txHash: blobTx.hash 
    });

  } catch (error) {
    console.error("Upload Error:", error);
    // Return the specific error so we can debug if it fails again
    return NextResponse.json({ error: "System Error: " + error.message }, { status: 500 });
  }
}