# 03-data-fetching.md

---

## 1. Simple Explanation (Like I'm 7)

Fetching data in Next.js is like ordering food at a restaurant:

- **Server Components** are like the chef — they can go to the kitchen (database), order whatever you want, and bring it back to your table. This is the fastest way because the data comes with the page.

- **Client Components** are like you at the table — you can't go to the kitchen directly. You have to wait for the chef to bring food. But you can use `fetch()` yourself in the browser, which is slower because the browser has to do the work.

- **The Data Cache** is like a smart waiter who remembers what you ordered last time. If you order the same thing again, they bring it from memory instead of going to the kitchen. This makes repeated visits super fast.

- **Revalidate** is like telling the waiter "check the kitchen every 60 seconds for new food". After 60 seconds, the next person gets the fresh data.

Rule: In Next.js App Router, **default is to use `fetch()` in Server Components**. It's automatic, cached, and fast.

---

## 2. Real Name

| Term | Technical Description |
|------|----------------------|
| **`fetch()` in Server Components** | The standard way to fetch data in App Router. Requests are automatically cached per-request (request memoization) and per-route (Data Cache). You just `const res = await fetch(url)` and it works. |
| **Request Memoization** | Within a single request, if you `fetch()` the same URL twice, Node returns the same Response object from the first fetch. No duplicate network calls. |
| **Data Cache** | Next.js caches `fetch()` results keyed by URL + options. Default TTL is ∞ (never expires) — data is static unless you explicitly revalidate. |
| **Full Route Cache** | Caches the entire rendered output of a route. If you navigate back to a route, Next.js skips re-rendering and serves the cached HTML. |
| **Router Cache** | Per-segment cache that exists within a single navigation. It prevents the same data from being fetched multiple times during one page visit. |
| **`revalidatePath(path)`** | Explicitly mark a path as stale after `seconds` so the next `fetch()` will re-run and get fresh data. |
| **`revalidateTag(tag)`** | Invalidate all `fetch()` calls that use the same `tag`. Great for purging many URLs at once (e.g., after a mutation). |
| **`revalidateTag(tag, { throwIfStale: true })`** | Throw an error if the tag is stale, useful for immediate feedback. |
| **Dynamic vs Static Rendering** | `fetch()` by default makes a route **static** (pre-rendered at build time). Use `dynamic('force-static')` or `{ cache: 'force-dynamic' }` to force dynamic rendering. |
| **`searchParams`** | Read URL query params in server components via const { searchParams } = useSearchParams() (client) or from `params` context (server). |

---

## 3. Example

Let me set up data fetching examples showing the caching model.

### File: `src/app/products/page.tsx` — Server Component with `fetch()`

```tsx
src/app/products/page.tsx
```

```tsx
// Server Component — fetch() is auto-cached by Next.js

interface Product {
  id: number;
  name: string;
  price: number;
}

async function fetchProducts(): Promise<Product[]> {
  // This fetch is cached by Next.js Data Cache
  // TTL is ∞ by default (never expires)
  const res = await fetch("https://api.example.com/products", {
    // Cache strategy can be specified here
    // next: { revalidate: 60 } = revalidate every 60 seconds
  });

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  return res.json();
}

export default async function ProductsPage() {
  const products = await fetchProducts();

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Products</h1>
      <ul className="space-y-2">
        {products.map((product) => (
          <li key={product.id} className="p-2 border rounded">
            <span className="font-medium">{product.name}</span>
            <span className="text-zinc-600">${product.price}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

---

### File: `src/app/products/[id]/page.tsx` — Dynamic Route with fetch()

```tsx
src/app/products/[id]/page.tsx
```

```tsx
// Dynamic route — fetch the product by ID
// The ID is available from the route params

interface Product {
  id: number;
  name: string;
  price: string;
}

