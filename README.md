[![CI](https://github.com/clip-fish/web/actions/workflows/publish.yml/badge.svg)](https://github.com/clip-fish/web/actions)
[![Version](https://img.shields.io/badge/v1.0.0-blue.svg)](...)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Table of Contents

1. [What Is Clip Fish?](#what-is-clip-fish)
2. [Features](#features)
3. [FAQ](#faq)
4. [Self-Hosting](#selfhosting)
5. [Local Development](#local-development)
6. [Docker](#docker)
7. [Runtime Configuration](#runtime-configuration)
8. [Scripts](#scripts)
9. [License](#license)

# Clip Fish
### Stop emailing and texting yourself – share anything between your devices in seconds

## What Is Clip Fish?
Clip Fish is a web‑based app for quickly sharing links, text snippets, and files. 
Open the site on one device, scan the QR code with another, 
and you instantly get a private, end‑to‑end‑encrypted WebRTC tunnel 
with no installs, no sign‑ups, and no middleman servers ferrying your data.

Go to <https://clip.fish> to try it out.

## Features
- **Fast & Secure Transfers:** Direct peer‑to‑peer via WebRTC.
- **End‑to‑End Encryption:** Messages encrypted on your device.
- **No Installs or Signups:** Just open the page and scan.
- **User‑Controlled Sessions:** Sessions stay active until you clear them.
- **Pluggable Back‑ends:** Defaults to Express+WebSocket; also supports Firestore.
- **MIT‑licensed:** Free to fork, remix, and use commercially.

---

## FAQ

**Q. Is Clip Fish free to use?**  
**A.** Yes. Use it for free at <https://clip.fish> and the code is MIT‑licensed.

**Q. Where is my data stored?**  
**A.** Message content stays in your browser’s storage (IndexedDB); only minimal session metadata is sent to the server.

**Q. What if a device loses connection?**  
**A.** Re‑open the same session URL or rescan the QR code to reconnect instantly.

**Q. How long does a session stay active?**  
**A.** Indefinitely, until you click **Clear Session** or open a new session URL.

---

## Self‑Hosting

Clip Fish is designed to be self‑hosted. You can run the entire stack on your own server, or just the front‑end.

**Front‑end**
- Built with Vite + React
- Static files served by Nginx

**Signaling** (choose one)  
- **WebSocket**: Lightweight Node.js server (broadcasts offers/answers)  
- **Firestore**: Firebase Firestore (stores signals in a collection)  

**Session Storage** (choose one)  
- **Express**: Node.js API with MongoDB persistence  
- **Firestore**: Firebase Firestore (persistent, multi‑region storage)  

**Runtime Config**  
- Mounted via `config.json` (no rebuild needed)  
- Keys: `signaling`, `sessionStore`, `wsUrl`, `apiUrl`, `firebase.*`, etc.  
- See [Runtime Configuration](#runtime-configuration) for full details  

**Docker**  
- All three services come as Docker images (`web`, `ws`, `api`)  
- Single `docker-compose.yml` wires them together on a custom network  
- Volume‑mount your `config.json` for on‑the‑fly configuration  

**Security**  
- WebRTC streams are E2E‑encrypted by design  
- Only minimal metadata (session IDs, device lists) passes through your signaling/session servers  


---

## Local Development

```bash
git clone https://github.com/clip-fish/web.git
cd web
npm install
npm run dev     # Vite + Express+WS back‑end
```
1. Open http://localhost:5173 in a browser.
2. Scan the QR code with another device.
3. Start sharing!

---

## Docker

You can run the entire Clip Fish stack with one command using Docker Compose:

```bash
docker compose up
```
This will start four services on your local machine:
- `web` – the Vite/React front‑end served by Nginx
- `ws` – the WebSocket signalling server
- `api` – the Express + MongoDB session‑storage API
- `mongo` – the MongoDB server (persisting session metadata)

By default the front‑end will mount your local `config.json` (created from `config.template.json`) at runtime.

To rebuild the front‑end in development (with hot‑reload), use an override:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

---

## Runtime Configuration

All runtime settings live in **`config.json`** (no rebuild needed).  
Use the following command to copy [config.template.json](config.template.json) into the same directory as `docker-compose.yml`:

```bash
cp config.template.json config.json
```

You can then edit it as needed, and mount it.

### Configuration Values
| Setting                   | Type                         | Description                                                            | Default                 |
|---------------------------|------------------------------|------------------------------------------------------------------------|-------------------------|
| `signaling`               | `"WebSocket" \| "Firestore"` | Which transport to use for WebRTC signaling                            | `"WebSocket"`           |
| `sessionStore`            | `"Express" \| "Firestore"`   | Where to store session metadata (devices & messages)                   | `"Express"`             |
| `peerImpl`                | `"SimplePeer" \| "Raw"`      | Which WebRTC implementation to use for data‑channels                   | `"SimplePeer"`          |
| `wsUrl`                   | `string`                     | URL of the WebSocket signaling server (when `signaling = "WebSocket"`) | `ws://localhost:3000`   |
| `apiUrl`                  | `string`                     | Base HTTP URL for the session API (when `sessionStore = "Express"`)    | `http://localhost:2000` |
| `firebase.*`              | `string`                     | Firebase configurations                                                | `""`                    |
| `storeTextMessageContent` | `boolean`                    | Whether to persist text messages in storage                            | `false`                 |
| `defaultMaxTransferSize`  | `number`                     | Max bytes per WebRTC message                                           | `262144` (256 KB)       |
| `maxMessageChunkSize`     | `number`                     | Max bytes per chunk when splitting large payloads                      | `2097152` (2 MB)        |
| `messageLoadTimeout`      | `number`                     | Timeout (ms) for loading messages from peers                           | `10000`                 |
| `enableAnalytics`         | `boolean`                    | Whether to initialize Google Analytics                                 | `false`                 |

---

## Scripts

| Command           | Description                           |
|-------------------|---------------------------------------|
| `npm run dev`     | Vite dev server + local WS & API      |
| `npm run build`   | Type‑check & production build         |
| `npm run preview` | Preview the production build (`dist`) |
| `npm run lint`    | Run ESLint on `src/`                  |

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.