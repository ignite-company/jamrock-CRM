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
- Private-user authentication and workspace-aware database schema connected to Jamrock's own Supabase project

**Current status:** The browser app now uses Jamrock's dedicated Supabase project URL and public publishable key by default. This does **not** mean deployment or end-to-end database validation is complete. Do not enter real customer data before the authentication, permission, and persistence tests in step 6 are passed. The sample-record preview is available only if the app is explicitly built with the database configuration removed.

## Start development

```sh
npm install
npm run dev
```

## Production setup

1. **Jamrock Supabase project exists:** `yvqduodposlpcimqqewc`. Keep it separate from other client databases.
2. The owner reported successfully running [supabase/schema.sql](supabase/schema.sql) in Jamrock's SQL Editor. Verify the tables and security policies in Supabase before first real use. Do **not** run the SQL against a different or existing client project.
3. In Supabase Authentication, disable public signups and provision the owner user. The user creation trigger automatically creates a private Jamrock workspace. For additional Jamrock staff, provision accounts and add their membership to the original workspace; do not use independent auto-created workspaces as shared production workspaces.
4. The app includes Jamrock's **public browser connection values**, so Vercel can build without additional environment configuration. If overriding them, set `VITE_SUPABASE_URL` to the base `.supabase.co` URL, never `/rest/v1/`, and `VITE_SUPABASE_ANON_KEY` to the publishable key. NEVER include database passwords, Supabase service-role keys or secret keys in client code or `VITE_` variables.
5. Deploy `ignite-company/jamrock-CRM` to a **new Vercel project** called `jamrock-crm`: framework **Vite**, build command `npm run build`, output directory `dist`. Do not modify the existing `jamrock-junk-removal` Vercel website. As of Oct 20, Vercel's connected API rejected new-project creation with HTTP 403; the owner must create/import this new project in the Vercel UI if that restriction persists.
6. Verify sign-in, create and edit lead, update job stage, schedule job, complete task, refresh persistence, and test a second unauthorized user. Only then enter real customer records.

## Integrations status

- **Google Calendar:** CRM calendar works. Google Calendar access is currently an external link, **not two-way synchronization**.
- **Google Business Profile:** external management link only, **not an authorized Business Profile API integration**.
- **Jamrock website:** inbound lead capture is planned but **not wired**. It will require a protected API/webhook and deduplication.

## Hand-off and ownership

The code lives in GitHub and can be transferred to Jamrock's organization/account when the build is finalized. Transfer the Vercel project and isolated Supabase project separately, after confirming the destination accounts, billing, environment variables and access permissions.

## Design

Logo is loaded from the image URL provided by Ignite. Color system: deep forest `#103A2B`, green `#2E884E`, orange `#E67816`, and off-white `#F7F9F7`.

## Pickup addresses and View House

- Each job stores its own saved pickup street address. Calendar days show the time, customer, and pickup address for every scheduled job.
- The **View House** button opens three optional external address-search links: **Zillow**, **Redfin**, and **Google Maps**. Links are generated from the saved full pickup address and open in a new tab.
- Zillow and Redfin are third-party searches, not guaranteed direct property listings. If a specific property is not indexed, select a matching address in the destination website.
- No MLS feed, paid data provider, or RentCast API is used by the View House feature.
- The old `jamrock-property-details` Supabase function is replaced by a deactivated endpoint (HTTP 410), and cannot make RentCast requests.
- If the old `RENTCAST_API_KEY` secret is still present in Supabase, it is no longer needed and may be deleted in **Edge Functions → Secrets**. Also review and cancel the RentCast subscription separately if one was activated.
