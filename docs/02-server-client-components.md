# 02-server-client-components.md

---

## 1. Simple Explanation (Like I'm 7)

Next.js has two types of components. Think of them like two different kitchens:

- **Server Components** run on the server (like a chef in a kitchen). They can fetch data from databases, read files, and use Node.js APIs. They send less JavaScript to the browser, so the page loads faster. But they can't use `useState` or event handlers directly.

- **Client Components** run in the browser (like a microwave on your counter). They can use hooks like `useState`, handle clicks, and respond to user input. But they can't fetch data from databases directly — they have to get that data from a server component first.

Rule of thumb: Start with Server Components. Only add `"use client"` when you need interactivity (buttons, forms, state).

---

## 2. Real Name

| Term | Technical Description |
|------|----------------------|
| **Server Component** | A component that renders on the server during `next dev`/`next build`. It sends UI HTML to the client, but no JavaScript bundle for that component. It can `import` data, DB calls, `fs`, Node APIs. Syntax: default export, no `"use client"` directive. |
| **Client Component** | A component that renders in the browser. It has `"use client"` at the top. It can use `useState`, `useEffect`, event handlers, and client-side APIs. It sends its JavaScript to the browser. |
| **Boundary** | The point where `"use client"` is added. Everything above (parent directories) becomes server, everything below becomes client. |
| **Hydration** | The process where React makes a client-side component interactive by attaching event listeners to existing HTML. Mismatches between server-rendered HTML and client-side expected HTML cause hydration errors. |

---

## 3. Example

Let me set up a server component that fetches data and a client component that shows interactive UI.

### File: `src/app/dashboard/server-components.tsx` — Server Component

```tsx
src/app/dashboard/server-components.tsx
```

```tsx
// No "use client" directive = this is a Server Component by default
// It can fetch data from databases, APIs, etc.

interface Product {
  id: number;
  name: string;
  price: number;
}

async function fetchProducts(): Promise<Product[]> {
  // Simulate database fetch — this runs on the server
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [
    { id: 1, name: "Widget A", price: 29.99 },
    { id: 2, name: "Widget B", price: 49.99 },
    { id: 3, name: "Widget C", price: 19.99 },
  ];
}

export default async function ServerProducts() {
  // Server components can use async/await directly
  const products = await fetchProducts();

  return (
    <ul className="space-y-2">
      {products.map((product) => (
        <li key={product.id} className="p-2 border rounded">
          <span className="font-medium">{product.name}</span>
          <span className="text-zinc-600">${product.price}</span>
        </li>
      ))}
    </ul>
  );
}
```

---

### File: `src/app/dashboard/client-interactive.tsx` — Client Component

```tsx
src/app/dashboard/client-interactive.tsx
```

```tsx
// "use client" directive makes this a Client Component
// It can use hooks, event handlers, and browser APIs

import { useState } from "react";

export default function ProductFilter() {
  const [filter, setFilter] = useState("");

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(filter.toLower())
  );

  return (
    <div className="mt-4 p-4 border rounded">
      <h3 className="font-medium mb-2">Filter products:</h3>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Type to filter..."
        className="border rounded p-1"
      />
      <ul className="mt-4 space-y-2 max-h-40 overflow-y-auto">
        {filteredProducts.map((product) => (
          <li key={product.id} className="p-2 border rounded">
            <span className="font-medium">{product.name}</span>
            <span className="text-zinc-600">/${product.price}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

*Note: `products` here would be passed as a prop from a parent server component in a real app. This stands alone for demonstration.*

---

### File: `src/app/dashboard/page.tsx` — Combining Both

```tsx
src/app/dashboard/page.tsx
```

```tsx
// Server component — no "use client"
// Fetches data and passes it to client components

import ServerProducts from "./server-components";
import ProductFilter from "./client-interactive";

