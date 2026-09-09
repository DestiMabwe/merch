import { afterEach, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

import { CartProvider } from "@/lib/cart-context";
import CheckoutPage from "./page";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test("the contact form is present even when the cart is empty", () => {
  render(
    <CartProvider>
      <CheckoutPage />
    </CartProvider>,
  );

  expect(screen.getByLabelText(/name/i)).toBeDefined();
});

test("Place Order stays disabled when the cart is empty", () => {
  render(
    <CartProvider>
      <CheckoutPage />
    </CartProvider>,
  );

  const button = screen.getByRole("button", { name: /place order/i }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
});

test("Place Order is enabled once the cart has items", async () => {
  localStorage.setItem(
    "camp-merch-cart",
    JSON.stringify([
      {
        productId: 1,
        productName: "Camp Tee",
        variantId: 1,
        size: "M",
        color: null,
        price: 360,
        stock: 10,
        quantity: 1,
      },
    ]),
  );

  render(
    <CartProvider>
      <CheckoutPage />
    </CartProvider>,
  );

  const button = (await screen.findByRole("button", {
    name: /place order/i,
  })) as HTMLButtonElement;
  expect(button.disabled).toBe(false);
});
