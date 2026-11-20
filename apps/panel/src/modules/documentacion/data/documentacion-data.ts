import { DocCategory, DocArticle } from '../types/documentacion.types';

export const docCategories: DocCategory[] = [
  {
    id: 'introduccion',
    title: 'Comenzando & Arquitectura',
    description: 'Estructura modular del proyecto, stack técnico y directivas de diseño Apple HIG.',
    iconName: 'Compass',
    badge: 'Core',
  },
  {
    id: 'instalacion',
    title: 'Instalación & Despliegue',
    description: 'Requisitos de entorno, scripts de desarrollo y compilación optimizada para producción.',
    iconName: 'Terminal',
  },
  {
    id: 'diseno',
    title: 'Diseño, Tipografía & Tema',
    description: 'Personalización de las 5 fuentes dinámicas, paleta de colores HSL y efecto Liquid Glass.',
    iconName: 'Palette',
    badge: 'Apple HIG',
  },
  {
    id: 'notificaciones',
    title: 'Notificaciones & Audio',
    description: 'Motor Sileo Dynamic Island, feedback háptico con Web Audio API y auto-cierre con resortes.',
    iconName: 'BellRing',
    badge: 'Sileo',
  },
  {
    id: 'componentes',
    title: 'Componentes Pro & Shell',
    description: 'Tablas de alta densidad TanStack Table v8, macOS Bottom Dock y Spotlight Raycast.',
    iconName: 'LayoutGrid',
  },
  {
    id: 'negocio',
    title: 'Módulos de Negocio & Flujos',
    description: 'Guía de uso para eCommerce, paquetería DeliveryProgress, facturación y automatizaciones.',
    iconName: 'Briefcase',
    badge: 'Negocio',
  },
  {
    id: 'backend',
    title: 'Conexión de APIs & Backend',
    description: 'Integración de TanStack Query v5 con servicios REST, GraphQL, Supabase y Node.js.',
    iconName: 'Server',
  },
];

