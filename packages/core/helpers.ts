export function normalizeName(value: string | undefined | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s@._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeEmail(value: string | undefined | null) {
  return (value ?? "").trim().toLowerCase();
}

export function getEmailDomain(value: string | undefined | null) {
  const email = normalizeEmail(value);
  const atIndex = email.lastIndexOf("@");

  return atIndex >= 0 ? email.slice(atIndex + 1) : "";
}

export function safeNumber(value: number | undefined | null, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

export function includesNameToken(name: string, candidateName: string) {
  const nameTokens = new Set(normalizeName(name).split(" ").filter(Boolean));
  const candidateTokens = normalizeName(candidateName)
    .split(" ")
    .filter((token) => token.length > 1);

  return candidateTokens.some((token) => nameTokens.has(token));
}

export function nameTokenOverlap(name: string, candidateName: string) {
  const nameTokens = new Set(normalizeName(name).split(" ").filter(Boolean));
  const candidateTokens = normalizeName(candidateName)
    .split(" ")
    .filter((token) => token.length > 1);

  if (candidateTokens.length === 0) {
    return 0;
  }

  const matches = candidateTokens.filter((token) => nameTokens.has(token));

  return matches.length / candidateTokens.length;
}

export function isGenericDeviceName(value: string | undefined | null) {
  const normalized = normalizeName(value);

  if (!normalized) {
    return true;
  }

  const genericPatterns = [
    /^macbook( pro| air)?$/,
    /^iphone$/,
    /^ipad$/,
    /^galaxy$/,
    /^samsung$/,
    /^android$/,
    /^user$/,
    /^guest$/,
    /^unknown$/,
    /^participant$/,
    /^device$/
  ];

  return genericPatterns.some((pattern) => pattern.test(normalized));
}

export function textIncludesAny(text: string, phrases: readonly string[]) {
  const normalized = normalizeName(text);

  return phrases.some((phrase) => normalized.includes(normalizeName(phrase)));
}
