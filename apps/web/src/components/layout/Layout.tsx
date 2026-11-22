import { AnimatePresence, motion } from "motion/react";
import { Suspense, useEffect, useState } from "react";
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

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <>
      <AmbientLight />
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
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
