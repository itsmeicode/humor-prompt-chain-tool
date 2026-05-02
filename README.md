# Prompt Chain Tool

Prompt Chain Tool is an admin interface for building and testing humor flavors — ordered chains of prompt steps that turn an image into captions via the `api.almostcrackd.ai` REST API. Built with Next.js, Supabase, and Tailwind CSS.

## App routes

- `/` — Redirects to `/admin`
- `/login` — Sign-in page (Google OAuth)
- `/auth/callback` — OAuth callback route
- `/auth/signout` — Sign-out endpoint
- `/access-denied` — Shown when user lacks admin access
- `/admin` — Protected overview
- `/admin/flavors` — Protected humor flavors list (CRUD + paginated)
- `/admin/flavors/[id]` — Protected flavor detail with step CRUD + drag-and-drop reorder
- `/admin/flavors/[id]/test` — Protected test page (image picker + upload + caption generation)
- `/admin/flavors/[id]/captions` — Protected captions reader filtered by flavor

## Walkthrough

1. Go to `/` and sign in with Google.
2. If your profile has `is_superadmin == true` **or** `is_matrix_admin == true`, you'll land on `/admin`. Otherwise you're sent to `/access-denied`.
3. Click **Humor Flavors** in the sidebar to see the paginated list (15 per page).
4. Create a new flavor with a unique slug + optional description, or **Edit** / **Delete** / **Duplicate** existing ones. Duplicating copies the flavor and all its steps under a new slug.
5. Click a flavor's slug to open its detail page. Add steps with the form, edit them inline, drag the `⋮⋮` handle to reorder, and delete with confirmation.
6. Each step has a step type, model, input/output type, optional temperature, and required system + user prompts.
7. Click **Test flavor →** to pick an existing image (or upload one) and generate captions through the REST API.
8. Click **View captions** to read every caption ever produced by this flavor, grouped by image.
9. Toggle light/dark/system mode with the bottom-right theme switcher.
10. Sign out from the sidebar.

## Core functionality

### Authentication + protection

Uses Supabase Auth (Google OAuth). All `/admin` routes redirect to `/login` if there is no active session. After sign-in, the admin layout checks `profiles.is_superadmin == true` **or** `profiles.is_matrix_admin == true`. If neither is true, the user is redirected to `/access-denied?reason=not_admin`. Other failure modes (`profile_error`, `no_profile_row`) have their own reason codes.

### Humor flavor CRUD (Supabase mutations)

Server actions handle inserts/updates/deletes against `humor_flavors`. Each mutation re-runs the admin gate so the action is not bypassable from a client call. Audit columns (`created_by_user_id`, `modified_by_user_id`, `created_datetime_utc`, `modified_datetime_utc`) are filled automatically.

### Humor flavor step CRUD with drag-and-drop reorder

Steps are managed via `humor_flavor_steps`. The form pulls dropdown options from real DB rows (`humor_flavor_step_types`, `llm_input_types`, `llm_output_types`, `llm_models`) so the UI stays in sync with the underlying schema. Drag-and-drop reorder uses `@dnd-kit/sortable`; on drop, every changed step's `order_by` is updated in parallel and the UI rolls back if the server returns an error.

### Duplicate humor flavor

The Duplicate button on each row prompts for a unique slug, copies the flavor's description, and bulk-inserts copies of every step preserving `order_by` and all step fields (prompts, model, types, temperature). On success, redirects to the new flavor's detail page. On slug collision (Postgres `23505`), the error is translated into a friendly message and the prompt re-opens with the entered slug pre-filled.

### Test flavor (almostcrackd REST API)

The test page has two image-source tabs:

- **Pick existing** — paginated grid of rows from the `images` table.
- **Upload new** — file input that runs the 4-step upload pipeline (presigned URL → PUT → register image by URL → generate captions).

Both paths call `POST https://api.almostcrackd.ai/pipeline/generate-captions` with `imageId` and `humorFlavorId`. The user's Supabase access token is fetched from the browser session and sent as a `Bearer` header.

### Captions reader

Reads `captions` filtered by `humor_flavor_id`, joined to `images` for thumbnails. Captions are grouped by image so multiple captions for the same picture appear together. Paginated 25 per page.

## Getting Started

### Requirements

- Node.js + npm
- Supabase project credentials (public anon key + URL)

### Environment variables

Create `.env` with:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```
