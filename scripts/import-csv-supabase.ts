import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CSV_PATH = path.resolve(__dirname, '../typebot-export_09-01-2026.csv');

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parsePtBrDate(dateStr: string): string {
    // Format: "8 de jan., 23:20" or "31 de dez. de 2025, 14:51"
    if (!dateStr) return new Date().toISOString();

    try {
        const months: Record<string, number> = {
            'jan.': 0, 'fev.': 1, 'mar.': 2, 'abr.': 3, 'mai.': 4, 'jun.': 5,
            'jul.': 6, 'ago.': 7, 'set.': 8, 'out.': 9, 'nov.': 10, 'dez.': 11,
            'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
            'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
        };

        const now = new Date();
        let year = now.getFullYear();
        let month = now.getMonth();
        let day = now.getDate();
        let hour = 0;
        let minute = 0;

        // Clean up the string
        const cleanStr = dateStr.toLowerCase().replace(/de /g, '').trim();
        const parts = cleanStr.split(/[\s,]+/);

        if (parts.length >= 2) {
            day = parseInt(parts[0]);
            const monthStr = parts[1];
            if (months[monthStr] !== undefined) {
                month = months[monthStr];
            }

            // Check for year
            if (parts.length >= 4 && parts[2].match(/^\d{4}$/)) {
                year = parseInt(parts[2]);
            } else {
                // Heuristic for year boundary (if needed)
            }
            
            // Time
            const timeStr = parts[parts.length - 1];
            if (timeStr.includes(':')) {
                const [h, m] = timeStr.split(':').map(Number);
                hour = h;
                minute = m;
            }
        }

        const date = new Date(year, month, day, hour, minute);
        
        // Simple year adjustment if date is too far in future (e.g. Dec 2026 when now is Jan 2026 -> Dec 2025)
        if (date > new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30)) { 
             date.setFullYear(year - 1);
        }

        return date.toISOString();

    } catch (e) {
        console.warn(`Failed to parse date "${dateStr}", using now. Error:`, e);
        return new Date().toISOString();
    }
}

// Cache for tags to avoid repeated lookups
const tagCache = new Map<string, string>();

async function getOrCreateTag(name: string): Promise<string> {
    if (!name) return '';
    if (tagCache.has(name)) return tagCache.get(name)!;

    try {
        // Try to find existing tag
        const { data: existing, error } = await supabase
            .from('tags')
            .select('id')
            .eq('name', name)
            .single();

        if (existing) {
            tagCache.set(name, existing.id);
            return existing.id;
        }

        // Create new
        const { data: created, error: createError } = await supabase
            .from('tags')
            .insert({ name: name, color: '#64748b' })
            .select('id')
            .single();

        if (createError) throw createError;
        
        if (created) {
            console.log(`Created new tag: ${name}`);
            tagCache.set(name, created.id);
            return created.id;
        }
        return '';
    } catch (err) {
        console.error(`Failed to handle tag "${name}":`, err);
        return '';
    }
}

async function main() {
    console.log('Connecting to Supabase...');
    
    if (!fs.existsSync(CSV_PATH)) {
        console.error('CSV file not found:', CSV_PATH);
        return;
    }

    const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
    }) as Record<string, string>[];

    console.log(`Found ${records.length} records in CSV.`);

    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (const record of records) {
        try {
            // Normalize data
            let email = record['email']?.trim();
            const phone = record['telefone']?.trim();
            const name = record['nome']?.trim();

            if (email && !email.includes('@')) {
                email = '';
            }

            if (!name) {
                console.log('Skipping record without name');
                continue;
            }

            // Check for existing lead by email or phone
            let existingId = null;
            if (email) {
                const { data } = await supabase.from('leads').select('id').eq('email', email).single();
                if (data) existingId = data.id;
            }
            if (!existingId && phone) {
                const { data } = await supabase.from('leads').select('id').eq('phone', phone).single();
                if (data) existingId = data.id;
            }

            if (existingId) {
                console.log(`Lead already exists: ${name} (${email || phone}) - ID: ${existingId}`);
                skipCount++;
                continue;
            }

            // Process Tags
            const tagIds: string[] = [];
            if (record['atracao']) {
                const tags = record['atracao'].split(',').map(t => t.trim()).filter(Boolean);
                for (const tagName of tags) {
                    const tagId = await getOrCreateTag(tagName);
                    if (tagId) tagIds.push(tagId);
                }
            }

            // Process Notes
            const noteParts: string[] = [];
            if (record['visao_cliente']) noteParts.push(`Visão Cliente: ${record['visao_cliente']}`);
            
            for (const [key, value] of Object.entries(record)) {
                if (!value || !value.trim()) continue;
                if (key.startsWith('FAQ') || key.includes('Mapeamento') || key === 'confirmacao' || key.includes('Revisão')) {
                    noteParts.push(`${key}: ${value.trim()}`);
                }
            }
            const notes = noteParts.join('\n');

            // Insert Lead
            const leadData = {
                name: name,
                email: email || null,
                phone: phone || null,
                location: record['localizacao'] || record['outra_localizacao'] || null,
                capital: record['capital'] || null,
                profile: record['perfil_operador'] || null,
                operation: '', 
                interest: record['atracao'] || null,
                source: record['origem_lead'] || 'csv_import',
                status: 'novo',
                submitted_at: parsePtBrDate(record['Submitted at'] || record['submitted_at'] || record['Criado em']),
            notes: notes
            };

            const { data: newLead, error: insertError } = await supabase
                .from('leads')
                .insert(leadData)
                .select('id')
                .single();

            if (insertError) throw insertError;

            // Insert Lead Tags
            if (tagIds.length > 0) {
                const tagInserts = tagIds.map(tagId => ({
                    lead_id: newLead.id,
                    tag_id: tagId
                }));
                await supabase.from('lead_tags').insert(tagInserts);
            }

            // Insert Initial Activity
            await supabase.from('activities').insert({
                lead_id: newLead.id,
                type: 'note',
                content: 'Lead importado via CSV'
            });

            console.log(`Imported: ${name}`);
            successCount++;

        } catch (e) {
            console.error(`Failed to import record ${record['nome']}:`, e);
            failCount++;
        }
    }

    console.log('\nImport Summary:');
    console.log(`Success: ${successCount}`);
    console.log(`Skipped: ${skipCount}`);
    console.log(`Failed: ${failCount}`);
}

main().catch(console.error);
