export interface OsmSelector {
  [key: string]: string;
}

export interface Niche {
  id: string;
  label: string;
  emoji: string;
  selectors: OsmSelector[];
}

export const NICHES: Niche[] = [
  { id: "restaurantes", label: "Restaurantes", emoji: "🍽️", selectors: [{ amenity: "restaurant" }] },
  {
    id: "pizzarias",
    label: "Pizzarias",
    emoji: "🍕",
    selectors: [
      { amenity: "restaurant", cuisine: "pizza" },
      { amenity: "fast_food", cuisine: "pizza" },
    ],
  },
  {
    id: "lanchonetes",
    label: "Lanchonetes / Hamburgueria",
    emoji: "🍔",
    selectors: [
      { amenity: "fast_food" },
      { amenity: "restaurant", cuisine: "burger" },
      { amenity: "restaurant", cuisine: "sandwich" },
    ],
  },
  {
    id: "cafes",
    label: "Cafés / Cafeterias",
    emoji: "☕",
    selectors: [{ amenity: "cafe" }, { shop: "coffee" }],
  },
  {
    id: "padarias",
    label: "Padarias / Confeitaria",
    emoji: "🥖",
    selectors: [{ shop: "bakery" }, { shop: "pastry" }, { shop: "confectionery" }],
  },
  {
    id: "bares",
    label: "Bares / Botecos",
    emoji: "🍺",
    selectors: [{ amenity: "bar" }, { amenity: "pub" }, { amenity: "biergarten" }],
  },
  {
    id: "saloes",
    label: "Salões de beleza",
    emoji: "💇",
    selectors: [{ shop: "hairdresser" }, { shop: "beauty" }],
  },
  {
    id: "barbearias",
    label: "Barbearias",
    emoji: "💈",
    selectors: [{ shop: "hairdresser" }, { shop: "barber" }],
  },
  {
    id: "estetica",
    label: "Estética / Spa",
    emoji: "💅",
    selectors: [{ shop: "beauty" }, { leisure: "spa" }, { shop: "massage" }],
  },
  {
    id: "petshops",
    label: "Pet shops",
    emoji: "🐾",
    selectors: [{ shop: "pet" }, { shop: "pet_grooming" }],
  },
  {
    id: "veterinarias",
    label: "Clínicas veterinárias",
    emoji: "🐶",
    selectors: [{ amenity: "veterinary" }],
  },
  {
    id: "academias",
    label: "Academias",
    emoji: "🏋️",
    selectors: [{ leisure: "fitness_centre" }, { amenity: "gym" }],
  },
  {
    id: "oficinas",
    label: "Oficinas mecânicas",
    emoji: "🔧",
    selectors: [{ shop: "car_repair" }, { shop: "tyres" }],
  },
  {
    id: "lavarapido",
    label: "Lava-rápido / Estética automotiva",
    emoji: "🚗",
    selectors: [{ amenity: "car_wash" }, { shop: "car_wash" }],
  },
  {
    id: "autopecas",
    label: "Autopeças",
    emoji: "⚙️",
    selectors: [{ shop: "car_parts" }],
  },
  {
    id: "roupas",
    label: "Lojas de roupas / Moda",
    emoji: "👕",
    selectors: [{ shop: "clothes" }, { shop: "boutique" }, { shop: "fashion" }],
  },
  {
    id: "calcados",
    label: "Lojas de calçados",
    emoji: "👟",
    selectors: [{ shop: "shoes" }],
  },
  {
    id: "mercados",
    label: "Mercados / Mercearias",
    emoji: "🛒",
    selectors: [{ shop: "supermarket" }, { shop: "convenience" }, { shop: "grocery" }],
  },
  {
    id: "moveis",
    label: "Lojas de móveis / Decoração",
    emoji: "🛋️",
    selectors: [{ shop: "furniture" }, { shop: "interior_decoration" }, { shop: "houseware" }],
  },
  {
    id: "materiais",
    label: "Materiais de construção",
    emoji: "🧱",
    selectors: [{ shop: "doityourself" }, { shop: "hardware" }, { shop: "trade" }],
  },
  {
    id: "floriculturas",
    label: "Floriculturas",
    emoji: "🌷",
    selectors: [{ shop: "florist" }, { shop: "garden_centre" }],
  },
  {
    id: "oticas",
    label: "Óticas",
    emoji: "👓",
    selectors: [{ shop: "optician" }],
  },
  {
    id: "joalherias",
    label: "Joalherias",
    emoji: "💍",
    selectors: [{ shop: "jewelry" }, { shop: "watches" }],
  },
  {
    id: "presentes",
    label: "Lojas de presentes",
    emoji: "🎁",
    selectors: [{ shop: "gift" }, { shop: "variety_store" }],
  },
  {
    id: "papelarias",
    label: "Papelarias",
    emoji: "✏️",
    selectors: [{ shop: "stationery" }, { shop: "copyshop" }],
  },
  {
    id: "livrarias",
    label: "Livrarias",
    emoji: "📚",
    selectors: [{ shop: "books" }, { shop: "newsagent" }],
  },
  {
    id: "clinicas",
    label: "Clínicas médicas",
    emoji: "🩺",
    selectors: [
      { amenity: "clinic" },
      { healthcare: "clinic" },
      { healthcare: "doctor" },
      { amenity: "doctors" },
    ],
  },
  {
    id: "dentistas",
    label: "Dentistas",
    emoji: "🦷",
    selectors: [{ amenity: "dentist" }, { healthcare: "dentist" }],
  },
  {
    id: "farmacias",
    label: "Farmácias",
    emoji: "💊",
    selectors: [{ amenity: "pharmacy" }, { healthcare: "pharmacy" }],
  },
  {
    id: "advogados",
    label: "Advogados / Escritórios jurídicos",
    emoji: "⚖️",
    selectors: [{ office: "lawyer" }, { office: "notary" }],
  },
  {
    id: "contadores",
    label: "Contadores / Contabilidade",
    emoji: "📊",
    selectors: [{ office: "accountant" }, { office: "tax_advisor" }],
  },
  {
    id: "imobiliarias",
    label: "Imobiliárias",
    emoji: "🏠",
    selectors: [{ office: "estate_agent" }],
  },
  {
    id: "agencias",
    label: "Agências / Marketing / Design",
    emoji: "🎨",
    selectors: [
      { office: "advertising_agency" },
      { office: "graphic_design" },
      { office: "it" },
      { office: "consulting" },
    ],
  },
  {
    id: "escolas",
    label: "Escolas / Cursos / Idiomas",
    emoji: "🎓",
    selectors: [
      { amenity: "language_school" },
      { amenity: "driving_school" },
      { amenity: "music_school" },
      { amenity: "prep_school" },
    ],
  },
  {
    id: "pousadas",
    label: "Pousadas / Hotéis",
    emoji: "🏨",
    selectors: [{ tourism: "hotel" }, { tourism: "guest_house" }, { tourism: "motel" }],
  },
  {
    id: "fotografos",
    label: "Fotógrafos",
    emoji: "📷",
    selectors: [{ craft: "photographer" }, { shop: "photo" }],
  },
  {
    id: "costura",
    label: "Costura / Confecção / Ateliê",
    emoji: "🧵",
    selectors: [{ craft: "tailor" }, { craft: "dressmaker" }, { shop: "tailor" }],
  },
];

export function getNiche(id: string): Niche | undefined {
  return NICHES.find((n) => n.id === id);
}
