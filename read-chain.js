const { Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");
const { Account, Ed25519PrivateKey } = require("@aptos-labs/ts-sdk");
require('dotenv').config({ path: '.env.local' });

// Hex to String Helper
const hexToString = (hex) => {
    try {
        if (!hex) return "";
        if (hex.startsWith('0x')) hex = hex.slice(2);
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return str;
    } catch (e) { return "[Binary Data]"; }
};

async function readChain() {
    console.log("🕵️ READING BLOCKCHAIN STORAGE...");
    
    // 1. Setup
    const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
    const address = Account.fromPrivateKey({ privateKey }).accountAddress.toString();
    
    const config = new AptosConfig({ network: Network.CUSTOM, fullnode: "https://api.shelbynet.shelby.xyz/v1" });
    const aptos = new Aptos(config);

    // 2. Fetch Last 5 Transactions
    const txs = await aptos.getAccountTransactions({ accountAddress: address, limit: 5 });

    if (txs.length === 0) {
        console.log("❌ No transactions found.");
        return;
    }

    // 3. Inspect Them
    console.log(`✅ Found ${txs.length} transactions. checking payloads...`);
    console.log("---------------------------------------------------");

    for (const tx of txs) {
        if (tx.payload) {
            console.log(`🔹 Tx Hash: ${tx.hash.slice(0, 10)}...`);
            console.log(`   Function: ${tx.payload.function}`);
            
            // Check arguments (This is where the secret lives)
            if (tx.payload.arguments && tx.payload.arguments.length > 0) {
                // Shelby Upload usually has: [content, filename, expiry]
                // We try to decode the first two args
                const rawContent = tx.payload.arguments[0];
                const rawName = tx.payload.arguments[1];

                console.log(`   📂 Filename (Decoded): "${hexToString(rawName)}"`);
                console.log(`   🔐 Content  (Decoded): "${hexToString(rawContent)}"`);
            }
            console.log("---------------------------------------------------");
        }
    }
}

readChain();
