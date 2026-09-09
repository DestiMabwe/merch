import type { CartItem } from "./cart";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type OrderLineItem = {
  product_name: string;
  variant_size: string | null;
  variant_color: string | null;
  unit_price: number;
  quantity: number;
};

export type Order = {
  reference: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  status: string;
  proof_of_payment_url: string | null;
  created_at: string;
  items: OrderLineItem[];
  total: number;
};

export class CheckoutError extends Error {}
export class OrderLookupError extends Error {}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending Payment",
  paid: "Paid",
  ready_for_collection: "Ready for Collection",
  collected: "Collected",
  cancelled: "Cancelled",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  const detail = body?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg as string;
  return fallback;
}

export async function submitCheckout(
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  cartItems: CartItem[],
): Promise<Order> {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: customerName,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      items: cartItems.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })),
    }),
  });

  if (!res.ok) {
    throw new CheckoutError(await extractErrorMessage(res, "Checkout failed. Please try again."));
  }

  return (await res.json()) as Order;
}

export async function lookupOrder(reference: string, name: string): Promise<Order> {
  const params = new URLSearchParams({ reference: reference.trim(), name: name.trim() });

  const res = await fetch(`${API_BASE_URL}/orders/lookup?${params.toString()}`);
  if (!res.ok) {
    throw new OrderLookupError(
      res.status === 404
        ? "No order found for that order number and name."
        : await extractErrorMessage(res, "Couldn't look up that order."),
    );
  }
  return (await res.json()) as Order;
}

export async function uploadProofOfPayment(
  reference: string,
  name: string,
  file: File,
): Promise<Order> {
  const formData = new FormData();
  formData.append("name", name.trim());
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(reference)}/proof`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new OrderLookupError(
      await extractErrorMessage(res, "Couldn't upload your proof of payment."),
    );
  }
  return (await res.json()) as Order;
}
