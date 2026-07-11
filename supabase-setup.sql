-- ============================================================
-- Portfolio database setup
-- Run this once in Supabase: Dashboard → SQL Editor → New query
-- → paste all of this → Run
-- ============================================================

-- PROFILE (single row, id is always 'main')
create table if not exists profile (
  id text primary key default 'main',
  name text,
  role text,
  tagline text,
  about text,
  email text,
  github text,
  linkedin text,
  "resumeUrl" text,
  location text
);

-- PROJECTS
create table if not exists projects (
  id text primary key,
  title text not null,
  "shortDescription" text,
  description text,
  image text,
  github text,
  demo text,
  tech text[],
  created_at timestamptz default now()
);

-- CERTIFICATES
create table if not exists certificates (
  id text primary key,
  title text not null,
  issuer text,
  date text,
  "shortDescription" text,
  description text,
  image text,
  "verifyUrl" text,
  created_at timestamptz default now()
);

-- SKILLS
create table if not exists skills (
  id text primary key,
  category text,
  name text not null,
  level int,
  created_at timestamptz default now()
);

-- EXPERIENCE
create table if not exists experience (
  id text primary key,
  role text not null,
  company text,
  duration text,
  "shortDescription" text,
  description text,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security: anyone can READ, only a logged-in
-- (authenticated) user can WRITE. This is what makes the admin
-- panel's login meaningful — without this, the public anon key
-- embedded in your site's code could be used by anyone to edit
-- your data directly.
-- ============================================================

alter table profile enable row level security;
alter table projects enable row level security;
alter table certificates enable row level security;
alter table skills enable row level security;
alter table experience enable row level security;

-- Public read access for every table
create policy "Public can read profile" on profile for select using (true);
create policy "Public can read projects" on projects for select using (true);
create policy "Public can read certificates" on certificates for select using (true);
create policy "Public can read skills" on skills for select using (true);
create policy "Public can read experience" on experience for select using (true);

-- Only logged-in users can write (insert/update/delete)
create policy "Authenticated can write profile" on profile for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated can write projects" on projects for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated can write certificates" on certificates for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated can write skills" on skills for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated can write experience" on experience for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Seed the profile row so the site has something to read on first load
insert into profile (id, name, role, tagline, about, email, github, linkedin, "resumeUrl", location)
values (
  'main',
  'Your Name',
  'B.Tech Graduate · Software Engineer',
  'I build fast, reliable software and enjoy turning hard problems into clean, working code.',
  'I''m a Computer Science engineering graduate who loves shipping things end to end. Update this bio from the admin panel.',
  'you@example.com',
  'https://github.com/yourusername',
  'https://linkedin.com/in/yourusername',
  'resume.pdf',
  'Jaipur, India'
)
on conflict (id) do nothing;
