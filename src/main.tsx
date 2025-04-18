import { createRoot } from 'react-dom/client'
import {BrowserRouter} from "react-router-dom";

async function main() {
    const res = await fetch("/config.json");
    if (!res.ok) {
        document.body.innerHTML = `<pre style="color:red">
      Failed to load config.json: ${res.status} ${res.statusText}
    </pre>`;
        return;
    }
    (window as any).APP_CONFIG = await res.json();

    const { default: App } = await import("./App");

    createRoot(document.getElementById("root")!).render(
        <BrowserRouter>
            <App />
        </BrowserRouter>
    );
}

main().catch(err => {
    console.error(err);
    document.body.innerHTML = `<pre style="color:red">${err}</pre>`;
});