const { Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");
const { Account, Ed25519PrivateKey } = require("@aptos-labs/ts-sdk");
require('dotenv').config({ path: '.env.local' });

async function calibrate() {
    console.log("🔍 READING LAST TRANSACTION...");
    
    // 1. Setup Connection
    const config = new AptosConfig({ network: Network.CUSTOM, fullnode: "https://api.shelbynet.shelby.xyz/v1" });
    const aptos = new Aptos(config);
    
    const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
    const address = Account.fromPrivateKey({ privateKey }).accountAddress.toString();

    // 2. Fetch Last Transaction
    const txs = await aptos.getAccountTransactions({ accountAddress: address, limit: 1 });
    
    if (txs.length === 0) {
        console.log("❌ No transactions found.");
        return;
    }

    const lastTx = txs[0];
    console.log(`🔹 Tx Hash: ${lastTx.hash.slice(0,10)}...`);

    if (lastTx.payload && lastTx.payload.arguments) {
        // Arg0 is usually the content
        const rawHex = lastTx.payload.arguments[0]; 

        console.log("\n🧪 DECODING ANALYSIS:");
        console.log(`RAW HEX: ${rawHex.substring(0, 50)}...`);

        // METHOD 1: Standard UTF8
        // (This gave you the "pT" garbage earlier)
        const utf8 = Buffer.from(rawHex.slice(2), 'hex').toString('utf8');
        console.log(`\n👉 METHOD 1 (Standard):  "${utf8}"`);

        // METHOD 2: Clean Invisible Characters
        // (This strips out the garbage bytes)
        const clean = utf8.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
        console.log(`👉 METHOD 2 (Cleaned):   "${clean}"`);

        // METHOD 3: Skip First Byte (Length Prefix)
        // (We ignore the first 2 hex chars which might be the size)
        try {
            const skip1 = Buffer.from(rawHex.slice(4), 'hex').toString('utf8');
            console.log(`👉 METHOD 3 (Skip 1):    "${skip1}"`);
        } catch(e) {}
    }
}

calibrate();
