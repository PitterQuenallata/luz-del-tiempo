import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform, type PanInfo } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useSlides } from "../../api";
import type { HeroSlide } from "../../api/types";
import { LogoMark } from "../layout/Logo";
import { EstelasVuelo } from "../ui/Estelas";
import { SmartImage } from "../ui/SmartImage";

const DURATION = 7000;
const ease = [0.22, 1, 0.36, 1] as const;

function Cta({ slide }: { slide: HeroSlide }) {
  const cls = "btn-oro btn-brillo self-start text-sm";
  return slide.cta.to.startsWith("#") ? (
    <a href={slide.cta.to} className={cls}>{slide.cta.label}</a>
  ) : (
    <Link to={slide.cta.to} className={cls}>{slide.cta.label}</Link>
  );
}

/** El título entra palabra por palabra, cada una subiendo desde detrás de una máscara. */
function TituloPorPalabras({ text }: { text: string }) {
  return (
    <h2 className="titulo text-[clamp(38px,4.6vw,84px)] leading-[1.04]" aria-label={text}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom" aria-hidden>
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: "105%" }, show: { y: 0, transition: { duration: 0.7, ease, delay: i * 0.06 } } }}
          >
            {word}
            {" "}
          </motion.span>
        </span>
      ))}
    </h2>
  );
}

/**
 * Portada tipo carrusel, como los sliders de SUMtv: la imagen ocupa todo el
 * ancho (con más peso a la derecha) y el texto va a la izquierda sobre la
 * parte oscura. Sin imagen se ve el degradado del tono de la diapositiva y el logo.
 * Las imágenes ideales son 16:9 con el sujeto a la derecha (ver docs/PROMPTS-IMAGENES-GEMINI.md).
 *
 * En celular el texto baja y la foto queda arriba; se cambia de diapositiva deslizando el dedo.
 * Se pausa con el mouse encima, con el foco del teclado dentro o con la pestaña oculta.
 */
export function HeroCarousel() {
  const { data: slides = [] } = useSlides();
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [hidden, setHidden] = useState(false);
  const paused = hover || focus || hidden;
  const slide = slides[index];
  const reduce = useReducedMotion();

  // Al bajar, la foto se mueve más lento que la página (profundidad) y el texto se desvanece.
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "22%"]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % slides.length), DURATION);
    return () => clearTimeout(id);
  }, [index, paused, slides.length]);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const go = (step: number) => setIndex((i) => (i + step + slides.length) % slides.length);

  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    const { x, y } = info.offset;
    if (Math.abs(x) < 50 || Math.abs(x) < Math.abs(y)) return;
    go(x < 0 ? 1 : -1);
  };

  return (
    <motion.section
      ref={ref}
      id="inicio"
      className="relative isolate touch-pan-y overflow-hidden"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocus(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onPanEnd={onPanEnd}
      aria-roledescription="carrusel"
      aria-label="Destacados"
    >
      {/* Fondo: tono + imagen a todo el ancho, cambia con cada diapositiva */}
      <motion.div className="absolute inset-x-0 -top-[2%] -z-10 h-[115%]" style={{ y: bgY }}>
        <AnimatePresence initial={false}>
          {slide && (
            <motion.div
              key={slide.id + "-bg"}
              className="absolute inset-0"
              style={{ background: `radial-gradient(circle at 70% 45%, ${slide.tint} 0%, #0f1b38 55%, #0b1324 100%)` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
            >
              {/* Sin foto: el logo grande y tenue a la derecha */}
              <span className="absolute top-1/2 right-[6%] hidden -translate-y-1/2 opacity-25 md:block">
                <LogoMark className="h-[clamp(240px,26vw,460px)] w-[clamp(240px,26vw,460px)]" sizes="460px" />
              </span>
              {/* Con foto: cubre el fondo; un acercamiento lento le da vida */}
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1.08 }}
                animate={{ scale: 1 }}
                transition={{ duration: DURATION / 1000 + 1.2, ease: "linear" }}
              >
                <SmartImage
                  src={slide.imageUrl}
                  eager={index === 0}
                  sizes="100vw"
                  className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Lectura. Escritorio: oscuro a la izquierda donde va el texto. Celular: oscuro abajo, donde baja el texto. */}
      <span className="absolute inset-0 -z-10 hidden bg-[linear-gradient(90deg,rgba(11,19,36,0.97)_0%,rgba(11,19,36,0.9)_30%,rgba(11,19,36,0.55)_55%,rgba(11,19,36,0.1)_85%)] md:block" />
      <span className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(11,19,36,0.98)_0%,rgba(11,19,36,0.88)_38%,rgba(11,19,36,0.35)_70%,rgba(11,19,36,0.15)_100%)] md:hidden" />
      <span className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-noche-900 to-transparent" />

      {/* Firma: las tres estelas de los ángeles cruzan la portada en cada diapositiva */}
      <EstelasVuelo replayKey={slide?.id} />

      <motion.div
        className="contenedor relative flex min-h-[clamp(500px,78svh,640px)] items-end md:min-h-[clamp(440px,64vh,760px)] md:items-center"
        style={{ y: textY, opacity: textOpacity }}
      >
        <AnimatePresence mode="wait">
          {slide && (
            <motion.div
              key={slide.id}
              className="flex max-w-[640px] flex-col gap-4 pt-14 pb-6 md:py-14"
              initial="hidden"
              animate="show"
              exit="exit"
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${index + 1} de ${slides.length}`}
              variants={{ show: { transition: { staggerChildren: 0.09 } }, exit: { opacity: 0, x: -30, transition: { duration: 0.3 } } }}
            >
              <motion.span className="eyebrow" variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}>
                {slide.eyebrow}
              </motion.span>
              <TituloPorPalabras text={slide.title} />
              {[
                <p key="s" className="max-w-lg text-[clamp(16px,1.15vw,21px)] text-niebla-100">{slide.subtitle}</p>,
                <Cta key="c" slide={slide} />,
              ].map((el, i) => (
                <motion.div
                  key={i}
                  className="flex flex-col"
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease, delay: 0.25 } } }}
                >
                  {el}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Puntos con barra de progreso. El botón mide 44 px de alto para el dedo, aunque el punto se vea chico. */}
      <div className="contenedor relative flex pb-3">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            className="group grid h-11 min-w-9 place-items-center px-1.5 first:-ml-1.5"
            aria-label={`Ir a: ${s.title}`}
            aria-current={i === index}
          >
            <span
              className={`relative block h-1.5 overflow-hidden rounded-full bg-white/30 transition-[width,background-color] duration-300 ${i === index ? "w-10" : "w-1.5 group-hover:bg-white/60"}`}
            >
              {i === index && (
                <motion.span
                  key={index + String(paused)}
                  className="absolute inset-0 origin-left bg-oro-500"
                  initial={{ scaleX: paused ? 1 : 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: paused ? 0 : DURATION / 1000, ease: "linear" }}
                />
              )}
            </span>
          </button>
        ))}
      </div>
    </motion.section>
  );
}
