-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table public.users (
    id           uuid primary key default uuid_generate_v4(),
    telegram_id  bigint unique not null,
    name         text not null,
    username     text,
    role         text not null default 'employee' check (role in ('manager', 'employee')),
    is_active    boolean not null default true,
    created_at   timestamptz not null default now()
);

create index idx_users_telegram_id on public.users(telegram_id);

-- TASKS TABLE
create table public.tasks (
    id           uuid primary key default uuid_generate_v4(),
    title        text not null,
    description  text,
    creator_id   uuid not null references public.users(id) on delete restrict,
    assignee_id  uuid not null references public.users(id) on delete restrict,
    deadline     timestamptz not null,
    status       text not null default 'pending'
                 check (status in ('pending', 'in_progress', 'completed', 'overdue')),
    priority     text not null default 'medium'
                 check (priority in ('low', 'medium', 'high')),
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

create index idx_tasks_assignee_id on public.tasks(assignee_id);
create index idx_tasks_creator_id  on public.tasks(creator_id);
create index idx_tasks_status      on public.tasks(status);
create index idx_tasks_deadline    on public.tasks(deadline);

-- TASK COMMENTS TABLE
create table public.task_comments (
    id         uuid primary key default uuid_generate_v4(),
    task_id    uuid not null references public.tasks(id) on delete cascade,
    user_id    uuid not null references public.users(id) on delete restrict,
    content    text not null,
    created_at timestamptz not null default now()
);

create index idx_task_comments_task_id on public.task_comments(task_id);
