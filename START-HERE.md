# CodeAtlas with local Ollama

Ollama is the program that runs an AI model. Qwen3 is the model that generates answers. CodeAtlas gives it tools to inspect your selected source files and explain what, how and why with clickable source references.

## Windows setup

1. Install Node.js 22.13 or newer from https://nodejs.org and Ollama from https://ollama.com/download. Reopen PowerShell after installing.
2. Open Ollama. In PowerShell run `ollama pull qwen3:4b`. This downloads about 2.5 GB once. The model is not included in this ZIP. This small model is a starting point for a 16 GB computer; speed depends on CPU/GPU and available memory.
3. Extract this project ZIP. Open a terminal in the folder containing package.json.
4. Run `npm install` once, then `npm run local`.
5. Open http://127.0.0.1:5173 and load the sample or upload your project. In Project Tutor refresh the connection, select source files, check the local processing box and ask “How does the cart work?”

Keep Ollama and the CodeAtlas terminal running. Stop CodeAtlas with Ctrl+C. Next time, open Ollama and run `npm run local` again. No API key or paid model account is needed.

## What stays local

The tutor sends selected code to your local CodeAtlas server, then relevant excerpts to Ollama at 127.0.0.1:11434. The app uses only the local qwen3:4b model, and rejects cloud model metadata. It does not send tutor questions to OpenAI or Gemini. Initial software/model downloads require internet. Browser ML search is a separate feature and may download its embedding model; use Keyword search if offline.

The hosted CodeAtlas website cannot call Ollama on your laptop. Use the local URL for AI answers. Files and chat are session-only and do not transfer from the hosted window; upload again locally. Save/download edited files before closing or reloading.

## Troubleshooting

- “Open Ollama”: launch the Ollama desktop app. If it is not running as an app, `ollama serve` starts it. An address-in-use error means it is already running.
- “Model missing”: run `ollama pull qwen3:4b`, then refresh the tutor connection.
- Slow answer: first model loading can take time. Close memory-heavy apps and ask about one feature with a smaller source selection. Each investigation has a five-minute timeout and bounded tool calls.
- Port 5173 busy: stop the previous CodeAtlas terminal with Ctrl+C.
- No evidence or invalid answer: small models can make mistakes. Narrow the question and check the cited code yourself.

Do not change Ollama's host to a public address or enable wildcard origins. This app binds only to your computer. It reads source; it cannot execute uploaded code, install project packages, or edit files through the tutor.

## Development

`npm test` runs deterministic tests, including mocked Ollama tool calling and failure cases. `npm run local` serves the local app. `npm run build` builds the separate hosted Site; that hosted tutor deliberately shows local setup instructions.

## When cloning from GitHub

After `npm install`, optionally run `npm run setup:search` once for ML search. It downloads and verifies the small embedding model. You can start `npm run local` and use Keyword search and Ollama without that download.
