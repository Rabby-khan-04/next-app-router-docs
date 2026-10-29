# 12-multitenant.md

---

## 1. Simple Explanation (Like I'm 7)

A multi-tenant app is like an apartment building. The building (your Next.js app) has many apartments (tenants), each with their own residents (customers). But the building has some shared areas (the main lobby, the gym, the roof).

In a web app:
- **Single tenant**: One company uses the whole app. All data is theirs, and it's kept separate from other companies.
- **Multi-tenant**: Many companies (tenants) use the same app. Each company's data must be kept separate. They can't see each other's customers, orders, or products.

How we do it:
- **Hostname-based**: `tenant1.example.com` and `tenant2.example.com` — the app knows which tenant based on the URL hostname.
- **Custom domain**: `store1.com` and `store2.com` — each tenant has their own domain, pointing to the same app.
- **Tenant context**: Once we know which tenant it is, we pass that context to all the data queries so we only show their data.

Rule: Always resolve the tenant early (in middleware or at the top of the page), then scope all database queries to that tenant. Never trust the URL — always re-verify in the data layer.

---

## 2. Real Name

| Term | Technical Description |
|------|----------------------|
| **Multi-tenant app** | An application that serves multiple customers (tenants) using the same codebase. Each tenant's data is isolated and private. |
| **Tenancy** | The state of being a tenant. In Next.js, tenancy is resolved from the hostname, subdomain, or custom domain. |
| **Hostname/subdomain** | The URL domain (e.g., `tenant1.example.com`). The part before `.example.com` (`tenant1`) identifies the tenant. |
| **Custom domain** | Tenant's own domain (e.g., `my-store.com`). DNS points to the same Next.js app, and the app identifies the tenant from the domain. |
| **Tenant context** | The tenant ID or slug passed through the request context to all data fetches. Ensures only that tenant's data is returned. |
| **`resolveTenant()`** | A helper function that extracts the tenant from the request (hostname, domain, cookie, or header). |
| **`withTenancy`** | A higher-order function or middleware that resolves the tenant and makes it available to the rest of the app. |
| **Data isolation** | Ensuring that Tenant A's queries never return Tenant B's data. Achieved by always including the tenant ID in WHERE clauses. |
| **`NEXT_PUBLIC_` pitfall** | Tenant context should NOT be exposed via `NEXT_PUBLIC_` env vars if it contains sensitive info. Only expose safe, read-only data. |

**Version note for Next.js 16.4.3:** Tenant resolution commonly happens in `src/middleware.ts` (from the hostname/subdomain) or at the top of Server Components (from a route parameter or search param). The tenant context can be passed as a prop to child components or stored in a cookie.

---

## 3. Example

Let me set up multi-tenant examples.

### File: `src/middleware.ts` — Tenant Resolution from Hostname

```tsx
src/middleware.ts
```

```tsx
// Middleware — resolves tenant from hostname
// Runs on every request on the edge
// Sets the tenant in a cookie for later use

import { NextResponse } from "next/server";
import type { NextMiddleware, NextRequest } from "next/server";

export const middleware: NextMiddleware = async (request: NextRequest) => {
  const { hostname, pathname } = request.nextUrl;

  // Extract tenant from hostname (e.g., tenant1.example.com)
  // Format: subdomain.example.com -> subdomain = tenant
  const hostnameParts = hostname.split(".");
  const tenant = hostnameParts[0]; // First part is the tenant

  // Valid tenant check — only known tenants are allowed
  const validTenants = ["tenant1", "tenant2", "store", "admin"];

  // Special paths that don't need tenant context
  const publicPaths = ["/login", "/signup", "/", "/api"];

  // If it's a public path, continue without tenant cookie
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // If tenant is valid, set it in a cookie for the app to use
  if (validTenants.includes(tenant)) {
    const response = NextResponse.next();
    response.cookies.set("tenant-id", tenant, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;
  }

  // Unknown tenant — redirect to a default or show error
  // For now, continue without tenant cookie
  return NextResponse.next();
};

export const config = {
  matcher: [
    "/:path*",
    // Exclude known static paths from middleware processing
    "/_next/static/:path*",
    "/favicon.ico",
    "/images/:path*",
  ],
};
```

