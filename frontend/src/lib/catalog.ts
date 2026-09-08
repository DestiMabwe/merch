import { getToken } from "./adminAuth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type Variant = {
  id: number;
  size: string | null;
  color: string | null;
  price: number;
  stock: number;
  active: boolean;
};

export type Product = {
  id: number;
  name: string;
  description: string | null;
  photo_url: string | null;
  active: boolean;
  variants: Variant[];
};

export type VariantInput = {
  size: string | null;
  color: string | null;
  price: number;
  stock: number;
};

export class CatalogError extends Error {}

async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new CatalogError(`Request failed: ${res.status}`);
  }

  return res;
}

async function adminFetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await adminFetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  return (await res.json()) as T;
}

export function listProducts(): Promise<Product[]> {
  return adminFetchJson<Product[]>("/admin/products");
}

export function getProduct(id: number): Promise<Product> {
  return adminFetchJson<Product>(`/admin/products/${id}`);
}

export function createProduct(body: {
  name: string;
  description: string | null;
  variants: VariantInput[];
}): Promise<Product> {
  return adminFetchJson<Product>("/admin/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateProduct(
  id: number,
  body: Partial<{ name: string; description: string | null; active: boolean }>,
): Promise<Product> {
  return adminFetchJson<Product>(`/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function uploadProductPhoto(id: number, file: File): Promise<Product> {
  const formData = new FormData();
  formData.append("photo", file);
  const res = await adminFetch(`/admin/products/${id}/photo`, {
    method: "POST",
    body: formData,
  });
  return (await res.json()) as Product;
}

export function createVariant(productId: number, body: VariantInput): Promise<Product> {
  return adminFetchJson<Product>(`/admin/products/${productId}/variants`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateVariant(
  productId: number,
  variantId: number,
  body: Partial<VariantInput & { active: boolean }>,
): Promise<Product> {
  return adminFetchJson<Product>(`/admin/products/${productId}/variants/${variantId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