export const docArticles: DocArticle[] = [
  // 1. INTRODUCCIÓN & ARQUITECTURA
  {
    id: 'arquitectura-kit',
    categoryId: 'introduccion',
    title: 'Visión General & Arquitectura de Dominio',
    summary: 'Estructura modular orientada a funcionalidades (Feature/Domain-Driven Architecture) para máxima escalabilidad.',
    readingTime: '4 min de lectura',
    lastUpdated: 'Octubre 2026',
    badge: 'Arquitectura',
    tags: ['Arquitectura', 'React 19', 'TypeScript', 'Clean Code'],
    sections: [
      {
        id: 'sec-overview',
        heading: '1. Filosofía de Kit de Plantilla Profesional',
        paragraphs: [
          'Blakor Admin Pro está concebido no solo como un panel administrativo estético, sino como una arquitectura empresarial lista para conectar con APIs reales. Cada funcionalidad vive encapsulada en su propio módulo independiente, lo que permite añadir, modificar o remover secciones sin romper el resto de la aplicación.',
          'La base de código sigue estrictamente el principio de separación de responsabilidades: los componentes reutilizables residen en src/shared, mientras que la lógica de negocio vive en src/modules.',
        ],
        bullets: [
          'Sin código espagueti: Cada módulo tiene sus propios componentes, tipos, datos de prueba y páginas.',
          'Type-Safety total: Interfaces de TypeScript estrictas en todas las capas del sistema.',
          'División de código automática: Cada ruta se importa bajo demanda mediante React.lazy.',
        ],
        callout: {
          type: 'info',
          title: 'Directriz de Código',
          content: 'Si necesitas crear una nueva funcionalidad (por ejemplo, "inventario"), crea una carpeta en src/modules/inventario con components, pages y types. No contamines src/shared con lógica específica de negocio.',
        },
      },
      {
        id: 'sec-folders',
        heading: '2. Mapa de Directorios del Proyecto',
        paragraphs: [
          'A continuación se detalla la organización estándar de directorios para mantener la coherencia del proyecto a medida que crezca tu equipo:',
        ],
        codeSnippet: {
          language: 'bash',
          filename: 'Estructura de Directorios',
          code: `src/
├── app/                  # Proveedores globales y configuración de TanStack Router
│   ├── providers/        # QueryClient, ThemeProvider, SoundProvider, LayoutProvider
│   └── routes/           # Árbol de rutas tipadas con React.lazy (app-router.tsx)
├── modules/              # Funcionalidades de negocio encapsuladas (24 módulos)
│   ├── automatizaciones/ # Motor de reglas autónomas y simulador de flujos
│   ├── dashboard/        # Métricas principales, gráficos y KPIs ejecutivos
│   ├── ecommerce/        # Catálogo, órdenes y stepper DeliveryProgress
│   ├── pagos/            # Facturación, planes Stripe y vista imprimible
│   └── usuarios/         # Directorio de clientes, perfiles y permisos RBAC
├── shared/               # Primitivas universales de interfaz y utilidades
│   ├── components/       # Layout (Shell, Dock, TopNavbar), UI y DataTable
│   ├── context/          # Contextos de Layout, Tema y Sonido
│   └── lib/              # Motor Sileo notify, helpers y configuración de navegación
└── styles/               # CSS global, tokens de diseño y variables CSS`,
        },
      },
    ],
  },
  {
    id: 'convenciones-apple',
    categoryId: 'introduccion',
    title: 'Principios Apple HIG & Política Zero Emojis',
    summary: 'Directrices estrictas de artesanía visual basadas en las Apple Human Interface Guidelines y fidelidad cromática.',
    readingTime: '3 min de lectura',
    lastUpdated: 'Octubre 2026',
    badge: 'Apple HIG',
    tags: ['Apple HIG', 'Zero Emojis', 'Lucide React', 'SF Symbols'],
    sections: [
      {
        id: 'sec-zero-emojis',
        heading: '1. Política Estricta de Cero Emojis',
        paragraphs: [
          'En entornos empresariales y dashboards profesionales, los emojis pictóricos tradicionales rompen la jerarquía visual, varían de forma inconsistente entre sistemas operativos y reducen la seriedad de la plataforma.',
          'En Blakor Admin Pro está prohibido el uso de emojis en cualquier parte de la interfaz: botones, insignias, tablas, toasts, banners o migas de pan. Toda la iconografía utiliza exclusivamente símbolos vectoriales de Lucide React o glifos tipográficos del sistema (⌘, ↵, Esc).',
        ],
        callout: {
          type: 'warning',
          title: 'Regla Crítica del Proyecto',
          content: 'Nunca agregues emojis como iconos o decoraciones. Utiliza componentes Lucide React con stroke width homogéneo de 1.75px a 2px y colores semánticos sutiles.',
        },
      },
      {
        id: 'sec-contrast',
        heading: '2. Capas de Liquid Glass y Refracción Óptica',
        paragraphs: [
          'La interfaz implementa un enfoque de dos capas funcionales:',
          '1. Capa de Contenido: Fondo neutro puro (#FFFFFF en modo claro, #000000 en modo oscuro) con tipografía de alto contraste para máxima legibilidad de métricas y tablas densas.',
          '2. Capa de Controles Flotantes: Barras de navegación superior, dock inferior y modales flotantes con efecto Liquid Glass (backdrop-blur-xl bg-background/80 border border-border/50), bisel de luz y sombras difusas de 24px.',
        ],
      },
    ],
  },

  // 2. INSTALACIÓN & DESPLIEGUE
  {
    id: 'guia-inicio-rapido',
    categoryId: 'instalacion',
    title: 'Instalación, Setup & Scripts de Terminal',
    summary: 'Paso a paso para clonar, instalar dependencias y levantar el servidor de desarrollo en menos de 2 minutos.',
    readingTime: '3 min de lectura',
    lastUpdated: 'Octubre 2026',
    badge: 'Quickstart',
    tags: ['Node.js', 'pnpm', 'Vite', 'Scripts'],
    sections: [
      {
        id: 'sec-reqs',
        heading: '1. Requisitos Previos',
        paragraphs: [
          'Antes de iniciar, asegúrate de contar con Node.js 18.0 o superior en tu entorno de trabajo. Recomendamos utilizar pnpm para una instalación instantánea y gestión eficiente del almacenamiento en disco.',
        ],
        bullets: [
          'Node.js >= 18.18.0 (recomendado Node.js 20 LTS o 22)',
          'pnpm >= 9.0.0 (o en su defecto npm >= 10 o yarn >= 1.22)',
        ],
      },
      {
        id: 'sec-commands',
        heading: '2. Comandos Principales de la Plantilla',
        paragraphs: [
          'Ejecuta los siguientes comandos en la terminal desde la raíz del proyecto:',
        ],
        codeSnippet: {
          language: 'bash',
          filename: 'Terminal Bash',
          code: `# 1. Instalar dependencias con pnpm
pnpm install

# 2. Iniciar servidor de desarrollo con Hot Module Replacement (HMR)
pnpm run dev

# 3. Validar tipos de TypeScript sin emitir archivos
pnpm run check-types

# 4. Compilar para producción (genera carpeta dist/ optimizada)
pnpm run build

# 5. Previsualizar la compilación de producción localmente
pnpm run preview`,
        },
        callout: {
          type: 'tip',
          title: 'Tip de Compilación',
          content: 'El script check-types utiliza el binario nativo ultra-rápido tsgo --noEmit para revisar errores de tipos en milisegundos.',
        },
      },
    ],
  },

  // 3. DISEÑO, TIPOGRAFÍA & TEMA
  {
    id: 'tipografia-5-fuentes',
    categoryId: 'diseno',
    title: '5 Familias Tipográficas & Zero FOUT',
    summary: 'Ajuste en caliente de tipografías empresariales pre-cargadas con persistencia instantánea y sin saltos visuales.',
    readingTime: '3 min de lectura',
    lastUpdated: 'Octubre 2026',
    badge: 'Tipografía',
    tags: ['Tipografía', 'Geist', 'Inter', 'FOUT', 'CSS Variables'],
    sections: [
      {
        id: 'sec-fonts-overview',
        heading: '1. Catálogo de 5 Fuentes Seleccionables',
        paragraphs: [
          'El personalizador de tema permite alternar entre 5 familias tipográficas de grado corporativo, cada una optimizada para diferentes casos de uso:',
        ],
        bullets: [
          'Geist Sans (Vercel): Líneas geométricas limpias y moderna estética de ingeniería de software.',
          'Inter (Figma): Alta legibilidad en interfaces de usuario densas y pantallas de baja resolución.',
          'Plus Jakarta Sans: Toque editorial elegante con curvas distintivas para marcas de lujo y finanzas.',
          'JetBrains Mono: Tipografía de ancho fijo (monospace) con números tabulares perfectos para dashboards financieros.',
          'Overpass: Inspirada en la señalética Highway Gothic de EE.UU., ideal para pantallas de operaciones y logística.',
        ],
      },
      {
        id: 'sec-zero-fout',
        heading: '2. Mecanismo de Cero FOUT (Flash of Unstyled Text)',
        paragraphs: [
          'Para evitar que la página parpadee al recargar mientras lee la preferencia del usuario, index.html incorpora un script síncrono antes del primer renderizado que lee localStorage.getItem("blakor_typography") y define de inmediato las variables CSS globales.',
        ],
        codeSnippet: {
          language: 'css',
          filename: 'src/styles/globals.css',
          code: `:root {
  /* Variables dinámicas controladas por el LayoutContext */
  --font-family-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
  --font-family-heading: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif;
  --font-family-mono: "JetBrains Mono", ui-monospace, monospace;
}

body {
  font-family: var(--font-family-sans);
}

h1, h2, h3, h4, .font-heading {
  font-family: var(--font-family-heading);
}`,
        },
      },
    ],
  },

  // 4. NOTIFICACIONES & AUDIO
  {
    id: 'sileo-dynamic-island',
    categoryId: 'notificaciones',
    title: 'Sistema de Notificaciones Sileo & Web Audio API',
    summary: 'Guía para emitir toasts animados estilo Dynamic Island con auto-cierre milimétrico y retroalimentación acústica.',
    readingTime: '3 min de lectura',
    lastUpdated: 'Octubre 2026',
    badge: 'Sileo',
    tags: ['Sileo', 'Notificaciones', 'Web Audio API', 'Sonidos Hápticos'],
    sections: [
      {
        id: 'sec-sileo-usage',
        heading: '1. Cómo Lanzar Notificaciones en Cualquier Módulo',
        paragraphs: [
          'El motor de notificaciones del sistema utiliza Sileo en la parte superior central (top-center) de la pantalla. Provee una cápsula flotante con morphing de resortes, auto-cierre a los 3.5 segundos y sonido háptico generado sintéticamente.',
          'Para emitir una alerta, importa el singleton notify desde src/shared/lib/notify:',
        ],
        codeSnippet: {
          language: 'typescript',
          filename: 'Ejemplo de Uso',
          code: `import { notify } from '@/shared/lib/notify';

// 1. Notificación de éxito estándar (3.5s)
notify.success('Cambios Guardados', 'Los ajustes fueron actualizados con éxito.');

// 2. Alerta de error crítico (4.0s con tono acústico grave)
notify.error('Fallo de Red [504]', 'No se pudo conectar con el servidor.');

// 3. Advertencia preventiva
notify.warning('Cuota Próxima al Límite', 'Has consumido el 85% de las llamadas API.');

// 4. Mensaje informativo
notify.info('Sincronización Iniciada', 'Procesando registros en segundo plano...');

// 5. Promesa asíncrona con estados de carga y resolución automática
notify.promise(guardarEnServidor(), {
  loading: { title: 'Guardando datos...' },
  success: { title: 'Guardado con éxito' },
  error: { title: 'Error al procesar' },
});`,
        },
        callout: {
          type: 'tip',
          title: 'Duración Garantizada',
          content: 'Todas las alertas tienen un temporizador automático preconfigurado para evitar que se queden congeladas en pantalla. Si el usuario desea cerrarla antes, puede hacer clic sobre ella o invocar notify.clear().',
        },
      },
      {
        id: 'sec-audio',
        heading: '2. Retroalimentación Acústica (Web Audio API)',
        paragraphs: [
          'La plantilla integra un sintetizador de audio nativo mediante Web Audio API (src/shared/lib/sound.ts) que no depende de archivos MP3 externos. Los sonidos son inmediatos (cero latencia de red) y los usuarios pueden silenciarlos con el atajo de la barra superior o desde la paleta de comandos.',
        ],
      },
    ],
  },

  // 5. COMPONENTES & SHELL
  {
    id: 'tablas-pro',
    categoryId: 'componentes',
    title: 'Tablas de Alta Densidad con TanStack Table v8',
    summary: 'Componente DataTable con 3 estados de densidad visual, exportación CSV, visibilidad de columnas y selección masiva.',
    readingTime: '4 min de lectura',
    lastUpdated: 'Octubre 2026',
    badge: 'TanStack Table',
    tags: ['DataTable', 'TanStack Table v8', 'CSV', 'Bulk Actions'],
    sections: [
      {
        id: 'sec-datatable',
        heading: '1. Características del Componente DataTable',
        paragraphs: [
          'El componente DataTable (src/shared/components/data-table/data-table.tsx) encapsula la potencia de TanStack Table v8 con una presentación visual refinada estilo Apple:',
        ],
        bullets: [
          'Selector de Densidad de 3 estados: Compacta (32px para analítica densa), Normal (44px estándar) y Relajada (56px para lectura cómoda).',
          'Selector de Columnas: Popover que permite mostrar u ocultar columnas en caliente.',
          'Exportación a CSV: Botón directo para descargar los registros filtrados en formato CSV con escape de caracteres seguro.',
          'Barra Flotante de Acciones en Lote: Al seleccionar una o más filas mediante checkboxes, emerge un panel flotante inferior con acciones masivas (eliminar, cambiar estado, exportar seleccionados).',
        ],
        codeSnippet: {
          language: 'tsx',
          filename: 'Uso de DataTable en una Página',
          code: `import { DataTable } from '@/shared/components/data-table/data-table';
import { columns } from './usuarios-columns';
import { initialUsers } from './usuarios-data';

export const UsuariosPage = () => {
  return (
    <DataTable
      columns={columns}
      data={initialUsers}
      searchKey="nombre"
      searchPlaceholder="Buscar usuario por nombre o correo..."
      onBulkDelete={(selectedRows) => {
        console.log('Eliminar filas seleccionadas:', selectedRows);
      }}
    />
  );
};`,
        },
      },
    ],
  },

  // 6. MÓDULOS DE NEGOCIO
  {
    id: 'dashboard-7-vistas',
    categoryId: 'negocio',
    title: 'Guía Rápida del Dashboard & 7 Vistas Ejecutivas',
    summary: 'Aprende a navegar y configurar los 7 tableros especializados para diferentes verticales de negocio.',
    readingTime: '3 min de lectura',
    lastUpdated: 'Octubre 2026',
    badge: 'Dashboard',
    tags: ['Dashboard', 'KPIs', 'Métricas', 'Reportes PDF', 'Analítica'],
    sections: [
      {
        id: 'sec-dash-views',
        heading: '1. Los 7 Tableros Especializados',
        paragraphs: [
          'El módulo principal /dashboard integra 7 tableros de control diseñados con directivas Apple HIG para diferentes casos de uso corporativo:',
        ],
        bullets: [
          'Ejecutivo (Finanzas SaaS): Ingresos recurrentes mensuales (MRR), retención de licencias y balances.',
          'eCommerce & Retail: Volumen bruto de mercancías (GMV), ticket promedio y seguimiento de órdenes.',
          'CRM Ventas B2B: Pipeline de contratos corporativos, tasas de cierre y comisiones de ejecutivos.',
          'Analítica de Plataforma: Concurrencia de usuarios en tiempo real, canales y distribución geográfica.',
          'Campus Educativo (LMS): Matriculados, asistencia biométrica y exámenes programados.',
          'Clínico & Hospitalario: Ocupación de camas, triaje Manchester y disponibilidad UCI.',
          'Logística & Suministro: Flotas en tránsito, centros de distribución y entregas OTIF.',
        ],
        callout: {
          type: 'tip',
          title: 'Recorrido Guiado Interactivo',
          content: 'En la cabecera del Dashboard dispones del botón "Recorrido" para iniciar el tutorial interactivo paso a paso enfocado en cada sección.',
        },
      },
      {
        id: 'sec-dash-kpis',
        heading: '2. Tarjetas KPI y Tipografía Tabular',
        paragraphs: [
          'Todas las tarjetas de métricas numéricas utilizan font-variant-numeric: tabular-nums (clase tabular-nums de Tailwind CSS). Esto garantiza que los dígitos de valores financieros o porcentajes conserven el mismo ancho entre sí, evitando oscilaciones visuales al actualizar métricas en tiempo real.',
        ],
      },
    ],
  },
  {
    id: 'flujos-automatizaciones',
    categoryId: 'negocio',
    title: 'Motor de Flujos & Automatizaciones',
    summary: 'Estructura del pipeline de 3 nodos (Trigger -> Condición -> Acción) y simulador interactivo de pruebas en vivo.',
    readingTime: '3 min de lectura',
    lastUpdated: 'Octubre 2026',
    badge: 'Automatizaciones',
    tags: ['Automatizaciones', 'Pipelines', 'Webhooks', 'Simulador'],
    sections: [
      {
        id: 'sec-automations-model',
        heading: '1. Modelo de Datos de una Regla de Automatización',
        paragraphs: [
          'El módulo /automatizaciones permite conectar eventos desencadenantes con filtros de condición y acciones automáticas hacia servicios externos (Stripe, paquetería, registros de auditoría o helpdesk).',
          'Cada regla se compone de 3 nodos encadenados:',
        ],
        bullets: [
          'Trigger (Desencadenante): Evento de entrada (p. ej. "ecommerce.order_paid" o "auth.login_failed").',
          'Condition (Condición): Regla de negocio que debe cumplirse (p. ej. "Monto >= $50 USD" o "3 intentos fallidos en 60s").',
          'Action (Acción): Tarea ejecutada automáticamente (p. ej. "Iniciar DeliveryProgress" o "Bloquear IP en firewall").',
        ],
        codeSnippet: {
          language: 'typescript',
          filename: 'src/modules/automatizaciones/types/automatizaciones.types.ts',
          code: `export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category: 'ecommerce' | 'pagos' | 'soporte' | 'seguridad' | 'sistema';
  trigger: AutomationNode;
  condition: AutomationNode;
  action: AutomationNode;
  enabled: boolean;
  executionsCount: number;
  lastRun: string;
  successRate: number; // e.g. 99.8
  avgLatency: string;  // e.g. 142ms
  savedHoursMonthly: number;
}`,
        },
        callout: {
          type: 'tip',
          title: 'Simulador en Tiempo Real',
          content: 'Haz clic en "Probar Flujo Ahora" en cualquier regla para abrir el modal de simulación paso a paso con inspección de payload JSON en vivo.',
        },
      },
    ],
  },

  // 7. BACKEND & APIS
  {
    id: 'integracion-api',
    categoryId: 'backend',
    title: 'Conexión de APIs con TanStack Query v5',
    summary: 'Cómo sustituir los datos mock por peticiones reales a servicios REST, GraphQL o bases de datos BaaS.',
    readingTime: '4 min de lectura',
    lastUpdated: 'Octubre 2026',
    badge: 'TanStack Query',
    tags: ['APIs', 'REST', 'Supabase', 'TanStack Query', 'Hooks'],
    sections: [
      {
        id: 'sec-api-hook',
        heading: '1. Creación de un Hook de Consulta con TanStack Query',
        paragraphs: [
          'La plantilla ya incluye TanStack Query v5 configurado con caché optimizada en src/app/providers. Para consumir un endpoint real en lugar del archivo mock, crea un hook en la carpeta hooks de tu módulo:',
        ],
        codeSnippet: {
          language: 'typescript',
          filename: 'src/modules/usuarios/hooks/use-usuarios.ts',
          code: `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notify } from '@/shared/lib/notify';

// 1. Función fetch tipada
async function fetchUsuarios() {
  const res = await fetch('/api/v1/usuarios');
  if (!res.ok) throw new Error('Error al cargar lista de usuarios');
  return res.json();
}

// 2. Hook de consulta
export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: fetchUsuarios,
    staleTime: 1000 * 60 * 5, // 5 minutos de caché fresca
  });
}

// 3. Mutación con actualización optimista y notificación Sileo
export function useCrearUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nuevoUsuario: any) => {
      const res = await fetch('/api/v1/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      notify.success('Usuario Registrado', 'Los datos fueron almacenados en la base de datos.');
    },
    onError: (err: Error) => {
      notify.error('Error de Guardado', err.message);
    },
  });
}`,
        },
      },
    ],
  },
];
