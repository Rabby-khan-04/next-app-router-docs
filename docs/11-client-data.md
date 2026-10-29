# 11-client-data.md

---

## 1. Simple Explanation (Like I'm 7)

Client data libraries are like having a personal assistant who remembers things for you, so you don't have to go to the server every time you need data.

Think of these tools:

- **React Query** — Like a smart cache that sits in your client app. It automatically fetches data, keeps it fresh, and shows you a loading spinner while waiting. It handles "stale while revalidate" strategies so your data is always fresh without you thinking about it.

- **SWR** (Stale-While-Revalidate) — Similar to React Query, but developed by Vercel (the makers of Next.js). It's simpler and works great with Next.js. The name says it all: show stale data first, then revalidate in the background.

- **Native Server Fetching** — Like going to the kitchen yourself. You fetch data in a Server Component, and it comes with the page. No extra library needed, but you have to handle loading states, caching, and revalidation manually.

Rule: Use React Query or SWR when you have complex client-side data needs (many components needing the same data, real-time updates, complex caching). Use native server fetching for simple pages.

---

## 2. Real Name

| Term | Technical Description |
|------|----------------------|
| **React Query** (`@tanstack/react-query`) | A third-party library for managing server-state in client components. Provides `useQuery`, `useMutation`, caching, invalidation, and background refetching. Does NOT work in Server Components directly. |
| **SWR** (`swr`) | A data fetching hook library by Vercel. `useSWR(key, fetcher)` — fetches data, keeps it stale, then revalidates. Built-in support for revalidation on focus, network recovery. Works perfectly with Next.js App Router. |
| **`useQuery`** | React Query hook that fetches data. Takes a unique key and a fetch function. Returns `data`, `isLoading`, `isError`, `refetch`. |
| **`useSWR`** | SWR hook that fetches data. Takes a key and a fetcher function. Returns `[data, error, isLoading, mutate]`. |
| **`mutate`** | Function to manually trigger a refetch or update cache. Used after mutations (form submissions) to invalidate caches. |
| **`revalidatePath` / `revalidateTag`** | Server-side functions to invalidate React Query/SWR caches from the server. Called after mutations to ensure next page view shows fresh data. |
| **`staleTime`** | How long data is considered "fresh" in memory. After staleTime, it's considered stale and will refetch on next access. Default: 5 minutes (React Query) / 0 minutes (SWR). |
| **`cacheTime`** | How long data is kept in memory after being unused. Default: 30 minutes. |
| **`focusTime`** | In SWR, how long data stays fresh when the window regains focus. Default: 30000ms (30 seconds). |

**Version note for Next.js 16.4.3:** React Query and SWR are third-party packages that must be installed separately (`npm install @tanstack/react-query` or `npm install swr`). They work alongside Next.js App Router — Server Components fetch data, and Client Components use React Query/SWR for client-side caching. SWR has built-in integration with Next.js's Data Cache via `revalidateTag`.

---

## 3. Example

Let me set up React Query and SWR examples.

### File: `src/app/data/react-query/page.tsx` — React Query Example

```tsx
src/app/data/react-query/page.tsx
```

```tsx
// React Query client — useQuery hook in a Client Component
// Must install: npm install @tanstack/react-query
// The "use client" directive is required

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

// Fetch function — this runs in the CLIENT browser
// React Query manages the caching, not Next.js Data Cache
async function fetchProducts() {
  // This goes to the browser's network, not the Data Cache
  const res = await fetch("https://api.example.com/products");

  if (!res.ok) {
    throw new Error("Network response was not ok");
  }

  return res.json();
}

export default function ReactQueryPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["products"], // Unique key for caching
    queryFn: fetchProducts,
    // staleTime: 60000, // 1 minute — data is fresh for 1 minute
    // cacheTime: 30000, // 30 minutes — kept in memory for 30 min after unused
  });

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">React Query - Product List</h1>

      {/* Loading state */}
      {isLoading && (
        <p className="text-zinc-600">Loading products...</p>
      )}

      {/* Error state */}
      {isError && (
        <p className="text-zinc-600">Error loading products.</p>
      )}

      {/* Success state */}
      {!isLoading && !isError && data && (
        <ul className="space-y-2">
          {data.map((product: any) => (
            <li key={product.id} className="p-2 border rounded">
              <span className="font-medium">{product.name}</span>
              <span className="text-zinc-600">${product.price}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Manual refetch button */}
      <button
        onClick={refetch}
        className="mt-4 px-4 py-2 bg-zinc-600 text-white rounded"
      >
        Refresh Data
      </button>

      <Link href="/">Go Home</Link>
    </main>
  );
}
```

