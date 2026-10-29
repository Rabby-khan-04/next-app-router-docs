# 07-error-handling.md

---

## 1. Simple Explanation (Like I'm 7)

Error handling in Next.js is like having a safety net under a trapeze artist. Sometimes things go wrong — the database is down, a page doesn't exist, or a user tries to do something they shouldn't. Instead of showing a scary white screen or a generic error, Next.js has special ways to handle problems gracefully.

Think of these tools:

- **`notFound()`** — Like telling the teacher "this student isn't here today". Instead of a white screen, Next.js shows a nice "404 Page Not Found" page. You use this when a resource (product, user, document) doesn't exist.

- **`error.tsx`** — Like a emergency exit sign. If something goes wrong anywhere in a page's tree, this file catches the error and shows a friendly fallback UI. It's like a backup dancer who steps in when the star trips.

- **`redirect()`** — Like a signpost pointing in a new direction. "You don't have permission here, go login instead." Returns a 30x redirect.

- **`global-error.tsx`** — Like the building's fire alarm. If something catastrophic happens that can't be recovered, this global error boundary catches it for the entire app.

Rule: Catch errors as early as possible. Show helpful messages, not technical stack traces.

---

## 2. Real Name

| Term | Technical Description |
|------|----------------------|
| **`notFound()`** | Function from `next/navigation` that throws a `NotFound` error. When caught by Next.js, renders the `not-found.tsx` boundary. Used when a resource doesn't exist (e.g., product ID doesn't match any product). |
| **`error.tsx`** | File-based error boundary. If any component in the route tree throws, Next.js renders this file instead of the normal page. Can show a fallback UI, link back to home, or show error details. |
| **`global-error.tsx`** | Global error boundary. If an error occurs that isn't caught by a route-level `error.tsx`, this file catches it for the entire app. Renders as the root error UI. |
| **`redirect()`** | Function from `next/navigation` that returns a `Redirect` error. Causes a 30x HTTP redirect. Can be used in Server Components, route handlers, or client components (with `useNavigation`). |
| **`NextResponse.redirect()`** | Route handler helper that returns a `NextResponse` with a 30x status code. Used in `route.ts` files. |
| **`useNavigation`** | Hook that provides navigation state (isLoading, formData, etc.) in client components. Can be used for conditional redirects on the client. |
| **`throw` in Server Components** | Server components can `throw` errors, and Next.js will render the nearest `error.tsx` boundary. This is how `notFound()` works internally. |

---

## 3. Example

Let me set up error handling examples.

### File: `src/app/not-found/page.tsx` — Custom 404 Page

```tsx
src/app/not-found/page.tsx
```

```tsx
// Custom 404 page — replaces Next.js's default 404
// This file is automatically picked up when notFound() is called
// or when a dynamic route param doesn't match any data

export const metadata = {
  title: "Page Not Found - Next.js Learn",
  description:
    "The page you are looking for does not exist. Please check the URL and try again.",
  openGraph: {
    title: "Page Not Found",
    description: "The requested page could not be found.",
  },
} satisfies Metadata;

export default function NotFoundPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-zinc-600 dark:text-zinc-200">
          404
        </h1>
        <h2 className="text-3xl font-medium mb-6 text-zinc-600 dark:text-zinc-200">
          Page Not Found
        </h2>
        <p className="text-zinc-600 max-w-xl mx-auto">
          The page you are looking for does not exist. Please check the URL and
          try going back home.
        </p>
        <div className="mt-8 p-6 border rounded bg-white dark:bg-gray-800">
          <Link href="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
```

---

### File: `src/app/dashboard/not-found.tsx` — Dashboard-Specific 404

```tsx
src/app/dashboard/not-found.tsx
```

```tsx
// Dashboard-specific 404 page
// This only applies when navigating within the /(dashboard) route group

export default function DashboardNotFoundPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center p-8">
        <h1 className="text-5xl font-bold mb-4 text-zinc-600 dark:text-zinc-200">
          404
        </h1>
        <h2 className="text-2xl font-medium mb-6 text-zinc-600 dark:text-zinc-200">
          Page Not Found in Dashboard
        </h2>
        <p className="text-zinc-600 max-w-xl mx-auto">
          The page you're looking for within the dashboard doesn't exist.
        </p>
        <div className="mt-6 p-4 border rounded bg-zinc-100 dark:bg-gray-900">
          <Link href="/dashboard" className="btn">
            Go Back to Dashboard
          </Link>
          <Link href="/" className="btn ml-2">
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
```

*Note: This `not-found.tsx` inside the `dashboard` folder only applies to routes under the dashboard layout. It doesn't affect the root `/404`.*

---

