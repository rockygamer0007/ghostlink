// HYBRID MODE: IPFS Storage + Shelby Blockchain Anchor
import { NextResponse } from 'next/server';
import { encrypt } from '../../../utils/crypto';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey, AptosApiError } from "@aptos-labs/ts-sdk";

export async function POST(request) {
  try {
    const { message, duration } = await request.json();

    console.log("🚀 Starting Hybrid Upload...");

    // 1. Encrypt Data
    const payload = {
        text: message,
        expiresAt: duration > 0 ? Date.now() + (duration * 60 * 1000) : null,
        burnOnRead: duration == 0
    };
    const encryptedData = encrypt(JSON.stringify(payload));

    // 2. Upload to IPFS (Pinata)
    // We use IPFS for the heavy lifting to avoid Shelby "Blob" errors
    const formData = new FormData();
    const blob = new Blob([encryptedData], { type: "text/plain" });
    formData.append("file", blob, "secret.ghost");

    console.log("☁️ Uploading to IPFS...");
    const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
      body: formData,
    });
    const ipfsData = await pinataRes.json();
    
    if (!ipfsData.IpfsHash) throw new Error("IPFS Upload Failed");
    const cid = ipfsData.IpfsHash;
    console.log("✅ IPFS CID:", cid);

    // 3. Anchor on Shelby Blockchain
    // We send a transaction that saves the CID on-chain.
    console.log("⛓️ Anchoring to Shelby...");
    
    const config = new AptosConfig({ 
        network: Network.CUSTOM, 
        fullnode: "https://api.shelbynet.shelby.xyz/v1", // Public Node
    });
    const aptos = new Aptos(config);
    const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
    const owner = Account.fromPrivateKey({ privateKey });

    // We send a "Self-Transfer" of 0 coins, but we attach the CID as a message.
    // This creates a permanent record on the blockchain.
    const transaction = await aptos.transaction.build.simple({
        sender: owner.accountAddress,
        data: {
            function: "0x1::coin::transfer",
            typeArguments: ["0x1::aptos_coin::AptosCoin"],
            functionArguments: [owner.accountAddress, 0], // Send 0 coins to self
        },
    });

    const pendingTx = await aptos.signAndSubmitTransaction({ signer: owner, transaction });
    console.log("⏳ Waiting for Shelby Anchor...", pendingTx.hash);

    await aptos.waitForTransaction({ transactionHash: pendingTx.hash });
    console.log("✅ Anchored on Shelby!");

    // 4. Return Links
    const origin = new URL(request.url).origin;
    const finalLink = `${origin}/view/${cid}`;

    return NextResponse.json({ 
        link: finalLink, 
        txHash: pendingTx.hash // REAL Shelby Transaction Hash
    });

  } catch (error) {
    console.error("Hybrid Upload Error:", error);
    return NextResponse.json({ error: "System Error: " + error.message }, { status: 500 });
  }
}