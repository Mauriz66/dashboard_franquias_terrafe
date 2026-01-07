-- Habilita geração de UUIDs
create extension if not exists "uuid-ossp";

-- Tabela de Leads
create table leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  location text,
  capital text,
  profile text,
  operation text,
  interest text,
  source text,
  status text default 'novo',
  notes text,
  meeting_date date,
  meeting_time text,
  meeting_link text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tabela de Atividades (Histórico/Timeline)
create table activities (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete cascade,
  type text not null, -- 'note', 'status_change', 'call', etc.
  content text,
  old_status text,
  new_status text,
  created_at timestamp with time zone default now()
);

-- Tabela de Tags
create table tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  color text
);

-- Tabela de Relacionamento Lead <-> Tags
create table lead_tags (
  lead_id uuid references leads(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (lead_id, tag_id)
);

-- Tabela de Estágios do Pipeline
create table pipeline_stages (
  id text primary key,
  title text not null,
  color text not null,
  order_index integer not null,
  created_at timestamp with time zone default now()
);

-- Inserir dados iniciais para Estágios do Pipeline
insert into pipeline_stages (id, title, color, order_index) values
  ('novo', 'Novos', 'bg-lead-new', 0),
  ('contato', 'Em Contato', 'bg-lead-contacted', 1),
  ('qualificado', 'Qualificados', 'bg-lead-qualified', 2),
  ('proposta', 'Proposta', 'bg-lead-proposal', 3),
  ('negociacao', 'Negociação', 'bg-lead-negotiation', 4),
  ('ganho', 'Ganhos', 'bg-lead-won', 5),
  ('perdido', 'Perdidos', 'bg-lead-lost', 6)
on conflict (id) do nothing;