---

### File: `src/app/data/swr/page.tsx` — SWR Example

```tsx
src/app/data/swr/page.tsx
```

```tsx
// SWR client — useSWR hook in a Client Component
// Must install: npm install swr
// The "use client" directive is required

"use client";

import useSWR from "swr";
import Link from "next/link";

// Fetch function — runs in the client browser
async function fetchProducts() {
  const res = await fetch("https://api.example.com/products");
  if (!res.ok) {
    throw new Error("Network error");
  }
  return res.json();
}

export default function SWRPage() {
  // SWR returns [data, error, isLoading, { mutate }]
  const { data: products, error, isLoading, mutate } = useSWR(
    ["products"], // Unique key
    fetchProducts,
    {
      // revalidateOnFocus: true, // Re-fetch when window regains focus
      // revalidateOnReconnect: true, // Re-fetch when reconnecting to network
      // refreshInterval: 60000, // Re-fetch every 1 minute (auto)
    }
  );

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">SWR - Product List</h1>

      {/* SWR state */}
      {isLoading && (
        <p className="text-zinc-600">Loading products...</p>
      )}

      {error && (
        <p className="text-zinc-600">Error: {error.message}</p>
      )}

      {!isLoading && !error && products && (
        <ul className="space-y-2">
          {products.map((product: any) => (
            <li key={product.id} className="p-2 border rounded">
              <span className="font-medium">{product.name}</span>
              <span className="text-zinc-600">${product.price}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Manual refetch / mutate button */}
      <button
        onClick={() => mutate()}
        className="mt-4 px-4 py-2 bg-zinc-600 text-white rounded"
      >
        Refresh Data
      </button>

      {/* After mutation, we can revalidate }}
      {/* In a real app, after a form submission, call: mutate() */}
      
      <Link href="/">Go Home</Link>
    </main>
  );
}
```

---

### File: `src/app/data/comparison/page.tsx` — Comparing React Query vs SWR

```tsx
src/app/data/comparison/page.tsx
```

```tsx
// Comparison page — when to choose which library

export default function DataComparisonPage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">React Query vs SWR</h1>
      <p className="text-zinc-600">
        Both libraries solve the same problem: managing server state in client
        components. Here's the quick difference:
      </p>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium">React Query</h3>
          <ul className="list-disc pl-5">
            <li>More features and fine-grained control</li>
            <li>Larger ecosystem, more documentation</li>
            <li>Default staleTime: 5 minutes</li>
            <li>Used by larger, complex enterprise apps</li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium">SWR</h3>
          <ul className="list-disc pl-5">
            <li>Simpler API, easier to learn</li>
            <li>Built by Vercel (Next.js creators)</li>
            <li>Default staleTime: 0 (stale immediately, revalidate on every access)</li>
            <li>Great for Next.js apps, simpler setups</li>
          </ul>
        </div>
      </div>

      <p className="text-zinc-600">
        <strong>Bottom line:</strong> Use SWR for most Next.js apps. Use React Query
        for complex enterprise needs.
      </p>
    </main>
  );
}
```

---

### File: `src/app/data/use-mutation/page.tsx` — Using mutate After Server Action

```tsx
src/app/data/use-mutation/page.tsx
```

