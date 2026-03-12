## ClutchCast 🏀

**ClutchCast** is an AI-powered March Madness companion that:

- **Pulls live (or historical) NCAA play‑by‑play data**
- **Detects momentum swings and key moments in a game**
- **Generates multiple styles of AI commentary** (hype caster, analyst, casual fan) via **Ollama**
- **Speaks the commentary aloud** using the browser’s speech synthesis
- **Builds a full narrative recap** of the entire game

Built with **React + TypeScript + Vite** and a lightweight custom momentum engine.

---

### Features

- **Game Loader**
  - Enter an NCAA `gameId` or pick from curated famous games.
  - Fetches play‑by‑play data from the NCAA API (proxied via Vite).

- **Momentum Timeline**
  - Visual timeline of scoring runs and momentum swings.
  - Click any key moment to generate tailored commentary.

- **AI Commentary Personas**
  - `hype`: loud, over‑the‑top broadcaster style.
  - `analyst`: calm, tactical breakdown with basketball terminology.
  - `casual`: group‑chat / Twitter‑style reactions with slang and emojis.

- **Approval Workflow**
  - Generate commentary for a moment, review/edit in an approval modal, then save.
  - All approved lines are displayed in an `ApprovedCommentary` panel.

- **Full Game Story**
  - Generate a multi‑paragraph recap of the whole game from all detected key moments.
  - Optional **bias warnings** if the AI over‑focuses on one team.

- **Text‑to‑Speech**
  - Uses the Web Speech API to read commentary and the full story aloud.
  - Prefers high‑quality local English voices on macOS (e.g. `Samantha`, `Alex`).

---

### Architecture Overview

- **Frontend**: React + TypeScript + Vite
- **Key modules**
  - `src/utils/ncaaApi.ts` – fetches and normalizes NCAA play‑by‑play data (via `/ncaa-api` proxy) and provides mock data for demos.
  - `src/utils/momentumEngine.ts` – processes raw plays into momentum swings and key moments.
  - `src/utils/ollamaService.ts` – builds persona‑specific prompts and calls a proxied Ollama endpoint (`/ollama-api/api/generate`) using the `llama3` model.
  - `src/utils/speechService.ts` – thin wrapper over the browser’s `speechSynthesis` API.
  - `src/components/*` – UI components for the loader, timeline, cards, persona selector, approval modal, full story, etc.
  - `src/types/index.ts` – shared TypeScript types for plays, games, personas, and commentary responses.

There is **no separate backend** in this project; Vite’s dev server proxy is used to reach the NCAA API and local Ollama instance.

---

### Prerequisites

- **Node.js** 18+ (recommended)  
- **npm** (or another Node package manager)
- **Ollama** installed and running locally, with a `llama3` model pulled:

```bash
ollama pull llama3
ollama serve
```

- **NCAA API access / proxy**  
  The frontend expects a proxy at `/ncaa-api` that forwards requests to the real NCAA play‑by‑play API. In development this is typically configured via Vite’s `server.proxy` in `vite.config.ts`.

---

### Getting Started (Development)

1. **Install dependencies**

```bash
npm install
```

2. **Ensure Ollama is running locally**

```bash
ollama serve
```

3. **Configure Vite proxy (if needed)**

Check `vite.config.ts` and adjust the proxy targets for:

- `/ncaa-api` → NCAA play‑by‑play API
- `/ollama-api` → local Ollama HTTP endpoint (e.g. `http://localhost:11434`)

4. **Run the dev server**

```bash
npm run dev
```

Then open the printed local URL in your browser.

---

### Usage

1. **Load a game**
   - Use the game loader to paste an NCAA `gameId`, or pick one of the built‑in famous games from `FAMOUS_GAMES` in `src/utils/ncaaApi.ts`.
2. **Explore momentum**
   - Inspect the momentum timeline and moment cards showing swings and scoring runs.
3. **Generate commentary**
   - Select a **voice persona**, click a key moment on the timeline/cards, and wait for AI commentary from Ollama.
   - Review/edit the text in the approval modal and approve to save.
4. **Tell the full story**
   - Once key moments are available, open **Full Story** and generate a narrated recap for the entire game.
5. **Listen to it**
   - Use the read‑aloud controls on commentary/full‑story to have the browser speak the text.

---

### Scripts

```bash
npm run dev      # start Vite dev server
npm run build    # type‑check and build for production
npm run preview  # preview the production build
npm run lint     # run ESLint
```

---

### Notes & Limitations

- **Local only by default** – This project is wired to a local NCAA proxy and local Ollama instance. To deploy it, you’ll need to replace those with hosted equivalents or server‑side APIs.
- **Browser speech support** – Text‑to‑speech depends on the Web Speech API; some browsers or platforms may have limited voice options.
- **Model behavior** – Commentary quality and style depend heavily on the Ollama model (`llama3`) and prompt design in `src/utils/ollamaService.ts`.

---

### License

This project is licensed under the terms of the LICENSE file included in the repository.
