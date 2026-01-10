
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const mapSource = (source: string) => {
    if (!source) return 'outro';
    const s = source.toLowerCase();
    if (s.includes('instagram')) return 'instagram';
    if (s.includes('facebook')) return 'facebook';
    if (s.includes('whatsapp')) return 'whatsapp';
    if (s.includes('site') || s.includes('web')) return 'website';
    if (s.includes('indica')) return 'indicacao';
    return 'outro';
};

async function fixSources() {
    console.log('Starting lead source normalization...');

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, source, name');

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    console.log(`Found ${leads.length} leads.`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const lead of leads) {
        const originalSource = lead.source;
        const normalizedSource = mapSource(originalSource);

        if (originalSource !== normalizedSource) {
            console.log(`Updating lead ${lead.name} (${lead.id}): "${originalSource}" -> "${normalizedSource}"`);
            
            const { error: updateError } = await supabase
                .from('leads')
                .update({ source: normalizedSource })
                .eq('id', lead.id);

            if (updateError) {
                console.error(`Failed to update lead ${lead.id}:`, updateError);
                errorCount++;
            } else {
                updatedCount++;
            }
        }
    }

    console.log('-----------------------------------');
    console.log(`Finished processing leads.`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Unchanged: ${leads.length - updatedCount - errorCount}`);
}

fixSources();
