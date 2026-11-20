import { BlogPost } from '../types/blog.types';

export const initialBlogPosts: BlogPost[] = [
  {
    id: 'post-1',
    slug: 'apple-hig-enterprise-production',
    title: 'Principios de Diseño Apple Human Interface: De la Teoría a la Producción Enterprise',
    excerpt: 'Cómo transformar directivas de accesibilidad, micro-bordes transparentes y tipografía tabular en sistemas de diseño de alta densidad.',
    content: `El diseño para aplicaciones de misión crítica no consiste en añadir adornos superfluos, sino en retirar todo elemento que compita con la claridad de los datos.

1. Jerarquía Tipográfica y Números Tabulares
En plataformas analíticas y financieras, la legibilidad vertical es fundamental. Al aplicar fuentes monoespaciadas con cifras tabulares (tabular-nums), garantizamos que las cantidades y balances se alineen de forma natural en columnas, permitiendo al usuario detectar discrepancias en milisegundos sin esfuerzo cognitivo.

2. Cero Emojis y Sobriedad Visual
El uso de emojis o iconografía decorativa en cabeceras de tarjetas genera ruido perceptual y abarata el producto. Las directivas de Apple HIG exigen que los encabezados comuniquen su función a través de peso y escala tipográfica pura.

3. Superficies y Micro-Bordes
En lugar de depender de sombras difuminadas que oscurecen la interfaz, los micro-bordes de 1 píxel con transparencia alfa (rgba) delimitan con precisión los planos de elevación tanto en modo claro como en modo oscuro.`,
    category: 'Design Systems',
    coverImage: '/images/gallery/blog-img1.jpg',
    authorName: 'Mathew Anderson',
    authorRole: 'Lead Product Designer',
    authorAvatar: '/images/profile/user-1.jpg',
    readingTime: '5 min',
    publishedAt: '28 Oct 2026',
    viewsCount: 3420,
    likesCount: 184,
    isLiked: false,
    commentsCount: 3,
    isFeatured: true,
    status: 'published',
    tags: ['Apple HIG', 'Design Systems', 'Accesibilidad', 'UI/UX'],
    comments: [
      {
        id: 'comm-1',
        authorName: 'Elena Rostova',
        authorAvatar: '/images/profile/user-2.jpg',
        authorRole: 'UX Researcher',
        date: 'Hace 3 horas',
        content: 'La eliminación de emojis en las cabeceras transformó radicalmente la seriedad del panel financiero. Excelente análisis.',
      },
      {
        id: 'comm-2',
        authorName: 'Carlos Mendoza',
        authorAvatar: '/images/profile/user-3.jpg',
        authorRole: 'VP of Engineering',
        date: 'Hace 1 hora',
        content: 'Los tiempos de renderizado DOM bajaron sensiblemente al retirar contenedores de iconos innecesarios.',
      },
    ],
  },
  {
    id: 'post-2',
    slug: 'micro-bordes-contraste-modo-oscuro',
    title: 'Micro-Bordes y Ratios de Contraste en Modo Oscuro para Dashboards Financieros',
    excerpt: 'Técnicas avanzadas de balance de luminancia y canal alfa para evitar el efecto de halo negro en interfaces glass.',
    content: `El modo oscuro no es simplemente pintar el fondo de negro absoluto. Requiere una calibración precisa de superficies y niveles de elevación.

En Blakor Admin Pro, implementamos una jerarquía de grises de sistema Apple:
- Fondo base: #000000 o superficie mínima neutral.
- Tarjetas de contenido: rgba(255, 255, 255, 0.04) con borde sutil rgba(255, 255, 255, 0.08).
- Controles funcionales flotantes: backdrop-blur-xl con opacidad controlada al 70%.

Esta fórmula elimina la fatiga visual en jornadas prolongadas de supervisión de trading o pasarelas de pago.`,
    category: 'Design Systems',
    coverImage: '/images/gallery/blog-img2.jpg',
    authorName: 'Elena Rostova',
    authorRole: 'Senior UX Researcher',
    authorAvatar: '/images/profile/user-2.jpg',
    readingTime: '4 min',
    publishedAt: '26 Oct 2026',
    viewsCount: 2150,
    likesCount: 96,
    isLiked: false,
    commentsCount: 1,
    isFeatured: false,
    status: 'published',
    tags: ['Dark Mode', 'Liquid Glass', 'Contraste', 'Accesibilidad'],
    comments: [
      {
        id: 'comm-3',
        authorName: 'Lucía Benítez',
        authorAvatar: '/images/profile/user-7.jpg',
        authorRole: 'Design System Ops',
        date: 'Ayer',
        content: 'La fórmula de elevación en modo oscuro resuelve por completo los problemas de saturación en pantallas OLED.',
      },
    ],
  },
  {
    id: 'post-3',
    slug: 'web-audio-api-cuelume-haptics',
    title: 'Arquitectura de Audio Háptico en la Web: Integrando Web Audio API cuelume',
    excerpt: 'Síntesis acústica senoidal en el navegador sin archivos WAV ni latencia de red para confirmar acciones de usuario.',
    content: `La respuesta táctil en aplicaciones web tradicionales se limita a cambios de color. Al incorporar micro-tonos senoidales generados proceduralmente con Web Audio API, creamos un lazo de confirmación sensorial inmediato.

Perfiles Acústicos de la Biblioteca cuelume:
- Click (120ms): Frecuencia senoidal atenuada para botones estándar y selecciones en tablas.
- Pop (90ms): Frecuencia ascendente rápida para toggles y checkboxes.
- Success (220ms): Acorde armonizado en quinta justa para pagos confirmados.
- Alert (180ms): Onda cuadrada suave para validaciones erróneas.

Todo generado en menos de 2 kilobytes de código JavaScript sin descargar archivos de audio externos.`,
    category: 'Ingeniería Web',
    coverImage: '/images/gallery/blog-img3.jpg',
    authorName: 'Lucía Benítez',
    authorRole: 'Design System Ops',
    authorAvatar: '/images/profile/user-7.jpg',
    readingTime: '6 min',
    publishedAt: '24 Oct 2026',
    viewsCount: 1890,
    likesCount: 142,
    isLiked: true,
    commentsCount: 2,
    isFeatured: false,
    status: 'published',
    tags: ['Web Audio API', 'Hápticos', 'Frontend', 'React 19'],
    comments: [],
  },
  {
    id: 'post-4',
    slug: 'optimizacion-vite-chunks-rollup',
    title: 'Optimización de Chunks en Vite y Empaquetado Rollup para Alta Concurrencia',
    excerpt: 'Estrategias de code-splitting manual y árboles de dependencias para lograr tiempos de carga iniciales menores a 1 segundo.',
    content: `Cuando una suite corporativa crece hasta incorporar eCommerce, Kanban, Chat y Facturación, el tamaño del paquete puede degradar la experiencia de inicio.

Claves de la Configuración de Build:
1. División manual de vendors pesados como TanStack Query, TanStack Table y Framer Motion en chunks independientes.
2. Carga perezosa de vistas no críticas mediante React.lazy e importaciones dinámicas.
3. Eliminación de polifills obsoletos gracias a la compilación dirigida a navegadores modernos con soporte nativo de ES2022.`,
    category: 'Arquitectura Cloud',
    coverImage: '/images/gallery/blog-img4.jpg',
    authorName: 'Carlos Mendoza',
    authorRole: 'VP of Engineering',
    authorAvatar: '/images/profile/user-3.jpg',
    readingTime: '5 min',
    publishedAt: '22 Oct 2026',
    viewsCount: 2840,
    likesCount: 167,
    isLiked: false,
    commentsCount: 4,
    isFeatured: false,
    status: 'published',
    tags: ['Vite', 'Rollup', 'Performance', 'Bundling'],
    comments: [],
  },
  {
    id: 'post-5',
    slug: 'offline-first-tanstack-query',
    title: 'Patrones Offline-First y Manejo de Estado Transaccional con TanStack Query',
    excerpt: 'Técnicas de actualización optimista y persistencia en IndexedDB para asegurar operatividad sin conexión a internet.',
    content: `En operaciones comerciales B2B y logística, la conexión a internet puede fluctuar. Diseñar bajo el paradigma offline-first garantiza que el cajero o administrador continúe registrando órdenes sin interrupción.

Implementación de Mutaciones Optimistas:
- El estado local se actualiza inmediatamente al presionar 'Confirmar Venta'.
- La mutación se almacena en cola de sincronización persistente.
- Al restablecerse la red, se dispara un reintento idempotente con reconciliación en servidor.`,
    category: 'Ingeniería Web',
    coverImage: '/images/gallery/blog-img5.jpg',
    authorName: 'Andrés Villalobos',
    authorRole: 'Senior Frontend Engineer',
    authorAvatar: '/images/profile/user-8.jpg',
    readingTime: '4 min',
    publishedAt: '19 Oct 2026',
    viewsCount: 1620,
    likesCount: 88,
    isLiked: false,
    commentsCount: 1,
    isFeatured: false,
    status: 'published',
    tags: ['TanStack Query', 'Offline-First', 'React 19', 'State'],
    comments: [],
  },
  {
    id: 'post-6',
    slug: 'resiliencia-kubernetes-hpa',
    title: 'Resiliencia en Kubernetes: Auto-escalado Horizontal sin Pérdida de Paquetes',
    excerpt: 'Configuración de Horizontal Pod Autoscalers (HPA) con métricas personalizadas de Prometheus para mitigar picos de facturación.',
    content: `Durante campañas de liquidación o cierres de mes, el volumen transaccional de pasarelas de pago se multiplica por diez.

Estrategia de Auto-escalado:
- Monitoreo de colas de mensajes en lugar de consumo estático de CPU.
- Ventanas de estabilización de 300 segundos para evitar efecto de oscilación (flapping).
- Graceful shutdown de conexiones HTTP activas con preStop hooks de 15 segundos.`,
    category: 'Arquitectura Cloud',
    coverImage: '/images/gallery/blog-img6.jpg',
    authorName: 'Sofía Valenzuela',
    authorRole: 'Principal Cloud Architect',
    authorAvatar: '/images/profile/user-5.jpg',
    readingTime: '7 min',
    publishedAt: '15 Oct 2026',
    viewsCount: 3100,
    likesCount: 210,
    isLiked: true,
    commentsCount: 5,
    isFeatured: false,
    status: 'published',
    tags: ['Kubernetes', 'HPA', 'Cloud', 'DevOps'],
    comments: [],
  },
  {
    id: 'post-7',
    slug: 'accesibilidad-wcag-aaa-voiceover',
    title: 'Accesibilidad Universal en Sistemas de Alta Densidad: Contraste WCAG 2.1 AAA y Navegación por Teclado',
    excerpt: 'Cómo implementar focus-visible personalizado, soporte nativo para VoiceOver y relaciones de luminancia para paneles operativos de misión crítica.',
    content: `La accesibilidad en aplicaciones de nivel empresarial no es un añadido estético opcional, sino un requisito indispensable de cumplimiento legal y diseño inclusivo.

1. Contraste de Luminancia WCAG AAA (7:1)
En terminales financieros y salas de operaciones con iluminación variable, los textos sobre fondos transparentes o modo oscuro deben mantener una relación de contraste mínima de 7:1 para texto normal y 4.5:1 para titulares grandes. En Blakor, calibramos cada token de color neutral para superar el umbral estándar de Apple HIG.

2. Navegación por Teclado Sin Trampas de Foco
Todo componente interactivo (filas de tablas, filtros de estado, botones de acción rápida) implementa anillos de foco visibles con doble contraste (ring-2 ring-primary ring-offset-2) y maneja los eventos de teclado Tab, Enter, Space y Escape conforme a los patrones ARIA Authoring Practices.

3. Compatibilidad con Lectores de Pantalla (VoiceOver y NVDA)
Las tablas complejas y los gráficos con curvas dinámicas incorporan atributos aria-label y tablas de datos equivalentes en texto plano, permitiendo a los operadores con discapacidad visual consultar balances y fluctuaciones con total autonomía.`,
    category: 'Accesibilidad',
    coverImage: '/images/gallery/blog-img7.jpg',
    authorName: 'Amara Okafor',
    authorRole: 'Accessibility & Compliance Lead',
    authorAvatar: '/images/profile/user-8.jpg',
    readingTime: '6 min',
    publishedAt: '27 Oct 2026',
    viewsCount: 2450,
    likesCount: 178,
    isLiked: false,
    commentsCount: 2,
    isFeatured: false,
    status: 'published',
    tags: ['Accesibilidad', 'WCAG AAA', 'VoiceOver', 'A11y', 'Apple HIG'],
    comments: [
      {
        id: 'comm-701',
        authorName: 'Elena Rostova',
        authorAvatar: '/images/profile/user-2.jpg',
        authorRole: 'UX Researcher',
        date: 'Hace 5 horas',
        content: 'El tratamiento de focus-visible con anillo offset resuelve por completo las pruebas de accesibilidad en Chrome y Safari.',
      },
      {
        id: 'comm-702',
        authorName: 'Steve Miller',
        authorAvatar: '/images/profile/user-5.jpg',
        authorRole: 'Security & Compliance',
        date: 'Hace 2 horas',
        content: 'Fundamental para las auditorías de accesibilidad en contratos con el sector público europeo.',
      },
    ],
  },
  {
    id: 'post-8',
    slug: 'reduced-motion-dynamic-type',
    title: 'Reducción de Movimiento y Tipografía Dinámica: Adaptando la UI a Preferencias del Sistema',
    excerpt: 'Técnicas CSS y hooks de React para respetar prefers-reduced-motion y escalas tipográficas de accesibilidad sin desalinear tablas numéricas.',
    content: `Apple Human Interface Guidelines establece que las interfaces deben honrar las preferencias de accesibilidad del usuario a nivel del sistema operativo.

1. Respeto Estricto a prefers-reduced-motion
Los usuarios con trastornos vestibulares pueden experimentar náuseas y mareos con animaciones de desplazamiento o zoom agresivas. Implementamos selectores CSS @media (prefers-reduced-motion: reduce) para sustituir transiciones complejas por transiciones inmediatas de opacidad sin saltos visuales.

2. Tipografía Dinámica y Cifras Tabulares
Al aumentar el tamaño de fuente en las preferencias del sistema, las tablas de datos deben acomodar el nuevo tamaño sin truncar cifras financieras críticas. El uso de tabular-nums y fuentes monoespaciadas garantiza que los separadores decimales se mantengan verticalmente sincronizados.

3. Áreas de Toque Mínimas (44x44 puntos)
En dispositivos táctiles o pantallas táctiles industriales, todos los botones de acción rápida respetan el área de toque mínima recomendada por Apple de 44x44 puntos para prevenir pulsaciones involuntarias.`,
    category: 'Accesibilidad',
    coverImage: '/images/gallery/blog-img8.jpg',
    authorName: 'Elena Rostova',
    authorRole: 'Senior UX Researcher',
    authorAvatar: '/images/profile/user-2.jpg',
    readingTime: '5 min',
    publishedAt: '25 Oct 2026',
    viewsCount: 1980,
    likesCount: 115,
    isLiked: false,
    commentsCount: 1,
    isFeatured: false,
    status: 'published',
    tags: ['A11y', 'Reduced Motion', 'Dynamic Type', 'Apple HIG'],
    comments: [
      {
        id: 'comm-801',
        authorName: 'Lucas Graham',
        authorAvatar: '/images/profile/user-7.jpg',
        authorRole: 'Frontend Specialist',
        date: 'Ayer',
        content: 'La combinación de dynamic type con cifras tabulares es indispensable para evitar cortes de texto en tablas financieras.',
      },
    ],
  },
  {
    id: 'post-9',
    slug: 'reconciliacion-bancaria-idempotencia',
    title: 'Arquitectura de Reconciliación Bancaria en Tiempo Real: Idempotencia y Trazabilidad Transaccional',
    excerpt: 'Diseño de ledgers de doble partida y procesamiento de webhooks de pasarelas de pago con claves de idempotencia UUID v7 para eliminar cobros duplicados.',
    content: `En la infraestructura Fintech moderna, la consistencia eventual no es suficiente cuando se manejan fondos de usuarios y balances comerciales.

1. Principio de Idempotencia Estricta
Cada solicitud de cobro, reembolso o transferencia genera un encabezado Idempotency-Key basado en UUID v7 ordenado cronológicamente. Si la pasarela experimenta un timeout de red y reintenta el webhook, el motor transaccional detecta la clave existente y devuelve el resultado previo sin alterar el saldo contable.

2. Libros Mayores de Doble Partida (Double-Entry Bookkeeping)
Ningún número se actualiza in-place en la base de datos. Cada movimiento genera dos asientos vinculados: un débito y un crédito que deben sumar exactamente cero. Esto asegura una pista de auditoría inmutable requerida para auditorías SOX y conciliaciones bancarias automatizadas.

3. Manejo de Retenciones y Reversiones
Las operaciones pendientes se registran en una subcuenta de retención (escrow) hasta que la cámara de compensación emite la liquidación definitiva, previniendo sobregiros o discrepancias en la tesorería corporativa.`,
    category: 'Fintech',
    coverImage: '/images/gallery/blog-img9.jpg',
    authorName: 'Mathew Anderson',
    authorRole: 'Finance Operations Lead',
    authorAvatar: '/images/profile/user-1.jpg',
    readingTime: '8 min',
    publishedAt: '28 Oct 2026',
    viewsCount: 3890,
    likesCount: 245,
    isLiked: true,
    commentsCount: 3,
    isFeatured: false,
    status: 'published',
    tags: ['Fintech', 'Idempotencia', 'Stripe', 'Double-Entry', 'Ledgers'],
    comments: [
      {
        id: 'comm-901',
        authorName: 'Carlos Mendoza',
        authorAvatar: '/images/profile/user-3.jpg',
        authorRole: 'VP of Engineering',
        date: 'Hace 4 horas',
        content: 'Implementar el doble asiento con UUID v7 resolvió el 100% de los incidentes de duplicación de webhooks.',
      },
      {
        id: 'comm-902',
        authorName: 'Elena Rostova',
        authorAvatar: '/images/profile/user-2.jpg',
        authorRole: 'UX Researcher',
        date: 'Hace 2 horas',
        content: 'Mostrar el estado exacto de la retención bancaria al usuario redujo en un 45% las consultas al equipo de soporte.',
      },
    ],
  },
  {
    id: 'post-10',
    slug: 'micro-liquidaciones-sepa-swift-saas',
    title: 'Micro-Liquidaciones y Cumplimiento SEPA / Swift en Plataformas SaaS Globales',
    excerpt: 'Orquestación de pagos multi-divisa, cálculo dinámico de retenciones impositivas VIES y validación de IBAN en milisegundos.',
    content: `Operar una plataforma SaaS a escala internacional implica procesar transacciones en más de 30 monedas locales cumpliendo normativas fiscales heterogéneas.

1. Validación Instantánea de Códigos IBAN y Routing BIC
Antes de emitir una instrucción de transferencia bancaria hacia Europa o Norteamérica, el sistema ejecuta una validación de algoritmo MOD-97 y verificación de formato bancario local, evitando comisiones por transferencias rechazadas.

2. Liquidaciones Agrupadas (Batch Settlements)
Para optimizar costos de comisiones en transferencias de bajo importe, agrupamos los pagos en ventanas de consolidación cada 6 horas, emitiendo una única orden de compensación SEPA Instant Credit Transfer con confirmación en menos de 10 segundos.

3. Verificación de Exención de IVA Intracomunitario (VIES)
Integración asíncrona con los servicios de la Comisión Europea para validar números de IVA empresarial en tiempo real, aplicando automáticamente exención tributaria a clientes B2B con domicilio fiscal verificado.`,
    category: 'Fintech',
    coverImage: '/images/gallery/blog-img10.jpg',
    authorName: 'Carlos Mendoza',
    authorRole: 'VP of Engineering',
    authorAvatar: '/images/profile/user-3.jpg',
    readingTime: '6 min',
    publishedAt: '23 Oct 2026',
    viewsCount: 2780,
    likesCount: 164,
    isLiked: false,
    commentsCount: 2,
    isFeatured: false,
    status: 'published',
    tags: ['Fintech', 'SEPA', 'Multi-Divisa', 'Compliance', 'SaaS'],
    comments: [
      {
        id: 'comm-1001',
        authorName: 'Mathew Anderson',
        authorAvatar: '/images/profile/user-1.jpg',
        authorRole: 'Finance Operations Lead',
        date: 'Ayer',
        content: 'El ahorro en tasas interbancarias gracias al batching de 6 horas superó los $14,000 mensuales.',
      },
    ],
  },
];