async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(
    `https://api.example.com/products/${id}`,
    // Cache for 30 seconds — after that, re-fetch
    { next: { revalidate: 30 } }
  );

  if (!res.ok) {
    throw new Error("Product not found");
  }

  return res.json();
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await fetchProduct(params.id);

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
        {product.name}
      </h1>
      <p className="text-zinc-600">${product.price}</p>
      <a href="/products">Back to products</a>
    </main>
  );
}
```

---

### File: `src/app/products/[id]/layout.tsx` — Layout for Dynamic Route

```tsx
src/app/products/[id]/layout.tsx
```

```tsx
export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <nav className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-medium">Product Detail</h2>
      </nav>
      <div className="p-4">{children}</div>
    </div>
  );
}
```

---

### File: `src/app/admin/route.ts` — Route Handler with revalidation

```tsx
src/app/admin/route.ts
```

```tsx
// Route Handler — for POST mutations and revalidation
// This is the new App Router way (not Pages Router's api/)

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // This runs on the server
  const products = await fetch("https://api.example.com/admin/products", {
    // No revalidate by default — cached per request
  }).then((res) => res.json());

  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const body = await request.json();

  // Process the mutation (e.g., create product)
  const created = await createProduct(body);

  // Revalidate the products page after mutation
  // This ensures the next page view shows the new data
  revalidatePath("/products");
  revalidateTag("products"); // If using tags (see below)

  return NextResponse.json({ success: true, product: created }, {
    // Set cache headers
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
```

*Note: `revalidatePath` and `revalidateTag` are imported from `next/server` in route handlers.*

---

### File: `src/app/admin/products/page.tsx` — Using revalidateTag

```tsx
src/app/app/admin/products/page.tsx
```

Wait, let me fix the path. Let me use `src/app/admin/products/page.tsx`:

```tsx
src/app/admin/products/page.tsx
```

```tsx
// Products page that uses revalidateTag for purging

import { revalidateTag } from "next/cache";

export default async function AdminProductsPage() {
  // Fetch products with a "products" tag
  const res = await fetch("https://api.example.com/admin/products", {
    // Tag all fetches with "products"
    // Next.js caches this separately; revalidateTag("products") clears it
    next: { tags: ["products"] },
  }).then((res) => res.json());

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Admin Products</h1>
      <ul className="space-y-2">
        {res.map((product: any) => (
          <li key={product.id} className="p-2 border rounded">
            {product.name} - ${product.price}
          </li>
        ))}
      </ul>
    </main>
  );
}
```

---

## 4. What I Should See

**Running `npm run dev`:**

- Visiting `http://localhost:3000/products` → Shows the products list fetched from the API
- The first load fetches from `https://api.example.com/products`
- **Reload the page** — you'll notice it's faster. That's because the Data Cache served the cached response without a network call.
- Visiting `http://localhost:3000/products/1` → Shows product details for ID 1
- The `next: { revalidate: 30 }` means the cache expires after 30 seconds, then it re-fetches

**`next build` output:**
```
✓ Compiled successfully in 324ms
✓ Generating static pages using 6 workers (5/5) in 607ms
○  (Static) prerendered as static content
```

All routes are statically generated because `fetch()` by default makes routes static. The build generates static HTML for each route.

---

## 5. In a Real Multi-tenant E-commerce Platform

- **Product listing page**: Server component fetches products for the current tenant from the database or API. The `fetch()` is cached by the Data Cache. On first visit, it fetches from the API. On subsequent visits within the TTL, it serves from cache.

- **Product detail page**: Dynamic route `[id]` fetches a specific product. The `next: { revalidate: 30 }` means the product detail is re-fetched every 30 seconds. This balances freshness with performance.

- **Admin dashboard**: Route handlers (`route.ts`) handle mutations (create/update product). After a mutation, `revalidatePath("/products")` or `revalidateTag("products")` ensures the product list shows the new data immediately.

- **Tenant-aware caching**: Each tenant's data can be cached separately by including the tenant ID in the fetch URL or using tags. `revalidateTag("tenant-123")` clears only that tenant's cache.

---

## 6. When to Use It and When NOT to

| Use `fetch()` in Server Components When | Avoid / Use Alternative When |
|----------------------------------------|-------------------------------|
| Fetching data that doesn't change often | Need real-time data every second (use WebSockets or interval fetching) |
| Want automatic caching (fast repeat visits) | Need fine-grained control over cache keys (use `headers: { 'Cache-Control': 'no-store' }`) |
| Building standard e-commerce, admin dashboards | Need edge-rendering for every request (use `dynamic('force-static')` or Edge Functions) |
| Data is public or doesn't contain secrets | Need per-user personalized data on every request (fetch in client component with auth headers) |

**Default Next.js behavior (App Router 16.4.3):** `fetch()` is **static by default** — data is cached permanently (TTL = ∞) unless you specify `next: { revalidate: number }` or `dynamic('force-static')`.

---

## 7. Common Mistakes

1. **Forgetting `next: { revalidate: ... }` to make data fresh** — Without it, `fetch()` data is cached forever (TTL = ∞). If your data changes, users won't see updates until the cache expires or you explicitly revalidate.

2. **Using `fetch()` in a client component without proper headers** — Client-side `fetch()` doesn't benefit from the Data Cache. It goes to the network every time. If you need caching in client components, use React Query or SWR.

3. **Adding `no-store` cache option unnecessarily** — `next: { cache: 'no-store' }` disables the Data Cache entirely. Only use this for truly dynamic data that changes on every request.

4. **Mixing `fetch()` with `ssr: false`** — In Next.js 16, `ssr` is not a valid option for `fetch()`. To make a route fully dynamic, use `dynamic('force-static')` at the top of the file.

5. **Calling `revalidatePath` or `revalidateTag` without importing from `next/server`** — In route handlers (`route.ts`), you must import `revalidatePath` and `revalidateTag` from `next/server`, not from `next/cache`.

6. **Not understanding the caching layers** — Request memoization (same request in same render), Data Cache (per URL + options), Full Route Cache (whole route output), Router Cache (single navigation). Not knowing which layer you're using leads to confusing cache behavior.

---

## 8. Try it Yourself

1. **Add `next: { revalidate: 10 }`** to the `fetch()` in `src/app/products/page.tsx`. Wait 12 seconds, then reload the page. Observe that the data has been refreshed (the API call runs again).

2. **Remove the `next` option entirely** from the fetch in `src/app/products/[id]/page.tsx`. Visit the page, then `next build` and `next dev`. Observe that the page remains static — the fetch result is cached permanently until you restart the dev server or explicitly revalidate.

3. **Add `tags: ['products']`** to a fetch call, then call `revalidateTag('products')` in a route handler after a mutation. Observe that the next page view fetches fresh data.

**Hint for exercise 1:** After adding `revalidate: 10`, wait about 12 seconds and refresh. The browser will show a new network request to the API. Before the 10 seconds are up, the cached version is served.

---

## 9. Next: Chapter 4

[Rendering Modes →](docs/04-rendering-modes.md)

**What's coming:** Static, dynamic, ISR, streaming with Suspense, partial prerendering, and `generateStaticParams`. How to tell which rendering mode a route uses.