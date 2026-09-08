import { afterEach, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import ProductDetailPage from "./page";

const PRODUCT = {
  id: 1,
  name: "Camp Tee",
  description: "Purpose Over Pressure tee",
  photo_url: null,
  variants: [
    { id: 1, size: "M", color: null, price: 350, stock: 10 },
    { id: 2, size: "L", color: null, price: 350, stock: 0 },
  ],
};

function mockBackend() {
  globalThis.fetch = mock(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("/health")) {
      return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    }
    if (url.includes("/products/1")) {
      return new Response(JSON.stringify(PRODUCT), { status: 200 });
    }
    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;
}

afterEach(() => {
  cleanup();
  mock.restore();
});

test("a zero-stock variant is disabled and cannot be selected", async () => {
  mockBackend();

  render(<ProductDetailPage params={Promise.resolve({ id: "1" })} />);

  const soldOutButton = (await screen.findByRole("button", { name: "L" })) as HTMLButtonElement;
  expect(soldOutButton.disabled).toBe(true);

  fireEvent.click(soldOutButton);
  expect(soldOutButton.getAttribute("aria-pressed")).toBe("false");
});

test("selecting an in-stock variant shows its price and stock", async () => {
  mockBackend();

  render(<ProductDetailPage params={Promise.resolve({ id: "1" })} />);

  const inStockButton = (await screen.findByRole("button", { name: "M" })) as HTMLButtonElement;
  expect(inStockButton.disabled).toBe(false);

  fireEvent.click(inStockButton);

  expect(inStockButton.getAttribute("aria-pressed")).toBe("true");
  expect(await screen.findByText(/10 in stock/i)).toBeDefined();
});

test("shows a not-found message for a missing product", async () => {
  globalThis.fetch = mock(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("/health")) {
      return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    }
    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;

  render(<ProductDetailPage params={Promise.resolve({ id: "999" })} />);

  expect(await screen.findByText(/product not found/i)).toBeDefined();
});
