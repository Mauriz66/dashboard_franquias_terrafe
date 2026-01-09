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

type PbStage = {
    title?: string;
    slug?: string;
    order_index?: number;
};

async function main() {
    try {
        await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASS!);
        console.log('Authenticated.');

        // Inspect pipeline_stages
        try {
            const col = await pb.collections.getOne('pipeline_stages');
            console.log('Collection "pipeline_stages" found.');
            console.log('Collection data:', JSON.stringify(col, null, 2));
            
            const records = await pb.collection('pipeline_stages').getFullList<PbStage>();
            console.log(`Found ${records.length} stages.`);
            records.forEach(r => console.log(`- ${r.title} (slug: ${r.slug}, order: ${r.order_index})`));

        } catch (e) {
            const err = e as { message?: string; response?: { data?: unknown } };
            console.error('Error fetching pipeline_stages collection:', err.message, err.response?.data);
        }

        // Inspect leads
        try {
            const col = await pb.collections.getOne('leads');
            console.log('\nCollection "leads" found.');
            console.log('Collection data:', JSON.stringify(col, null, 2));

            const list = await pb.collection('leads').getList(1, 5);
            console.log(`Found ${list.items.length} leads (page 1 sample).`);
            if (list.items.length > 0) {
                console.log('First lead:', JSON.stringify(list.items[0], null, 2));
            }
        } catch (e) {
             const err = e as { message?: string; response?: { data?: unknown } };
             console.error('Error fetching leads collection:', err.message, err.response?.data);
        }

    } catch (e) {
        const err = e as { message?: string; response?: { data?: unknown } };
        console.error('Fatal error:', err.message, err.response?.data);
    }
}

main();
