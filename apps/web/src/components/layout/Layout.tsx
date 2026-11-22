import { AnimatePresence, motion } from "motion/react";
import { Suspense, useState } from "react";
import { useLocation, useOutlet } from "react-router";
import { AmbientLight } from "./AmbientLight";
import { BackToTop } from "./BackToTop";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { PlayerBar } from "./PlayerBar";

/** Congela la página que sale para que la animación de salida muestre la página vieja, no la nueva. */
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return frozen;
}

/**
 * Cambio de página: un fundido corto y sin desplazamiento (antes subía y bajaba 12 px, se sentía brusco).
 * La vuelta al inicio de la página ocurre cuando la vieja ya se fue, para que no se vea el salto.
 */
export function Layout() {
  const { pathname } = useLocation();

  return (
    <>
      <AmbientLight />
      <Navbar />
      <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo({ top: 0 })}>
        <motion.main
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.28, ease: "easeOut" } }}
          exit={{ opacity: 0, transition: { duration: 0.16, ease: "easeIn" } }}
        >
          <Suspense fallback={<div className="min-h-[70vh]" />}>
            <FrozenOutlet />
          </Suspense>
        </motion.main>
      </AnimatePresence>
      <Footer />
      <PlayerBar />
      <BackToTop />
    </>
  );
}
