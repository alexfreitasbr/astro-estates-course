import type { Block } from "@wp-block-tools/styles";

const COLOR_SLUG_KEYS = [
  "textColor",
  "backgroundColor",
  "borderColor",
  "gradient",
] as const;

function normalizeColorSlug(slug: string): string {
  return slug.toLowerCase();
}

function normalizeVarPreset(value: string): string {
  const colorPrefix = "var:preset|color|";
  const gradientPrefix = "var:preset|gradient|";

  if (value.startsWith(colorPrefix)) {
    return `${colorPrefix}${normalizeColorSlug(value.slice(colorPrefix.length))}`;
  }

  if (value.startsWith(gradientPrefix)) {
    return `${gradientPrefix}${normalizeColorSlug(value.slice(gradientPrefix.length))}`;
  }

  return value;
}

function normalizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return normalizeVarPreset(value);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (value && typeof value === "object") {
    return normalizeObject(value as Record<string, unknown>);
  }

  return value;
}

function normalizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (
      COLOR_SLUG_KEYS.includes(key as (typeof COLOR_SLUG_KEYS)[number]) &&
      typeof value === "string"
    ) {
      result[key] = normalizeColorSlug(value);
      continue;
    }

    result[key] = normalizeValue(value);
  }

  return result;
}

/**
 * Normalizes WordPress color slugs to lowercase so they match cssVariables
 * from the GraphQL API (e.g. "Brast-off" → "brast-off").
 */
export function normalizeBlockColors<T extends Block>(block: T): T {
  return {
    ...block,
    attributes: block.attributes
      ? (normalizeObject(block.attributes as Record<string, unknown>) as T["attributes"])
      : block.attributes,
    globalStyles: block.globalStyles
      ? (normalizeObject(block.globalStyles as Record<string, unknown>) as T["globalStyles"])
      : block.globalStyles,
    innerBlocks: block.innerBlocks?.map(normalizeBlockColors),
  };
}
