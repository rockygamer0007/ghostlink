import { NextResponse } from 'next/server';
import { encrypt } from '../../../utils/crypto';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

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
    const origin = new URL(request.url).origin;
    const finalLink = `${origin}/view/${encodeURIComponent(encryptedData)}`;

    // 2. Blockchain "Fire and Forget"
    let txHash = null;
    try {
        console.log("🚀 Firing transaction to Shelby...");

        const config = new AptosConfig({ 
            network: Network.CUSTOM, 
            fullnode: "https://api.shelbynet.shelby.xyz/v1" 
        });
        const aptos = new Aptos(config);
        
        const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
        const owner = Account.fromPrivateKey({ privateKey });

        const transaction = await aptos.transaction.build.simple({
            sender: owner.accountAddress,
            data: {
                function: "0x1::coin::transfer",
                typeArguments: ["0x1::aptos_coin::AptosCoin"],
                functionArguments: [owner.accountAddress, 100], 
            },
        });

        // CHANGE: We get the hash IMMEDIATELY. We do not wait for the block to be mined.
        const committedTx = await aptos.signAndSubmitTransaction({ signer: owner, transaction });
        
        txHash = committedTx.hash; // <--- Grab hash instantly
        console.log("✅ Hash captured:", txHash);

    } catch (e) {
        console.error("⚠️ Blockchain Error:", e.message);
        // If it fails here, it likely means the Private Key is wrong in Vercel settings
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