```tsx
// Using SWR's mutate after a Server Action mutation
// This ensures the product list refetches after a create/update/delete

"use client";

import useSWR from "swr";
import { useActionState } from "react";
import Link from "next/link";
import { revalidateTag } from "next/cache";

async function createProduct(formData: FormData) {
  "use server";
  // Simulate creating a product
  await new Promise((resolve) => setTimeout(resolve, 500));
  const name = formData.get("name") as string;
  return { success: true, name };
}

// SWR key
const key = ["products"];

export default function ProductMutationPage() {
  // useActionState manages the Server Action state
  const [status, data, revalidate] = useActionState(createProduct, "idle");

  // SWR hook for the products list
  const { data: swrProducts, trigger: mutate } = useSWR(key, async () => {
    // Fetch products from server component or API
    const res = await fetch("https://api.example.com/products", {
      // staleTime controls caching behavior
      next: { tags: ["products"] }, // Tag for revalidation
    }).then((res) => res.json());
    return res;
  });

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Product Management with SWR</h1>

      {/* Form to create product */}
      <form onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        await createProduct(formData);
        // After mutation, trigger SWR refetch
        mutate(); // This re-fetches the products list
      }}>
        <div className="mb-4 p-4 border rounded bg-white dark:bg-gray-800">
          <h3 className="font-medium mb-2">Add Product</h3>
          <input
            type="text"
            name="name"
            placeholder="Product name"
            className="border rounded p-2 w-full"
            required
          />
          <button type="submit" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
            Add
          </button>
        </div>
      </form>

      {/* Products list from SWR */}
      <div className="mt-6">
        {isLoading && <p>Loading...</p>}
        {error && <p>Error loading products.</p>}
        {!isLoading && !error && swrProducts && (
          <ul className="space-y-2">
            {swrProducts.map((p: any) => (
              <li key={p.id} className="p-2 border rounded">
                {p.name}
              </li>
            ))}
          </ul>
        )}

        {/* Show action result */}
        {status === "success" && (
          <div className="mt-4 p-4 bg-green-100 rounded">
            <p>Product added: {data?.name}</p>
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 p-4 bg-red-100 rounded">
            <p>Error: {String(data)}</p>
          </div>
        )}
      </div>

      <Link href="/">Go Home</Link>
    </main>
  );
}
```

*Note: `revalidateTag("products")` is called in the Server Action (or route handler) to invalidate the SWR tag cache, ensuring the next access fetches fresh data.*

---

## 4. What I Should See

**Running `npm run dev`:**

- **React Query page** (`/data/react-query`) → Shows "Loading products..." initially, then the product list appears after the fetch completes. The "Refresh Data" button manually refetches. If you click it, the data refreshes.

- **SWR page** (`/data/swr`) → Similar behavior. Shows loading state, then products. The "Refresh Data" button calls `mutate()` to refetch.

- **Comparison page** (`/data/comparison`) → Shows the differences between React Query and SWR in a list format.

- **Product mutation page** (`/data/use-mutation`) → Form to add a product. After submitting, the product list below refetches (via `mutate()`), and "Product added: [name]" appears. The data stays fresh because of the SWR tag revalidation.

**`next build` output:**
```
✓ Compiled successfully in 314ms
✓ Client data libraries compiled
○  (Static) prerendered as static content where applicable
```

React Query/SWR client bundles are extracted into separate JavaScript chunks. The initial HTML is statically generated for Server Component parts.

---

## 5. In a Real Multi-tenant E-commerce Platform

- **Product listing with React Query**: The product list page uses `useQuery` from React Query. The data is cached per-query-key. On first visit, it fetches from the API. Subsequent visits within `staleTime` (e.g., 2 minutes) serve from cache. After staleTime, it refetches automatically.

- **SWR for real-time price updates**: The price display on product cards uses SWR with `refreshInterval: 30000` (30 seconds). Prices update automatically without the user clicking "refresh".

- **Cart management with SWR**: The shopping cart uses SWR to keep the cart count in sync. When an item is added (via Server Action), `mutate()` refetches the cart data. The `revalidateTag("cart")` ensures the cart count is updated across all tabs.

- **Stale-while-revalidate pattern**: Product details use SWR with `revalidateOnFocus: true` — when the admin returns to the dashboard tab after 10 minutes, the product data refetches to get the latest price/stock.

- **Server Component + React Query hybrid**: The admin dashboard uses Server Components for the overall layout and navigation. Client modules (tables, forms) use React Query or SWR for their specific data needs. This combines the best of both worlds: fast initial page load (Server Components) + client-side caching and revalidation (React Query/SWR).

- **Tenant-aware caching**: Each tenant's product data can be cached separately using unique SWR tags (`["products-tenant-123"]`) or React Query query keys. `revalidateTag("products-tenant-123")` clears only that tenant's cache.

- **Offline support**: SWR's `revalidateOnReconnect: true` ensures that if the user loses internet and comes back, the data automatically refetches. React Query has similar capabilities with `refetchOnReconnect: true`.

