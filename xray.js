const { Aptos, AptosConfig, Network } = require("@aptos-labs/ts-sdk");
const { Account, Ed25519PrivateKey } = require("@aptos-labs/ts-sdk");
require('dotenv').config({ path: '.env.local' });

async function xray() {
    console.log("🩻 PERFORMING ACCOUNT X-RAY...");
    
    const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
    const address = Account.fromPrivateKey({ privateKey }).accountAddress.toString();
    console.log(`👤 Target: ${address}`);

    const config = new AptosConfig({ network: Network.CUSTOM, fullnode: "https://api.shelbynet.shelby.xyz/v1" });
    const aptos = new Aptos(config);

    // Fetch ALL resources
    const resources = await aptos.getAccountResources({ accountAddress: address });

    console.log(`📦 Found ${resources.length} resource containers.`);
    console.log("---------------------------------------------------");

    // Scan them for our text
    for (const res of resources) {
        const type = res.type;
        const data = JSON.stringify(res.data);
        
        console.log(`🔹 Type: ${type}`);
        // print first 100 chars of data to keep it clean
        console.log(`   Data: ${data.substring(0, 150)}...`); 
        console.log("---------------------------------------------------");
    }
}

xray();
