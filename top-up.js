const { Account, Ed25519PrivateKey, Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");
require('dotenv').config({ path: '.env.local' });

// The Storage Credit ID
const FA_ADDRESS = "0x1b18363a9f1fe5e6ebf247daba5cc1c18052bb232efdc4c50f556053922d98e1";

async function finishFunding() {
    const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
    const owner = Account.fromPrivateKey({ privateKey });
    const address = owner.accountAddress.toString();
    
    console.log(`👤 Wallet: ${address}`);
    console.log("---------------------------------------------------");

    // We ONLY ask for ShelbyUSD this time
    console.log("💾 Requesting Storage Credits (ShelbyUSD)...");
    
    try {
        const response = await fetch(`https://faucet.shelbynet.shelby.xyz/fund?asset=shelbyusd`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: address, amount: 50_000_000_000 })
        });

        if (response.ok) {
            console.log("✅ REQUEST ACCEPTED!");
            console.log("---------------------------------------------------");
            console.log("💤 Waiting 5 seconds for balance to update...");
            await new Promise(r => setTimeout(r, 5000));
            await checkBalance(address);
        } else {
            console.log(`❌ Error: ${await response.text()}`);
        }
    } catch (e) { console.log(`❌ Connection failed: ${e.message}`); }
}

async function checkBalance(address) {
    try {
        const config = new AptosConfig({
            network: Network.CUSTOM,
            fullnode: "https://api.shelbynet.shelby.xyz/v1",
        });
        const aptos = new Aptos(config);
        const balance = await aptos.getAccountFungibleAssetBalance({
            accountAddress: address,
            fungibleAssetMetadataAddress: FA_ADDRESS,
        });
        console.log(`💰 FINAL BALANCE: ${balance}`);
        
        if(balance > 0) console.log("🚀 YOU ARE READY. RESTART SERVER AND UPLOAD.");
    } catch (e) { console.log("⚠️ Balance check failed (but funds likely sent)."); }
}

finishFunding();
