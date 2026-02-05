import { NextResponse } from 'next/server';
import { encrypt } from '../../../utils/crypto';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
// CHANGE IS HERE: Added "/node" to the end
import { ShelbyClient } from "@shelby-protocol/sdk/node"; 

export async function POST(request) {
  // ... (Keep the rest of your code exactly the same)
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

    // 2. Blockchain
    let txHash = null;
    let debugInfo = "";

    try {
        const config = new AptosConfig({ 
            network: Network.CUSTOM, 
            fullnode: "https://api.shelbynet.shelby.xyz/v1" 
        });
        const aptos = new Aptos(config);
        
        const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
        const owner = Account.fromPrivateKey({ privateKey });

        // --- THE TRUTH DETECTOR ---
        const address = owner.accountAddress.toString();
        console.log("🕵️ VERCEL IS USING WALLET:", address); 
        // --------------------------

        const transaction = await aptos.transaction.build.simple({
            sender: owner.accountAddress,
            data: {
                function: "0x1::coin::transfer",
                typeArguments: ["0x1::aptos_coin::AptosCoin"],
                functionArguments: [owner.accountAddress, 100], 
            },
        });

        const committedTx = await aptos.signAndSubmitTransaction({ signer: owner, transaction });
        txHash = committedTx.hash;
        console.log("✅ Success:", txHash);

    } catch (e) {
        console.error("⚠️ Blockchain Error:", e.message);
        debugInfo = e.message;
    }

    // 3. Return Result
    return NextResponse.json({ 
        link: finalLink, 
        txHash: txHash,
        debug_error: debugInfo
    });

  } catch (error) {
    return NextResponse.json({ error: "System Error" }, { status: 500 });
  }
}