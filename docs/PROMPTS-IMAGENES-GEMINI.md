# Prompts de imágenes para Gemini — La Luz del Tiempo

> **Solo para la demo al cliente (desarrollo).** Las imágenes muestran cómo se verá la web con fotos reales.
> En producción se reemplazan por fotos del ministerio. Ninguna imagen copia personas reales ni marcas de otros ministerios.

## Cómo usarlo

1. Copia el **estilo base** y pégalo al final de cada prompt (ya va incluido en los prompts largos).
2. Elige en Gemini la **proporción** que dice cada imagen. Si no te deja elegir, escribe la proporción al inicio del prompt.
3. Descarga y guarda con el **nombre exacto** en `apps/web/public/demo/` (por ejemplo `apps/web/public/demo/hero-radio.jpg`).
4. Avísame y las conecto en la web. Si una imagen sale con texto, logos o manos raras, pide otra.

**Reglas para todas:**
- Sin texto, sin letras, sin logos ni marcas de agua. Los títulos los pone la web encima.
- Personas latinoamericanas y bolivianas, ropa sencilla y moderna, nada de disfraces.
- Nada de personas famosas ni pastores reales: todos son personajes inventados.
- Deja **espacio vacío** donde va el texto (lo dice cada prompt).

## Identidad: que no se parezca a SUMtv

Las fotos son lo que más define la identidad del sitio. Para que se sienta **propio** y no una copia:

- **Bolivia, no un estudio de TV genérico:** los Andes, el Illimani, cielos altiplánicos, plazas, mercados y barrios reales. Nada de escenarios de televisión ni paneles de presentadores.
- **Gente común en su vida diaria:** oyentes escuchando la radio en la cocina, en el micro o en el campo; niños, familias, voluntarios. SUMtv muestra pastores en estudio; nosotros mostramos a la gente a la que llega la radio.
- **La luz como hilo conductor:** amanecer, rayos de sol, luz dorada entrando por una ventana. Es el nombre del ministerio ("La Luz del Tiempo") y combina con las estelas doradas de la web.
- **Evitar:** pinturas bíblicas clásicas, estatuas, ángeles épicos y estilo "póster de película". Eso es justo lo que identifica a SUMtv.
- **Tres trazos de luz** (los tres ángeles del logo): cuando la escena lo permita, agrega `three soft golden light streaks crossing the sky` al prompt.

Agrega esta línea a cualquier prompt que salga muy "de estudio de TV":

```
Real everyday life in Bolivia, natural documentary feel, not a TV studio, no stage lighting.
```

## Estilo base (pegar al final)

```
Cinematic photography, deep navy blue (#0b1324) and warm gold (#e2a927) color grade, soft golden rim light, gentle film grain, shallow depth of field, calm and hopeful mood, high detail, natural skin tones. No text, no letters, no logos, no watermarks.
```

---

## 1. Portada (carrusel) — 3 imágenes · proporción **16:9** · 1920×1080

Ocupan toda la portada. El texto va a la **izquierda**: el sujeto debe ir a la **derecha** y la izquierda quedar oscura y tranquila.

| Archivo | Prompt |
|---|---|
| `hero-radio.jpg` | Wide cinematic shot at sunrise of a Bolivian grandmother in a warm shawl listening to a small radio by her kitchen window, golden morning light pouring in, the Andes visible outside, she is on the right third of the frame smiling softly. Left half in deep shadow, calm and empty for text. + estilo base |
| `hero-escuela-vacaciones.jpg` | Wide shot of joyful Bolivian children aged 6 to 10 making paper crafts with a young female teacher, all on the right half of the frame, warm afternoon window light, colorful but soft. Left half darker and calm for text. + estilo base |
| `hero-vida-sana.jpg` | Wide shot of a smiling Bolivian female doctor in her 30s in a white coat holding a bowl of fresh fruits and quinoa, on the right third of the frame, bright kitchen softly blurred behind her. Left half darker and calm for text. + estilo base |

---

## 2. Emisoras — 4 imágenes · proporción **16:9** · 1920×1080

Fondo de cada emisora. `emisora-principal.jpg` es además **el fondo a todo el ancho de la página En vivo**, así que es la más importante de esta lista. El nombre va a la **izquierda**, así que el sujeto va a la **derecha**.

| Archivo | Prompt |
|---|---|
| `emisora-principal.jpg` | Wide shot of a modern radio studio at dawn, mixing console and microphone on the right side of the frame, large window behind showing the Andes mountains with the sun rising in gold light, left side of the frame dark and empty for text. + estilo base |
| `emisora-musica.jpg` | Close-up of hands playing an acoustic guitar and a piano keyboard in warm stage light, right side of the frame, floating dust in golden beams, left half dark navy and empty for text. + estilo base |
| `emisora-salud.jpg` | Fresh vegetables, fruits, a glass of water and a stethoscope on a wooden table on the right side of the frame, soft morning light, left half dark and empty for text, teal and gold accents. + estilo base |
| `emisora-predicas.jpg` | An open old Bible on a wooden lectern lit by a single warm beam of light from above, right side of the frame, dark navy background with soft bokeh, left half empty for text. + estilo base |

