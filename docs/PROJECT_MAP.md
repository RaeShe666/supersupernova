# SYL.AILABS Project Map

This repo currently contains two products under the SYL.AILABS platform:

- Brand Kit
- Chirp

Brand Kit also contains one desktop sub-function:

- Demo Studio

Do not add separate product forks by copying whole pages. If a product needs a variant, add configuration inside the existing product module first.

## Product Routes

Public browsing:

- `/` - SYL.AILABS landing page
- `/brandkit` - Brand Kit home
- `/chirp` - Chirp home

Authenticated product use:

- `/brandkit/editor/:id` - Brand Kit editor
- `/chirp/planet/:id` - Chirp planet chat
- `/chirp/persona` - Chirp personas
- `/chirp/moments` - Chirp moments
- `/chirp/about-me` - Chirp profile

Retired routes:

- `chirp.love`
- `chirp-lova`
- `lova`

## Product Boundaries

Brand Kit owns:

- brand extraction
- project list and editor
- desktop demo recording and editing through `desktop/demo-studio`
- `projects` records in Supabase
- backend extraction and screenshot routes

Chirp owns:

- planets
- personas
- moments
- profile/onboarding
- AI persona replies

Shared platform owns:

- auth
- global navigation
- Supabase client setup
- invite/access gating
- API URL configuration

## Access Model

All users may browse public product pages. Product usage should go through:

1. Auth gate
2. Product access gate
3. Invite gate while the product is in beta

When a product becomes public, turn off invite requirements in data/config instead of deleting the invite flow.

Recommended tables:

- `profiles`
- `products`
- `product_access`
- `invite_codes`
- `projects`
- Chirp-specific tables for planets, messages, personas, profile, and moments

## Deployment

Frontend:

- Vercel
- Recommended project name: `sylailabs-web`
- Domains: `sylailabs.com`, `www.sylailabs.com`

Backend:

- Render
- Recommended service name: `sylailabs-api`
- Domain: `api.sylailabs.com`

Database/auth:

- Supabase
- Keep schema changes in `supabase/migrations` when migrations are introduced.

## Coding Rules

- Keep product code grouped by product.
- Keep shared UI/auth/API helpers outside product folders.
- Do not duplicate a product into a second product folder for small experiments.
- Add route/product metadata in one config file before wiring new navigation.
- Prefer one backend API with product-specific routers over separate small services during early stage.
