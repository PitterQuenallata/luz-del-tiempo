import { Hono } from 'hono';
import { radioOpenApi } from './radio-openapi.js';

// Swagger UI de la API de radio. En producción solo si se activa con API_DOCS=1.
export const docsRoutes = new Hono();

const activas = process.env.NODE_ENV !== 'production' || process.env.API_DOCS === '1';

docsRoutes.get('/openapi.json', (c) => {
  if (!activas) return c.notFound();
  return c.json(radioOpenApi);
});

docsRoutes.get('/', (c) => {
  if (!activas) return c.notFound();
  return c.html(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>API de radio · Documentación</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({ url: '/api/docs/openapi.json', dom_id: '#swagger-ui', deepLinking: true });
  </script>
</body>
</html>`);
});
