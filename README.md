# Jamrock Command Center

Custom, mobile-first CRM for **Jamrock Junk Removal, LLC** in Gainesville, Florida.

## Version 1

- Jamrock branding with a clean white UI, forest-green navigation and orange highlights
- Dashboard with new leads, open estimates, booked jobs and recorded completed-job value
- Customer directory with phone, email, address and notes
- Lead pipeline with editable stages: new, contacted, estimate sent, booked, completed, lost
- Jobs, estimates, scheduled appointments and CSV export
- CRM calendar for booked work
- Follow-up checklist and reminder dates
- Mobile-responsive layout
- Private-user authentication and workspace-aware database schema, ready to enable with an isolated Supabase project

The demo is *not* a production CRM. Without Supabase environment variables the app runs with explicitly marked fake sample contacts stored only in the visitor's browser. Do not enter real customer details into demo mode.

## Start development

```sh
npm install
npm run dev
```

## Production setup

1. Create a **new, isolated Supabase project for Jamrock**. Do not reuse another client's or Ignite's operational database.
2. Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL editor. This creates workspace, contact, job and follow-up tables with row-level security.
3. In Supabase Authentication, disable public signups and provision the owner user. The user creation trigger automatically creates a private Jamrock workspace. For additional Jamrock staff, provision accounts and add their membership to the original workspace; do not use independent auto-created workspaces as shared production workspaces.
4. Copy `.env.example` to `.env.local` and add the dedicated Supabase project URL and **publishable or anon key**. NEVER put a Supabase service-role key or secret key into any `VITE_` environment variable.
5. Deploy this GitHub repository to a Vercel project with framework **Vite**, build command `npm run build`, output directory `dist`. Set the same `VITE_` values for Production.
6. Verify sign-in, create and edit lead, update job stage, schedule job, complete task, refresh persistence, and test a second unauthorized user. Only then enter real customer records.

## Integrations status

- **Google Calendar:** CRM calendar works. Google Calendar access is currently an external link, **not two-way synchronization**.
- **Google Business Profile:** external management link only, **not an authorized Business Profile API integration**.
- **Jamrock website:** inbound lead capture is planned but **not wired**. It will require a protected API/webhook and deduplication.

## Hand-off and ownership

The code lives in GitHub and can be transferred to Jamrock's organization/account when the build is finalized. Transfer the Vercel project and isolated Supabase project separately, after confirming the destination accounts, billing, environment variables and access permissions.

## Design

Logo is loaded from the image URL provided by Ignite. Color system: deep forest `#103A2B`, green `#2E884E`, orange `#E67816`, and off-white `#F7F9F7`.
