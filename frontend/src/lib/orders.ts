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
  created_at: string;
  items: OrderLineItem[];
  total: number;
};

export class CheckoutError extends Error {}

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
    const body = await res.json().catch(() => null);
    const detail = body?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail) && detail[0]?.msg
          ? detail[0].msg
          : "Checkout failed. Please try again.";
    throw new CheckoutError(message);
  }

  return (await res.json()) as Order;
}