export default function DashboardPage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Product Dashboard</h1>

      {/* Server component — data fetches on server */}
      <ServerProducts />

      {/* Client component — adds interactivity */}
      {/* Note: the boundary is at the "use client" line in client-interactive.tsx */}
      <ProductFilter />
    </main>
  );
}
```

---

### File: `src/app/dashboard/layout.tsx` — Layout with Mixed Components

```tsx
src/app/dashboard/layout.tsx
```

```tsx
import "./globals.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <nav className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-medium">Admin Dashboard</h2>
      </nav>
      <div className="p-4">{children}</div>
    </div>
  );
}
```

---

## 4. What I Should See

**Running `npm run dev`:**

- Visiting `http://localhost:3000/dashboard` → Shows the dashboard page
- **Server Products** list renders with the three widgets (Widget A, B, C)
- **Filter input** is interactive — you can type and it filters the list (this part runs in the browser)
- The layout (`layout.tsx`) persists the "Admin Dashboard" header while content changes
- **Terminal output:** `✓ Ready in ...` with no errors

**`next build` output:**
- Server components are statically extracted into HTML. No JavaScript bundle for `ServerProducts`.
- Client components have their JavaScript chunk loaded separately.
- Build succeeds with `Cache Components enabled` (Next 16 default).

---

## 5. In a Real Multi-tenant E-commerce Platform

- **Product listing page**: Server component fetches products from the database for the tenant, sends only the HTML to the browser. Fast initial load, no database JavaScript sent to the client.
- **Product filter/interactive area**: Client component with `"use client"` lets users filter, sort, and select products. The filter input and selection state live in the browser.
- **Admin layout**: The sidebar/navigation is a layout (server component) that stays up while the product grid (server) and filter (client) swap below it.
- **Tenant context**: The tenant ID can be resolved in a server component and passed as props to child components, keeping secrets out of the browser.

---

## 6. When to Use It and When NOT to

| Use Server Component When | Use Client Component When |
|--------------------------|---------------------------|
| Fetching data from databases, APIs, files | Need `useState`, `useEffect`, or other hooks |
| Rendering large lists of data (no interactivity needed) | Handling user events (clicks, form inputs, drag-and-drop) |
| Reducing JavaScript sent to the browser | Accessing browser-only APIs (e.g., `localStorage`, `window.matchMedia`) |
| Markup-heavy UI (tables, cards, lists) | Building interactive widgets, charts, drag-and-drop |
| SEO-critical content (rendered on server) | Third-party scripts that need to run in browser |

**Default rule:** Start with server components. Add `"use client"` only for the specific parts that need interactivity.

---

## 7. Common Mistakes

1. **Adding `"use client"` too high in the tree** — If `layout.tsx` has `"use client"`, the entire layout becomes a client component, increasing bundle size and losing server-side data fetching. Only add it where interactivity is truly needed.

2. **Trying to use `useState` in a server component** — Server components don't have access to React hooks. If you need state, move that part of the tree below the `"use client"` boundary.

3. **Fetching data in a client component** — Client components can't directly fetch from databases. They should receive data from parent server components via props, or use `useSuspense` with `fetch()` (which works in client components but goes to the Router Cache, not the Data Cache).

4. **Circular imports between server and client** — Don't import a client component from a server component without passing data as props. The server component can't render a client component's internal state.

5. **Using `document`, `window` in server components** — These browser globals don't exist on the server. Use them only in client components (inside `"use client"`).

6. **Forgetting the boundary** — If you add `"use client"` to a file, that file and all its children become client components. Moving a component above the `"use client"` line won't make it a server component unless you remove the directive.

---

## 8. Try it Yourself

1. **Convert the `ProductFilter` client component** to a server component (remove `"use client"` and `useState`). Then try typing in the filter — it should break because server components can't handle events. Note the error message.

2. **Create a new client component** that uses `useEffect` to fetch data with `fetch()`. Observe that the fetch runs in the browser, not on the server.

3. **Add `"use client"` to `layout.tsx`** and observe how the whole layout becomes interactive, the navbar becomes clickable, and the initial page load sends more JavaScript to the browser.

**Hint for exercise 1:** Remove `"use client"` from the top, delete the `useState` hook, and try rendering the component. Then add `"use client"` back and notice the difference.

---

## 9. Next: Chapter 3

[Data Fetching →](docs/03-data-fetching.md)

**What's coming:** How to fetch data in server components, the caching layers (request memoization, Data Cache, Full Route Cache, Router Cache), `revalidate`, tags, and how to tell which rendering mode a route uses.