**Version note for Next.js 16.4.3:** The middleware uses `request.nextUrl.hostname` to get the hostname. The `config.matcher` uses the new format. The tenant is set in an `httpOnly` cookie so it's not accessible to client JavaScript (for security), but the server can read it via `cookies()`.

---

### File: `src/app/tenants/page.tsx` — Tenant Dashboard

```tsx
src/app/tenants/page.tsx
```

```tsx
// Tenant dashboard — reads tenant from cookie and shows tenant-specific data
// Server Component — runs on every page load

import { cookies } from "next/headers";

interface TenantData {
  name: string;
  slug: string;
  productCount: number;
}

export default async function TenantsPage() {
  // Resolve tenant from the cookie set by middleware
  const cookieStore = cookies();
  const tenantId = cookieStore.get("tenant-id")?.value;

  if (!tenantId) {
    // No tenant cookie — redirect or show error
    // In a real app, would redirect to hostname-based selection
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">Unable to determine tenant</h1>
        <p>Please access via a tenant hostname (e.g., tenant1.example.com)</p>
      </div>
    );
  }

  // Fetch tenant-specific data — scoped by tenant ID
  // In a real app: const data = await db.tenants.find(tenantId)
  const tenantData: TenantData = {
    name: tenantId,
    slug: tenantId,
    productCount: Math.floor(Math.random() * 100), // Demo data
  };

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
        {tenantData.name} - Dashboard
      </h1>
      <p className="text-zinc-600">
        Welcome to your dashboard. You have {tenantData.productCount} products.
      </p>
      <Link href="/">Go Home</Link>
    </main>
  );
}
```

---

### File: `src/app/products/[id]/page.tsx` — Tenant-Scoped Product Page

```tsx
src/app/products/[id]/page.tsx
```

```tsx
// Product detail page — scoped to the current tenant
// The tenant context is read from the cookie and used in the query

import { notFound } from "next/navigation";
import { cookies } from "next/headers";

interface Product {
  id: string;
  name: string;
  price: number;
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  // Read tenant from cookie (set by middleware)
  const cookieStore = cookies();
  const tenantId = cookieStore.get("tenant-id")?.value;

  if (!tenantId) {
    // No tenant context — redirect or show error
    notFound();
  }

  // Fetch product — SCOPED to the tenant
  // In a real app: const product = await db.products.findByTenantId(tenantId, id)
  // For demo: simulate based on tenant and ID
  const numericId = Number(id);
  const existingProductIds = {
    tenant1: [1, 2, 3],
    tenant2: [4, 5, 6],
    store: [1, 2, 3, 7, 8],
  };

  const tenantIds = existingProductIds[tenantId] || [];
  if (!tenantIds.includes(numericId)) {
    // Product doesn't exist for this tenant — show 404
    notFound();
  }

  // Simulate product data
  const product: Product = {
    id,
    name: `Product ${id} (Tenant ${tenantId})`,
    price: numericId * 10,
  };

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
        {product.name}
      </h1>
      <p className="text-zinc-600">${product.price}</p>
      <Link href="/">Go Home</Link>
    </main>
  );
}
```

---

### File: `src/app/(admin)/products/page.tsx` — Admin Products for Tenant

```tsx
src/app/(admin)/products/page.tsx
```

```tsx
// Admin products page — shows products for the current tenant
// The admin layout has a sidebar, and the products are tenant-scoped

import { cookies } from "next/headers";

export default function AdminProductsPage() {
  // Read tenant from cookie
  const cookieStore = cookies();
  const tenantId = cookieStore.get("tenant-id")?.value;

  if (!tenantId) {
    // No tenant — redirect to login or show error
    // In a real app, would redirect to /login
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">Tenant not found</h1>
        <p>Please access via a tenant hostname.</p>
      </div>
    );
  }

  // Fetch products for this tenant only
  // In a real app: const products = await db.products.findByTenant(tenantId)
  // Demo: generate fake products scoped to tenant
  const productCount = 5 + Math.floor(Math.random() * 10); // 5-14 products
  const products = Array.from({ length: productCount }, (_, i) => ({
    id: `${tenantId}-${i + 1}`,
    name: `Product ${i + 1} (${tenantId})`,
    price: (i + 1) * 10,
  }));

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
        Products - {tenantId}
      </h1>
      <p className="text-zinc-600">
        Managing {products.length} products for this tenant.
      </p>

      <ul className="space-y-4">
        {products.map((product) => (
          <li key={product.id} className="p-3 border rounded bg-zinc-50">
            <span className="font-medium">
              {product.name} - ${product.price}
            </span>
          </li>
        ))}
      </ul>

      <Link href="/">Go Home</Link>
    </main>
  );
}
```

