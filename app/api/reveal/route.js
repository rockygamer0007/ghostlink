import { NextResponse } from 'next/server';
import { decrypt } from '../../../utils/crypto';

// GLOBAL MEMORY STORAGE (Instead of a file)
// Note: This resets if the server restarts, but it works perfectly for a Vercel demo.
let burntList = new Set(); 

export async function POST(request) {
    try {
        const { id } = await request.json();
        
        // 1. Decrypt (Server-Side)
        const decryptedString = decrypt(id);
        if (!decryptedString) {
            return NextResponse.json({ status: 'Corrupted' });
        }

        const data = JSON.parse(decryptedString);

        // 2. Check Expiration
        if (data.expiresAt && Date.now() > data.expiresAt) {
            return NextResponse.json({ status: 'Expired' });
        }

        // 3. Handle One-Time View (Using Memory Set)
        if (data.burnOnRead) {
            if (burntList.has(id)) {
                return NextResponse.json({ status: 'Burnt' });
            }
            // Mark as burnt immediately
            burntList.add(id);
            return NextResponse.json({ status: 'One-Time', text: data.text });
        }

        // 4. Standard Return
        return NextResponse.json({ status: 'Decrypted', text: data.text, expiresAt: data.expiresAt });

    } catch (e) {
        return NextResponse.json({ status: 'Corrupted' });
    }
}