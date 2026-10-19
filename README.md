# Support Ticket Similarity Assistant

A small full-stack support-ticket application. Support staff can browse open and resolved tickets, create new tickets, find semantically similar historical tickets, and resolve an open ticket using a past resolution or notes entered manually.

The active implementation is a React/Vite frontend backed by an Express API. The API generates text embeddings with Hugging Face Transformers.js and persists tickets and embeddings in SQLite.

## Contents

- [How it works](#how-it-works)
- [Technology](#technology)
- [Repository layout](#repository-layout)
- [Requirements](#requirements)
- [Run the application](#run-the-application)
- [Run with Docker](#run-with-docker)
- [Ticket lifecycle](#ticket-lifecycle)
- [HTTP API](#http-api)
- [Data and persistence](#data-and-persistence)
- [Validation](#validation)
- [Known limitations](#known-limitations)
- [Starter kit](#starter-kit)

## How it works

1. On API startup, the service opens the SQLite database and creates the `tickets` table if needed.
2. If the database has no tickets, the API seeds it from `semantic-search-api/src/data/tickets.json` and creates an embedding for each ticket.
3. The frontend calls the API to create and retrieve tickets.
4. When a user asks for similar tickets, the API embeds the current ticket's subject and description, compares that vector with the stored ticket vectors using cosine similarity, and returns the best matches.
5. The ticket detail page shows resolved matches. A strong resolved match can supply its resolution notes to resolve the current ticket; if no resolved match scores at least `0.75`, the user can enter a resolution manually.

Ticket text is represented consistently for both indexing and search as the subject plus description. The API uses the `Xenova/all-MiniLM-L6-v2` feature-extraction model with mean pooling, normalized vectors, and quantized (`q8`) inference.

## Technology

- **Frontend:** React 19, React Router, Vite 8, Material UI (MUI) and Emotion
- **API:** Node.js, Express 5
- **Similarity:** `@huggingface/transformers` with `Xenova/all-MiniLM-L6-v2`
- **Persistence:** SQLite through `better-sqlite3`
- **Optional starter:** Python example utilities under `starter_kit/`; these are not used by the running app

## Repository layout

```text
.
├── README.md
├── case-study-brief.md
├── semantic-search-api/
│   ├── package.json
│   └── src/
│       ├── Server.js                 # Express routes and in-memory search index
│       ├── Utils.js                  # Seeding, cosine similarity, score labels, IDs
│       ├── db.js                     # SQLite schema and persistence helpers
│       ├── embedder.js               # Transformers.js embedding model
│       └── data/tickets.json         # 40 synthetic seed tickets
├── starter_kit/                      # Optional Python starter/prototype files
└── ticket-dashboard-app/
    ├── package.json
    ├── index.html
    ├── public/
    └── src/
        ├── App.jsx                   # Frontend routes
        ├── components/
        │   ├── main/                 # Landing content, ticket form and card
        │   ├── pages/                # Home, ticket list and ticket detail pages
        │   ├── header/
        │   └── footer/
        ├── model/Ticket.js           # Ticket data shape
        └── service/
            └── SemanticSearchService.jsx # Frontend API calls
```

## Requirements

- Node.js **20.19+** or **22.12+**
- npm (included with Node.js)
- Internet access for the first API startup so Transformers.js can download the embedding model

The API uses a native SQLite dependency (`better-sqlite3`). If npm cannot find a prebuilt binary for your Node.js/platform combination, a working native build toolchain may be needed.

## Run the application

Install dependencies and start the API and frontend in separate terminals. Run the API command from its own folder: the SQLite filename is relative to the process working directory.

### 1. Start the API

```powershell
cd semantic-search-api
npm install
npm start
```

The API listens at `http://localhost:8081`. On the first run, it downloads/initializes the embedding model and seeds the local database if that database is empty. Allow some time for model download and initial embedding generation.

To start without file watching, use `npm start` instead of `npm run dev`.

### 2. Start the frontend

In a second terminal, from the repository root:

```powershell
cd ticket-dashboard-app
npm install
npm run dev
```

Vite prints the local development URL; by default it is `http://localhost:5173`. Open that URL in a browser.

## Run with Docker

Install Docker Desktop (or another Docker Compose-compatible runtime), then run these commands from the repository root:

```powershell
docker compose up --build -d
```

Open `http://localhost:8080`. The first startup may take several minutes while the API downloads the embedding model and seeds the database. Check startup progress with:

```powershell
docker compose logs -f api
```

Docker Compose stores the SQLite database and downloaded model cache in the `ticket-data` volume so they are retained across container restarts. To stop the app without removing data, run `docker compose down`. To also permanently remove the stored database and model cache, run `docker compose down --volumes`.

To use a different host port, set `PORT` before starting Compose, for example:

```powershell
$env:PORT = "9000"
docker compose up --build -d
```

Then open `http://localhost:9000`.

### App pages

| URL | Page |
| --- | --- |
| `/` | Home and introduction to semantic ticket similarity |
| `/view-all-tickets` | Tickets split into Open and Resolved sections |
| `/new-ticket` | Form to create a ticket |
| `/view/tickets/:ticketId` | Ticket details, historical similarity search, and resolution actions |

## Ticket lifecycle

- A new ticket requires a subject and description. Category and comma-separated tags are optional.
- The API assigns a ticket ID, sets the creation date, and defaults its status to `open`.
- The all-tickets page displays open tickets as compact cards and resolved tickets in expandable rows.
- On an open ticket's detail page, **Find similar tickets** searches ticket history. The frontend only displays resolved matches and excludes the current ticket.
- **Use resolution & resolve** is offered for a resolved historical match only when its score is greater than `0.75` and it contains resolution notes. Applying it copies those notes to the open ticket and marks it resolved.
- If the resolved matches all score below `0.75`, or there are no resolved matches, the page offers a manual resolution form. Saving notes marks the ticket resolved.

The `0.75` score is a product threshold for enabling a resolution action, not a guarantee that two tickets are equivalent. Agents should review a historical resolution before applying it.

## HTTP API

Base URL: `http://localhost:8081/api`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | API health and indexed ticket count |
| `GET` | `/tickets` | List tickets; returns `{ "count": number, "tickets": [...] }`. Optional `?category=...` filter |
| `GET` | `/tickets/:id` | Retrieve one ticket by ID |
| `POST` | `/tickets/similar` | Semantic search; JSON body includes `subject`, optional `description`, `topK` (default 5), and `minScore` (default 0) |
| `POST` | `/add/ticket` | Create a ticket; `subject` is required, other ticket fields are optional |
| `POST` | `/update/ticket/:id` | Update a ticket's category, resolution notes, tags, or status |

Similarity search returns a `results` array. Each match contains ticket fields plus a numeric `score` and a `match` label (`strong`, `related`, or `weak`). Scores are cosine similarities for the normalized embeddings. The current score labels are:

- `strong`: score >= `0.75`
- `related`: score >= `0.5` and < `0.75`
- `weak`: score < `0.5`

Example similarity-search request:

```json
{
  "subject": "Recent sales are missing from the export",
  "description": "The latest four days of records do not appear in the downloaded CSV.",
  "topK": 5,
  "minScore": 0
}
```

## Data and persistence

- The seed file contains 40 synthetic historical tickets.
- The API database is `semantic-search-api/ticket-knowledgebase.db` when started from `semantic-search-api/`. The root `.gitignore` excludes the database and SQLite WAL/SHM sidecar files.
- The API seeds only when the database contains zero tickets. A non-empty database is retained between restarts and is not automatically refreshed from the JSON seed.
- To reload a fresh seed dataset, stop the API, back up any data you need, remove `ticket-knowledgebase.db` from `semantic-search-api/`, then restart the API. Seeding runs again when the new database is empty.
- Ticket vectors are stored as `Float32` blobs in SQLite and loaded into an in-memory index on API startup. Ticket metadata is returned by API routes without its vector.

## Validation

The frontend's available checks:

```powershell
cd ticket-dashboard-app
npm run build
npm run lint
```

There is currently no automated test suite configured for either the frontend or API.

## Known limitations

- The frontend API URL can be set with the `VITE_API_URL` build variable. Docker Compose serves the frontend and API on the same origin through an Nginx proxy; Vite proxies `/api` to the local API during development.
- There is no authentication, authorization, role management, pagination, or production-grade operational monitoring.
- Semantic search evaluates the in-memory ticket index. The API selects the top `topK` matches before the frontend filters them to resolved tickets, so fewer than five resolved results can be displayed even when more resolved matches exist at lower ranks.
- Search is performed against historical ticket text and reports similarity; it does not establish that the old fix is appropriate for the new case.
- The SQLite file is local to the API process and is not designed for multi-instance deployment or concurrent distributed search.
- Model initialization and embedding generation add startup and request latency, especially during the first model download.
- The frontend's landing page contains explanatory sample copy; its illustrative example is not a live similarity result.

## Starter kit

`starter_kit/` contains the original optional Python helpers, a basic keyword-overlap approach, an example Transformers/Sentence-Transformers semantic search, and input examples. The active application is implemented in JavaScript under `semantic-search-api/` and `ticket-dashboard-app/`; no Python environment setup is required to run it.