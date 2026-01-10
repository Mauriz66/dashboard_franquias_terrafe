
-- Tabela de Leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    location TEXT,
    capital TEXT,
    profile TEXT,
    operation TEXT,
    interest TEXT,
    source TEXT,
    status TEXT DEFAULT 'novo',
    notes TEXT,
    submitted_at TIMESTAMPTZ,
    meeting_date DATE,
    meeting_time TEXT,
    meeting_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Tags
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT
);

-- Tabela de Relacionamento Leads <-> Tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS lead_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(lead_id, tag_id)
);

-- Tabela de Atividades
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'note', 'status_change', 'call', etc.
    content TEXT,
    old_status TEXT,
    new_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Pipeline Stages (Opcional, se quiser personalizar colunas)
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir estágios padrão se não existirem
INSERT INTO pipeline_stages (slug, title, color, order_index) VALUES
('novo', 'Novos', 'bg-lead-new', 0),
('contato', 'Em Contato', 'bg-lead-contacted', 1),
('qualificado', 'Qualificados', 'bg-lead-qualified', 2),
('proposta', 'Proposta', 'bg-lead-proposal', 3),
('negociacao', 'Negociação', 'bg-lead-negotiation', 4),
('ganho', 'Ganhos', 'bg-lead-won', 5),
('perdido', 'Perdidos', 'bg-lead-lost', 6)
ON CONFLICT (slug) DO NOTHING;

-- Habilitar Row Level Security (RLS) - Opcional para começar, mas recomendado
-- Por enquanto, vamos deixar políticas abertas para facilitar o uso inicial via API anon/service_role
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para leitura/escrita (DEV MODE - CUIDADO EM PROD)
-- Permite acesso total para anon e service_role
CREATE POLICY "Public Access Leads" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Tags" ON tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access LeadTags" ON lead_tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Activities" ON activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Pipeline" ON pipeline_stages FOR ALL USING (true) WITH CHECK (true);
