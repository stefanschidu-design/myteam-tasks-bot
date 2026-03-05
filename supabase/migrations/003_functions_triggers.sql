-- Trigger: actualizeaza updated_at la fiecare modificare a unui task
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger tasks_updated_at
    before update on public.tasks
    for each row execute function public.update_updated_at();

-- Functie RPC: marcheaza sarcinile depasite ca 'overdue'
-- Poate fi apelata si din Python via supabase.rpc('mark_overdue_tasks')
create or replace function public.mark_overdue_tasks()
returns void language plpgsql as $$
begin
    update public.tasks
    set status = 'overdue'
    where deadline < now()
      and status in ('pending', 'in_progress');
end;
$$;

-- View: rezumat sarcini per angajat (folosit in analytics si raport zilnic)
create or replace view public.task_summary as
select
    u.id                                                                        as user_id,
    u.name                                                                      as user_name,
    count(t.id)                                                                 as total_tasks,
    count(t.id) filter (where t.status = 'completed')                          as completed_tasks,
    count(t.id) filter (where t.status = 'overdue')                            as overdue_tasks,
    count(t.id) filter (where t.status = 'in_progress')                        as in_progress_tasks,
    count(t.id) filter (where t.status = 'pending')                            as pending_tasks,
    round(
        100.0 * count(t.id) filter (where t.status = 'completed')
        / nullif(count(t.id), 0),
        2
    )                                                                           as completion_rate
from public.users u
left join public.tasks t on t.assignee_id = u.id
where u.role = 'employee'
  and u.is_active = true
group by u.id, u.name;
