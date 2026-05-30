# Side Project Workspaces

Updated: 2026-05-30

This `side project` folder holds two **independent** projects (each its own
git repo). Vercel / Render / Supabase production setup is unchanged.

- **`chirp/`** — a standalone clone of `RaeShe666/sylailabs` (branch `master`,
  the production / default branch). This is the **production app**: the Chirp
  product **plus** the SYL.AILABS website (landing page + the Brand Studio
  download page). Vercel deploys its frontend, Render deploys its backend, both
  from `master`.
- **`brand-studio/`** — a separate repo (`RaeShe666/brand-studio`): the
  standalone **Brand Studio desktop app** (Electron screen recorder / video
  editor, its own releases). Not part of sylailabs.

Supabase is shared across products with separate tables; Chirp uses the
`chirp_*` tables.

## History / what changed

- The **web Brand Kit** (previously the `brand/` worktree on the `sylailabs`
  `brand-work` branch, plus the embedded `desktop/demo-studio` source) is
  **deprecated** — its functionality moved into the standalone `brand-studio`
  desktop app. The old `brand/` worktree has been removed locally; the
  `brand-work` branch is preserved on GitHub (`origin/brand-work`) as a backup.
- `chirp/` used to be a linked git **worktree** of `brand/`. It is now a clean
  **standalone clone**, so the two no longer share a `.git`.
- The stale `main` branch on GitHub was deleted; `master` is the default branch.
- Brand-only leftovers (demo-studio source, brand-kit backend routes
  `extract` / `screenshot`, the `sharp` image dep, unused brand textures) were
  removed from `master`. The website keeps only the Brand Studio **download
  page** (`/brandkit`).

## Local Development

Run the Chirp / main-site frontend and backend:

```powershell
cd "C:\Users\lenovo\Desktop\side project\chirp"
npm run dev          # frontend (Vite) -> http://localhost:5173

cd "C:\Users\lenovo\Desktop\side project\chirp\backend"
npm run dev          # backend -> http://localhost:8080
```

For the Brand Studio desktop app, work in `brand-studio/` (see its own README).
