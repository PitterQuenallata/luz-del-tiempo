const tz = "America/La_Paz";

export const dayMonth = (iso: string) => {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("es-BO", { day: "2-digit", timeZone: tz }),
    month: d.toLocaleDateString("es-BO", { month: "short", timeZone: tz }).replace(".", ""),
  };
};

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-BO", { day: "numeric", month: "long", year: "numeric", timeZone: tz });

export const whatsappLink = (number: string, text: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
