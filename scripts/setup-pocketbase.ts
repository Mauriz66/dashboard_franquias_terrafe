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

if (!ADMIN_EMAIL || !ADMIN_PASS) {
    console.error('POCKETBASE_EMAIL and POCKETBASE_PASSWORD must be set in .env');
    process.exit(1);
}

const pb = new PocketBase(pbUrl);

async function main() {
    console.log('Authenticating...');
    try {
        await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASS!);
        console.log('Authenticated!');
    } catch (e) {
        console.error('Authentication failed:', e);
        return;
    }

    // 1. Tags Collection
    try {
        await pb.collections.getOne('tags');
        console.log('Collection "tags" already exists.');
    } catch (e) {
        console.log('Creating "tags" collection...');
        await pb.collections.create({
            name: 'tags',
            type: 'base',
            fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'color', type: 'text', required: false }
            ]
        });
        console.log('Collection "tags" created.');
    }

    // Set public API rules for tags
    const tagsCollection = await pb.collections.getOne('tags');
    await pb.collections.update(tagsCollection.id, {
        listRule: '',
        viewRule: '',
        createRule: '', // Public create for testing/webhook
        updateRule: '',
        deleteRule: '',
    });
    console.log('API Rules for "tags" updated to public.');

    // 2. Leads Collection
    try {
        await pb.collections.getOne('leads');
        console.log('Collection "leads" already exists.');
    } catch (e) {
        console.log('Creating "leads" collection...');
        await pb.collections.create({
            name: 'leads',
            type: 'base',
            fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'email', type: 'email', required: false },
                { name: 'phone', type: 'text', required: false },
                { name: 'location', type: 'text', required: false },
                { name: 'capital', type: 'text', required: false },
                { name: 'profile', type: 'text', required: false },
                { name: 'operation', type: 'text', required: false },
                { name: 'interest', type: 'text', required: false },
                { name: 'source', type: 'text', required: false },
                { name: 'status', type: 'text', required: false }, // default 'novo' logic in app
                { name: 'notes', type: 'text', required: false },
                { name: 'meeting_date', type: 'date', required: false },
                { name: 'meeting_time', type: 'text', required: false },
                { name: 'meeting_link', type: 'url', required: false },
                { 
                    name: 'tags', 
                    type: 'relation', 
                    required: false,
                    collectionId: (await pb.collections.getOne('tags')).id,
                    cascadeDelete: false,
                    maxSelect: 999
                }
            ]
        });
        console.log('Collection "leads" created.');
    }

    // Set public API rules for leads
    const leadsCollection = await pb.collections.getOne('leads');
    await pb.collections.update(leadsCollection.id, {
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
    });
    console.log('API Rules for "leads" updated to public.');

    // 3. Activities Collection
    try {
        await pb.collections.getOne('activities');
        console.log('Collection "activities" already exists.');
    } catch (e) {
        console.log('Creating "activities" collection...');
        await pb.collections.create({
            name: 'activities',
            type: 'base',
            fields: [
                { 
                    name: 'lead', 
                    type: 'relation', 
                    required: true,
                    collectionId: (await pb.collections.getOne('leads')).id,
                    cascadeDelete: true,
                    maxSelect: 1
                },
                { name: 'type', type: 'text', required: true }, // 'note', 'status_change', 'email', 'call'
                { name: 'content', type: 'text', required: false },
                { name: 'old_status', type: 'text', required: false },
                { name: 'new_status', type: 'text', required: false }
            ]
        });
        console.log('Collection "activities" created.');
    }

    // Set public API rules for activities
    const activitiesCollection = await pb.collections.getOne('activities');
    await pb.collections.update(activitiesCollection.id, {
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
    });
    console.log('API Rules for "activities" updated to public.');

    // 4. Pipeline Stages Collection
    try {
        await pb.collections.getOne('pipeline_stages');
        console.log('Collection "pipeline_stages" already exists.');
    } catch (e) {
        console.log('Creating "pipeline_stages" collection...');
        await pb.collections.create({
            name: 'pipeline_stages',
            type: 'base',
            fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'color', type: 'text', required: true },
                { name: 'slug', type: 'text', required: true },
                { name: 'order_index', type: 'number', required: false }
            ]
        });

        // Insert default stages
        const stages = [
            { slug: 'novo', title: 'Novos', color: 'bg-lead-new', order_index: 0 },
            { slug: 'contato', title: 'Em Contato', color: 'bg-lead-contacted', order_index: 1 },
            { slug: 'qualificado', title: 'Qualificados', color: 'bg-lead-qualified', order_index: 2 },
            { slug: 'proposta', title: 'Proposta', color: 'bg-lead-proposal', order_index: 3 },
            { slug: 'negociacao', title: 'Negociação', color: 'bg-lead-negotiation', order_index: 4 },
            { slug: 'ganho', title: 'Ganhos', color: 'bg-lead-won', order_index: 5 },
            { slug: 'perdido', title: 'Perdidos', color: 'bg-lead-lost', order_index: 6 }
        ];

        for (const stage of stages) {
            await pb.collection('pipeline_stages').create(stage);
            console.log(`Created stage: ${stage.title}`);
        }
    }

    // Set public API rules for pipeline_stages
    const pipelineCollection = await pb.collections.getOne('pipeline_stages');
    await pb.collections.update(pipelineCollection.id, {
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
    });
    console.log('API Rules for "pipeline_stages" updated to public.');

}

main().catch(console.error);
