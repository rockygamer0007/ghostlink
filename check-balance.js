const { Account, Ed25519PrivateKey, Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");
require('dotenv').config({ path: '.env.local' });

// ShelbyUSD Address
const FA_ADDRESS = "0x1b18363a9f1fe5e6ebf247daba5cc1c18052bb232efdc4c50f556053922d98e1";

async function check() {
    console.log("🔍 WALLET DIAGNOSTIC");
    console.log("---------------------------------------------------");
    
    const key = process.env.SHELBY_PRIVATE_KEY;
    if(!key) { console.log("❌ No Private Key found in .env.local"); return; }
    
    // 1. Get Address
    const privateKey = new Ed25519PrivateKey(key);
    const owner = Account.fromPrivateKey({ privateKey });
    const address = owner.accountAddress.toString();
    console.log(`👤 Address: ${address}`);
    
    // 2. Setup Connection
    const config = new AptosConfig({
        network: Network.CUSTOM,
        fullnode: "https://api.shelbynet.shelby.xyz/v1",
    });
    const aptos = new Aptos(config);
    
    try {
        // 3. Check Gas
        const gas = await aptos.getAccountCoinAmount({
            accountAddress: address,
            coinType: "0x1::aptos_coin::AptosCoin",
        });
        console.log(`⛽ Gas (APT):     ${gas}`);
        
        // 4. Check Storage
        const storage = await aptos.getAccountFungibleAssetBalance({
            accountAddress: address,
            fungibleAssetMetadataAddress: FA_ADDRESS,
        });
        console.log(`💾 Storage (USD): ${storage}`);
        
        console.log("---------------------------------------------------");

        // DIAGNOSIS
        if (gas < 1000) {
            console.log("❌ PROBLEM: You have NO GAS. The upload is failing because it can't pay network fees.");
            console.log("👉 FIX: Run 'node top-up.js' immediately.");
        } 
        else if (storage < 1000) {
            console.log("❌ PROBLEM: You have NO STORAGE CREDITS.");
            console.log("👉 FIX: Run 'node top-up.js' immediately.");
        } 
        else {
            console.log("✅ MONEY IS GOOD.");
            console.log("👉 FIX: If upload still fails, simply RESTART YOUR SERVER (Ctrl+C, then npm run dev).");
        }
        
    } catch(e) {
        console.log("❌ Error reading balance:", e.message);
    }
}
check();
