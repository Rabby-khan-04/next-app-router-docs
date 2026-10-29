# 01-foundations.md

---

## 1. Simple Explanation (Like I'm 7)

Next.js has a special folder system that decides what you see on the screen. Think of it like a treasure map:

- `page.tsx` = The main screen when someone visits that folder
- `layout.tsx` = A frame that wraps the page, stays visible when navigating
- `template.tsx` = A reusable wrapper that re-runs every time you visit
- `loading.tsx` = A spinner while the page is fetching data
- `error.tsx` = A friendly error message if something goes wrong
- `not-found.tsx` = A "page not found" page for broken links
- `Link` = A special button that navigates without reloading the whole page
- Dynamic routes like `[id]` = Folders with brackets that show different content based on the URL

Route groups `(features)` let you organize URLs without changing the file tree. Private folders `[[...]]` hide routes from the public.

---

## 2. Real Name

**File-system routing** — Next.js figures out your URLs from your folder structure. No `express.js` or `pages/router.js` needed.

| File | What it is |
|------|-----------|
| `page.tsx` | The component rendered at that URL (required for pages) |
| `layout.tsx` | A UI shell that stays stable across navigation (renders once, persists) |
| `template.tsx` | A wrapper that re-runs on every navigation (unlike layout) |
| `loading.tsx` | Shown while the route's data is loading (Suspense boundary) |
| `error.tsx` | Shown when the route throws an error |
| `not-found.tsx` | Shown when `notFound()` is called or URL doesn't match |
| `Link` | `<a>` replacement that does client-side navigation |
| Dynamic route `[param]` | Folder name in brackets = captures part of URL |
| Route group `(group)` | Parentheses = organize URLs without affecting tree |
| Private folder `[[...]]` | Double brackets = route not directly accessible via URL |

---

## 3. Example

Let me set up the foundational files. First, let me clean up the default files and create our structure:

### File: `src/app/layout.tsx`

```tsx
src/app/layout.tsx
```

```tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Next.js Learn - Admin Dashboard",
  description: "Learning Next.js App Router",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("min-h-screen bg-background antialiased", {
      dark: "bg-black text-white",
      light: "bg-white text-black",
    })}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

---

### File: `src/app/page.tsx`

```tsx
src/app/page.tsx
```

```tsx
export default function HomePage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Admin Dashboard</h1>
      <p className="text-zinc-600">
        This is the home page using Next.js App Router.
      </p>
      {/* Link does client-side navigation, no full page reload */}
      <Link href="/customers">Go to Customers</Link>
    </main>
  );
}
```

---

### File: `src/app/customers/page.tsx`

```tsx
src/app/customers/page.tsx
```

```tsx
export default function CustomersPage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Customers</h1>
      <p className="text-zinc-600">
        Here is the customers page accessed via /customers.
      </p>
      {/* Link back to home */}
      <Link href="/">Go Home</Link>
    </main>
  );
}
```

---

### File: `src/app/customers/layout.tsx`

```tsx
src/app/customers/layout.tsx
```

```tsx
import "./globals.css";

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* This layout wraps the customers page */}
      <nav className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-medium">Admin Panel</h2>
      </nav>
      <div className="p-4">{children}</div>
    </div>
  );
}
```

---

### File: `src/app/(admin)/page.tsx` — Route Group Example

```tsx
src/app/(admin)/page.tsx
```

```tsx
export default function AdminPage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-zinc-600">
        This is inside (admin) route group. The (admin) group lets us organize
        admin URLs without them appearing in the file tree directly.
      </p>
      <Link href="/(admin)/settings">Admin Settings</Link>
    </main>
  );
}
```

---

### File: `src/app/[[admin]]/page.tsx` — Private Folder Example

```tsx
src/app/[[admin]]/page.tsx
```

```tsx
export default function PrivateAdminPage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Private Admin Area</h1>
      <p className="text-zinc-600">
        This folder uses double brackets [[...]], making it a "private" route.
        It won't show up in the default URL structure the same way.
      </p>
    </main>
  );
}
```

---

## 4. What I Should See

**Running `npm run dev`:**

- Visiting `http://localhost:3000/` → Shows "Welcome to the Admin Dashboard" with a "Go to Customers" link
- Clicking "Go to Customers" → Navigates to `/customers` without full reload, shows "Customers" page with admin nav
- Visiting `http://localhost:3000/customers` → Shows the customers page with the layout sidebar
- The layout persists across navigations (the "Admin Panel" header stays visible)
- The `template` (if used) would re-render on every navigation, while `layout` stays stable

**Terminal output from `next dev`:**
```
▲ Next.js 16.4.3 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.1.x:3000
✓ Ready in ...
```

**`next build` output:** All routes will be statically generated by default (since no `fetch` or dynamic functions are used). The build succeeds with no errors.

---

## 5. In a Real Multi-tenant E-commerce Platform

- **`page` + `layout`**: The admin dashboard layout shows the sidebar and header on every admin page. The page content changes per section (customers, orders, products).
- **Route groups `(admin)`**: All admin URLs live under `/(admin)/customers`, `/(admin)/orders`, etc., but the `(admin)` part doesn't appear in the file tree—it's just an organizational layer. Public users never see these URLs.
- **Private folders `[[...]]`**: A route like `[[tenant]]` could capture the tenant subdomain (e.g., `tenant1.example.com`) and keep it hidden from the regular route structure, requiring auth to access.

---

## 6. When to Use It and When NOT to

| Use When | Avoid When |
|----------|-----------|
| Creating new pages via folder structure (no config needed) | Want URL that doesn't match file structure |
| Layout that stays stable while navigating between child routes | Need a component that re-renders on every navigation (use `template`) |
| Grouping related routes under a common prefix | Want the prefix visible in the URL without config |
| Hiding certain routes from the public URL structure | Need the route to be publicly accessible |

---

## 7. Common Mistakes

1. **Missing `default` export in `page.tsx`** — Next throws "Error: Module returned no renderable..." 
2. **Placing a `client` component too high** — If you add `"use client"` in `layout.tsx`, it makes the entire layout interactive and increases bundle size. Only add it if you need interactivity in the layout.
3. **Forgetting `not-found.tsx`** — If a dynamic route parameter doesn't match, Next shows the default 404. A custom `not-found.tsx` gives a better experience.
4. **Using `Link` outside a `<body>`** — `Link` must render inside the React tree; using it in a plain `<div>` that's not rendered by Next.js causes hydration errors.
5. **Thinking `(group)` changes the URL path** — Route groups in parentheses organize the tree but DON'T appear in the final URL. Use middlewares or rewrites if you need the prefix in the actual URL.

---

## 8. Try it Yourself

1. Create a new route at `/products` with its own `page.tsx` and `layout.tsx`. Add a "Go to Products" link on the home page.
2. Add a dynamic route `[id]` under `src/app/products/[id]/page.tsx` that shows the ID passed as a param. Use `params` to read it.
3. Create a route group `(marketing)` and add a page inside it. Verify the URL works without `(marketing)` appearing in the file tree.

**Hint:** To read dynamic params: `const { id } = useParams()` (client) or read in the server component via the `params` context.

---

## 9. Next: Chapter 2

[Server vs Client Components →](docs/02-server-client-components.md)

**What's coming:** Understanding what runs on the server vs client, the `"use client"` directive, the boundary between them, passing props across, and common hydration errors.