create table if not exists prospects (
  id serial primary key,
  code text unique not null,          -- ID (ex: ECOM-10M-A-001)
  strategy text,                      -- Estratégia
  name text,
  company text,
  linkedin text,
  email text,
  phone text,
  has_whatsapp text,                  -- Sim | Não
  stage text not null default 'Prospect',        -- Estágio
  pipeline text not null default 'fora de pipe', -- Pipeline
  created_on date default current_date,          -- Data de Criação
  meeting_scheduled boolean not null default false, -- Reunião Agendada
  no_show boolean not null default false,
  owner text default 'Nícolas',       -- Responsável
  hook text,                          -- Gancho de Recuperação
  notes text,
  proposal_value numeric,
  proposal_date date,
  updated_at timestamptz not null default now()
);
create table if not exists prospect_touches (
  prospect_id int not null references prospects(id) on delete cascade,
  touch_no int not null check (touch_no between 1 and 6),
  channel text,   -- EMAIL | WHATSAPP | LINKEDIN | INSTAGRAM | LIGAÇÃO
  status text,    -- Enviado | Recebido | Respondido
  content text,
  primary key (prospect_id, touch_no)
);
create table if not exists strategies (
  code text primary key,
  csv_link text,   -- Link do CSV da cadência
  notes text       -- Observações
);
