export const categories = ["New Arrivals", "Unisex", "Winter", "Summer", "Gymwear"] as const;

export type CategoryName = (typeof categories)[number];

export function toCategorySlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCategoryFromSlug(slug: string): CategoryName | undefined {
  return categories.find((category) => toCategorySlug(category) === slug);
}

export function getCategoryHref(category: string) {
  return `/category/${toCategorySlug(category)}`;
}
