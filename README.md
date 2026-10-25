# CodeAtlas

CodeAtlas is a project learning workspace with a read-only Project Tutor agent, ZIP import, source editor, code search, and a static import map.

## Local Ollama tutor

Start with [START-HERE.md](START-HERE.md). Install Ollama, download `qwen3:4b`, then run `npm install` and `npm run local`. Open http://127.0.0.1:5173. No API credentials are required.

The local Node server binds to loopback, validates Host and Origin, limits request bodies and accepts one investigation at a time. The model uses a bounded native Ollama tool loop (five investigation rounds, eight tool calls, five-minute timeout). It can list/search/read selected files and follow static imports. A separate structured response explains what/how/why, uncertainty and a next exercise, with validated source evidence IDs. Evidence IDs verify source locations, not explanation correctness. No shell or code execution tools are exposed.

Selected scope is at most 200 files / 1 MB, separate from ZIP upload. Large tool outputs stop with a request to narrow scope. Follow-up history is bounded. Changes to scope or saved code reset chat. Tests use a mocked Ollama transport; real model quality and speed must be evaluated on your laptop.

The hosted Site retains browsing, search, maps and editing. Its tutor shows local setup instructions because a cloud server cannot reach your laptop's localhost. There is no OpenAI or Gemini provider fallback.

## Build

    npm run build

Source is in `src/main.jsx` and `src/style.css`. The built site is in `dist/`.

ZIPs are processed entirely in browser memory and disappear on refresh. Browsing remains local; the optional tutor uses the local server and Ollama after consent. There are no application-imposed limits on ZIP size, extracted source size, file count, or individual file size. Actual capacity depends on available browser memory and ZIP format support. Binaries, environment files, dependencies, and build directories are omitted. The sample project is explicitly labeled and available without uploading.

## Import map

The TypeScript parser runs in a browser Web Worker. React Flow shows local file connections, pan/zoom controls, a minimap, file filtering, and a selected-file neighborhood view. Selecting a node highlights its direct neighbors and selects its source in the viewer. Selecting a connection or evidence entry opens and highlights the supporting line.

Supports literal imports, re-exports, dynamic imports with literal paths, and CommonJS require syntax in JS/JSX/TS/TSX/MJS/CJS/MTS/CTS files. Resolves relative paths, extensionless files, index files, and JS-to-TS source extension fallback. CSS and other imported files are nodes but their internal dependencies are not parsed. Package imports, custom aliases, computed paths, and missing files remain unresolved with an explanation. CommonJS is syntax-based and can include shadowed require calls. The map does not prove runtime execution or change impact. Parser diagnostics identify potentially incomplete files.

Run analyzer checks with `node --test tests/analyze.test.js`.

Semantic code search is available in Find code.


## ML search (milestone 3)

Find code uses local MiniLM embeddings through Transformers.js in a Web Worker. Code is divided at top-level JS/TS statement boundaries and into short sections with exact source line ranges. Other supported source languages use short text sections. Normalized embeddings are ranked by cosine similarity, with overlapping locations deduplicated. This general-purpose language model is not trained specifically for code; rankings are suggestions, not verified explanations or confidence scores. Keyword mode is separate and explicitly labeled.

The model and WASM runtime are served as static assets by this Site. Source code and queries stay in browser memory; embeddings are reused until the project changes or the page reloads. First ML search loads model/runtime assets, then indexes the project with progress and cancellation. No fixed ZIP limits apply, but browser memory and inference time limit practical scale. Models are licensed in public/models/Xenova/all-MiniLM-L6-v2 and public/onnx.

This milestone uses browser inference, not a FastAPI service or pgvector database. Those remain a future migration for persistence and team-scale indexing.

## Student walkthrough update

Search results now include deterministic, syntax-based walkthroughs with line references for supported JS/TS functions, conditionals, returns, calls, React state, and event bindings. These are explicitly not LLM answers and do not infer author intent. Unsupported snippets show a limitation. The separate Project Tutor implements conversational investigation and requires its server model connection to be configured.

The ML runtime uses the bundled JavaScript loader with an absolute same-origin WASM URL, avoiding separate runtime-module imports. If ML initialization or inference fails, search automatically returns explicitly labeled keyword results, preserves the project, and displays expandable diagnostic information. Browser verification of the user's specific failure is still required.

## Code Editor

The separate Code Editor tab uses a bundled Monaco editor and worker. Browse files,
open tabs, edit with syntax highlighting, find/replace, reset unsaved edits, or
save all edits into the current browser session. Search and the import map use
saved edits. Download source ZIP includes unsaved drafts too. The ZIP contains
only the supported text files imported into CodeAtlas, not the original archive's
binaries, environment files, dependencies, or build output. Download before leaving:
there is no persistent project storage or code execution terminal in this version.
