import { NextResponse } from 'next/server';
import { encrypt } from '../../../utils/crypto';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

export async function POST(request) {
  try {
    const { message, duration } = await request.json();

    // 1. Encrypt Payload (This creates the secure link)
    const payload = {
        text: message,
        expiresAt: duration > 0 ? Date.now() + (duration * 60 * 1000) : null,
        burnOnRead: duration == 0
    };
    const encryptedData = encrypt(JSON.stringify(payload));
    const origin = new URL(request.url).origin;
    const finalLink = `${origin}/view/${encodeURIComponent(encryptedData)}`;

    // 2. Blockchain "Heartbeat" Transaction
    // We send a tiny self-transfer to generate a Real Tx Hash on ShelbyNet
    let txHash = null;
    try {
        console.log("🔄 Connecting to Shelby Chain (via Aptos SDK)...");

        const config = new AptosConfig({ 
            network: Network.CUSTOM, 
            fullnode: "https://api.shelbynet.shelby.xyz/v1" 
        });
        const aptos = new Aptos(config);
        
        const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
        const owner = Account.fromPrivateKey({ privateKey });

        // Build a simple "Ping" transaction (Send 0 coins to self)
        // This proves the app is live and connected.
        const transaction = await aptos.transaction.build.simple({
            sender: owner.accountAddress,
            data: {
                function: "0x1::coin::transfer",
                typeArguments: ["0x1::aptos_coin::AptosCoin"],
                functionArguments: [owner.accountAddress, 100], // Send tiny amount to self
            },
        });

        const committedTx = await aptos.signAndSubmitTransaction({ signer: owner, transaction });
        txHash = committedTx.hash;
        
        console.log("✅ BLOCKCHAIN SUCCESS! Hash:", txHash);

    } catch (e) {
        console.error("⚠️ Blockchain Note:", e.message);
        // If chain fails, we still return the link
    }

    // 3. Return Result
    return NextResponse.json({ 
        link: finalLink, 
        txHash: txHash 
    });

  } catch (error) {
    console.error("Critical Error:", error);
    return NextResponse.json({ error: "System Error" }, { status: 500 });
  }
}