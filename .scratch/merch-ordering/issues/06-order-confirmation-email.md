Status: ready-for-agent

# Order confirmation email

## Parent

.scratch/merch-ordering/PRD.md

## What to build

An order-confirmation email sent automatically right after checkout, containing the order summary, reference number, and payment instructions - built behind a generic notification interface so future notifications (paid, collected) can be added later as additive calls, not a rewrite.

## Acceptance criteria

- [ ] A notification module exposes a generic "send order notification" interface, with one concrete notification type implemented today: order confirmation
- [ ] Immediately after a successful checkout (if the customer provided an email), an order-confirmation email is sent containing order reference, line items, total, and the bank/EFT payment instructions
- [ ] If no email was provided (phone-only checkout), no email send is attempted and checkout still completes successfully
- [ ] Email sending failure does not fail or roll back the order itself (the order still exists even if the email bounces/errors)

## Blocked by

- 05-cart-checkout
