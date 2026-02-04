const { ShelbyClient } = require('@shelby-protocol/sdk/node');
const { Account, Ed25519PrivateKey } = require("@aptos-labs/ts-sdk");
require('dotenv').config({ path: '.env.local' });

async function debugUpload() {
    console.log("🧪 STARTING DIAGNOSTIC UPLOAD...");
    
    try {
        // 1. Setup Keys
        const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
        const owner = Account.fromPrivateKey({ privateKey });
        console.log(`👤 Account: ${owner.accountAddress.toString()}`);

        // 2. Setup Client
        const client = new ShelbyClient({
            network: "custom",
            aptos: { network: "custom", fullnode: "https://api.shelbynet.shelby.xyz/v1" },
            indexer: { baseUrl: "https://api.shelbynet.aptoslabs.com/nocode/v1/public/cmforrguw0042s601fn71f9l2/v1/graphql" }
        });

        // 3. Attempt Upload
        const testName = `DEBUG_TEST_${Date.now()}.bin`;
        console.log(`📤 Attempting to upload: ${testName}`);

        const tx = await client.upload({
            blobData: Buffer.from("TEST_DATA", 'utf-8'),
            blobName: testName,
            expirationMicros: Date.now() * 1000 + (60 * 1000000), 
            signer: owner
        });

        console.log("✅ SUCCESS!");
        console.log("🔹 Hash:", tx.hash);

    } catch (e) {
        console.log("\n❌ UPLOAD FAILED [RAW ERROR]:");
        console.log("---------------------------------------------------");
        console.log(e); // Printing the full object often reveals more
        console.log("---------------------------------------------------");
        
        if (e.message && e.message.includes("Sequence number")) {
            console.log("💡 HINT: Your sequence number is out of sync. Wait 10s and try again.");
        }
        if (e.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
            console.log("💡 HINT: The Shelby SDK is conflicting with your Node version.");
        }
    }
}

debugUpload();