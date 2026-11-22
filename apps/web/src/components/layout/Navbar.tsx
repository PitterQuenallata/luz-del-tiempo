import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Logo } from "./Logo";

export const NAV = [
  { to: "/radio", label: "En vivo" },
  { to: "/programacion", label: "Programación" },
  { to: "/areas", label: "Áreas" },
  { to: "/actividades", label: "Actividades" },
  { to: "/videos", label: "Videos" },
  { to: "/noticias", label: "Noticias" },
  { to: "/nosotros", label: "Quiénes somos" },
];

export function Navbar() {
  const { pathname } = useLocation();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  // Se esconde al bajar (más pantalla para leer, sobre todo en celular) y vuelve apenas se sube un poco.
  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 12);
    const prev = scrollY.getPrevious() ?? 0;
    if (y < 120 || y < prev - 4) setHidden(false);
    else if (y > prev + 6) setHidden(true);
  });
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        scrolled || open ? "border-white/10 bg-noche-900/85 backdrop-blur-lg" : "border-white/[0.06] bg-noche-900"
      } ${hidden && !open ? "-translate-y-full" : "translate-y-0"}`}
    >
      <nav className={`contenedor flex items-center justify-between gap-4 transition-[padding] duration-300 ${scrolled ? "py-1.5" : "py-2.5"}`}>
        <Link to="/" aria-label="La Luz del Tiempo, inicio">
          <Logo />
        </Link>

        <ul className="hidden items-center xl:flex">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `relative block px-3 py-3 text-[13px] font-medium transition-colors ${
                    isActive ? "text-white" : "text-niebla-300 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded bg-oro-500" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            to="/donar"
            className="hidden min-h-11 items-center rounded-md bg-noche-700 px-4 text-[13px] font-bold text-white transition hover:bg-noche-600 sm:inline-flex"
          >
            Donar
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="grid h-11 w-11 place-items-center rounded-md text-white hover:bg-white/10 xl:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            className="overflow-hidden border-t border-white/10 xl:hidden"
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.ul
              className="contenedor space-y-1 py-4"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            >
              {[...NAV, { to: "/donar", label: "Donar" }].map((item) => (
                <motion.li key={item.to} variants={{ hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0 } }}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `block rounded-md px-4 py-3 font-semibold ${isActive ? "bg-oro-500/15 text-oro-400" : "text-niebla-100 hover:bg-white/5"}`
                    }
                  >
                    {item.label}
                  </NavLink>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
