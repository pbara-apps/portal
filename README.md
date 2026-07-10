# RAPBA Portal

React + Vite application for the **admin CMS** and future **member portal** features. Lives alongside the public Next.js marketing site (`front/`) inside `pbara-web`.

## Stack

- **Vite** + **React 18** + **TypeScript**
- **React Router** — client-side routing
- **Tailwind CSS v4** — styling
- **shadcn/ui** (Radix primitives) — UI components
- **TanStack Query** — server state / API hooks
- **Zustand** — auth session + drawer state
- **Axios** — HTTP client to the shared Express API (`back/`)

## Routes

| Path                                         | Purpose                                             |
| -------------------------------------------- | --------------------------------------------------- |
| `/login`                                     | Admin authentication                                |
| `/admin`                                     | Dashboard                                           |
| `/admin/executive`, `/office`, `/chapter`, … | CMS modules                                         |
| `/member`                                    | Member portal placeholder (future product features) |

## Development

```bash
cd portal
npm install
cp .env.example .env   # set VITE_API_URL
npm run dev            # http://localhost:5173
```

Ensure the API is running (`back/` on port 3004 by default).

## Environment

| Variable       | Description                                             |
| -------------- | ------------------------------------------------------- |
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:3004/api`) |

## Folder structure

```
portal/
├── src/
│   ├── app/              # Providers (Query, Toaster)
│   ├── components/ui/    # shadcn/ui primitives
│   ├── config/           # env helpers
│   ├── features/
│   │   ├── admin/        # Admin CMS components
│   │   ├── auth/         # Login branding
│   │   └── member/       # Member portal (extensible)
│   ├── hooks/            # Auth session
│   ├── lib/api/          # Axios + React Query hooks
│   ├── lib/mappers/      # API → domain mappers
│   ├── routes/           # Route pages + router config
│   ├── store/            # Zustand (drawer)
│   └── types/            # Shared TypeScript types
└── public/
```

## Deployment

- `www.pbara.org.ng` → Next.js marketing site
- `portal.pbara.org.ng` → this portal app
