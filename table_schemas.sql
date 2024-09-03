-- This file isn't used for anything but reference

create table
  public.accounts (
    id uuid not null default gen_random_uuid (),
    name character varying not null,
    starting_amount numeric not null,
    owner uuid not null,
    constraint accounts_pkey primary key (id),
    constraint accounts_owner_fkey foreign key (owner) references auth.users (id) on update cascade on delete cascade
  ) tablespace pg_default;

create table
  public.categories (
    id uuid not null default gen_random_uuid (),
    name character varying not null,
    owner uuid not null,
    constraint categories_pkey primary key (id),
    constraint categories_owner_fkey foreign key (owner) references auth.users (id) on update cascade on delete cascade
  ) tablespace pg_default;

create table
  public.transactions (
    id uuid not null default gen_random_uuid (),
    date date not null,
    name character varying not null,
    amount numeric not null,
    owner uuid null,
    category_id uuid not null,
    account_id uuid not null,
    constraint transactions_pkey primary key (id),
    constraint transactions_id_key unique (id),
    constraint transactions_account_id_fkey foreign key (account_id) references accounts (id) on update cascade on delete set null,
    constraint transactions_category_id_fkey foreign key (category_id) references categories (id) on update cascade on delete set null,
    constraint transactions_owner_fkey foreign key (owner) references auth.users (id) on update cascade on delete cascade
  ) tablespace pg_default;