### File: `src/app/dashboard/error.tsx` — Dashboard Error Boundary

```tsx
src/app/dashboard/error.tsx
```

```tsx
// Error boundary for the dashboard route group
// If any component in the dashboard tree throws an error,
// this fallback UI is shown instead of the crashing component

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  // Reset the error state after 5 seconds auto-retry
  useEffect(() => {
    const timer = setTimeout(reset, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen p-8 bg-white dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6 text-zinc-600 dark:text-zinc-200">
          Something went wrong
        </h1>
        <p className="text-zinc-600 mb-8 max-w-2xl mx-auto">
          An unexpected error occurred. Our team has been notified.
        </p>
        <button
          onClick={reset}
          className="btn btn-primary"
        >
          Try Again
        </button>
        <p className="text-zinc-500 text-sm mt-4">
          If the problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
```

---

### File: `src/app/products/[id]/page.tsx` — Using `notFound()` in Server Component

```tsx
src/app/products/[id]/page.tsx
```

```tsx
// Dynamic route — using notFound() when product doesn't exist
// This is the most common pattern: fetch data, and if it doesn't exist,
// throw notFound() to render the 404 page

import { notFound } from "next/navigation";
import { Product } from "@/types/product";

interface Product {
  id: number;
  name: string;
  price: number;
}

async function fetchProduct(id: string): Promise<Product | null> {
  // Simulate fetching from database
  await new Promise((resolve) => setTimeout(resolve, 500));

  // In a real app: const product = await db.products.find(id)
  // For demo: only product IDs 1, 2, 3 exist
  const existingIds = [1, 2, 3];
  const numericId = Number(id);

  if (existingIds.includes(numericId)) {
    return {
      id: numericId,
      name: `Product ${numericId}`,
      price: numericId * 10,
    };
  }

  return null;
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await fetchProduct(params.id);

  // If product doesn't exist, throw notFound()
  // This will render the not-found.tsx boundary
  if (!product) {
    notFound();
  }

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
        {product.name}
      </h1>
      <p className="text-zinc-600">${product.price}</p>
      <Link href="/products">Back to products</Link>
    </main>
  );
}
```

---

### File: `src/app/dashboard/page.tsx` — Using `redirect()`

```tsx
src/app/dashboard/page.tsx
```

```tsx
// Using redirect() to protect routes
// This can be in a Server Component or route handler

import { redirect } from "next/navigation";

export default function DashboardPage() {
  // Check if user is authenticated
  // In a real app, you'd check cookies, session, etc.
  const isAuthenticated = false; // Simulate unauthenticated user

  // If not authenticated, redirect to login
  // This throws a Redirect error, which Next.js handles
  if (!isAuthenticated) {
    redirect("/login");
  }

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-zinc-600">
        Welcome to the admin dashboard. You're logged in.
      </p>
      <Link href="/">Go Home</Link>
    </main>
  );
}
```

---

### File: `src/app/global-error.tsx` — Global Error Boundary

```tsx
src/app/global-error.tsx
```

```tsx
// Global error boundary — catches errors that aren't caught
// by any route-level error.tsx. This is the fallback for the whole app.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">Error</h1>
        <p className="text-white mb-8">
          Something went wrong on our end. Our team has been notified and
          will fix this shortly.
        </p>
        <button onClick={reset} className="btn btn-primary">
          Try Again
        </button>
      </div>
    </div>
  );
}
```

---

## 4. What I Should See

**Running `npm run dev`:**

- **Product exists** (`/products/1`) → Shows "Product 1" with price $10. Normal rendering.
- **Product doesn't exist** (`/products/99`) → Renders the custom `not-found.tsx` page with "404" and "Page Not Found". The browser shows the 404 status.
- **Dashboard error** — If a component in the dashboard throws, the `dashboard/error.tsx` boundary catches it and shows "Something went wrong" with a "Try Again" button.
- **Global error** — If an uncaught error occurs anywhere in the app that isn't caught by a route-level `error.tsx`, the `global-error.tsx` is shown.
- **Redirect** — If you access a protected route without auth, `redirect("/login")` sends you to `/login`.

**`next build` output:**
```
✓ Compiled successfully in 314ms
✓ Error boundaries compiled
○  (Static) prerendered as static content where applicable
```

Error boundaries don't affect static generation of routes that don't throw errors.

---

## 5. In a Real Multi-tenant E-commerce Platform

- **Product not found** (`/products/[id]`): When an admin or customer requests a product that doesn't exist in the database, `notFound()` is thrown. This renders the custom 404 page instead of a white screen or database error. The URL `/products/999` shows a friendly "Product not found" message.

