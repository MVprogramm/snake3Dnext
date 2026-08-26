# Snake 3D

3D browser version of the classic Snake game. The player controls a snake, collects food, earns score, avoids collisions, and progresses through configured levels.

## Stack

- TypeScript
- React
- Next.js 14 (App Router)
- Three.js
- React Three Fiber
- Drei
- Zustand

## Project Structure

- `app/` - Next.js layout and page entry point.
- `src/components/SnakeGame.tsx` - client-only game initialization and startup.
- `src/components/` - React and React Three Fiber rendering components.
- `src/assets/` - 3D model components, geometry, textures, and visual assets.
- `src/engine/` - gameplay rules, level loading, movement, collisions, scores, lives, bonuses, obstacles, and timers.
- `src/config/` - camera, field, light, apple, and snake configuration.
- `src/types/` - shared TypeScript types.
- `src/styles/` - CSS for app shell, menu, spinner, wrapper, and game info.
- `docs/architecture-map.md` - current architecture map.
- `docs/tasks/` - task or PRD files for planned project changes.
- `AGENTS.md` - working rules for coding agents.

## Commands

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Start the production build:

```bash
npm run start
```

## Environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Validation

The project currently has no automated test suite. For now, use:

```bash
npm run build
```

For gameplay changes, also run the manual checklist:

- English: `docs/manual-test-checklist.md`
- Russian: `docs/manual-test-checklist.ru.md`

The latest recorded build status is in `docs/build-baseline.md`.
The latest runtime smoke status is in `docs/runtime-smoke-report.md`.

## Documentation

Before changing code, read:

1. `AGENTS.md`
2. `docs/architecture-map.md`
3. The relevant task file in `docs/tasks/`, if one exists

Keep documentation updated when project structure, commands, validation rules, or gameplay behavior change.
