-- Enable RLS on all tables
alter table public.users         enable row level security;
alter table public.tasks         enable row level security;
alter table public.task_comments enable row level security;

-- ============================================================
-- USERS policies
-- ============================================================

-- Toti pot citi lista utilizatorilor (necesar pentru dropdown responsabil)
create policy "users_select_all"
    on public.users for select
    using (true);

-- Utilizatorii isi pot actualiza propriul profil
create policy "users_update_own"
    on public.users for update
    using (telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint);

-- Insertul este gestionat de bot via service_role (bypass RLS)

-- ============================================================
-- TASKS policies
-- ============================================================

-- Managerii vad toate sarcinile; angajatii vad doar sarcinile lor (atribuite sau create)
create policy "tasks_select"
    on public.tasks for select
    using (
        exists (
            select 1 from public.users
            where telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint
              and role = 'manager'
        )
        or
        assignee_id in (
            select id from public.users
            where telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint
        )
        or
        creator_id in (
            select id from public.users
            where telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint
        )
    );

-- Doar managerii pot crea sarcini din browser (botul foloseste service_role)
create policy "tasks_insert_manager"
    on public.tasks for insert
    with check (
        exists (
            select 1 from public.users
            where telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint
              and role = 'manager'
        )
    );

-- Responsabilul poate actualiza statusul; managerul poate actualiza orice
create policy "tasks_update"
    on public.tasks for update
    using (
        assignee_id in (
            select id from public.users
            where telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint
        )
        or
        exists (
            select 1 from public.users
            where telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint
              and role = 'manager'
        )
    );

-- Doar managerii pot sterge sarcini
create policy "tasks_delete_manager"
    on public.tasks for delete
    using (
        exists (
            select 1 from public.users
            where telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint
              and role = 'manager'
        )
    );

-- ============================================================
-- TASK COMMENTS policies
-- ============================================================

-- Pot vedea comentariile cei implicati in sarcina (creator sau responsabil)
create policy "comments_select"
    on public.task_comments for select
    using (
        exists (
            select 1 from public.tasks t
            join public.users u on u.id = t.assignee_id or u.id = t.creator_id
            where t.id = task_id
              and u.telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint
        )
    );

-- Pot adauga comentarii doar cei implicati
create policy "comments_insert"
    on public.task_comments for insert
    with check (
        user_id in (
            select id from public.users
            where telegram_id = (current_setting('request.jwt.claims', true)::json->>'telegram_id')::bigint
        )
    );
