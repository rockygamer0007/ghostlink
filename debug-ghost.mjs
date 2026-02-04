import { ShelbyClient } from '@shelby-protocol/sdk';
import { Account, Ed25519PrivateKey, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import dotenv from 'dotenv';
import fs from 'fs';

// Load env manually since dotenv-flow isn't here
const envConfig = dotenv.config({ path: '.env.local' });

async function diagnose() {
    console.log("🔍 GHOSTLINK HEALTH CHECK (ESM Mode)");
    console.log("---------------------------------------------------");

    // 1. Check Private Key
    const key = process.env.SHELBY_PRIVATE_KEY;
    if (!key) {
        console.log("❌ CRITICAL: No SHELBY_PRIVATE_KEY found in .env.local");
        return;
    }
    
    // 2. Setup Wallet
    const privateKey = new Ed25519PrivateKey(key);
    const owner = Account.fromPrivateKey({ privateKey });
    const address = owner.accountAddress.toString();
    console.log(`👤 Wallet Address: ${address}`);

    // 3. Check Balance (The most important part)
    console.log("\n💰 Checking Real Balance...");
    const config = new AptosConfig({
        network: Network.CUSTOM,
        fullnode: "https://api.shelbynet.shelby.xyz/v1",
    });
    const aptos = new Aptos(config);

    try {
        // Check Gas (APT)
        const aptBalance = await aptos.getAccountCoinAmount({
            accountAddress: address,
            coinType: "0x1::aptos_coin::AptosCoin",
        });
        
        // Check Storage (ShelbyUSD)
        const faAddress = "0x1b18363a9f1fe5e6ebf247daba5cc1c18052bb232efdc4c50f556053922d98e1";
        const shelbyBalance = await aptos.getAccountFungibleAssetBalance({
            accountAddress: address,
            fungibleAssetMetadataAddress: faAddress,
        });

        console.log(`   - Gas (APT):      ${aptBalance}`);
        console.log(`   - Storage (USD):  ${shelbyBalance}`);

        if (aptBalance < 1000 || shelbyBalance < 1000) {
            console.log("\n❌ FAIL: Your wallet is EMPTY.");
            console.log("👉 FIX: Run 'node top-up.js' immediately.");
            return;
        }

    } catch (e) {
        console.log("⚠️ Could not read balance (Network might be slow):", e.message);
    }

    // 4. Test Actual Upload
    console.log("\n📤 Attempting Test Upload...");
    
    const client = new ShelbyClient({
        network: "custom",
        aptos: {
            network: "custom",
            fullnode: "https://api.shelbynet.shelby.xyz/v1",
        },
        indexer: {
            baseUrl: "https://api.shelbynet.aptoslabs.com/nocode/v1/public/cmforrguw0042s601fn71f9l2/v1/graphql"
        }
    });

    try {
        const testName = `debug_${Math.floor(Math.random() * 1000)}.txt`;
        const blobData = Buffer.from("Debug Test Content", 'utf-8');
        
        // Expiry: 1 hour from now
        const expiry = Date.now() * 1000 + (60 * 60 * 1000000); 

        const tx = await client.upload({
            blobData: blobData,
            blobName: testName,
            expirationMicros: expiry, 
            signer: owner
        });

        console.log("\n✅ SUCCESS! Upload worked.");
        console.log(`   File: ${testName}`);
        console.log("   (If you see this, your APP code is the problem, not the network).");

    } catch (e) {
        console.log("\n❌ UPLOAD CRASHED.");
        console.log("---------------------------------------------------");
        console.log(e);
        console.log("---------------------------------------------------");
    }
}

diagnose();
