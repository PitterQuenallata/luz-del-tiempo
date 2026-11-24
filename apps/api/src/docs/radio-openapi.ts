// Documentación OpenAPI 3.1 de la API de radio (API 1, /api/v1/radio).
// Las formas coinciden con packages/shared (validaciones) y con las rutas de radio.routes.ts y radio-musica.routes.ts.

const ref = (nombre: string) => ({ $ref: `#/components/schemas/${nombre}` });
const json = (schema: unknown) => ({ 'application/json': { schema } });
const error = (descripcion: string) => ({ description: descripcion, content: json(ref('Error')) });
const idParam = (nombre = 'id', descripcion = 'UUID del recurso') => ({
  name: nombre,
  in: 'path',
  required: true,
  description: descripcion,
  schema: { type: 'string', format: 'uuid' },
});
const seguridad = [{ sesionPanel: [] }];
const permiso = 'Requiere permiso `estaciones:todas`.';

type Metodo = 'get' | 'post' | 'put' | 'patch' | 'delete';
const op = (
  tag: string,
  summary: string,
  extra: { descripcion?: string; params?: unknown[]; body?: unknown; multipart?: boolean; respuesta?: unknown; codigos?: Record<string, unknown> } = {},
) => ({
  tags: [tag],
  summary,
  description: [extra.descripcion, permiso].filter(Boolean).join('\n\n'),
  security: seguridad,
  parameters: extra.params ?? [],
  ...(extra.body
    ? {
        requestBody: {
          required: true,
          content: extra.multipart
            ? { 'multipart/form-data': { schema: extra.body } }
            : { 'application/json': { schema: extra.body } },
        },
      }
    : {}),
  responses: {
    ...(extra.respuesta ? { '200': { description: 'OK', content: json(extra.respuesta) } } : { '200': { description: 'OK' } }),
    '401': { description: 'Sin sesión' },
    '403': { description: 'Sin permiso' },
    ...(extra.codigos ?? {}),
  },
});