---

## 6. When to Use It and When NOT to

| Use React Query/SWR When | Use Native Server Fetching When |
|--------------------------|--------------------------------|
| Multiple components need the same data | Simple pages with one data fetch |
| Data needs to stay fresh (auto-refetch) | Page loads once and data doesn't change often |
| Client-side caching, offline support | You want zero extra dependencies |
| Complex mutations with automatic refetch | You're okay with manual loading state management |
| SWR's `revalidateOnFocus`/`revalidateOnReconnect` | You don't need automatic revalidation |

| Use SWR When | Avoid When |
|-------------|------------|
| Most Next.js apps (built by Vercel creators) | You need fine-grained control over every cache option |
| Simpler API, less configuration | You need advanced features like per-page cache durations |
| Built-in `revalidateTag` integration with Next.js Data Cache | You're already heavily invested in React Query |

| Use React Query When | Avoid When |
|--------------------|------------|
| Complex enterprise apps needing fine-grained control | You want the simplest possible setup |
| Advanced cache options (`staleTime`, `cacheTime`, `refetchOnWindowFocus`) | You just need basic data fetching |
| When you need `useMutation` with complex invalidate logic | SWR suffices for your needs |

**Key rule:** For most Next.js App Router apps, **SWR is the default choice** because of its simple API and built-in Next.js integration. Use React Query only when you need its advanced features.

---

## 7. Common Mistakes

1. **Using React Query/SWR in Server Components** — These libraries only work in Client Components. Add `"use client"` at the top of the file, or the hooks will throw errors.

2. **Forgetting to install the package** — React Query (`@tanstack/react-query`) and SWR (`swr`) are not included in the default Next.js install. Must run `npm install` after adding them.

3. **Overusing client-side fetching** — If the data is only needed on page load and doesn't change, use a Server Component with `fetch()` instead. Don't add unnecessary client-side libraries.

4. **Not integrating with Next.js revalidation** — After a mutation (form submission), call `mutate()` (SWR) or `refetch()` (React Query) to refetch data. Or better, use `revalidateTag()` / `revalidatePath()` in the Server Action/route handler to invalidate the cache at the source.

5. **Using the same key for different data** — SWR/React Query keys must be unique per data set. Using `["products"]` for both the product list and the product detail page would cause cache conflicts.

6. **Not setting `revalidateOnFocus`/`refetchOnWindowFocus` appropriately** — If data doesn't change often, setting `refetchOnWindowFocus: true` means the data refetches every time the user switches tabs, which is unnecessary network traffic.

7. **Ignoring the SWR/React Query DevTools** — Both libraries have browser DevTools extensions that show the cache state, pending requests, and history. These are invaluable for debugging data fetching issues.

8. **Mixing Data Cache and React Query/SWR caches** — The Next.js Data Cache (server-side, per-route) and React Query/SWR caches (client-side, per-key) are separate. Data fetched with `fetch()` in Server Components is cached by the Data Cache. Data fetched with `useSWR()`/`useQuery()` in Client Components is cached by the library. Don't expect one to automatically invalidate the other — use `revalidateTag()` to bridge them.

---

## 8. Try it Yourself

1. **Add React Query to the app**: Run `npm install @tanstack/react-query`, then add `"use client"` to a new file and use `useQuery` to fetch data. Observe the loading/error states.

2. **Add SWR to the app**: Run `npm install swr`, then add `"use client"` to a new file and use `useSWR` to fetch data. Compare the API with React Query.

3. **Add a mutation refetch**: In the Product Mutation page, after submitting the form, the product list should automatically refetch. Try removing the `mutate()` call and observe that the data doesn't update until you manually refresh the page.

4. **Add `revalidateTag` to a Server Action**: In a Server Action after creating/updating a product, call `revalidateTag("products")`. Then observe that the next page view shows the updated data without needing a manual refetch.

**Hint for exercise 3:** The `mutate()` function returned by `useSWR()` triggers an immediate refetch. You can also pass a second argument: `mutate(null, { revalidateTags: ["products"] })` to explicitly invalidate tags.

---

## 9. Next: Multi-tenant Apps

[→ docs/12-multitenant.md](docs/12-multitenant.md)

**What's coming:** Resolving the tenant from the hostname or custom domain, and passing tenant context safely.