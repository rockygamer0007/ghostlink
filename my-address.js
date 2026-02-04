const { Account, Ed25519PrivateKey } = require("@aptos-labs/ts-sdk");
require('dotenv').config({ path: '.env.local' });

try {
    const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
    const account = Account.fromPrivateKey({ privateKey });
    
    console.log("\n==================================================");
    console.log("🟢 YOUR SHELBY WALLET ADDRESS");
    console.log("==================================================");
    console.log(account.accountAddress.toString());
    console.log("==================================================\n");

} catch (e) {
    console.error("Error reading key:", e.message);
}