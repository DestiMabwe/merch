import { getToken } from "./adminAuth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/**
 * Visual weight for a status badge — never the accent color (DESIGN.md's
 * One-Accent Rule reserves magenta for money and the primary action), so
 * distinction comes from fill/weight/opacity instead. Pass the result to
 * `styles[`badge${variant}`]` against admin.module.css's badge classes.
 */
export function statusBadgeVariant(
  status: string,
): "Filled" | "Neutral" | "Quiet" | "Dead" | "Outlined" {
  switch (status) {
    case "paid":
      return "Neutral";
    case "ready_for_collection":
      return "Filled";
    case "collected":
      return "Quiet";
    case "cancelled":
      return "Dead";
    default:
      return "Outlined";
  }
}

export type AdminOrderLineItem = {
  id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  variant_size: string | null;
  variant_color: string | null;
  unit_price: number;
  quantity: number;
  recipient_name: string | null;
};

export type ProductionLineItem = AdminOrderLineItem & {
  order_reference: string;
  customer_name: string;
  order_status: string;
  order_proof_of_payment_url: string | null;
  created_at: string;
};

export type AdminOrderSummary = {
  reference: string;
  customer_name: string;
  status: string;
  proof_of_payment_url: string | null;
  created_at: string;
  total: number;
};

export type AdminOrderDetail = AdminOrderSummary & {
  customer_email: string | null;
  customer_phone: string | null;
  items: AdminOrderLineItem[];
};

export class AdminOrdersError extends Error {}

async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...(options.headers ?? {}), Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = typeof body?.detail === "string" ? body.detail : `Request failed: ${res.status}`;
    throw new AdminOrdersError(detail);
  }

  return res;
}

async function adminFetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await adminFetch(path, options);
  return (await res.json()) as T;
}

export function listAdminOrders(filters: {
  status?: string;
  sort?: "oldest" | "newest";
}): Promise<AdminOrderSummary[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status_filter", filters.status);
  if (filters.sort) params.set("sort", filters.sort);
  const query = params.toString();
  return adminFetchJson<AdminOrderSummary[]>(`/admin/orders${query ? `?${query}` : ""}`);
}

export function getAdminOrder(reference: string): Promise<AdminOrderDetail> {
  return adminFetchJson<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(reference)}`);
}

export function listOrderItems(filters: {
  productId?: number;
  status?: string;
  sort?: "oldest" | "newest";
}): Promise<ProductionLineItem[]> {
  const params = new URLSearchParams();
  if (filters.productId) params.set("product_id", String(filters.productId));
  if (filters.status) params.set("status_filter", filters.status);
  if (filters.sort) params.set("sort", filters.sort);
  const query = params.toString();
  return adminFetchJson<ProductionLineItem[]>(`/admin/orders/items${query ? `?${query}` : ""}`);
}

function postTransition(reference: string, action: string): Promise<AdminOrderDetail> {
  return adminFetchJson<AdminOrderDetail>(
    `/admin/orders/${encodeURIComponent(reference)}/${action}`,
    { method: "POST" },
  );
}

export function markOrderPaid(reference: string): Promise<AdminOrderDetail> {
  return postTransition(reference, "mark-paid");
}

export function markOrderReadyForCollection(reference: string): Promise<AdminOrderDetail> {
  return postTransition(reference, "mark-ready-for-collection");
}

export function markOrderCollected(reference: string): Promise<AdminOrderDetail> {
  return postTransition(reference, "mark-collected");
}

export function cancelOrder(reference: string): Promise<AdminOrderDetail> {
  return postTransition(reference, "cancel");
}

export function uploadAdminProofOfPayment(
  reference: string,
  file: File,
): Promise<AdminOrderDetail> {
  const formData = new FormData();
  formData.append("file", file);
  return adminFetchJson<AdminOrderDetail>(
    `/admin/orders/${encodeURIComponent(reference)}/proof`,
    { method: "POST", body: formData },
  );
}

export function updateLineItem(
  reference: string,
  itemId: number,
  body: { variant_id?: number; quantity?: number; recipient_name?: string },
): Promise<AdminOrderDetail> {
  return adminFetchJson<AdminOrderDetail>(
    `/admin/orders/${encodeURIComponent(reference)}/items/${itemId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export function deleteLineItem(reference: string, itemId: number): Promise<AdminOrderDetail> {
  return adminFetchJson<AdminOrderDetail>(
    `/admin/orders/${encodeURIComponent(reference)}/items/${itemId}`,
    { method: "DELETE" },
  );
}
