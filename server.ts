import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy endpoint to handle CORS for ngrok
  app.post("/api/chat", async (req, res) => {
    // Standard backend path
    let rawUrl = process.env.MISTRAL_BACKEND_URL;
    
    // If MISTRAL_BACKEND_URL is set to the generic AI API root, it's likely a misconfiguration
    // especially if we are getting backend-style 404s.
    if (!rawUrl || rawUrl === "https://api.mistral.ai/v1") {
      rawUrl = "https://either-abdominal-subtotal.ngrok-free.dev/aistudio";
    }
    
    // Ensure protocol is present
    if (rawUrl && !rawUrl.startsWith('http')) {
      rawUrl = `https://${rawUrl}`;
    }
    const BACKEND_URL = rawUrl;
    
    // Prepare payload according to AI Studio function spec
    const session_id = req.body.session_id || "session_" + Date.now();
    
    const payload = {
      customer_message: req.body.message,
      session_id: session_id
    };

    try {
      console.log(`[Proxy] Forwarding to: ${BACKEND_URL}`);
      console.log(`[Proxy] Session ID: ${session_id}`);
      
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true' 
        },
        body: JSON.stringify(payload),
      });

      console.log(`[Proxy] Upstream Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
      
      const errorText = await response.text();
      console.warn(`[Proxy] Upstream Error (${response.status}): ${errorText.slice(0, 200)}`);
      res.status(response.status).json({ 
        error: `Backend error (${response.status})`,
        details: errorText.slice(0, 500),
        target: BACKEND_URL,
        message: "The backend returned an error. Please verify your FastAPI route/AI Agent configuration."
      });
    } catch (error: any) {
      console.error("[Proxy] Critical Failure:", error.message);
      res.status(503).json({ 
        error: "Connection failure to AI backend",
        debug: error.message,
        target: BACKEND_URL,
        suggestion: "Verify ngrok is running and the URL is reachable from the internet."
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
