export function parsePositiveInt(input: string | null, fallback: number, min = 1, max = 100) {
  if (input === null || input.trim() === "") return fallback;
  const value = Number(input);
  if (!Number.isFinite(value)) return fallback;
  const normalized = Math.floor(value);
  if (normalized < min) return min;
  if (normalized > max) return max;
  return normalized;
}

export function parsePagination(searchParams: URLSearchParams, defaults?: { page?: number; pageSize?: number }) {
  const page = parsePositiveInt(searchParams.get("page"), defaults?.page ?? 1, 1, 100000);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), defaults?.pageSize ?? 20, 1, 100);
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

