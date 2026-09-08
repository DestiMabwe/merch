const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type PublicVariant = {
  id: number;
  size: string | null;
  color: string | null;
  price: number;
  stock: number;
};

export type PublicProduct = {
  id: number;
  name: string;
  description: string | null;
  photo_url: string | null;
  variants: PublicVariant[];
};

export class StorefrontError extends Error {}

export async function listPublicProducts(): Promise<PublicProduct[]> {
  const res = await fetch(`${API_BASE_URL}/products`);
  if (!res.ok) throw new StorefrontError("Couldn't load products.");
  return (await res.json()) as PublicProduct[];
}

export async function getPublicProduct(id: number): Promise<PublicProduct> {
  const res = await fetch(`${API_BASE_URL}/products/${id}`);
  if (!res.ok) throw new StorefrontError("Product not found.");
  return (await res.json()) as PublicProduct;
}

export function priceLabel(variants: PublicVariant[]): string {
  if (variants.length === 0) return "Unavailable";
  const prices = variants.map((v) => v.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `R${min}` : `From R${min}`;
}

export function variantLabel(variant: PublicVariant): string {
  return [variant.size, variant.color].filter(Boolean).join(" / ") || "One size";
}
