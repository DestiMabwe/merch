---
name: Purpose Over Pressure — Camp Merch
description: A festival-lineup-sheet storefront for Forward In Faith's annual camp merch drop.
colors:
  nightfall-violet: "#1b1230"
  playbill-cream: "#fdf6e3"
  ticket-stub-lilac: "#b9aed0"
  headliner-magenta: "#e63997"
typography:
  display:
    fontFamily: "Anton, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 9vw, 6.5rem)"
    fontWeight: 400
    lineHeight: 0.86
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Anton, system-ui, sans-serif"
    fontSize: "clamp(1.4rem, 3.6vw, 2.3rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "0.85rem-1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "0.72rem-0.85rem"
    fontWeight: 700
    letterSpacing: "0.02em-0.03em"
rounded:
  none: "0px"
spacing:
  xs: "0.4rem"
  sm: "0.75rem"
  md: "1.5rem"
  lg: "3rem"
  xl: "6rem"
components:
  button-primary:
    backgroundColor: "{colors.headliner-magenta}"
    textColor: "{colors.nightfall-violet}"
    rounded: "{rounded.none}"
    padding: "0.45rem 0.9rem"
  button-primary-hover:
    backgroundColor: "transparent"
    textColor: "{colors.headliner-magenta}"
  button-primary-disabled:
    backgroundColor: "transparent"
    textColor: "{colors.ticket-stub-lilac}"
  chip-size:
    backgroundColor: "transparent"
    textColor: "{colors.ticket-stub-lilac}"
    rounded: "{rounded.none}"
    padding: "0.4rem 0.65rem"
---

# Design System: Purpose Over Pressure — Camp Merch

## Overview

**Creative North Star: "The Lineup Sheet"**

The storefront reads like a festival billing sheet: one headliner phrase spanning the width in a single heavy condensed face, and everything else — garments, prices, sizes — filed underneath as billing, ranked by type size and line breaks alone. There is no icon or card chrome anywhere on this page; each billing row now carries one product photo (the garment mockup, front and back), placed flat with no frame or shadow, like an image pinned straight to the bulletin rather than boxed in a card. This is a deliberate, evidence-backed departure from the festival-poster tradition's usual electric-lime palette: it carries the church campaign's own confirmed colors (deep violet ground, warm cream ink, one magenta accent) instead of the catalog default, because the palette is product-specific brand evidence, not a free choice.

Adding a photo per product row makes the page longer than the original one-viewport lineup sheet — that's an accepted tradeoff for showing the garment art, not an oversight to "fix" later.

**Key Characteristics:**
- One saturated ground, one ink, one accent — no third neutral color anywhere.
- Every corner is a hard edge. No radius exists in this system.
- No shadows, no gradients, no card chrome — including around product photos, which sit flat with their native background.
- Hierarchy is carried entirely by Anton's size and weight steps, never by containers.

## Imagery

Each billing row carries one product photo: the garment mockup (front and back in a single image), sourced from `frontend/public/products/`. Rendered flat — no border, no radius, no shadow, no crop into a card shape — so the image reads as artwork placed on the page, not merchandise in a frame. Sized as a compact thumbnail (`clamp(6rem, 22vw, 9rem)` wide, `object-fit: contain`) beside the product's name/price/sizes, not as a full-width hero — the type still carries the page's rhythm, the photo is supporting evidence of what the print looks like. Alt text names the product and notes "front and back" rather than describing the artwork in detail, since the design itself (crown, drip lettering, verse) isn't information-bearing beyond what the tagline and verse copy already say in text.

## Colors

A two-tone poster ground with a single accent reserved for prices and calls to action.

