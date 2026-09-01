# TennisComp

Minimal Vite + React frontend and NestJS backend.

```bash
npm install
npm run dev:backend   # http://localhost:3000
npm run dev:frontend  # http://localhost:5173
```

## Project structure

```text
TennisComp/
├── frontend/             # Vite + React website
│   ├── pages/            # Website pages, such as Home and About
│   ├── src.tsx           # React routes and navigation
│   ├── style.css         # Tailwind import and global styles
│   └── .env.example      # Example frontend API address
├── backend/              # NestJS API
│   └── src/
│       ├── main.ts       # Starts the API server
│       └── app.controller.ts # API routes
├── package.json          # Commands for both applications
└── README.md
```
