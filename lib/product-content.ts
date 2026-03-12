import type { Product } from "@/lib/types";

export type ProductDetailContent = {
  fabric: string;
  printType: string;
  images: string[];
  sizePrices: Record<string, number>;
};

const presetContent: Record<string, Omit<ProductDetailContent, "sizePrices"> & { deltas?: Record<string, number> }> = {
  "heavyweight boxy tee": {
    fabric: "300GSM Premium Cotton",
    printType: "High-Density Puff + Screen Mix",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
      "https://images.unsplash.com/photo-1527719327859-c6ce80353573",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27",
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820",
    ],
    deltas: { XS: -2, S: 0, M: 3, L: 6, XL: 9 },
  },
  "technical cargo pants": {
    fabric: "Water-Resistant Nylon Blend",
    printType: "Matte Transfer Logo",
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1",
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a",
      "https://images.unsplash.com/photo-1506629905607-d9f9a7d8b1d4",
      "https://images.unsplash.com/photo-1495385794356-15371f348c31",
      "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7",
    ],
    deltas: { S: -6, M: 0, L: 8, XL: 12, XXL: 18 },
  },
  "performance stringer": {
    fabric: "Breathable Mesh Poly-Cotton",
    printType: "Silicone Heat-Pressed Branding",
    images: [
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e",
      "https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
      "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
    ],
    deltas: { XS: -3, S: 0, M: 2, L: 5, XL: 7 },
  },
};

function getFallbackImages(primaryImage: string | null) {
  const base = primaryImage || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab";
  return [
    base,
    "https://images.unsplash.com/photo-1483985988355-763728e1935b",
    "https://images.unsplash.com/photo-1516762689617-e1cffcef479d",
    "https://images.unsplash.com/photo-1543087903-1ac2ec7aa8ef",
    "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2",
  ];
}

function uniqueImages(...lists: string[][]) {
  const unique: string[] = [];
  for (const list of lists) {
    for (const image of list) {
      if (image && !unique.includes(image)) unique.push(image);
    }
  }
  return unique;
}

function getImagesFromProduct(product: Product) {
  return [
    product.image_url_1,
    product.image_url_2,
    product.image_url_3,
    product.image_url_4,
    product.image_url_5,
    product.image_url,
  ].filter((value): value is string => Boolean(value));
}

function getSizePricesFromProduct(product: Product) {
  const sizePairs: Array<[string, number | string | null | undefined]> = [
    ["XS", product.size_xs_price],
    ["S", product.size_s_price],
    ["M", product.size_m_price],
    ["L", product.size_l_price],
    ["XL", product.size_xl_price],
    ["XXL", product.size_xxl_price],
  ];

  const parsedPairs = sizePairs
    .map(([size, value]) => [size, Number(value)] as const)
    .filter(([, value]) => Number.isFinite(value) && value > 0)
    .map(([size, value]) => [size, Number(value.toFixed(2))] as const);

  return Object.fromEntries(parsedPairs);
}

export function getProductDetailContent(product: Product): ProductDetailContent {
  const key = product.name.trim().toLowerCase();
  const preset = presetContent[key];
  const basePrice = Number(product.price) || 0;

  const sizePricesFromDb = getSizePricesFromProduct(product);
  const deltas = preset?.deltas ?? { S: -4, M: 0, L: 4, XL: 8, XXL: 12 };
  const fallbackSizePrices = Object.fromEntries(
    Object.entries(deltas).map(([size, delta]) => [size, Math.max(1, Number((basePrice + delta).toFixed(2)))]),
  );

  const images = uniqueImages(
    getImagesFromProduct(product),
    preset?.images ?? [],
    getFallbackImages(product.image_url),
  ).slice(0, 5);

  return {
    fabric: product.fabric || preset?.fabric || "Premium Technical Blend",
    printType: product.print_type || preset?.printType || "Hybrid Screen + Transfer",
    images,
    sizePrices: Object.keys(sizePricesFromDb).length > 0 ? sizePricesFromDb : fallbackSizePrices,
  };
}