### Primary
- **Headliner Magenta** (#e63997): the only accent color in the system. Used exclusively for prices, the "Over" line inside the headline, and the primary button. Never used for body text or decoration.

### Neutral
- **Nightfall Violet** (#1b1230): the page ground. Always dark — this is not a light/dark-mode toggle, it is the world's one committed background.
- **Playbill Cream** (#fdf6e3): primary ink. Headlines, product names, disabled-button borders.
- **Ticket-Stub Lilac** (#b9aed0): secondary ink for supporting text — taglines, verse copy, size chips, footer text, dividers (at reduced opacity).

### Named Rules
**The One-Accent Rule.** Headliner Magenta marks exactly two things: money (prices) and action (the pin-to-cart button). If a new element needs emphasis and isn't one of those two things, it does not get the accent color — it gets a weight or size step instead.

## Typography

**Display Font:** Anton (with system-ui, sans-serif fallback)
**Body Font:** Public Sans (with system-ui, sans-serif fallback)

**Character:** Anton is the only display voice in this system — a single heavy condensed grotesque doing every headline job, from the full-width campaign phrase down to each product's billing name. Public Sans carries everything Anton doesn't: taglines, verse copy, size labels, footer text.

### Hierarchy
- **Display** (400, `clamp(2.75rem, 9vw, 6.5rem)`, line-height 0.86): the campaign headline only. Appears once per page.
- **Headline** (400, `clamp(1.4rem, 3.6vw, 2.3rem)`, line-height 1): each product's billing name in the lineup list.
- **Body** (400, 0.85–1rem, line-height 1.5): tagline, verse copy, payment/collection notice.
- **Label** (700, 0.72–0.85rem, tracked 0.02–0.03em, uppercase): size chips, button text, footer status line.

### Named Rules
**The No-Kicker Rule.** No small label ever sits above a heading as a separate typographic voice. If a line needs introducing, it joins the heading as another row of the same display type, or it doesn't appear at all.

## Layout

Single column, centered, `max-width: 68rem`. Generous top padding (6rem) before the headline gives the page the feel of a sheet posted on a wall rather than a scrolled feed. Below the headline, a `border-top` rule opens the billing block; each product is a full-width row separated by a 1px hairline (14% opacity Playbill Cream), never a card or gutter grid. Spacing is loose above the headline and tight within the billing list — the rhythm favors one dramatic gap over many small ones.

## Elevation & Depth

Flat, by invariant, not by omission. No `box-shadow` exists anywhere in this system. Depth and hierarchy are conveyed entirely through type scale, weight, and the accent color — never through elevation, blur, or layering.

### Named Rules
**The Flat Sheet Rule.** Nothing on this page lifts, floats, or casts a shadow. A poster is printed flat; this page stays flat with it.

## Shapes

Every element is a hard-edged rectangle: buttons, size chips, dividers. No `border-radius` is used anywhere in the system — not on buttons, not on chips, not on any future container. Borders are always 1–2px solid hairlines, never soft or blurred.

## Components

### Buttons
- **Shape:** hard rectangle, no radius.
- **Primary ("Pin to cart"):** solid Headliner Magenta background, Nightfall Violet text, bold uppercase label, `0.45rem 0.9rem` padding.
- **Hover:** inverts to transparent background with Magenta text and border.
- **Disabled (no size chosen yet):** transparent background, dimmed Ticket-Stub Lilac text and border, label reads "Select a size" — the button explains what's missing rather than sitting inert with no cue.
- **Pinned (click to remove):** transparent background, Ticket-Stub Lilac text and border, label reads "Remove {size} from cart" — reads as quietly settled, not as an error, but stays clickable so pinning is always reversible. Hovering shifts to the Magenta accent, since removing is still the button's one action.

### Chips
- **Style (size chip):** 1px Ticket-Stub Lilac border, transparent background, Lilac text, small uppercase label. Real interactive buttons (not decorative) — sized for a comfortable tap target, not just the label's footprint.
- **Selected state:** filled Playbill Cream background with Nightfall Violet text and bold weight — a weight/fill step, not a new color, per the One-Accent Rule (selection isn't money or the primary action, so it never takes the magenta accent).
- **Locked state:** once a product is pinned, its other sizes dim to a low opacity and become inert until the item is unpinned — prevents changing size on an already-pinned item without an explicit undo step first.
- **Sold-out state:** strike-through text, reduced opacity, faded border — reserved for when real per-size stock data exists; no size currently renders this way since nothing is confirmed sold out.

### List Rows (billing act)
- **Style:** full-width flex row — product photo thumbnail on the left, name/price/sizes/pin button stacked in the remaining space, 1px bottom hairline divider. Wraps to photo-above-body on narrow screens.
- **Grouping:** the whole billing block opens with a 2px top rule in Playbill Cream, distinguishing it from the header/verse copy above.

### Navigation
Not yet established — this is currently a single-page storefront. If a second route is added (order lookup, product detail), its nav should stay type-led and flat, consistent with this system, rather than introducing card-based navigation chrome.

## Do's and Don'ts

### Do:
- **Do** keep the accent to prices and the primary action only (see The One-Accent Rule).
- **Do** carry hierarchy through Anton's size/weight steps before reaching for a new color or a container.
- **Do** keep every corner sharp — zero radius, anywhere.
- **Do** use the confirmed campaign palette (violet/cream/magenta) rather than the festival-poster catalog's default electric-lime — it's brand evidence, not decoration.

### Don't:
- **Don't** add a shadow, gradient, or glass effect anywhere — this world is flat by invariant, not by neglect.
- **Don't** introduce a small label/eyebrow above a heading (see The No-Kicker Rule) — fold it into the heading or cut it.
- **Don't** frame a product photo in a card, border, or shadow — it sits flat on the ground like everything else (see Imagery).
- **Don't** render a sold-out state without real stock data behind it — the capability exists in code, but no size is marked sold out until the stock ledger (issue #5) confirms one actually is.
