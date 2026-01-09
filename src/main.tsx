import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("%c LEADS COMPASS - POCKETBASE VERSION ", "background: #222; color: #bada55; font-size: 20px");
console.log("Build:", "2026-01-09T07:36Z");
const runtimeEnv = (window as unknown as { _env_?: unknown })._env_;
console.log("Environment:", runtimeEnv || import.meta.env);

createRoot(document.getElementById("root")!).render(<App />);
