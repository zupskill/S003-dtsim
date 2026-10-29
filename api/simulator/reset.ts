import app from "../../server";

export default async function handler(req: any, res: any) {
  try {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    // Ensure Express router matches the route regardless of how Vercel rewrote/passed the URL
    req.url = "/api/simulator/reset";

    return app(req, res);
  } catch (err: any) {
    console.error("[VERCEL HANDLER ERROR /api/simulator/reset]:", err?.message || err);
    return res.status(500).json({
      error: err?.message || "Internal Serverless Function Error",
      success: false
    });
  }
}
