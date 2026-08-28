export type Category =
  | "Ojos"
  | "Rostro"
  | "Labios"
  | "Bolsos"
  | "Collares"
  | "Accesorios";

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  featured?: boolean;
};

export const categories: Array<"Todos" | Category> = [
  "Todos",
  "Ojos",
  "Rostro",
  "Labios",
  "Bolsos",
  "Collares",
  "Accesorios",
];

function makePlaceholder(label: string, from: string, to: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 675" role="img" aria-label="${label}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${from}" />
          <stop offset="100%" stop-color="${to}" />
        </linearGradient>
      </defs>
      <rect width="900" height="675" rx="48" fill="url(#g)" />
      <circle cx="740" cy="140" r="90" fill="rgba(255,255,255,0.18)" />
      <circle cx="160" cy="545" r="130" fill="rgba(255,255,255,0.12)" />
      <text x="50%" y="46%" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="#ffffff">
        Magenta
      </text>
      <text x="50%" y="56%" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="#fff5fb">
        ${label}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const initialProducts: Product[] = [
  {
    id: 1,
    name: "Paleta Sunset Glow",
    description: "Sombras cálidas con brillo satinado y acabado profesional.",
    price: 28900,
    category: "Ojos",
    image: makePlaceholder("Paleta Sunset Glow", "#ffb2d4", "#d41478"),
    featured: true,
  },
  {
    id: 2,
    name: "Base Silk Finish",
    description: "Cobertura ligera a media, ideal para un rostro uniforme.",
    price: 34200,
    category: "Rostro",
    image: makePlaceholder("Base Silk Finish", "#ffd2e7", "#b20b5f"),
    featured: true,
  },
  {
    id: 3,
    name: "Gloss Berry Kiss",
    description: "Gloss hidratante con tono berry y brillo espejo.",
    price: 15800,
    category: "Labios",
    image: makePlaceholder("Gloss Berry Kiss", "#f59ac5", "#8f2457"),
  },
  {
    id: 4,
    name: "Bolso Aura Mini",
    description: "Bolso compacto con acabado suave y diseño elegante.",
    price: 49900,
    category: "Bolsos",
    image: makePlaceholder("Bolso Aura Mini", "#ffcfe2", "#d41478"),
  },
  {
    id: 5,
    name: "Collar Rose Line",
    description: "Cadena delicada con brillo sutil para looks diarios o noche.",
    price: 21200,
    category: "Collares",
    image: makePlaceholder("Collar Rose Line", "#ffd8ea", "#a20d58"),
  },
  {
    id: 6,
    name: "Set Pink Detail",
    description: "Mini accesorios para complementar maquillaje y outfit.",
    price: 11900,
    category: "Accesorios",
    image: makePlaceholder("Set Pink Detail", "#f7b7d3", "#d41478"),
  },
];