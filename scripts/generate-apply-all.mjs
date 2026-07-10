import { readFileSync, readdirSync, writeFileSync } from "fs";
import { resolve } from "path";

const migrationsDir = resolve("supabase/migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let sql = `-- Loveprofile.Ai — run this ONCE in Supabase → SQL Editor → New query → Run\n\n`;

for (const file of files) {
  sql += `-- ===== ${file} =====\n`;
  sql += readFileSync(resolve(migrationsDir, file), "utf8");
  sql += "\n\n";
}

sql += `-- Backfill profiles for auth users created before migrations
insert into public.profiles (
  id, email, full_name, display_name, avatar_url, provider, is_guest, approval_status, role
)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  u.raw_user_meta_data->>'avatar_url',
  coalesce(u.raw_app_meta_data->>'provider', 'email'),
  coalesce((u.raw_user_meta_data->>'guest')::boolean, false),
  case when coalesce((u.raw_user_meta_data->>'guest')::boolean, false) then 'approved' else 'pending' end,
  'user'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- After running this file:
-- 1. Sign in at http://localhost:3000/login with Google or email (NOT guest)
-- 2. Promote your real account:
-- UPDATE public.profiles SET role='admin', approval_status='approved', approved_at=now() WHERE email='your@email.com';
`;

const outPath = resolve("supabase/APPLY_ALL.sql");
writeFileSync(outPath, sql);
console.log(`Wrote ${outPath} (${sql.length} chars, ${files.length} migrations)`);
