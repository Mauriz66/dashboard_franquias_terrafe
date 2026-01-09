import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pbUrl = process.env.VITE_POCKETBASE_URL;
const ADMIN_EMAIL = process.env.POCKETBASE_EMAIL;
const ADMIN_PASS = process.env.POCKETBASE_PASSWORD;
const CSV_PATH = path.resolve(__dirname, '../typebot-export_09-01-2026.csv');

console.log('Connecting to:', pbUrl);
const pb = new PocketBase(pbUrl);

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

                // Prepare new lead data
                const leadData = {
                    name: name,
                    email: email,
                    phone: phone,
                    location: record['localizacao'] || record['outra_localizacao'] || '',
                    capital: record['capital'] || '',
                    profile: record['perfil_operador'] || '',
                    operation: '', // Not in CSV directly? Maybe inferred?
                    interest: record['atracao'] || '',
                    source: record['origem_lead'] || 'csv_import',
                    status: 'novo',
                    notes: `Imported from CSV. Visão Cliente: ${record['visao_cliente'] || ''}`,
                    // Add logic for tags if needed
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
