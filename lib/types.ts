export type Stage =
  | "novo"
  | "qualificado"
  | "contatado"
  | "negociacao"
  | "fechado"
  | "perdido";

export const STAGES: { id: Stage; label: string; cor: string }[] = [
  { id: "novo", label: "Novo", cor: "#64748b" },
  { id: "qualificado", label: "Qualificado", cor: "#0ea5e9" },
  { id: "contatado", label: "Contatado", cor: "#8b5cf6" },
  { id: "negociacao", label: "Negociação", cor: "#f59e0b" },
  { id: "fechado", label: "Fechado", cor: "#22c55e" },
  { id: "perdido", label: "Perdido", cor: "#ef4444" },
];

export interface Lead {
  id: string;
  osmType: "node" | "way" | "relation";
  osmId: number;
  name: string;
  nicheId?: string;
  nicheLabel?: string;
  category?: string;
  address?: string;
  city?: string;
  lat: number;
  lon: number;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  social?: string;
  hasWebsite: boolean;
  onlySocial: boolean;
  openingHours?: string;
  score: number;
  scoreReasons: string[];
  stage: Stage;
  notes?: string;
  message?: string;
  createdAt: number;
  updatedAt: number;
  contactedAt?: number;
  source: string;
}

export interface SearchInput {
  city: string;
  nicheId: string;
  limit?: number;
  requirePhone?: boolean;
  includeSocial?: boolean;
}

export interface GeocodeResult {
  displayName: string;
  lat: number;
  lon: number;
  areaId?: number;
  boundingbox?: [string, string, string, string];
}

export interface SearchResponse {
  geocode: GeocodeResult;
  total: number;
  results: Lead[];
}
