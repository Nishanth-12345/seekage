# SEEKAGE Web

React + TypeScript web version of the SEEKAGE React Native app (in `../seekage-app`).
Shares the same Node/Express + MySQL backend in `../backend`.

## Setup

```
cd seekage-web
npm install
npm start
```

Runs at http://localhost:3000. API requests are proxied to `http://localhost:5000` (see `proxy` in `package.json`). Override with `REACT_APP_API_URL` in `.env`.

## Backend

The backend expects MySQL. Load `../backend/seekage_schema.sql` in MySQL Workbench, then:

```
cd ../backend
npm install
node server.js
```

## Features ported from React Native

- **Auth**: Login (role selector), Register (seekage / school paths), EN/ML language toggle
- **Seekage**: age-based batch list → content tabs (video/doc/note) → upload, Q&A, chat
- **School**: school groups → subjects → content, upload, Q&A, chat (green theme)
- **Parent hide/unhide** with password modal; **admin** can override
- Mock data is used until the backend routes are wired up (search for `MOCK` in `src/pages/**`)
