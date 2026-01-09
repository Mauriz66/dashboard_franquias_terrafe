import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Configurar dotenv
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

const CSV_PATH = path.resolve(__dirname, '../typebot-export_09-01-2026.csv');

function parseCSVLine(text: string) {
    const result = [];
    let cell = '';
    let inQuote = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            result.push(cell);
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell);
    return result.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
}

async function main() {
    console.log('Authenticating...');
    try {
        await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASS!);
        console.log('Authenticated!');
    } catch (e) {
        console.error('Authentication failed:', e);
        return;
    }

    if (!fs.existsSync(CSV_PATH)) {
        console.error('CSV file not found:', CSV_PATH);
        return;
    }

    const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = fileContent.split('\n').filter(l => l.trim());
    const headers = parseCSVLine(lines[0]);
    
    // Map headers to indices
    const idx = {
        nome: headers.indexOf('nome'),
        email: headers.indexOf('email'),
        phone: headers.indexOf('telefone'),
        location: headers.indexOf('localizacao'),
        other_location: headers.indexOf('outra_localizacao'),
        capital: headers.indexOf('capital'),
        profile_op: headers.indexOf('perfil_operador'),
        interest: headers.indexOf('atracao'),
        source: headers.indexOf('origem_lead'),
        vision: headers.indexOf('visao_cliente'),
        deadline: headers.indexOf('prazo'),
        confirmation: headers.indexOf('confirmacao'),
        submitted: headers.indexOf('Submitted at')
    };

    console.log(`Found ${lines.length - 1} leads to process.`);

    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length < headers.length) continue;

        const leadData: any = {
            name: row[idx.nome] || 'Sem Nome',
            email: row[idx.email],
            phone: row[idx.phone],
            location: row[idx.location] || row[idx.other_location],
            capital: row[idx.capital],
            interest: row[idx.interest],
            status: 'novo'
        };

        // Logic for profile/operation
        const opProfile = (row[idx.profile_op] || '').toLowerCase();
        if (opProfile.includes('investidor')) {
            leadData.profile = 'investidor';
            leadData.operation = 'investidor';
        } else if (opProfile.includes('operar') || opProfile.includes('eu mesmo')) {
            leadData.profile = 'empresario';
            leadData.operation = 'operador';
        } else {
            leadData.profile = 'outro';
            leadData.operation = 'definindo';
        }

        // Logic for source
        const src = (row[idx.source] || '').toLowerCase();
        if (src.includes('instagram')) leadData.source = 'instagram';
        else if (src.includes('facebook')) leadData.source = 'facebook';
        else if (src.includes('whatsapp')) leadData.source = 'whatsapp';
        else if (src.includes('site') || src.includes('web')) leadData.source = 'website';
        else if (src.includes('indica')) leadData.source = 'indicacao';
        else leadData.source = 'outro';

        // Notes
        const notes = [];
        if (row[idx.vision]) notes.push(`Visão: ${row[idx.vision]}`);
        if (row[idx.deadline]) notes.push(`Prazo: ${row[idx.deadline]}`);
        if (row[idx.confirmation]) notes.push(`Confirmação: ${row[idx.confirmation]}`);
        if (row[idx.submitted]) notes.push(`Enviado em: ${row[idx.submitted]}`);
        leadData.notes = notes.join('\n\n');

        try {
            const record = await pb.collection('leads').create(leadData);
            console.log(`Imported: ${leadData.name}`);
            
            // Create initial activity
            await pb.collection('activities').create({
                lead: record.id,
                type: 'note',
                content: 'Importado via CSV'
            });

        } catch (e: any) {
            console.error(`Error importing ${leadData.name}:`, e.status, e.response);
        }
    }
}

main();
