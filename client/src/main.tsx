import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force light mode on startup
localStorage.removeItem('theme');
localStorage.setItem('theme', 'light');
document.documentElement.classList.remove('dark');

createRoot(document.getElementById("root")!).render(<App />);
