const { Account, Ed25519PrivateKey } = require("@aptos-labs/ts-sdk");
require('dotenv').config({ path: '.env.local' });

// We use a helper to wait between requests
const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function forceFund() {
    console.log("🔥 INITIATING FORCE FUNDING PROTOCOL...");
    
    const key = process.env.SHELBY_PRIVATE_KEY;
    if (!key) { console.log("❌ No Key Found"); return; }

    const privateKey = new Ed25519PrivateKey(key);
    const owner = Account.fromPrivateKey({ privateKey });
    const address = owner.accountAddress.toString();
    
    console.log(`👤 Target: ${address}`);

    // We hit the faucet 3 times with 10 Billion each
    // Sometimes one big request fails, but small ones work.
    for (let i = 1; i <= 3; i++) {
        console.log(`\n💸 Attempt ${i}/3: Requesting 10,000,000,000 ShelbyUSD...`);
        try {
            const res = await fetch(`https://faucet.shelbynet.shelby.xyz/fund?asset=shelbyusd`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    address: address, 
                    amount: 10_000_000_000 
                })
            });
            
            if (res.ok) console.log("   ✅ SUCCESS: Faucet accepted request.");
            else console.log(`   ❌ FAIL: ${await res.text()}`);
            
        } catch (e) {
            console.log(`   ❌ NETWORK ERROR: ${e.message}`);
        }
        
        console.log("   💤 Waiting 3s...");
        await wait(3000);
    }

    console.log("\n---------------------------------------------------");
    console.log("🚀 FUNDING COMPLETE.");
    console.log("👇 CRITICAL NEXT STEP 👇");
    console.log("1. STOP your server (Ctrl + C)");
    console.log("2. RESTART it (npm run dev)");
    console.log("3. Try uploading again.");
    console.log("---------------------------------------------------");
}

forceFund();
