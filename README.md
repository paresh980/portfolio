# Your Portfolio Website (now with a real live database)

Your data now lives in **Supabase** (a free, hosted Postgres database) instead of the browser.
That means: edit content from any device, log in once, and every visitor everywhere sees the update
immediately — no more "it only updates on my computer."

## Files
- `index.html` — the public portfolio site
- `admin.html` — the admin panel (login required)
- `style.css` / `admin.css` — styling
- `config.js` — **your Supabase project credentials go here**
- `db.js` — data layer (talks to Supabase)
- `app.js` — portfolio page logic
- `admin.js` — admin panel logic
- `supabase-setup.sql` — run this once inside Supabase to create your tables

## One-time setup (about 10 minutes)

### 1. Create a Supabase project
- Go to **https://supabase.com** → sign up free (email or GitHub) → **New Project**
- Pick any name/region, set a database password (save it somewhere), wait ~2 min for it to spin up

### 2. Create your tables
- In your project, open **SQL Editor** (left sidebar) → **New query**
- Open `supabase-setup.sql` from this folder, copy all of it, paste into the editor, click **Run**
- This creates the `profile`, `projects`, `certificates`, `skills`, and `experience` tables, plus
  security rules (anyone can *read*, only a logged-in user can *write*)

### 3. Get your API credentials
- Go to **Project Settings → API**
- Copy the **Project URL**
- Copy the **anon public** key (⚠️ not the `service_role` key — that one must stay secret)
- Open `config.js` in this folder and paste both in:
  ```js
  const SUPABASE_URL = "https://your-project-ref.supabase.co";
  const SUPABASE_ANON_KEY = "your-anon-public-key";
  ```

### 4. Create your admin login
- Go to **Authentication → Users → Add user**
- Enter your own email and a password — this is what you'll log into `admin.html` with
- (Auto-confirm the user, or check "Auto Confirm User" if shown, so you don't need email verification)

### 5. Load sample content (optional, recommended for first look)
- Open `admin.html`, log in with the account you just created
- Go to **Settings → Load sample data** to fill your tables with placeholder content you can then edit

That's it — your site and admin panel are now fully live and shared across every device.

## Deploying
Since this is still a static site (no server needed), deploy it exactly as before:
- **Vercel**: `npx vercel` from this folder, or import via GitHub at vercel.com
- **Netlify**: drag the folder onto https://app.netlify.com/drop
- **GitHub Pages**: push to a repo, enable Pages in repo Settings

Just make sure `config.js` (with your real credentials) is included when you deploy — it's meant to be
public, since the anon key is safe to expose (the SQL script's security rules are what actually protect
your data from being edited by strangers).

## Editing content after deployment
1. Go to `yourdomain.com/admin.html`
2. Log in with your Supabase account email/password
3. Edit anything — Projects, Certificates, Skills, Experience, Profile
4. Changes save straight to the database and appear on the live site immediately for everyone (refresh
   the site to see it — no rebuild or redeploy needed)

## Backup & transfer
Admin → Settings has **Export data (.json)** and **Import data (.json)** buttons — useful for backups,
or moving content between two different Supabase projects.

## Changing your password
Admin → Settings → Change admin password. (Forgot it entirely? Reset it from the Supabase dashboard:
Authentication → Users → your user → "Send password recovery," or just set a new one directly there.)

## Customizing design
All colors, fonts and spacing are CSS variables at the top of `style.css` under `:root`. Change
`--accent` / `--accent-2` there to shift the whole color scheme.

## Notes
- Images for projects/certificates are just URLs — paste a link (Unsplash, your own hosting, etc.)
- "See more" opens a modal with the full description from the admin panel
- If you ever see a red banner saying Supabase isn't configured, double-check `config.js`
