import { Link } from "react-router";
import { LogoMark } from "../components/layout/Logo";

/** Página provisional para las secciones que aún no se construyen. */
export default function ComingSoon({ title }: { title: string }) {
  return (
    <section className="grid min-h-[70vh] place-items-center px-4 py-20 text-center">
      <title>{`${title} · La Luz del Tiempo`}</title>
      <div className="flex flex-col items-center">
        <LogoMark className="h-28 w-28" />
        <h1 className="mt-6 text-4xl titulo">{title}</h1>
        <p className="mt-2 text-niebla-300">Estamos preparando esta sección.</p>
        <Link to="/" className="btn-oro mt-6">Volver al inicio</Link>
      </div>
    </section>
  );
}
