# Desarrollos · publicación en Vercel

Contenido:
- `index.html` — la app completa (un solo archivo, funciona sin servidor).
- `api/leer-croquis.js` — función opcional para que Claude lea las cotas del croquis.
- `package.json`, `vercel.json` — configuración mínima.

Sin configurar nada, la app ya funciona: el alumnado sube su croquis, escribe las cotas X, Y, Z
y la app reconoce el sólido, muestra el plegado y genera el PDF/SVG en su navegador.

Para activar la lectura automática con Claude, añade en Vercel la variable `ANTHROPIC_API_KEY`
(Project → Settings → Environment Variables) y vuelve a desplegar. Cada lectura se cobra en tu
cuenta de Anthropic: pon un límite de gasto en console.anthropic.com. `MAX_POR_HORA` (por defecto 100)
limita las lecturas por IP; ojo, en un aula todo el alumnado puede compartir la misma IP.