---

## 3. Programas — 4 portadas · proporción **3:4** · 1200×1600 · *opcional, todavía no se usan en la web*

Portadas de programas para cuando se agregue la página de cada programa. El título va **en el centro**, así que deja la parte central más tranquila.

| Archivo | Prompt |
|---|---|
| `programa-estudio-biblico.jpg` | Classical oil painting style of an ancient scroll and an oil lamp on a stone table, warm candlelight, rich brown and gold tones, dramatic chiaroscuro, calm empty space in the middle third for a title. No text. |
| `programa-vida-sana.jpg` | Editorial photo of a Bolivian family preparing a healthy breakfast together in a sunny kitchen, top and bottom of the frame busy, middle third softly blurred and calm for a title, teal and gold tones. + estilo base |
| `programa-mensaje-noche.jpg` | A small wooden church in the Bolivian highlands at night under a sky full of stars, warm light glowing from its windows, deep navy sky taking the upper two thirds, calm and peaceful. + estilo base |
| `programa-alabanza.jpg` | A youth choir singing with raised faces on a dim stage, backlit by warm golden spotlights, silhouettes with glowing rim light, haze in the air, calm space in the middle. + estilo base |

---

## 4. Áreas del ministerio — portadas · proporción **16:9** · 1920×1080

Se usan en la página de cada área (plantilla "portada grande"). Texto a la **izquierda**.

| Archivo | Prompt |
|---|---|
| `area-salud.jpg` | A free community health campaign in a Bolivian town square, volunteers in white coats measuring blood pressure of smiling elderly people under white tents, morning light, subject on the right, left third calm and slightly darker for text. + estilo base |
| `area-musica.jpg` | A music school classroom with teenagers learning violin, guitar and keyboard, a teacher guiding them, warm window light, subject on the right, left third calm for text. + estilo base |
| `area-biblia.jpg` | A small group of adults of different ages studying the Bible together around a wooden table with open books and coffee cups, warm lamp light, evening, subject on the right, left third dark for text. + estilo base |
| `area-ninos.jpg` | Children running and laughing in a sunny churchyard during a vacation school, colorful paper decorations, blurred motion, subject on the right, left third calm for text. + estilo base |

### Galerías de cada área — 4 por área · proporción **4:3** · 1600×1200

Para la plantilla "texto + galería". Nómbralas `galeria-<area>-1.jpg` … `-4.jpg`.

**Salud** (`galeria-salud-1..4.jpg`)
1. A volunteer nurse checking an elderly woman's blood pressure in a white tent, warm light. + estilo base
2. A cooking class showing how to prepare a healthy salad, hands and vegetables close-up. + estilo base
3. A group of adults doing a morning walk in a park in La Paz, Illimani mountain in the background. + estilo base
4. A health talk in a small community hall, a speaker with a projector, attentive audience from behind. + estilo base

**Música** (`galeria-musica-1..4.jpg`)
1. A child's hands on a piano keyboard with a teacher's hand guiding, close-up. + estilo base
2. A teenage girl playing violin in a practice room, soft window light. + estilo base
3. A small choir rehearsing in a church, conductor seen from behind. + estilo base
4. An acoustic concert on a small stage, warm spotlights, audience silhouettes. + estilo base

**Biblia** (`galeria-biblia-1..4.jpg`)
1. Open Bible with handwritten study notes and a pencil on a wooden table. + estilo base
2. A young couple reading the Bible together on a bench at sunset. + estilo base
3. A grandfather reading the Bible to his grandchildren on a sofa, warm lamp. + estilo base
4. Volunteers handing out small books in a busy Bolivian street market, friendly faces. + estilo base

**Niños** (`galeria-ninos-1..4.jpg`)
1. Children painting with watercolors at a long table, colorful and joyful. + estilo base
2. A teacher telling a story with puppets to seated children. + estilo base
3. Kids playing a group game in a sunny courtyard. + estilo base
4. Children singing with hand motions in a decorated classroom. + estilo base

---

## 5. Actividades y escuelas — 4 afiches · proporción **3:4** · 1200×1600

Fondo de los afiches de la fila "Actividades y escuelas". El título va **en el centro**: imagen más oscura y tranquila ahí.

| Archivo | Prompt |
|---|---|
| `actividad-escuela-salud.jpg` | Overhead flat lay of healthy food, a notebook, a measuring tape and a stethoscope on a green tablecloth, soft daylight, center area calm and darker. + estilo base |
| `actividad-escuela-vacaciones.jpg` | Colorful craft supplies, crayons and paper animals scattered on a classroom table, cheerful orange tones, center area calm and slightly darker. + estilo base |
| `actividad-taller-guitarra.jpg` | An acoustic guitar leaning on a wooden chair in a quiet room, a beam of warm light from a window, purple and gold tones, center area calm. + estilo base |
| `actividad-estudio-biblico.jpg` | A laptop showing an out-of-focus video call next to an open Bible and a cup of tea at night, blue screen glow and warm lamp light, center area calm. + estilo base |