- **Dashboard error boundaries**: The admin dashboard has complex interactions (forms, data tables, deletions). If a table row fails to render or a network error occurs, the `dashboard/error.tsx` boundary catches it and shows "Something went wrong" with a "Try Again" button, rather than crashing the entire dashboard.

- **Route protection with `redirect()`**: The dashboard layout checks for auth in a Server Component or layout. If the user isn't logged in, `redirect("/login")` sends them to the login page. The login page can then have a form to authenticate. **Important**: Always re-check authentication in the data layer — middleware can be bypassed.

- **Tenant-aware error handling**: If a tenant's data fails to load (e.g., tenant database is down), the error can be caught and displayed tenant-specifically. The `global-error.tsx` can show a generic message, while route-level `error.tsx` can show tenant-specific messages.

- **Validation errors with `redirect()`**: When form validation fails in a Server Action, you can `redirect()` back to the form with error messages in the flash data (or use `useFormStatus` to display them).

---

## 6. When to Use It and When NOT to

| Use `notFound()` When | Avoid When |
|----------------------|------------|
| Resource genuinely doesn't exist (product ID, document, user) | Hiding content that exists but you want to keep secret (use proper auth instead) |
| Rendering custom 404 page with proper metadata | Using `try/catch` to suppress errors you should address |

| Use `error.tsx` When | Avoid When |
|---------------------|------------|
| Any component in a route tree might throw (complex UIs, data fetching) | Simple pages with no interactivity (error boundaries add some overhead) |
| Showing friendly fallback UI instead of crashes | You want to handle errors with try/catch in the component itself (use for expected error flow) |

| Use `redirect()` When | Avoid When |
|---------------------|------------|
| User isn't authenticated, wrong role, or resource moved | You just want to navigate to another page within the same app (use `<Link>` or `navigate()` instead) |
| Permanent or temporary moves (SEO-friendly) | Client-side only navigation (use `useNavigation` or `router.push`) |

| Use `global-error.tsx` When | Avoid When |
|----------------------------|------------|
| Catastrophic errors that escape all boundaries | Expected errors that should be handled by `error.tsx` per route |

---

## 7. Common Mistakes

1. **Using `notFound()` in a client component** — `notFound()` from `next/navigation` only works in Server Components. In client components, use state management to show/hide content instead.

2. **Forgetting to create `not-found.tsx` before calling `notFound()`** — If you call `notFound()` but don't have a `not-found.tsx` in the route tree, Next.js will show the default "This page could not be found" page with minimal styling.

3. **Using `redirect()` without importing from `next/navigation`** — In Server Components and route handlers, use `redirect` from `next/navigation`. In client components, `useNavigation` from `react-router-dom` or Next.js's `navigate` can be used.

4. **Forgetting `satisfies Metadata` on `not-found.tsx`** — The custom 404 page should also have proper metadata (title, description) for SEO, even though it's an error page.

5. **Placing `error.tsx` too high in the tree unnecessarily** — If only one component in a route might throw, consider error boundaries only at that level rather than putting `error.tsx` at the layout level. This keeps other pages unaffected.

6. **Forgetting that `global-error.tsx` catches errors not caught by `error.tsx`** — The global error boundary is the last resort. If an error is thrown in a route that has its own `error.tsx`, the global one is NOT shown. Only errors that bubble past all route-level boundaries reach `global-error.tsx`.

7. **Not resetting error state** — The `error.tsx` boundary receives a `reset` function that clears the error state. If you don't call `reset`, the error UI stays visible indefinitely. Always provide a "Try Again" button that calls `reset`.

8. **Using `throw` in client components** — `throw` only works in Server Components. In client components, use state and `setError` from React Error Boundary, or use `use` hook with Suspense for async errors.

---

## 8. Try it Yourself

1. **Test the notFound pattern**: Visit `/products/99` (where 99 doesn't exist). Observe the custom 404 page. Then try `/products/1` to see the normal product page.

2. **Test error boundary**: Create a component that throws an error intentionally. For example, in `src/app/dashboard/page.tsx`, add a `<div onClick={() => throw new Error("test")}>Click me</div>`. Observe the `dashboard/error.tsx` boundary catches it.

3. **Test redirect**: Create a route that calls `redirect("/login")` conditionally. Visit the route without the proper auth state and observe the redirect.

**Hint for exercise 1:** The `notFound()` function is imported from `next/navigation`. It must be called in a Server Component (or a Server Component boundary). If you call it in a client component, you'll get a runtime error.

---

## 9. Next: Advanced Routing

[→ docs/08-advanced-routing.md](docs/08-advanced-routing.md)

**What's coming:** Parallel routes, intercepting routes, and modals. How to split UI into multiple outlet areas within a single page.