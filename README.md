# Kawika

> A progressive, gamified web platform empowering every Filipino to learn **Filipino Sign Language (FSL)** through micro quests and culturally grounded interactive challenges.

Kawika turns learning FSL into short, rewarding daily sessions. Instead of long lectures, learners complete bite-sized **micro quests** — a handful of signs, a quick recognition drill, a scenario set in a familiar Filipino setting — and build streaks, earn XP, and unlock new regions of the journey as they progress.

> **Status:** Early development. The project is scaffolded; most features below are planned. See [ABOUT.md](ABOUT.md) for the vision and roadmap.

---

## Why Kawika?

Filipino Sign Language is the national sign language of the Filipino Deaf community (Republic Act No. 11106, *The Filipino Sign Language Act*). Yet most hearing Filipinos have never had an accessible way to learn it. Kawika aims to close that gap — making FSL approachable, habit-forming, and rooted in everyday Filipino life.

## Planned Features

- **Micro quests** — 3–5 minute lessons focused on a single theme (greetings, family, numbers, food, etc.)
- **Culturally grounded challenges** — scenarios like ordering at a *sari-sari* store, riding a jeepney, or greeting *Lola* at a family gathering
- **Progression system** — XP, levels, streaks, and badges to keep learners coming back
- **Sign library** — searchable video/animation reference for every sign learned
- **Practice modes** — recognition (watch → choose), recall (prompt → sign), and review of weak signs
- **Progressive Web App** — installable and usable on low-end phones and slow connections

## Tech Stack

| Layer    | Technology                                   |
| -------- | -------------------------------------------- |
| Frontend | React 19, TypeScript, Vite                   |
| Backend  | Python 3.12, FastAPI, Uvicorn                |
| Tooling  | ESLint, typescript-eslint                    |

## Project Structure

```
kawika/
├── client/          # React + TypeScript frontend (Vite)
│   ├── public/
│   └── src/
├── server/          # FastAPI backend
│   └── requirements.txt
├── ABOUT.md         # Vision, mission, and roadmap
├── SETUP.md         # Detailed local setup guide
└── README.md
```

## Quick Start

**Prerequisites:** Node.js 20+ and npm, Python 3.12+, Git.

```bash
git clone <repo-url> kawika
cd kawika

# Frontend
cd client
npm install
npm run dev          # http://localhost:5173

# Backend (in a second terminal)
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

For full instructions — including Windows commands, running the API, and troubleshooting — see **[SETUP.md](SETUP.md)**.

## Available Scripts (client)

| Command           | Description                            |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR     |
| `npm run build`   | Type-check and build for production    |
| `npm run preview` | Preview the production build locally   |
| `npm run lint`    | Run ESLint                             |

## Contributing

Contributions are welcome — especially from members of the Deaf community, FSL interpreters, and educators. Please open an issue to discuss a change before submitting a pull request.

## Acknowledgments

Kawika is built in recognition of the Filipino Deaf community, whose language, culture, and advocacy make this work possible.