---

## 6. Noticias — 3 portadas · proporción **16:10** · 1600×1000

| Archivo | Prompt |
|---|---|
| `noticia-campana-salud.jpg` | Documentary photo of a long line of people waiting for free medical checkups outside a community center in Bolivia, volunteers in white coats, morning light, hopeful. + estilo base |
| `noticia-nueva-emisora.jpg` | Close-up of a glowing red on-air sign and a microphone in a dark radio studio, golden bokeh lights. + estilo base |
| `noticia-inscripciones.jpg` | A mother holding her child's hand at a school door with a colorful welcome table, warm afternoon light, people from behind and the side. + estilo base |

---

## 7. Predicadores y locutores — 4 retratos · proporción **1:1** · 1000×1000

Personajes inventados (en producción irán las fotos reales del equipo).

| Archivo | Prompt |
|---|---|
| `persona-predicador-1.jpg` | Studio portrait of a kind Bolivian man in his 60s with gray hair, dark suit and tie, gentle smile, dark navy backdrop with gold rim light, chest-up, centered. + estilo base |
| `persona-predicador-2.jpg` | Studio portrait of a Bolivian man in his 40s with glasses, light blue shirt, confident friendly expression, dark navy backdrop with gold rim light, chest-up. + estilo base |
| `persona-locutor.jpg` | Studio portrait of a young Bolivian radio host in his 30s wearing headphones around his neck, casual jacket, big smile, dark navy backdrop with gold rim light. + estilo base |
| `persona-conductora-salud.jpg` | Studio portrait of a Bolivian woman in her 30s, nutritionist, white blouse, warm smile, dark navy backdrop with gold rim light, chest-up. + estilo base |

---

## 8. Quiénes somos — 1 foto · proporción **21:9** · 1920×820

Es el fondo a todo el ancho de la página "Quiénes somos", con la misión escrita encima en la parte de **abajo**: deja la mitad inferior más oscura y las caras en la mitad de arriba.

| Archivo | Prompt |
|---|---|
| `nosotros-equipo.jpg` | Ultra-wide group photo of a small, diverse ministry team of eight Bolivian adults of different ages standing side by side and smiling in front of a small radio station building at golden hour, the Andes behind them, faces in the upper half of the frame, lower half in soft shadow for text, casual clothes, natural and warm. + estilo base |

---

## 9. App y redes

| Archivo | Proporción | Prompt |
|---|---|---|
| `app-pantalla.jpg` | **9:16** · 1080×1920 | Abstract dark navy background with three soft golden light streaks flying diagonally upward from left to right, like comet trails, subtle stars, elegant and minimal. No text. |
| `og-compartir.jpg` | **1.91:1** · 1200×630 | Wide view of the Andes mountains at sunrise with golden light breaking over the peaks, deep navy sky, left half calm and dark for a logo. + estilo base |

---

## Lista rápida de archivos (45)

```
hero-radio.jpg · hero-escuela-vacaciones.jpg · hero-vida-sana.jpg
emisora-principal.jpg · emisora-musica.jpg · emisora-salud.jpg · emisora-predicas.jpg
programa-estudio-biblico.jpg · programa-vida-sana.jpg · programa-mensaje-noche.jpg · programa-alabanza.jpg
area-salud.jpg · area-musica.jpg · area-biblia.jpg · area-ninos.jpg
galeria-salud-1..4.jpg · galeria-musica-1..4.jpg · galeria-biblia-1..4.jpg · galeria-ninos-1..4.jpg
actividad-escuela-salud.jpg · actividad-escuela-vacaciones.jpg · actividad-taller-guitarra.jpg · actividad-estudio-biblico.jpg
noticia-campana-salud.jpg · noticia-nueva-emisora.jpg · noticia-inscripciones.jpg
persona-predicador-1.jpg · persona-predicador-2.jpg · persona-locutor.jpg · persona-conductora-salud.jpg
nosotros-equipo.jpg · app-pantalla.jpg · og-compartir.jpg
```

Para la demo, si hay poco tiempo, las **prioritarias** son (12 imágenes):

1. Las 3 de portada (`hero-*.jpg`): es lo primero que ve el cliente.
2. `emisora-principal.jpg`: fondo de toda la página En vivo.
3. `nosotros-equipo.jpg`: fondo de Quiénes somos.
4. `area-salud.jpg` y `area-musica.jpg`: hoy no tienen ninguna foto.
5. Las 4 de actividades (`actividad-*.jpg`).
6. `noticia-campana-salud.jpg`: la noticia principal.

Las que hoy salen con recortes de SUMtv se reemplazan solas al guardar la tuya con el mismo nombre.