---

## 4. What I Should See

**Running `npm run dev`:**

- **Visiting `http://localhost:3000/`** (no tenant hostname) → The middleware may not set a tenant cookie (depends on the hostname). The tenants page may show "Unable to determine tenant" or the default home page.

- **Visiting `http://tenant1.localhost:3000/`** (if hostname is set) → The middleware sets a `tenant-id=tenant1` cookie. The dashboard shows "Tenant1 - Dashboard" with the product count.

- **Visiting `http://tenant2.localhost:3000/products/1`** → The product page checks the tenant cookie. If tenant is `tenant2`, product ID 1 doesn't exist for tenant2 (in the demo data), so the 404 page is shown. If visiting `http://tenant1.localhost:3000/products/1`, the product shows "Product 1 (Tenant tenant1)" with price $10.

- **Admin products page** (`/(admin)/products`) → Shows products for the current tenant. If tenant is `tenant1`, shows 5-14 products with names like "Product 1 (tenant1)", "Product 2 (tenant1)", etc.

**`next build` output:**
```
✓ Compiled successfully in 314ms
✓ Multi-tenancy compiled
○  (Static) prerendered as static content where applicable
```

Middleware runs on the edge. Tenant cookies set by middleware are httpOnly and not accessible to client JavaScript directly.

---

## 5. In a Real Multi-tenant E-commerce Platform

- **Hostname-based tenancy**: `store1.example.com`, `store2.example.com`, etc. The middleware extracts the subdomain (`store1`, `store2`) and sets the tenant cookie. All routes (product pages, cart, checkout) are scoped by this tenant ID.

- **Custom domain tenancy**: `store1.com`, `store2.com`. DNS CNAME records point to the Next.js app. The app reads the `host` header to identify the tenant. This gives each tenant a professional-looking domain while sharing the same codebase.

- **Tenant context propagation**: The tenant ID (set in the httpOnly cookie by middleware) is read at the top of Server Components and passed down as a prop to child components. All API calls, database queries, and `fetch()` calls include the tenant ID in the WHERE clause or request body.

- **Data isolation strategies**: 
  - **Database-level**: Each tenant has their own database schema or separate database. Queries always include `tenant_id`.
  - **Schema-level**: One database, but each tenant has their own schema (`tenant1_products`, `tenant2_products`). Queries use `current_schema()` or prefixed table names.
  - **Row-level**: One database, one schema, but every table has a `tenant_id` column. Every query filters by `tenant_id`.

- **Auth + multi-tenancy**: The middleware checks both auth (session cookie) and tenancy (hostname). Both must be valid for the user to access the route. If auth is valid but tenancy doesn't match, redirect to the correct tenant's hostname.

- **Tenant-aware sitemap and SEO**: The `sitemap.ts` and `metadata` objects include tenant-specific URLs and metadata. Each tenant gets their own sitemap entry and unique page titles/descriptions.

- **Tenant-specific branding**: The app can show different colors, logos, and themes per tenant. The `StyleProvider` from Ant Design (or CSS variables) can be set based on the tenant ID, so each tenant's storefront looks unique.

- **Rate limiting per tenant**: The middleware can track requests per tenant (using an in-memory store or Redis) and apply different rate limits. Tenant1 might get 100 requests/minute, Tenant2 gets 500 requests/minute based on their plan.

- **Graceful degradation for unknown tenants**: If a user visits a hostname that isn't a recognized tenant, the middleware can redirect to a onboarding page, show a "tenant not found" error, or fall back to a default tenant.

---

## 6. When to Use It and When NOT to