export const radioOpenApi = {
  openapi: '3.1.0',
  info: {
    title: 'API de radio · La Luz del Tiempo',
    version: '1.0.0',
    description:
      'Emisoras, programación semanal, transmisión (datos para el locutor), audios del AutoDJ y playlists.\n\n' +
      'La API 1 es la fuente de verdad: cada cambio de transmisión o playlists se envía a la radio-api (API 2), ' +
      'que controla Liquidsoap e Icecast. La contraseña del locutor se guarda cifrada y nunca se devuelve.',
  },
  servers: [{ url: 'http://localhost:4000', description: 'Desarrollo' }],
  tags: [
    { name: 'Emisoras', description: 'Alta, edición y baja de emisoras.' },
    { name: 'Programación', description: 'Programas y franjas semanales.' },
    { name: 'Transmisión', description: 'Mount, contraseña del locutor, calidad y AutoDJ.' },
    { name: 'Pistas', description: 'Audios del AutoDJ (biblioteca de la emisora).' },
    { name: 'Playlists', description: 'Modos, pesos, horarios y orden de los audios.' },
    { name: 'Servicio', description: 'Estado de la radio-api e Icecast.' },
  ],
  components: {
    securitySchemes: {
      sesionPanel: {
        type: 'apiKey',
        in: 'cookie',
        name: 'better-auth.session_token',
        description: 'Sesión del panel. Se obtiene con POST /api/auth/sign-in/email.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'validacion' },
          message: { type: 'string', example: 'Falta la contraseña del locutor.' },
          campo: { type: 'string', example: 'livePassword' },
        },
        required: ['error'],
      },
      SincronizacionEstado: {
        type: 'object',
        description: 'Resultado de empujar la configuración a la radio-api.',
        properties: {
          estado: {
            type: 'string',
            enum: ['ok', 'sin_transmision', 'falta_contrasena', 'radio_no_disponible', 'error'],
          },
          message: { type: 'string' },
          status: { type: 'integer', description: 'Código HTTP de la radio-api cuando estado = error' },
        },
        required: ['estado'],
      },
      Emisora: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string', example: 'salud' },
          name: { type: 'string' },
          description: { type: ['string', 'null'] },
          genre: { type: ['string', 'null'] },
          kind: { type: 'string', enum: ['own', 'external'] },
          isMain: { type: 'boolean' },
          status: { type: 'string', enum: ['active', 'suspended', 'disabled'] },
          mountPoint: { type: ['string', 'null'], example: '/salud' },
          sortOrder: { type: 'integer' },
        },
      },
      EmisoraInput: {
        type: 'object',
        description: 'Datos de la emisora (ver packages/shared emisoraSchema).',
        required: ['slug', 'name', 'kind', 'isMain', 'visibleInMinistry', 'status', 'sortOrder'],
        properties: {
          slug: { type: 'string' },
          name: { type: 'string', minLength: 2, maxLength: 80 },
          kind: { type: 'string', enum: ['own', 'external'] },
          isMain: { type: 'boolean' },
          status: { type: 'string', enum: ['active', 'suspended', 'disabled'] },
          visibleInMinistry: { type: 'boolean' },
          sortOrder: { type: 'integer', minimum: 0 },
          description: { type: ['string', 'null'] },
          genre: { type: ['string', 'null'] },
          areaId: { type: ['string', 'null'], format: 'uuid' },
          operatedByName: { type: ['string', 'null'] },
          contactName: { type: ['string', 'null'] },
          contactPhone: { type: ['string', 'null'] },
          contactEmail: { type: ['string', 'null'] },
          notes: { type: ['string', 'null'] },
        },
      },
      Programa: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          stationId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          hostName: { type: ['string', 'null'] },
          isActive: { type: 'boolean' },
          franjas: { type: 'array', items: ref('Franja') },
        },
      },
      ProgramaInput: {
        type: 'object',
        required: ['name', 'isActive'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 120 },
          description: { type: ['string', 'null'] },
          hostName: { type: ['string', 'null'], maxLength: 80 },
          areaId: { type: ['string', 'null'], format: 'uuid' },
          isActive: { type: 'boolean' },
        },
      },
      Franja: {
        type: 'object',
        description: 'Franja de programa. Si cruza la medianoche, se crean dos.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          programId: { type: 'string', format: 'uuid' },
          dayOfWeek: { type: 'integer', minimum: 0, maximum: 6, description: '0 = domingo … 6 = sábado' },
          startTime: { type: 'string', example: '19:00' },
          endTime: { type: 'string', example: '20:00' },
          isLive: { type: 'boolean' },
        },
      },
      FranjaInput: {
        type: 'object',
        required: ['dayOfWeek', 'startTime', 'endTime', 'isLive'],
        properties: {
          dayOfWeek: { type: 'integer', minimum: 0, maximum: 6 },
          startTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
          endTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
          isLive: { type: 'boolean' },
        },
      },
      Transmision: {
        type: 'object',
        description: 'Lo que necesita quien transmite. Nunca incluye la contraseña.',
        properties: {
          mountPoint: { type: ['string', 'null'], example: '/salud' },
          livePasswordConfigurada: { type: 'boolean' },
          bitrateKbps: { type: 'integer', example: 128 },
          autodjEnabled: { type: 'boolean' },
          maxListeners: { type: 'integer', example: 100 },
          storageQuotaMb: { type: 'integer', example: 5120 },
          streamUrl: { type: ['string', 'null'], example: 'http://localhost:8000/salud' },
          locutor: {
            type: 'object',
            properties: {
              servidor: { type: 'string', example: 'localhost' },
              puerto: { type: 'integer', example: 8005 },
              mount: { type: ['string', 'null'] },
            },
          },
        },
      },
      EmisionInput: {
        type: 'object',
        required: ['mountPoint', 'bitrateKbps', 'autodjEnabled', 'maxListeners', 'storageQuotaMb'],
        properties: {
          mountPoint: { type: 'string', pattern: '^/[a-z0-9][a-z0-9-]{0,39}$', example: '/salud' },
          livePassword: { type: 'string', minLength: 8, maxLength: 128, description: 'Solo si se cambia. La primera vez es obligatoria.' },
          bitrateKbps: { type: 'integer', minimum: 32, maximum: 320 },
          autodjEnabled: { type: 'boolean' },
          maxListeners: { type: 'integer', minimum: 1, maximum: 2000 },
          storageQuotaMb: { type: 'integer', minimum: 100, maximum: 10240 },
        },
      },
      Pista: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          stationId: { type: 'string', format: 'uuid' },
          storageKey: { type: 'string', example: 'Sonido de gaviota.mp3', description: 'Nombre del archivo en la radio' },
          title: { type: 'string' },
          artist: { type: ['string', 'null'] },
          durationSec: { type: ['integer', 'null'] },
          sizeBytes: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      PistaEditarInput: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 120 },
          artist: { type: ['string', 'null'], maxLength: 120 },
        },
      },
      Horario: {
        type: 'object',
        description: 'Horario de una playlist programada (hora local de la radio).',
        required: ['dayOfWeek', 'startTime', 'endTime'],
        properties: {
          dayOfWeek: { type: 'integer', minimum: 0, maximum: 6 },
          startTime: { type: 'string', example: '21:00' },
          endTime: { type: 'string', example: '23:59' },
        },
      },
      PlaylistInput: {
        type: 'object',
        required: ['name', 'mode', 'weight', 'isActive', 'trackIds', 'schedules'],
        description:
          'Modos: `rotacion` (se mezcla por peso, orden aleatorio), `secuencial` (se mezcla por peso, orden fijo), ' +
          '`programada` (no entra en la mezcla; solo suena en sus horarios; necesita al menos uno).',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 80 },
          description: { type: ['string', 'null'], maxLength: 300 },
          mode: { type: 'string', enum: ['rotacion', 'secuencial', 'programada'] },
          weight: { type: 'integer', minimum: 1, maximum: 100, description: 'Solo cuenta en rotación y secuencial.' },
          isActive: { type: 'boolean' },
          trackIds: { type: 'array', items: { type: 'string', format: 'uuid' }, maxItems: 5000, description: 'En el orden en que suenan.' },
          schedules: { type: 'array', items: ref('Horario'), maxItems: 50 },
        },
      },
      Playlist: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          stationId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: ['string', 'null'] },
          mode: { type: 'string', enum: ['rotacion', 'secuencial', 'programada'] },
          weight: { type: 'integer' },
          shuffle: { type: 'boolean' },
          isActive: { type: 'boolean' },
          trackIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
          schedules: { type: 'array', items: ref('Horario') },
        },
      },
    },
  },
  paths: {
    '/api/v1/radio/emisoras': {
      get: op('Emisoras', 'Listar emisoras', { respuesta: { type: 'object', properties: { emisoras: { type: 'array', items: ref('Emisora') } } } }),
      post: op('Emisoras', 'Crear emisora', {
        body: ref('EmisoraInput'),
        respuesta: { type: 'object', properties: { emisora: ref('Emisora') } },
        codigos: { '201': { description: 'Creada', content: json({ type: 'object', properties: { emisora: ref('Emisora') } }) }, '409': error('Ya existe una emisora con ese enlace (slug).'), '422': error('Regla de negocio: una sola principal, una sola externa, área inexistente.') },
      }),
    },
    '/api/v1/radio/emisoras/{id}': {
      patch: op('Emisoras', 'Editar emisora', {
        params: [idParam()],
        body: ref('EmisoraInput'),
        respuesta: { type: 'object', properties: { emisora: ref('Emisora') } },
        codigos: { '404': error('No existe.'), '409': error('Slug repetido.'), '422': error('Regla de negocio.') },
      }),
      delete: op('Emisoras', 'Eliminar emisora', {
        descripcion: 'Borra también programas y horarios. Quita la estación de la radio-api. No se puede borrar la principal.',
        params: [idParam()],
        codigos: { '404': error('No existe.'), '422': error('Es la principal.') },
      }),
    },
    '/api/v1/radio/emisoras/{id}/programas': {
      get: op('Programación', 'Listar programas de una emisora', { params: [idParam()], respuesta: { type: 'object', properties: { programas: { type: 'array', items: ref('Programa') } } } }),
      post: op('Programación', 'Crear programa', {
        params: [idParam()],
        body: ref('ProgramaInput'),
        respuesta: { type: 'object', properties: { programa: ref('Programa') } },
        codigos: { '404': error('La emisora no existe.') },
      }),
    },
    '/api/v1/radio/programas/{id}': {
      patch: op('Programación', 'Editar programa', { params: [idParam()], body: ref('ProgramaInput') }),
      delete: op('Programación', 'Eliminar programa (y sus franjas)', { params: [idParam()] }),
    },
    '/api/v1/radio/programas/{id}/franjas': {
      post: op('Programación', 'Agregar franja a un programa', {
        descripcion: 'Las franjas no pueden solaparse en la misma emisora.',
        params: [idParam()],
        body: ref('FranjaInput'),
        respuesta: { type: 'object', properties: { franja: ref('Franja') } },
        codigos: { '422': error('Solapa con otra franja o hora de fin antes del inicio.') },
      }),
    },
    '/api/v1/radio/franjas/{id}': {
      delete: op('Programación', 'Quitar una franja', { params: [idParam()] }),
    },
    '/api/v1/radio/servicio': {
      get: op('Servicio', 'Estado de la radio-api e Icecast', {
        descripcion: 'No cambia nada. Sirve para mostrar si la radio está encendida.',
        respuesta: {
          type: 'object',
          properties: {
            radioApi: { type: 'string', enum: ['ok', 'sin_conexion'] },
            icecastOnline: { type: 'boolean' },
            emisorasEnRadio: { type: 'integer' },
          },
        },
      }),
    },
    '/api/v1/radio/emisoras/{id}/transmision': {
      get: op('Transmisión', 'Ver la transmisión de una emisora', {
        descripcion: 'Devuelve los datos para el locutor y, si hay mount, el estado que reporta la radio-api. Nunca la contraseña.',
        params: [idParam()],
        respuesta: { type: 'object', properties: { transmision: ref('Transmision'), radio: { description: 'Estado de la radio-api para esta estación (o null).' } } },
      }),
      put: op('Transmisión', 'Guardar la transmisión', {
        descripcion:
          'Guarda mount, calidad, AutoDJ y límites, y empuja la configuración a la radio-api. ' +
          'La contraseña es opcional después de la primera vez; si se envía, se guarda cifrada.',
        params: [idParam()],
        body: ref('EmisionInput'),
        respuesta: { type: 'object', properties: { transmision: ref('Transmision'), sincronizado: ref('SincronizacionEstado') } },
        codigos: {
          '422': error('Falta la contraseña (primera vez), el mount ya lo usa otra emisora, o datos inválidos.'),
        },
      }),
    },
    '/api/v1/radio/emisoras/{id}/sincronizar': {
      post: op('Transmisión', 'Volver a empujar la configuración a la radio', {
        descripcion: 'Útil si la radio se apagó o se reinició.',
        params: [idParam()],
        respuesta: { type: 'object', properties: { transmision: ref('SincronizacionEstado'), playlists: ref('SincronizacionEstado') } },
      }),
    },
    '/api/v1/radio/emisoras/{id}/pistas': {
      get: op('Pistas', 'Listar audios de la emisora', {
        params: [idParam()],
        respuesta: {
          type: 'object',
          properties: {
            pistas: { type: 'array', items: ref('Pista') },
            espacioUsadoBytes: { type: 'integer' },
            espacioCuotaBytes: { type: 'integer' },
          },
        },
      }),
      post: op('Pistas', 'Subir un audio al AutoDJ', {
        descripcion:
          'Formatos: mp3, ogg, opus, m4a, aac, flac, wav. Máximo 300 MB. El título sale del nombre del archivo. ' +
          'Requiere transmisión configurada.',
        params: [idParam()],
        body: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } },
        multipart: true,
        codigos: {
          '201': { description: 'Subido', content: json({ type: 'object', properties: { pista: ref('Pista') } }) },
          '400': error('Formato no permitido o falta el archivo.'),
          '409': error('Sin transmisión, radio no lista, o cuota de espacio excedida.'),
          '413': error('Archivo mayor a 300 MB.'),
        },
      }),
    },
    '/api/v1/radio/emisoras/{id}/pistas/importar': {
      post: op('Pistas', 'Importar audios que ya están en la radio', {
        descripcion: 'Trae a la base los archivos que la radio tiene y todavía no están registrados.',
        params: [idParam()],
        respuesta: { type: 'object', properties: { importadas: { type: 'integer' }, total: { type: 'integer' } } },
        codigos: { '409': error('La emisora no tiene transmisión.') },
      }),
    },
    '/api/v1/radio/pistas/{id}': {
      patch: op('Pistas', 'Editar título o artista de un audio', {
        params: [idParam()],
        body: ref('PistaEditarInput'),
        respuesta: { type: 'object', properties: { pista: ref('Pista') } },
      }),
      delete: op('Pistas', 'Borrar un audio', {
        descripcion: 'Borra el archivo de la radio, lo quita de la base y de las playlists que lo tenían.',
        params: [idParam()],
        respuesta: { type: 'object', properties: { ok: { type: 'boolean' }, playlists: ref('SincronizacionEstado') } },
        codigos: { '502': error('La radio no respondió; el audio no se borró.') },
      }),
    },
    '/api/v1/radio/emisoras/{id}/playlists': {
      get: op('Playlists', 'Listar playlists de la emisora', {
        params: [idParam()],
        respuesta: { type: 'object', properties: { playlists: { type: 'array', items: ref('Playlist') } } },
      }),
      post: op('Playlists', 'Crear playlist', {
        descripcion: 'Los audios deben pertenecer a la misma emisora. Se sincroniza con la radio.',
        params: [idParam()],
        body: ref('PlaylistInput'),
        respuesta: { type: 'object', properties: { playlist: ref('Playlist'), sincronizado: ref('SincronizacionEstado') } },
        codigos: { '201': { description: 'Creada', content: json({ type: 'object', properties: { playlist: ref('Playlist'), sincronizado: ref('SincronizacionEstado') } }) }, '422': error('Alguna pista no es de la emisora o falta el horario de una programada.') },
      }),
    },
    '/api/v1/radio/playlists/{id}': {
      put: op('Playlists', 'Reemplazar una playlist', {
        descripcion: 'Envía la playlist completa (nombre, modo, peso, orden de pistas y horarios).',
        params: [idParam()],
        body: ref('PlaylistInput'),
        respuesta: { type: 'object', properties: { playlist: ref('Playlist'), sincronizado: ref('SincronizacionEstado') } },
      }),
      delete: op('Playlists', 'Eliminar playlist', {
        descripcion: 'Los audios no se borran.',
        params: [idParam()],
        respuesta: { type: 'object', properties: { ok: { type: 'boolean' }, sincronizado: ref('SincronizacionEstado') } },
      }),
    },
  },
};
