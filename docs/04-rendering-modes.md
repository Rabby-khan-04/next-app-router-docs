# 04-rendering-modes.md

---

## 1. Simple Explanation (Like I'm 7)

Next.js can render pages in different ways, like choosing how to bake a cake:

- **Static** — Baked before visitors arrive. Super fast, served from CDN. Like a cake baked yesterday and waiting on the shelf. Best for content that doesn't change often (blog posts, product listings).

- **Dynamic** — Baked fresh every time someone visits. Like a chef cooking a cake to order. Slower, but always fresh. Best for data that changes frequently (user-specific info, real-time prices).

- **ISR (Incremental Static Regeneration)** — Bake a cake, but set a timer. After the timer goes off, the next visitor gets a fresh cake. Great for balancing speed and freshness!

- **Streaming with Suspense** — Send parts of the page to the browser as soon as they're ready, rather than waiting for everything. Like serving appetizers while the main course is still cooking. Makes the page feel faster.

- **Partial Prerendering** (if available in your version) — Pre-render some parts of a page statically while keeping others dynamic. Like pre-rendering the header but rendering the body dynamically.

Rule: Default is Static. Add `"use client"` or `dynamic()` to make parts dynamic.

---

## 2. Real Name

| Term | Technical Description |
|------|----------------------|
| **Static Rendering** | Page HTML is generated at `next build` time. The result is cached CDN-ready HTML. No server needed for each request. `fetch()` by default makes routes static (TTL = ∞). |
| **Dynamic Rendering** | Page HTML is generated on every request (or as needed). Uses `dynamic('force-static')` to opt-out of static, or `fetch()` without `next: { revalidate }`. |
| **ISR (Incremental Static Regeneration)** | Start with static, then re-generate pages in the background after `revalidateTimeSeconds`. Combines static speed with fresh data. Uses `next: { revalidate: number }` in `fetch()`. |
| **Streaming with Suspense** | Render HTML in chunks. Critical UI sends first, then rest of page. Requires `<Suspense>` boundary. Makes Time-to-First-Byte much faster. |
| **Partial Prerendering** | Experimental feature. Renders some UI statically (e.g., header) while keeping other UI dynamic (e.g., product list that fetches from API). Uses `export const dynamic = 'force-static'` with selective `fetch()` calls. |
| **`generateStaticParams(params)`** | For dynamic routes (e.g., `[id]`), specify which param values should be statically generated. Required for ISR on dynamic routes. |
| **`export const dynamic = 'force-static'`** | Force a route to always be static, even if it uses `fetch()` or other dynamic features. Overrides default behavior. |
| **`export const dynamic = 'error'`** | Render errors dynamically. If a route throws, the `error.tsx` boundary catches it. |

---

## 3. Example

Let me set up examples showing different rendering modes.

### File: `src/app/rendering/static-page.tsx` — Static by Default

Actually, let me just use the default page. Let me restructure:

### File: `src/app/static-demo/page.tsx` — Static Mode

```tsx
src/app/static-demo/page.tsx
```

```tsx
// This route is STATIC by default.
// No "use client", no dynamic() = static rendering.
// fetch() data is cached permanently (TTL = ∞).

export default function StaticDemoPage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Static Rendering</h1>
      <p className="text-zinc-600">
        This page is pre-rendered at build time. Great for about pages, terms,
        and content that doesn't change often.
      </p>
      <div className="mt-6 p-4 border rounded bg-zinc-100">
        <strong>Cache TTL:</strong> ∞ (never expires unless you revalidate)
      </div>
    </main>
  );
}
```

---

### File: `src/app/dynamic-demo/page.tsx` — Dynamic Mode

```tsx
src/app/dynamic-demo/page.tsx
```

```tsx
// This route is DYNAMIC.
// Use export const dynamic = 'force-static' to make it static,
// or leave it default dynamic.

export const dynamic = 'force-dynamic'; // or omit for default behavior

import { useSearchParams } from "react-router-dom";
// Note: In App Router, useSearchParams from "react-dom" or read from useSearchParams()

// Actually, in App Router server components, we read searchParams differently.
// Let me use a simpler approach.

export default function DynamicDemoPage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Dynamic Rendering</h1>
      <p className="text-zinc-600">
        This page is rendered on every request. Data is always fresh but
        slightly slower than static.
      </p>
      <div className="mt-6 p-4 border rounded bg-yellow-100">
        <strong>Behavior:</strong> Rendered on every visit
      </div>
    </main>
  );
}
```

