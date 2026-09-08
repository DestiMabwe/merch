import { afterEach, expect, mock, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

import Home from "./page";

const PRODUCTS = [
  {
    id: 1,
    name: "Camp Tee",
    description: "Purpose Over Pressure tee",
    photo_url: null,
    variants: [{ id: 1, size: "M", color: null, price: 350, stock: 10 }],
  },
  {
    id: 2,
    name: "Camp Hoodie",
    description: "Warm hoodie",
    photo_url: null,
    variants: [{ id: 2, size: "M", color: null, price: 650, stock: 5 }],
  },
];

function mockBackend() {
  globalThis.fetch = mock(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("/health")) {
      return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    }
    if (url.includes("/products")) {
      return new Response(JSON.stringify(PRODUCTS), { status: 200 });
    }
    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;
}

afterEach(() => {
  cleanup();
  mock.restore();
});

test("renders the backend health status once the fetch resolves (non-production only)", async () => {
  mockBackend();

  render(<Home />);

  expect(await screen.findByText(/backend status: ok/i)).toBeDefined();
});

test("renders a grid of products fetched from the public catalog, each linking to its detail page", async () => {
  mockBackend();

  render(<Home />);

  expect(await screen.findByText("Camp Tee")).toBeDefined();
  expect(screen.getByText("Camp Hoodie")).toBeDefined();
  expect(screen.getByText("R350")).toBeDefined();
  expect(screen.getByText("R650")).toBeDefined();

  const teeLink = screen.getByText("Camp Tee").closest("a");
  expect(teeLink?.getAttribute("href")).toBe("/products/1");
});

test("shows a message when there are no products", async () => {
  globalThis.fetch = mock(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("/health")) {
      return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  }) as unknown as typeof fetch;

  render(<Home />);

  expect(await screen.findByText(/no products available yet/i)).toBeDefined();
});
