import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        
        // Extract parts
        const parts = cleanStr.split(/[\s,]+/);
        // Examples after split: 
        // "8 de jan., 23:20" -> ["8", "jan.", "23:20"]
        // "31 de dez. de 2025, 14:51" -> ["31", "dez.", "2025", "14:51"]

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
                // Heuristic: If month is greater than current month + 1, it's likely previous year?
                // Or since file is from 2026, and data seems recent.
                // "31 dez" -> 2025 if now is Jan 2026.
                // "8 jan" -> 2026.
                // Let's assume if month > now.month + 6, it's last year? 
                // Better: check if date is in future, if so, substract 1 year.
                // But we are in Jan 2026.
                // "31 dez" -> Month 11. Now Month 0.
                // 11 > 0.
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
        
        // Adjustment for year rollover if not specified
        // If we constructed a date that is way in the future (e.g. Dec 2026 when now is Jan 2026), it was likely Dec 2025.
        if (date > new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30)) { // 30 days buffer
             date.setFullYear(year - 1);
        }

        return date.toISOString();

    } catch (e) {
        console.warn(`Failed to parse date "${dateStr}", using now. Error:`, e);
        return new Date().toISOString();
    }
}
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pbUrl = process.env.VITE_POCKETBASE_URL;
const ADMIN_EMAIL = process.env.POCKETBASE_EMAIL;
const ADMIN_PASS = process.env.POCKETBASE_PASSWORD;
const CSV_PATH = path.resolve(__dirname, '../typebot-export_09-01-2026.csv');

console.log('Connecting to:', pbUrl);
const pb = new PocketBase(pbUrl);

// Cache for tags to avoid repeated lookups
const tagCache = new Map<string, string>();

async function getOrCreateTag(name: string): Promise<string> {
    if (!name) return '';
    if (tagCache.has(name)) return tagCache.get(name)!;

    try {
        // Try to find existing tag
        const record = await pb.collection('tags').getFirstListItem(`name="${name}"`);
        tagCache.set(name, record.id);
        return record.id;
    } catch (e) {
        // Not found, create new
        try {
            const record = await pb.collection('tags').create({
                name: name,
                color: '#64748b' // Default slate color
            });
            console.log(`Created new tag: ${name}`);
            tagCache.set(name, record.id);
            return record.id;
        } catch (createErr) {
            console.error(`Failed to create tag "${name}":`, createErr);
            return '';
        }
    }
}

async function main() {
    try {
        await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASS!);
        console.log('Authenticated.');

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
                    console.log(`Invalid email for ${name}: "${email}". Setting to empty.`);
                    email = '';
                }

                if (!name) {
                    console.log('Skipping record without name');
                    continue;
                }

                // Check for existing lead
                let existing = null;
                if (email) {
                    try {
                        existing = await pb.collection('leads').getFirstListItem(`email="${email}"`);
                    } catch (e) {
                        const status = typeof e === 'object' && e !== null && 'status' in e
                            ? (e as { status?: number }).status
                            : undefined;
                        if (status !== 404) throw e;
                    }
                }
                if (!existing && phone) {
                    try {
                        existing = await pb.collection('leads').getFirstListItem(`phone="${phone}"`);
                    } catch (e) {
                        const status = typeof e === 'object' && e !== null && 'status' in e
                            ? (e as { status?: number }).status
                            : undefined;
                        if (status !== 404) throw e;
                    }
                }

                if (existing) {
                    console.log(`Lead already exists: ${name} (${email || phone}) - ID: ${existing.id}`);
                    skipCount++;
                    continue;
                }

                // Process Tags (from 'atracao')
                const tagIds: string[] = [];
                if (record['atracao']) {
                    const tags = record['atracao'].split(',').map(t => t.trim()).filter(Boolean);
                    for (const tagName of tags) {
                        const tagId = await getOrCreateTag(tagName);
                        if (tagId) tagIds.push(tagId);
                    }
                }

                // Process Notes (Aggregate extra fields)
                const noteParts: string[] = [];
                if (record['visao_cliente']) noteParts.push(`Visão Cliente: ${record['visao_cliente']}`);
                
                // Collect FAQ and other fields
                for (const [key, value] of Object.entries(record)) {
                    if (!value || !value.trim()) continue;
                    
                    if (key.startsWith('FAQ') || 
                        key.includes('Mapeamento') || 
                        key === 'confirmacao' || 
                        key.includes('Revisão')) {
                        noteParts.push(`${key}: ${value.trim()}`);
                    }
                }
                const notes = noteParts.join('\n');

                // Prepare new lead data
                const leadData = {
                    name: name,
                    email: email,
                    phone: phone,
                    location: record['localizacao'] || record['outra_localizacao'] || '',
                    capital: record['capital'] || '',
                    profile: record['perfil_operador'] || '',
                    operation: '', 
                    interest: record['atracao'] || '',
                    source: record['origem_lead'] || 'csv_import',
                    status: 'novo',
                    submitted_at: parsePtBrDate(record['Submitted at']),
                    notes: notes,
                    tags: tagIds
                };

                await pb.collection('leads').create(leadData);
                console.log(`Imported: ${name}`);
                successCount++;

            } catch (e) {
                const err = e as { message?: string; response?: { data?: unknown } };
                console.error(`Failed to import record ${record['nome']}:`, err.message, err.response?.data);
                failCount++;
            }
        }

        console.log('\nImport Summary:');
        console.log(`Success: ${successCount}`);
        console.log(`Skipped (Duplicate): ${skipCount}`);
        console.log(`Failed: ${failCount}`);

    } catch (e) {
        const err = e as { message?: string; response?: { data?: unknown } };
        console.error('Fatal error:', err.message, err.response?.data);
    }
}

main();
