// Documentación OpenAPI 3.1 de la radio-api (API 2). Uso interno: solo la API 1 le habla.

const ref = (nombre: string) => ({ $ref: `#/components/schemas/${nombre}` });
const json = (schema: unknown) => ({ 'application/json': { schema } });
const slug = { name: 'slug', in: 'path', required: true, description: 'Identificador de la estación (minúsculas, números y guiones).', schema: { type: 'string', example: 'salud' } };
const seguridad = [{ tokenInterno: [] }];
const noAutorizado = { description: 'Token ausente o incorrecto', content: json(ref('Error')) };
const noExiste = { description: 'La estación no existe', content: json(ref('Error')) };

export const radioApiOpenApi = {
  openapi: '3.1.0',
  info: {
    title: 'radio-api · API 2 de radio',
    version: '1.0.0',
    description:
      'Controla Icecast y Liquidsoap: estaciones (mount, contraseña del locutor, AutoDJ), audios, playlists y oyentes.\n\n' +
      'Uso interno: solo la API 1 (apps/api) la llama, con el token `RADIO_API_TOKEN`. No se publica a internet.',
  },
  servers: [{ url: 'http://localhost:4100', description: 'Desarrollo (Docker)' }],
  tags: [
    { name: 'Salud', description: 'Sin token.' },
    { name: 'Estaciones', description: 'Configuración de cada estación y su estado en Icecast.' },
    { name: 'Audios', description: 'Archivos del AutoDJ de cada estación.' },
    { name: 'Playlists', description: 'Listas de reproducción del AutoDJ.' },
    { name: 'Oyentes', description: 'Muestras de oyentes para estadísticas.' },
  ],
  components: {
    securitySchemes: {
      tokenInterno: { type: 'http', scheme: 'bearer', description: 'Token interno (RADIO_API_TOKEN).' },
    },
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'string', example: 'no_autorizado' }, message: { type: 'string' } }, required: ['error'] },
      EstadoMount: {
        type: 'object',
        properties: {
          mount: { type: 'string', example: '/salud' },
          online: { type: 'boolean' },
          listeners: { type: 'integer' },
          listenerPeak: { type: 'integer' },
          title: { type: ['string', 'null'], description: 'Canción que suena (metadatos de Icecast)' },
          bitrate: { type: ['integer', 'null'] },
          startedAt: { type: ['string', 'null'], format: 'date-time' },
        },
      },
      Estacion: {
        type: 'object',
        description: 'Forma pública: nunca incluye la contraseña del locutor.',
        properties: {
          slug: { type: 'string' },
          name: { type: 'string' },
          mount: { type: 'string' },
          bitrate: { type: 'integer' },
          autodj: { type: 'boolean' },
          enabled: { type: 'boolean' },
          max_listeners: { type: 'integer' },
          storage_quota_mb: { type: 'integer' },
          streamUrl: { type: 'string', example: 'http://localhost:8000/salud' },
          playlists: { type: 'array', items: ref('PlaylistMeta') },
        },
      },
      EstacionEntrada: {
        type: 'object',
        required: ['name', 'mount', 'livePassword'],
        properties: {
          name: { type: 'string', maxLength: 120 },
          mount: { type: 'string', pattern: '^/[a-z0-9][a-z0-9-]{0,39}$', example: '/salud' },
          bitrate: { type: 'integer', minimum: 32, maximum: 320, default: 128 },
          livePassword: { type: 'string', minLength: 8, maxLength: 128, description: 'Contraseña del locutor (Liquidsoap la usa en el harbor)' },
          autodj: { type: 'boolean', default: true },
          enabled: { type: 'boolean', default: true },
          maxListeners: { type: 'integer', minimum: 1, maximum: 2000, default: 100 },
          storageQuotaMb: { type: 'integer', minimum: 1, maximum: 10240, default: 5120 },
        },
      },
      Audio: {
        type: 'object',
        properties: { file: { type: 'string', example: 'Sonido de gaviota.mp3' }, sizeBytes: { type: 'integer' }, uploadedAt: { type: 'string', format: 'date-time' } },
      },
      PlaylistMeta: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          mode: { type: 'string', enum: ['rotacion', 'secuencial', 'programada'] },
          weight: { type: 'integer' },
          shuffle: { type: 'boolean' },
          active: { type: 'boolean' },
          schedules: { type: 'array', items: { type: 'object', properties: { day: { type: 'integer', minimum: 0, maximum: 6 }, inicio: { type: 'integer', description: 'Minutos desde medianoche' }, fin: { type: 'integer', description: 'Minutos desde medianoche (máx. 1440)' } } } },
        },
      },
      PlaylistEntrada: {
        type: 'object',
        required: ['id', 'name', 'mode', 'tracks'],
        properties: {
          id: { type: 'string', pattern: '^[a-z0-9][a-z0-9-]{0,39}$' },
          name: { type: 'string', maxLength: 80 },
          mode: { type: 'string', enum: ['rotacion', 'secuencial', 'programada'] },
          weight: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          shuffle: { type: 'boolean', default: true },
          active: { type: 'boolean', default: true },
          tracks: { type: 'array', items: { type: 'string' }, description: 'Nombres de archivo en la carpeta de la estación, en orden.' },
          schedules: { type: 'array', items: { type: 'object', required: ['day', 'inicio', 'fin'], properties: { day: { type: 'integer', minimum: 0, maximum: 6 }, inicio: { type: 'integer', minimum: 0, maximum: 1439 }, fin: { type: 'integer', minimum: 1, maximum: 1440 } } } },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Salud'],
        summary: 'Estado del servicio',
        responses: { '200': { description: 'OK', content: json({ type: 'object', properties: { status: { type: 'string', example: 'ok' } } }) } },
      },
    },
    '/v1/stations': {
      get: {
        tags: ['Estaciones'],
        summary: 'Listar estaciones con su estado en Icecast',
        security: seguridad,
        responses: {
          '200': { description: 'OK', content: json({ type: 'object', properties: { icecastOnline: { type: 'boolean' }, stations: { type: 'array', items: { allOf: [ref('Estacion'), { type: 'object', properties: { status: ref('EstadoMount') } }] } } } }) },
          '401': noAutorizado,
        },
      },
    },
    '/v1/stations/{slug}': {
      parameters: [slug],
      get: {
        tags: ['Estaciones'],
        summary: 'Una estación con su estado y el espacio usado',
        security: seguridad,
        responses: { '200': { description: 'OK' }, '401': noAutorizado, '404': noExiste },
      },
      put: {
        tags: ['Estaciones'],
        summary: 'Crear o actualizar una estación',
        description: 'Escribe stations.json de forma atómica. Liquidsoap se reinicia (~2 s) al cambiar la configuración.',
        security: seguridad,
        parameters: [slug],
        requestBody: { required: true, content: json(ref('EstacionEntrada')) },
        responses: {
          '200': { description: 'Actualizada', content: json(ref('Estacion')) },
          '201': { description: 'Creada', content: json(ref('Estacion')) },
          '400': { description: 'Datos inválidos', content: json(ref('Error')) },
          '401': noAutorizado,
          '409': { description: 'El mount ya lo usa otra estación', content: json(ref('Error')) },
        },
      },
      delete: {
        tags: ['Estaciones'],
        summary: 'Quitar una estación',
        description: 'Los audios quedan en disco.',
        security: seguridad,
        parameters: [slug],
        responses: { '204': { description: 'Quitada' }, '401': noAutorizado, '404': noExiste },
      },
    },
    '/v1/listeners': {
      get: {
        tags: ['Oyentes'],
        summary: 'Oyentes por estación (para guardar muestras)',
        security: seguridad,
        responses: { '200': { description: 'OK', content: json({ type: 'object', properties: { sampledAt: { type: 'string', format: 'date-time' }, stations: { type: 'array', items: { type: 'object', properties: { slug: { type: 'string' }, listeners: { type: 'integer' } } } } } }) }, '401': noAutorizado },
      },
    },
    '/v1/stations/{slug}/tracks': {
      parameters: [slug],
      get: {
        tags: ['Audios'],
        summary: 'Audios del AutoDJ de la estación',
        security: seguridad,
        responses: { '200': { description: 'OK', content: json({ type: 'object', properties: { tracks: { type: 'array', items: ref('Audio') }, storageUsedBytes: { type: 'integer' }, storageQuotaBytes: { type: 'integer' } } }) }, '401': noAutorizado, '404': noExiste },
      },
      post: {
        tags: ['Audios'],
        summary: 'Subir un audio',
        description: 'Campo `file`. Formatos: mp3, ogg, opus, m4a, aac, flac, wav. Máximo 300 MB. Si pasa la cuota, responde 409.',
        security: seguridad,
        parameters: [slug],
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } } } } },
        responses: {
          '201': { description: 'Subido', content: json({ type: 'object', properties: { file: { type: 'string' }, sizeBytes: { type: 'integer' } } }) },
          '400': { description: 'Formato no permitido o falta el campo file', content: json(ref('Error')) },
          '401': noAutorizado,
          '404': noExiste,
          '409': { description: 'Cuota de espacio excedida', content: json(ref('Error')) },
          '413': { description: 'Archivo mayor a 300 MB', content: json(ref('Error')) },
        },
      },
    },
    '/v1/stations/{slug}/tracks/{file}': {
      parameters: [slug, { name: 'file', in: 'path', required: true, schema: { type: 'string' }, description: 'Nombre del archivo' }],
      delete: {
        tags: ['Audios'],
        summary: 'Borrar un audio',
        security: seguridad,
        responses: { '204': { description: 'Borrado' }, '401': noAutorizado, '404': noExiste },
      },
    },
    '/v1/stations/{slug}/playlists': {
      parameters: [slug],
      get: {
        tags: ['Playlists'],
        summary: 'Playlists de la estación con su lista de audios',
        security: seguridad,
        responses: { '200': { description: 'OK', content: json({ type: 'object', properties: { playlists: { type: 'array', items: { allOf: [ref('PlaylistMeta'), { type: 'object', properties: { tracks: { type: 'array', items: { type: 'string' } } } }] } } } }) }, '401': noAutorizado, '404': noExiste },
      },
      put: {
        tags: ['Playlists'],
        summary: 'Reemplazar todas las playlists de la estación',
        description:
          'Escribe un .m3u por playlist (Liquidsoap lo recarga sin cortar el stream). Si cambian modo, peso, activa o horarios, ' +
          'stations.json se actualiza y Liquidsoap se reinicia. Responde 422 si algún audio no existe en disco.',
        security: seguridad,
        parameters: [slug],
        requestBody: { required: true, content: json({ type: 'object', required: ['playlists'], properties: { playlists: { type: 'array', items: ref('PlaylistEntrada') } } }) },
        responses: {
          '200': { description: 'Aplicadas', content: json({ type: 'object', properties: { playlists: { type: 'integer' }, liquidsoapReiniciado: { type: 'boolean' } } }) },
          '400': { description: 'Datos inválidos o id repetido', content: json(ref('Error')) },
          '401': noAutorizado,
          '404': noExiste,
          '422': { description: 'Audios que no existen', content: json({ type: 'object', properties: { error: { type: 'string', example: 'pistas_no_existen' }, faltantes: { type: 'array', items: { type: 'string' } } } }) },
        },
      },
    },
  },
};