*Note: In Next.js 16 App Router, to force dynamic rendering, use `export const dynamic = 'force-dynamic'` at the top of the file.*

---

### File: `src/app/isr-page/page.tsx` — ISR Mode (revalidate)

```tsx
src/app/isr-page/page.tsx
```

```tsx
// This route uses ISR (Incremental Static Regeneration).
// fetch() with next: { revalidate: 30 } means:
// - First 30 seconds: served from cache (static speed)
// - After 30 seconds: next request re-fetches, new cache is set

interface Product {
  id: number;
  name: string;
  price: number;
}

async function fetchProducts() {
  return fetch("https://api.example.com/products", {
    next: { revalidate: 30 }, // Revalidate every 30 seconds
  }).then((res) => res.json());
}

export default async function ISRPage() {
  const products = await fetchProducts();

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">ISR (Incremental Static Regeneration)</h1>
      <p className="text-zinc-600">
        Products are re-generated every 30 seconds. First 30 visitors get
        cached data, then fresh data is generated.
      </p>
      <ul className="space-y-2 mt-6">
        {products.map((product: Product) => (
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

### File: `src/app/streaming-page/page.tsx` — Streaming with Suspense

```tsx
src/app/streaming-page/page.tsx
```

```tsx
// This route demonstrates streaming with Suspense.
// Components that fetch data can "suspend" rendering until data arrives,
// allowing other parts of the page to stream ahead.

import { Suspense } from "react";

async function fetchSlowData() {
  // Simulate slow data fetch
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { value: "Slow data loaded!" };
}

export default function StreamingPage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Streaming with Suspense</h1>

      <Suspense fallback={<p className="text-zinc-600">Loading data...</p>}>{
        /* This component suspends rendering until data is ready */
        <SlowDataComponent fetchData={fetchSlowData} />
      }</Suspense>

      <p className="text-zinc-600 mt-4">
        While the data was loading, above this sentence still rendered!
      </p>
    </main>
  );
}

function SlowDataComponent({ fetchData }: { fetchData: () => Promise<any> }) {
  const [data, setData] = React.useState(null);

  // In a real app, you'd use use or similar. For demo:
  useEffect(() => {
    fetchData().then(setData);
  }, [fetchData]);

  if (!data) return null;
  return <p>{data.value}</p>;
}
```

*Note: Streaming with Suspense requires the `Suspense` boundary. In Next.js 16, this works automatically for data-fetching components.*

---

### File: `src/app/partial-prerender/page.tsx` — Partial Prerendering

```tsx
src/app/partial-prerender/page.tsx
```

```tsx
// Partial Prerendering — Render some parts statically, others dynamically.
// This is an experimental feature in Next.js 16.

// To use: export const dynamic = 'error' at the route level,
// and selectively use fetch() with revalidate where needed.

export const dynamic = 'error'; // Render errors dynamically

