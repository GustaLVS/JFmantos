const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatPrice(value) {
  return BRL.format(value);
}

export function slug(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getStored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export function randomPalette(seed) {
  const palettes = [
    ["#111111", "#ffffff", "#e43d30"],
    ["#0d7c3f", "#ffffff", "#f3c44f"],
    ["#174fd7", "#ffffff", "#101114"],
    ["#8d1538", "#f6d36f", "#243b8f"],
    ["#75b9e7", "#ffffff", "#101114"],
  ];
  const index = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}

export function readImageFile(file) {
  return new Promise((resolve) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

export async function readImageFiles(files) {
  const list = Array.from(files || []);
  const images = await Promise.all(list.map((file) => readImageFile(file)));
  return images.filter(Boolean);
}
