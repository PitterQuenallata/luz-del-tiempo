import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useSlides } from "../../api";
import type { HeroSlide } from "../../api/types";
import { LogoMark } from "../layout/Logo";
import { EstelasVuelo } from "../ui/Estelas";
import { SmartImage } from "../ui/SmartImage";

const DURATION = 7000;
const ease = [0.22, 1, 0.36, 1] as const;

function Cta({ slide }: { slide: HeroSlide }) {
  const cls = "btn-oro self-start text-sm";
  return slide.cta.to.startsWith("#") ? (
    <a href={slide.cta.to} className={cls}>{slide.cta.label}</a>
  ) : (
    <Link to={slide.cta.to} className={cls}>{slide.cta.label}</Link>
  );
}

/**
 * Portada tipo carrusel, como los sliders de SUMtv: la imagen ocupa todo el
 * ancho (con más peso a la derecha) y el texto va a la izquierda sobre la
 * parte oscura. Sin imagen se ve el degradado del tono de la diapositiva y el logo.
 * Las imágenes ideales son 16:9 con el sujeto a la derecha (ver docs/PROMPTS-IMAGENES-GEMINI.md).
 */
export function HeroCarousel() {
  const { data: slides = [] } = useSlides();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[index];

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % slides.length), DURATION);
    return () => clearTimeout(id);
  }, [index, paused, slides.length]);

  return (
    <section
      id="inicio"
      className="relative isolate overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrusel"
    >
      {/* Fondo: tono + imagen a todo el ancho, cambia con cada diapositiva */}
      <AnimatePresence initial={false}>
        {slide && (
          <motion.div
            key={slide.id + "-bg"}
            className="absolute inset-0 -z-10"
            style={{ background: `radial-gradient(circle at 70% 45%, ${slide.tint} 0%, #0f1b38 55%, #0b1324 100%)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            {/* Sin foto: el logo grande y tenue a la derecha */}
            <span className="absolute top-1/2 right-[6%] hidden -translate-y-1/2 opacity-25 md:block">
              <LogoMark className="h-[clamp(240px,26vw,460px)] w-[clamp(240px,26vw,460px)]" />
            </span>
            {/* Con foto: cubre el fondo; un acercamiento lento le da vida */}
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: DURATION / 1000 + 1.2, ease: "linear" }}
            >
              <SmartImage src={slide.imageUrl} eager className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lectura: oscuro a la izquierda donde va el texto, y abajo para unir con la página */}
      <span className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(11,19,36,0.97)_0%,rgba(11,19,36,0.9)_30%,rgba(11,19,36,0.55)_55%,rgba(11,19,36,0.1)_85%)]" />
      <span className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-noche-900 to-transparent" />

      {/* Firma: las tres estelas de los ángeles cruzan la portada en cada diapositiva */}
      <EstelasVuelo replayKey={slide?.id} />

      <div className="contenedor relative flex min-h-[clamp(440px,64vh,760px)] items-center">
        <AnimatePresence mode="wait">
          {slide && (
            <motion.div
              key={slide.id}
              className="flex max-w-[640px] flex-col gap-4 py-14"
              initial="hidden"
              animate="show"
              exit="exit"
              variants={{ show: { transition: { staggerChildren: 0.09 } }, exit: { opacity: 0, x: -30, transition: { duration: 0.3 } } }}
            >
              {[
                <span key="e" className="eyebrow">{slide.eyebrow}</span>,
                <h1 key="t" className="titulo text-[clamp(40px,4.6vw,84px)] leading-[1.02]">{slide.title}</h1>,
                <p key="s" className="max-w-lg text-[clamp(17px,1.15vw,21px)] text-niebla-100">{slide.subtitle}</p>,
                <Cta key="c" slide={slide} />,
              ].map((el, i) => (
                <motion.div
                  key={i}
                  className="flex flex-col"
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}
                >
                  {el}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Puntos con barra de progreso */}
      <div className="contenedor relative flex gap-2 pb-5">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            className="group grid h-6 place-items-center"
            aria-label={`Ir a: ${s.title}`}
            aria-current={i === index}
          >
            <span className={`relative block h-1.5 overflow-hidden rounded-full bg-white/30 transition-colors ${i === index ? "w-10" : "w-1.5 group-hover:bg-white/60"}`}>
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
    </section>
  );
}
