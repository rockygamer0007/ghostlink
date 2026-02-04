import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to our blacklist file
const DB_PATH = path.join(process.cwd(), 'data', 'burnt.json');

// Helper to read the list
function getBurntList() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

// Helper to save the list
function markAsBurnt(id) {
    const list = getBurntList();
    if (!list.includes(id)) {
        list.push(id);
        fs.writeFileSync(DB_PATH, JSON.stringify(list, null, 2));
        return true; // Successfully burned
    }
    return false; // Already burned
}

export async function POST(request) {
    try {
        const { id, action } = await request.json();

        // CHECK: Just ask "Is this burned?"
        if (action === 'check') {
            const list = getBurntList();
            const isBurnt = list.includes(id);
            return NextResponse.json({ isBurnt });
        }

        // BURN: Mark it as destroyed forever
        if (action === 'burn') {
            const success = markAsBurnt(id);
            return NextResponse.json({ success });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (e) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}