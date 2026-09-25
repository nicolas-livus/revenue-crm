create table if not exists accounts (
  id serial primary key,
  name text not null,
  domain text unique,
  round text,              -- rodada de prospecção (ex: R12)
  thesis text,             -- tese (ex: T03)
  radar_notes text,        -- sinais do radar
  status text not null default 'ativa', -- ativa | descartada
  created_at timestamptz not null default now()
);
create table if not exists contacts (
  id serial primary key,
  account_id int references accounts(id) on delete cascade,
  name text not null,
  title text,
  email text,
  phone text,
  linkedin text,
  stage text not null default 'novo', -- novo | t1_enviado | cadencia | respondeu | conexao | reuniao | ganho | perdido
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists touches (
  id serial primary key,
  contact_id int references contacts(id) on delete cascade,
  touch_no int,            -- 1..6
  channel text,            -- whatsapp | email | linkedin | ligacao
  message text,
  reply text,
  sent_at timestamptz default now()
);
create index if not exists contacts_account_idx on contacts(account_id);
create index if not exists touches_contact_idx on touches(contact_id);