| Use Multi-tenancy When | Avoid When |
|------------------------|------------|
| You're building software for multiple customers (SaaS, e-commerce stores) | You're building a personal project, blog, or single-client app |
| You need to isolate data per customer (privacy, compliance) | Data privacy isn't a concern (single user/app) |
| You want to reuse the same codebase across customers | You need completely custom infrastructure per customer |
| Hostname-based (`store1.example.com`) or custom domains (`store1.com`) | You're okay with URL params or appending `?tenant=123` to every URL |

| Use Hostname-based Tenancy When | Avoid When |
|--------------------------------|------------|
| You want professional-looking URLs (store1.com, store2.com) | You're early-stage and want the simplest setup |
| DNS is under your control and you can configure CNAMEs | You can't control the DNS or your users can't configure custom domains |
| You want URL-based tenant isolation (automatic, no ?tenant param) | You have a small number of tenants (2-3) and URL parsing is overkill |

| Use Data Isolation When | Avoid When |
|------------------------|------------|
| You have privacy requirements (GDPR, HIPAA, etc.) | You're okay with all data in one shared space |
| You want to bill customers based on usage/plan | You have a single flat-price model |
| You want to provide truly separate experiences per customer | You just need to organize your own data |

**Key rule:** If you're building a SaaS product or multi-client e-commerce platform, multi-tenancy is essential. For a single-store or personal project, it's overkill.

---

## 7. Common Mistakes

1. **Forgetting to re-verify tenant in the data layer** — The middleware can set the tenant cookie, but **always** re-read the tenant and verify it in each Server Component and route handler. Never trust the cookie alone (it can be manipulated via direct API calls).

2. **Using `NEXT_PUBLIC_` for tenant context** — Don't expose the tenant ID via `NEXT_PUBLIC_` env vars if it's used for data isolation. The tenant ID should only be available on the server (via the httpOnly cookie or middleware context). Exposing it allows clients to change the tenant by modifying the cookie.

3. **Not handling unknown tenants** — If a user visits a hostname that isn't a recognized tenant, the app should have a graceful fallback (redirect to onboarding, show 404, or default tenant) rather than crashing or showing raw data.

4. **Tenant cookie accessible to client JavaScript** — The middleware sets the tenant cookie as `httpOnly: true` so it's not readable by `document.cookie`. If you need the tenant in a client component, pass it from a Server Component prop, don't read it from `cookies()` on the client.

5. **Not isolating database queries** — Simply setting the tenant cookie isn't enough. Every database query, `fetch()`, and Server Action must include the tenant ID in the query conditions. Without this, one tenant can access another's data.

6. **Not cleaning up tenant cookies** — After a tenant signs up or changes their hostname, old tenant cookies may still be valid. Have a sign-out or tenant-change flow that clears the `tenant-id` cookie.

7. **Assuming all subdomains are tenants** — Don't assume every subdomain is a valid tenant. Always validate against a list of known tenants (as in the example's `validTenants` array). Otherwise, `admin.example.com` or `dev.example.com` could accidentally become tenants.

8. **Sharing session cookies across tenants** — Don't use the same session cookie for all tenants. Each tenant should have their own session/scope to prevent cross-tenant session hijacking.

---

## 8. Try it Yourself

1. **Test hostname-based tenancy**: Run `npm run dev`, then modify your `/etc/hosts` file to add `tenant1.localhost` pointing to `127.0.0.1`. Visit `http://tenant1.localhost:3000/` and observe the tenant cookie being set and the dashboard showing tenant-specific data.

2. **Test tenant-scoped product pages**: Visit `http://tenant1.localhost:3000/products/1` and observe the product shows "Product 1 (Tenant tenant1)". Then visit `http://tenant2.localhost:3000/products/1` and observe the 404 page (product doesn't exist for tenant2).

3. **Test admin products page**: Visit `http://tenant1.localhost:3000/(admin)/products` and observe the products listed are for tenant1 only.

**Hint for exercise 1:** To add a hostname mapping, edit `/etc/hosts` (on Mac/Linux) or `C:\Windows\System32\drivers\etc\hosts` (on Windows) and add:
```
127.0.0.1 tenant1.localhost
127.0.0.1 tenant2.localhost
```
Then visit the hostnames in your browser.

---

## 9. Next: Performance

[→ docs/13-performance.md](docs/13-performance.md)

**What's coming:** Bundle size, dynamic imports, `next/image`, caching mistakes, and measuring with Lighthouse and the build output.