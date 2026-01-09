import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pbUrl = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_EMAIL;
const ADMIN_PASS = process.env.POCKETBASE_PASSWORD;

const pb = new PocketBase(pbUrl);

async function verify() {
    try {
        await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASS!);
        const result = await pb.collection('leads').getList(1, 1, {
            '$autoCancel': false
        });
        console.log(`Total leads in PocketBase: ${result.totalItems}`);
        
        // List first 3 names to confirm
        const firstFew = await pb.collection('leads').getList(1, 3, { sort: '-created' });
        console.log('Latest 3 leads:', firstFew.items.map(i => i.name).join(', '));
        
    } catch (e) {
        console.error('Verification failed:', e);
    }
}

verify();