export default function PartialPrerenderPage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Partial Prerendering</h1>
      <p className="text-zinc-600">
        This experimental feature lets you prerender parts of a page statically
        while keeping other parts dynamic. Check Next.js docs for your specific
        version availability.
      </p>
      <div className="mt-6 p-4 border rounded bg-purple-100">
        <strong>Status:</strong> Experimental — verify with your installed version
      </div>
    </main>
  );
}
```

---

## 4. What I Should See

**Running `npm run dev`:**

- **Static page** (`/static-demo`) → Loads instantly, HTML is pre-rendered. No network request needed for the page content.
- **Dynamic page** (`/dynamic-demo`) → Loads and always shows fresh data. Slightly slower than static on first visit.
- **ISR page** (`/isr-page`) → First visit fetches data and caches it. Subsequent visits within 30 seconds serve the cached data. After 30 seconds, the next request triggers a re-fetch.
- **Streaming page** (`/streaming-page`) → The "Loading data..." text appears first, then after ~1 second, "Slow data loaded!" appears. The page becomes interactive before everything is fully loaded.

**`next build` output:**
```
Route (app)
├ ○ /static-demo    (Static)
├ ○ /dynamic-demo   (Dynamic - force-dynamic)
├ ○ /isr-page       (ISR - revalidate 30s)
└ ○ /streaming-page (Streaming with Suspense)
○  (Static) prerendered as static content where applicable
```

Routes marked `force-dynamic` will NOT be statically pre-rendered. ISR routes will show the revalidate time in the route description.

---

## 5. In a Real Multi-tenant E-commerce Platform

- **Homepage**: Static rendering — no need to re-render on every visit. CDN serves the HTML globally. Fastest possible load.
- **Product listing page**: ISR with `revalidate: 60` — products are cached for 60 seconds. New products appear within a minute, but the page loads instantly for almost all visitors.
- **Product detail page** (`[id]`): Dynamic rendering — each product ID is rendered on-demand. Required because there are too many possible IDs to pre-render statically. Use `generateStaticParams` to pre-render top-selling products.
- **Admin dashboard**: Dynamic rendering — admin data changes frequently, so it must be fresh on every request.
- **Checkout page**: Streaming with Suspense — while payment processing happens, show the order summary and customer info immediately. The rest of the page streams in.

**`generateStaticParams` example for dynamic routes:**
```tsx
// src/app/products/[id]/page.tsx
export async function generateStaticParams() {
  // In a real app, fetch from DB to get top-selling product IDs
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
  ];
}
```
This pre-renders IDs 1, 2, and 3 as static pages. Other IDs fall back to dynamic rendering.

---

## 6. When to Use It and When NOT to

| Use Static When | Use Dynamic When |
|----------------|------------------|
| Content doesn't change often (marketing pages, docs) | User-specific data (profile, cart, recommendations) |
| SEO-critical pages that must load fast | Data changes every request (real-time prices, stock) |
| Global CDN deployment (Next on Vercel/Cloudflare) | Forms, mutations, user input |
| ISR when you need freshness + speed | Edge functions required per-request |

| Use ISR When | Use Streaming When |
|--------------|-------------------|
| Content needs to be fresh but not instant (blog, products) | Critical UI must load fast (headers, nav, hero image) |
| Balance between static speed and dynamic freshness | Complex pages with many independent data fetches |
| `revalidateTimeSeconds` between 30s to 3600s | Suspense-bound components that can suspend |

| Use Partial Prerendering When | Use `generateStaticParams` When |
|-------------------------------|--------------------------------|
| Experimental: need some static, some dynamic | Dynamic routes where only some param values are common |
| Your version supports it (check Next.js 16 docs) | Want ISR on dynamic routes without generating all params |

---

## 7. Common Mistakes

1. **Thinking all `fetch()` calls make a route dynamic** — By default, `fetch()` in Next.js 16 App Router makes a route **static** (cached permanently). You must explicitly use `dynamic('force-static')` or `next: { revalidate: number }` to control the behavior.

2. **Forgetting `generateStaticParams` for dynamic routes** — If you have a dynamic route `[id]` and want ISR, you must export `generateStaticParams` that returns all the param values you want statically pre-rendered. Without it, ISR won't work for dynamic routes.

3. **Using `dynamic('force-dynamic')` unnecessarily** — This defeats the purpose of Next.js's caching. Only use it when you truly need data on every request.

4. **Not understanding the caching layers** — Static (Full Route Cache), ISR (Data Cache + revalidate), Dynamic (Router Cache, no Data Cache). Not knowing which layer you're in leads to confused cache invalidation.

5. **Adding `fetch()` to a client component expecting Data Cache** — The Data Cache only works for `fetch()` in Server Components. Client-side `fetch()` goes to the network every time.

6. **Thinking `export const dynamic = 'error'` is the same as ISR** — They're different. `dynamic = 'error'` means "render errors dynamically" (use with `error.tsx`). ISR uses `next: { revalidate: number }` in `fetch()`.

---

## 8. Try it Yourself

1. **Convert the Static page to ISR**: Add `next: { revalidate: 15 }` to a `fetch()` call in `src/app/static-demo/page.tsx`. Wait 18 seconds and reload. Observe the data refreshes.

2. **Add `generateStaticParams` to a dynamic route**: In `src/app/products/[id]/page.tsx`, export `export async function generateStaticParams()` that returns 3 static IDs. Run `next build` and observe which IDs get pre-rendered vs. rendered dynamically.

3. **Add `export const dynamic = 'force-dynamic'`** to `src/app/static-demo/page.tsx`. Observe that the route is no longer pre-rendered as static (check the `next build` output).

**Hint for exercise 2:** The `generateStaticParams` function must return an array of objects matching the dynamic route params. If you have `[id]`, each object should be `{ id: "value" }`.

---

## 9. Next: Chapter 5

[Route Handlers & Server Actions →](docs/05a-route-handlers.md)

**What's coming:** `route.ts` files, Server Actions, forms, `useActionState`, `useFormStatus`, and mutations followed by revalidation. How to handle forms and data mutations in the App Router.