require("dotenv").config({ path: ".env.local" });
const { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } = require("@aptos-labs/ts-sdk");

async function refill() {
    const config = new AptosConfig({ 
        network: Network.CUSTOM, 
        fullnode: "https://api.shelbynet.shelby.xyz/v1",
        faucet: "https://faucet.shelbynet.shelby.xyz" 
    });
    const aptos = new Aptos(config);

    // Load key securely
    const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
    const account = Account.fromPrivateKey({ privateKey });

    console.log("💰 Wallet Address:", account.accountAddress.toString());
    
    // 1. Check Balance
    try {
        const resource = await aptos.getAccountCoinAmount({
            accountAddress: account.accountAddress,
            coinType: "0x1::aptos_coin::AptosCoin",
        });
        console.log("Current Balance:", resource, "SHELBY");
    } catch (e) {
        console.log("Current Balance: 0 (Account likely inactive)");
    }

    // 2. Fund it!
    console.log("\n🚰 Requesting Faucet Drop...");
    try {
        await aptos.fundAccount({
            accountAddress: account.accountAddress,
            amount: 100000000, // 1 Full Coin
        });
        console.log("✅ SUCCESS! Wallet funded.");
    } catch (e) {
        console.error("❌ Faucet Failed:", e.message);
        console.log("👉 Try visiting the Discord faucet channel and pasting your address above.");
    }
}

refill();
