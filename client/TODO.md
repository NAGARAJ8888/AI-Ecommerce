# Project TODO

## STEP 10 — Admin dashboard architecture audit + implementation plan (minimal refactor)

### Step 10.1: Admin shell modularization (no UX changes)
- [ ] Extract admin UI shell pieces from `client/app/admin/page.tsx`:
  - `AdminHeader` (top sticky header)
  - `AdminSidebar` (left nav)
  - `AdminShell` (layout wrapper)
- [ ] Add reusable `AdminLoadingState` and `AdminErrorState` components.
- [ ] Preserve current tab-based UX and internal state.

### Step 10.2: Lightweight frontend admin route protection
- [ ] Update `client/app/admin/page.tsx` to use `useAuth()`.
- [ ] Implement loading/skeleton while auth hydrates.
- [ ] For non-admin users: redirect to `/` or show access denied (design choice in implementation).

### Step 10.3: Extend admin API layer in `client/lib/api.ts`
- [ ] Add admin functions for existing backend endpoints, at minimum:
  - Orders: list + stats + update status/payment
  - Payments: list + stats + refund
  - Users/Customers: list/admin get
  - Products/Inventory integrity: stock update + inventory stats if available
  - Analytics: orders/payments/products/reviews stats + recommendation analytics
- [ ] Keep using existing `fetchWithAuth`/cookie-based auth.

### Step 10.4: Implement recruiter-critical panels (incremental wiring)
- [ ] Orders panel:
  - [ ] Replace mock recent orders with admin data from backend
  - [ ] Add status update actions
  - [ ] Add timeline/history UI if backend already provides fields (else show status history from order fields)
- [ ] Payments panel:
  - [ ] Replace mock with admin payment list
  - [ ] Add refund visibility/actions where backend supports it
- [ ] Inventory panel:
  - [ ] Add stock integrity table (reusing product data / stock endpoints)
  - [ ] Add stock update actions
- [ ] Customers/Users panel:
  - [ ] Replace mock with admin user list
  - [ ] Add pagination/search
- [ ] Analytics panel:
  - [ ] Add Recharts-based charts (KPIs + trend)
  - [ ] Use backend stats endpoints (orders/payments/products/reviews/recommendations)
- [ ] Recommendations panel:
  - [ ] Add admin recommendation analytics from backend

### Step 10.5: Production hardening
- [ ] Standardize loading/error states per panel.
- [ ] Add debounced search + pagination incrementally.
- [ ] Ensure toast/error handling uses existing `sonner`.

### Step 10.6: Post-implementation documentation
- [ ] Update `client/TODO.md` with what recruiter-visible operational tooling is now live.
- [ ] Document “signals improved” and list what should be STEP 11 next.

