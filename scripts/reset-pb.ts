import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pbUrl = process.env.VITE_POCKETBASE_URL;
const ADMIN_EMAIL = process.env.POCKETBASE_EMAIL;
const ADMIN_PASS = process.env.POCKETBASE_PASSWORD;

console.log('Connecting to:', pbUrl);

const pb = new PocketBase(pbUrl);

async function main() {
    try {
        await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASS!);
        console.log('Authenticated.');

        const collections = ['activities', 'leads', 'tags', 'pipeline_stages'];

        for (const name of collections) {
            try {
                const col = await pb.collections.getOne(name);
                console.log(`Deleting collection "${name}"...`);
                await pb.collections.delete(col.id);
                console.log(`Deleted "${name}".`);
            } catch (e) {
                const status = typeof e === 'object' && e !== null && 'status' in e
                    ? (e as { status?: number }).status
                    : undefined;
                if (status === 404) {
                    console.log(`Collection "${name}" not found (already deleted).`);
                } else {
                    const err = e as { message?: string; response?: { data?: unknown } };
                    console.error(`Error deleting "${name}":`, err.message, err.response?.data);
                }
            }
        }

    } catch (e) {
        const err = e as { message?: string; response?: { data?: unknown } };
        console.error('Fatal error:', err.message, err.response?.data);
    }
}

main();
