const { ShelbyClient } = require('@shelby-protocol/sdk/node');
const { Account, Ed25519PrivateKey, Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");
require('dotenv').config({ path: '.env.local' });

// Helper to pause execution
const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function calibrate() {
    console.log("🧪 STARTING CALIBRATION...");
    console.log("---------------------------------------------------");

    // 1. Setup
    const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
    const owner = Account.fromPrivateKey({ privateKey });
    const address = owner.accountAddress.toString();
    
    // 2. Upload a Known Secret
    const TEST_SECRET = "HELLO WORLD";
    const TEST_NAME = `calib_${Math.floor(Math.random() * 1000)}.txt`;
    
    console.log(`📤 Uploading: "${TEST_SECRET}" as ${TEST_NAME}...`);

    const client = new ShelbyClient({
        network: "custom",
        aptos: { network: "custom", fullnode: "https://api.shelbynet.shelby.xyz/v1" },
        indexer: { baseUrl: "https://api.shelbynet.aptoslabs.com/nocode/v1/public/cmforrguw0042s601fn71f9l2/v1/graphql" }
    });

    try {
        await client.upload({
            blobData: Buffer.from(TEST_SECRET, 'utf-8'),
            blobName: TEST_NAME,
            expirationMicros: Date.now() * 1000 + (60 * 1000000), 
            signer: owner
        });
        console.log("✅ Upload Sent. Waiting for chain...");
        await wait(3000); // Wait for block
    } catch(e) { console.log("⚠️ Upload error (ignored):", e.message); }

    // 3. READ IT BACK (The Investigation)
    console.log("\n🕵️ INSPECTING TRANSACTION PAYLOAD...");
    
    const config = new AptosConfig({ network: Network.CUSTOM, fullnode: "https://api.shelbynet.shelby.xyz/v1" });
    const aptos = new Aptos(config);
    
    const txs = await aptos.getAccountTransactions({ accountAddress: address, limit: 1 });
    const lastTx = txs[0];

    console.log(`🔹 Tx Hash: ${lastTx.hash.slice(0,10)}...`);
    
    if(lastTx.payload && lastTx.payload.arguments) {
        const rawArg0 = lastTx.payload.arguments[0];
        console.log(`\n📦 RAW ARGUMENT 0: ${rawArg0}`);
        
        // DECODER 1: Plain String
        console.log(`   👉 Attempt 1 (UTF8):   "${Buffer.from(rawArg0.slice(2), 'hex').toString('utf8')}"`);
        
        // DECODER 2: Remove Invisible Chars
        const clean = Buffer.from(rawArg0.slice(2), 'hex').toString('utf8').replace(/[\x00-\x1F\x7F-\x9F]/g, "");
        console.log(`   👉 Attempt 2 (Clean):  "${clean}"`);

        // DECODER 3: BCS Hex (Likely Solution)
        // Sometimes the first byte is length, so we skip 2 chars (1 byte) or 4 chars (2 bytes)
        const skip1 = Buffer.from(rawArg0.slice(4), 'hex').toString('utf8');
        console.log(`   👉 Attempt 3 (Skip 1): "${skip1}"`);
    }
}

calibrate();
