import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("%c LEADS COMPASS - POCKETBASE VERSION ", "background: #222; color: #bada55; font-size: 20px");
console.log("Environment:", (window as any)._env_ || import.meta.env);

createRoot(document.getElementById("root")!).render(<App />);
