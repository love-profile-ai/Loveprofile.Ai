-- Guest accounts require admin approval like all other users.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_guest_user boolean := coalesce((new.raw_user_meta_data->>'guest')::boolean, false);
  provider_name text := coalesce(new.raw_app_meta_data->>'provider', 'email');
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    display_name,
    avatar_url,
    provider,
    is_guest,
    approval_status
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    provider_name,
    is_guest_user,
    'pending'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    provider = coalesce(public.profiles.provider, excluded.provider),
    is_guest = public.profiles.is_guest or excluded.is_guest;

  insert into public.admin_notifications (type, title, message, metadata)
  values (
    'user_registration',
    case when is_guest_user then 'New guest awaiting approval' else 'New user awaiting approval' end,
    coalesce(new.email, 'A new user') || ' registered and needs review.',
    jsonb_build_object(
      'user_id', new.id,
      'email', new.email,
      'provider', provider_name,
      'is_guest', is_guest_user
    )
  );

  return new;
end;
$$ language plpgsql security definer;

-- Existing auto-approved guest accounts now require approval.
update public.profiles
set approval_status = 'pending'
where is_guest = true
  and role != 'admin'
  and approval_status = 'approved';
