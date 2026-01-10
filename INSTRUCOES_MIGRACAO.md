# Guia de Migração para Supabase

Este guia ajuda a configurar o Lead Compass para rodar 100% no Supabase Cloud, sem servidor Node.js auto-hospedado.

## 1. Criar Projeto no Supabase
1. Acesse [https://supabase.com](https://supabase.com) e crie uma conta.
2. Crie um novo projeto.
3. Aguarde o banco de dados ser provisionado.
4. Vá em **Project Settings > API** e copie:
   - `Project URL`
   - `anon` public key
   - `service_role` secret key

## 2. Configurar Variáveis de Ambiente
1. Crie um arquivo `.env` na raiz do projeto (se não existir).
2. Adicione as chaves copiadas acima:

```env
# Frontend (Vite)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica

# Scripts de Importação
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-secreta
```

## 3. Criar Banco de Dados (Tabelas)
1. No Dashboard do Supabase, clique em **SQL Editor** (ícone de terminal no menu esquerdo).
2. Copie todo o conteúdo do arquivo `supabase/schema.sql` deste projeto.
3. Cole no editor do Supabase e clique em **Run**.

## 4. Importar Dados do CSV
Seus leads antigos do CSV serão importados para o Supabase.
1. Certifique-se que o arquivo CSV (`typebot-export_09-01-2026.csv`) está na raiz do projeto.
2. Rode o comando:
   ```bash
   npm run import:supabase
   ```

## 5. Configurar Webhook (Recebimento de Leads)
Para receber novos leads do Typebot sem servidor extra:

### Opção A: Via Dashboard (Mais Fácil)
1. No Supabase, vá em **Edge Functions**.
2. Clique em **Create a new Function**.
3. Dê o nome: `typebot-webhook`.
4. Copie o código do arquivo `supabase/functions/typebot-webhook/index.ts`.
5. Cole no editor online do Supabase e salve/deploy.
6. Copie a URL gerada (ex: `https://.../functions/v1/typebot-webhook`) e coloque no seu Typebot.

### Opção B: Via CLI (Para Devs)
```bash
# Login no Supabase
npx supabase login

# Deploy da função
npx supabase functions deploy typebot-webhook
```

## 6. Rodar o Projeto
Agora é só iniciar o frontend:
```bash
npm run dev
```

Acesse `http://localhost:8080` (ou a porta que aparecer) e seus dados estarão lá!
