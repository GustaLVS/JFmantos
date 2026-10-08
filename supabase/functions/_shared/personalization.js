export const PERSONALIZATION_NAME_LIMIT = 20;

export function normalizePersonalization(value) {
  if (value == null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Personalizacao invalida.");
  }
  if (value.name != null && typeof value.name !== "string") {
    throw new Error("Informe um nome valido para a camisa.");
  }
  if (value.number != null && !["string", "number"].includes(typeof value.number)) {
    throw new Error("Informe um numero de 0 a 99 para a camisa.");
  }

  const rawName = value.name || "";
  if (/[\u0000-\u001f\u007f]/.test(rawName)) {
    throw new Error("Informe um nome valido para a camisa.");
  }
  const name = rawName.trim().replace(/\s+/g, " ").toUpperCase();
  const number = String(value.number ?? "").trim();

  if (name.length > PERSONALIZATION_NAME_LIMIT) {
    throw new Error(`O nome na camisa deve ter ate ${PERSONALIZATION_NAME_LIMIT} caracteres.`);
  }
  if (number && !/^[0-9]{1,2}$/.test(number)) {
    throw new Error("Informe um numero de 0 a 99 para a camisa.");
  }
  return name || number ? { name, number } : null;
}
