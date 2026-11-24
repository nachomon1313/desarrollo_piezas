// Función de Vercel: lee las cotas de un croquis con Claude (API de Anthropic).
// Es OPCIONAL: sin la variable ANTHROPIC_API_KEY la app funciona igual y el alumnado escribe las cotas a mano.
//
// Variables de entorno (Vercel → Project → Settings → Environment Variables):
//   ANTHROPIC_API_KEY   clave de la API de Anthropic (obligatoria para activar la lectura)
//   ANTHROPIC_MODEL     modelo (opcional; por defecto claude-sonnet-5-5)
//   MAX_POR_HORA        lecturas por hora y por dirección IP (opcional; por defecto 100)

const LIMITE = Number(process.env.MAX_POR_HORA || 100);
const usos = new Map(); // límite aproximado por IP (se reinicia cuando Vercel recicla la función)

export default async function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (req.method === "GET") return res.status(200).json({ ok: !!key });
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  if (!key) return res.status(503).json({ code: "not_granted", error: "Lectura con Claude no configurada" });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  const ahora = Date.now(), lista = (usos.get(ip) || []).filter(t => ahora - t < 3600e3);
  if (lista.length >= LIMITE) return res.status(429).json({ code: "rate_limited", error: "Demasiadas lecturas; espera un rato" });
  lista.push(ahora); usos.set(ip, lista);

  const { prompt, image, mediaType } = req.body || {};
  if (typeof prompt !== "string" || prompt.length > 20000) return res.status(400).json({ error: "Petición no válida" });
  if (image && (typeof image !== "string" || image.length > 3_500_000)) return res.status(413).json({ code: "image_rejected", error: "Imagen demasiado grande" });
  const tipo = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mediaType) ? mediaType : "image/jpeg";

  const content = [];
  if (image) content.push({ type: "image", source: { type: "base64", media_type: tipo, data: image } });
  content.push({ type: "text", text: prompt });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5", max_tokens: 4000, messages: [{ role: "user", content }] }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ code: r.status === 429 ? "rate_limited" : "server", error: j?.error?.message || "Error de la API" });
    const text = (j.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(502).json({ code: "server", error: "No se ha podido contactar con la API" });
  }
}
