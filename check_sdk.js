// Try to find where the "Network" list is hiding
try {
    const main = require('@shelby-protocol/sdk');
    console.log("--- MAIN EXPORTS ---");
    console.log(Object.keys(main));
    if (main.Network) console.log("VALID NETWORKS:", main.Network);
} catch (e) { console.log("Main import failed"); }

try {
    const node = require('@shelby-protocol/sdk/node');
    console.log("\n--- NODE EXPORTS ---");
    console.log(Object.keys(node));
} catch (e) { console.log("Node import failed"); }
