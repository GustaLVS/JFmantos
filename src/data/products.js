export const categories = ["Clubes Brasileiros", "Clubes Europeus", "Selecoes", "Retro", "Lancamentos"];

export function normalizeCategory(value = "") {
  const cleanValue = value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .toLowerCase();

  if (cleanValue === "selecoes" || cleanValue.includes("sele")) return "Selecoes";
  if (cleanValue === "retro" || cleanValue.includes("retr")) return "Retro";
  if (cleanValue === "lancamentos" || cleanValue.includes("lanc")) return "Lancamentos";
  if (cleanValue === "clubes brasileiros") return "Clubes Brasileiros";
  if (cleanValue === "clubes europeus") return "Clubes Europeus";
  return value;
}

export function categoryLabel(value = "") {
  const normalized = normalizeCategory(value);
  if (normalized === "Selecoes") return "Seleções";
  if (normalized === "Retro") return "Retrô";
  if (normalized === "Lancamentos") return "Lançamentos";
  return normalized;
}

export const baseProducts = [
  {
    id: "fla-25-home",
    name: "Camisa Flamengo I",
    team: "Flamengo",
    category: "Clubes Brasileiros",
    season: "2025/26",
    price: 249.9,
    type: "Torcedor",
    audience: "Masculino",
    sizes: ["P", "M", "G", "GG"],
    colors: ["#d7182a", "#111111", "#ffffff"],
    description: "Modelo rubro-negro com tecido leve, gola confortavel e visual inspirado nas noites decisivas do Maracana.",
    featured: true,
  },
  {
    id: "pal-25-home",
    name: "Camisa Palmeiras I",
    team: "Palmeiras",
    category: "Clubes Brasileiros",
    season: "2025/26",
    price: 239.9,
    type: "Torcedor",
    audience: "Masculino",
    sizes: ["P", "M", "G"],
    colors: ["#0b6b3a", "#ffffff", "#d7b85a"],
    description: "Camisa verde classica com acabamento premium e escudo em destaque para o torcedor alviverde.",
    featured: true,
  },
  {
    id: "real-25-home",
    name: "Camisa Real Madrid I",
    team: "Real Madrid",
    category: "Clubes Europeus",
    season: "2025/26",
    price: 319.9,
    type: "Jogador",
    audience: "Masculino",
    sizes: ["M", "G", "GG"],
    colors: ["#f8f8f8", "#d6b55b", "#4b2c7f"],
    description: "Modelo jogador com caimento atletico, tecido respiravel e detalhes dourados de campeao.",
    featured: true,
  },
  {
    id: "barca-25-away",
    name: "Camisa Barcelona II",
    team: "Barcelona",
    category: "Clubes Europeus",
    season: "2025/26",
    price: 299.9,
    type: "Torcedor",
    audience: "Feminino",
    sizes: ["P", "M", "G", "GG"],
    colors: ["#243b8f", "#9b1534", "#f0c24d"],
    description: "Camisa alternativa com combinacao forte de azul e grenat, feita para colecionadores e torcedores.",
    featured: false,
  },
  {
    id: "bra-26-home",
    name: "Camisa Brasil I",
    team: "Brasil",
    category: "Selecoes",
    season: "2026",
    price: 279.9,
    type: "Torcedor",
    audience: "Infantil",
    sizes: ["P", "M", "G", "GG"],
    colors: ["#ffd735", "#166b3a", "#1c4aa8"],
    description: "Amarelinha com detalhes verdes e azuis para vestir a selecao nos grandes jogos.",
    featured: true,
  },
  {
    id: "arg-86-retro",
    name: "Camisa Argentina Retro",
    team: "Argentina",
    category: "Retro",
    season: "1986",
    price: 219.9,
    type: "Retro",
    audience: "Masculino",
    sizes: ["P", "M", "G"],
    colors: ["#75b9e7", "#ffffff", "#111111"],
    description: "Edicao retro em listras celestes, com modelagem casual e memoria de copa.",
    featured: false,
  },
  {
    id: "vasco-retro",
    name: "Camisa Vasco Retro",
    team: "Vasco",
    category: "Retro",
    season: "1998",
    price: 229.9,
    type: "Retro",
    audience: "Masculino",
    sizes: ["M", "G", "GG"],
    colors: ["#111111", "#ffffff", "#d7182a"],
    description: "Faixa diagonal marcante, visual historico e tecido confortavel para uso no dia a dia.",
    featured: false,
  },
  {
    id: "city-release",
    name: "Camisa Manchester City",
    team: "Manchester City",
    category: "Lancamentos",
    season: "2025/26",
    price: 309.9,
    type: "Jogador",
    audience: "Masculino",
    sizes: ["P", "M", "G", "GG"],
    colors: ["#87c9ee", "#ffffff", "#182b49"],
    description: "Lancamento em azul celeste com tecido tecnico e acabamento moderno.",
    featured: true,
  },
];
