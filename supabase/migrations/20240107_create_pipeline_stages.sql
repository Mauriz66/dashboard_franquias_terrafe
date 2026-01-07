-- Create Pipeline Stages table
create table if not exists pipeline_stages (
  id text primary key,
  title text not null,
  color text not null,
  order_index integer not null,
  created_at timestamp with time zone default now()
);

-- Insert default stages based on current configuration
insert into pipeline_stages (id, title, color, order_index) values
  ('novo', 'Novos', 'bg-lead-new', 0),
  ('contato', 'Em Contato', 'bg-lead-contacted', 1),
  ('qualificado', 'Qualificados', 'bg-lead-qualified', 2),
  ('proposta', 'Proposta', 'bg-lead-proposal', 3),
  ('negociacao', 'Negociação', 'bg-lead-negotiation', 4),
  ('ganho', 'Ganhos', 'bg-lead-won', 5),
  ('perdido', 'Perdidos', 'bg-lead-lost', 6)
on conflict (id) do nothing;
