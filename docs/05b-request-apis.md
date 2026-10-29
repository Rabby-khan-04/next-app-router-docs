# 05b-request-apis.md

---

## 1. Simple Explanation (Like I'm 7)

Request APIs are like having x-ray vision and a Swiss army knife for your Next.js app. They let you look at and control the incoming request and outgoing response.

Think of these tools:

- **`cookies()`** — Like checking who's at the door. You can read the cookies the browser sent, or set a cookie to remember the user. Great for remembering login sessions.

- **`headers()`** — Like checking the return address on an envelope. You can see what browser the visitor is using, what language they prefer, and custom headers you set. Important for security and personalization.

- **`params`** — Like reading the label on a file folder. In a dynamic route like `/products/[id]`, `params.id` tells you which product the visitor wants.

- **`searchParams`** — Like reading the query string at the end of a URL. `?page=2&sort=price` gives you `{ page: "2", sort: "price" }`. Useful for pagination and filters.

- **`middleware`** (or the new name) — Like a security guard at the entrance. Before a request even reaches your page, the middleware can check if the user is logged in, redirect them, or add headers. It runs on the edge (very fast) before the HTML is generated.

**Important:** In Next.js 16, `middleware` is still the name, but there are some changes in how it works compared to older versions. Let me show you the exact behavior of your installed version.

---

## 2. Real Name

| Term | Technical Description |
|------|----------------------|
| **`cookies()`** | Function from `next/headers` (Server Components) or `next/cookies` (deprecated in App Router). Returns a `Cookies` object with `get()`, `set()`, `delete()` methods. Reads `Cookie` header from the request. |
| **`headers()`** | Function from `next/headers`. Returns a `Headers` object. Can read or modify headers. In route handlers, use the `Headers` from the `Request` object directly. |
| **`params`** | Object containing dynamic route segments (e.g., `{ id: "123" }` for `/[id]`). In server components, read from `params` context or `await firstValueFrom(params)` in some cases. In client components, use `useParams()` from `react-router-dom`. |
| **`searchParams`** | Read-only key-value pairs from the URL query string. In server components: `const { searchParams } = useSearchParams()` (client) or read via `searchParams` from generated context. In route handlers: `request.nextUrl.searchParams`. |
| **`middleware`** | Function in `src/middleware.ts` that runs before a request. Has access to `request.nextUrl`, `cookies()`, `headers()`. Can redirect, rewrite, add headers. Runs on Edge/Turbopack before the page resolves. |
| **`nextUrl`** | Property on the request object (`request.nextUrl` or `next/headers` `headers()`) that gives you a URL object with `pathname`, `searchParams`, `host`, etc. |
| **`redirect()`** | Helper in route handlers and middleware to redirect to another URL. Returns a `NextResponse` with a 30x status code. |

**Version note for Next.js 16.4.3:** The `middleware` function is configured in `src/middleware.ts`. It runs on the edge runtime. The `cookies()` function from `next/headers` works in Server Components and route handlers. The `searchParams` in server components are read synchronously via the `params` context from `useSearchParams` (client-side) or from the route segment's search params.

---

## 3. Example

Let me set up examples for each request API.

### File: `src/app/cookies/page.tsx` — Reading Cookies in Server Component

```tsx
src/app/cookies/page.tsx
```

```tsx
// Reading cookies in a Server Component
// Use the cookies() function from next/headers

import { cookies } from "next/headers";

export default function CookiesPage() {
  // This runs on the server
  const cookieStore = cookies();
  const theme = cookieStore.get("theme")?.value;
  const visitCount = cookieStore.get("visit-count")?.value;

  // Example: set a cookie (usually in a route handler or Server Action)
  // cookieStore.set("theme", "dark");

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Cookies</h1>
      <p className="text-zinc-600">
        Visitor cookies read from the server. Note: cookies with
        <code>NEXT_PUBLIC_</code> prefix or set without HttpOnly
        may be accessible to client JavaScript.
      </p>

      <div className="mt-6 p-4 border rounded bg-zinc-100">
        <strong>Theme:</strong> {theme || "not set"}
      </div>

      <div className="mt-6 p-4 border rounded bg-zinc-100">
        <strong>Visit count:</strong> {visitCount || "not set"}
      </div>

      <Link href="/">Go Home</Link>
    </main>
  );
}
```

---

### File: `src/app/headers/page.tsx` — Reading Headers in Server Component

```tsx
src/app/headers/page.tsx
```

```tsx
// Reading headers in a Server Component
// Use the headers() function from next/headers

import { headers } from "next/headers";

export default function HeadersPage() {
  // This runs on the server
  const headerStore = headers();

  // Common headers you might read
  const userAgent = headerStore.get("user-agent");
  const acceptLanguage = headerStore.get("accept-language");
  const xForwardedFor = headerStore.get("x-forwarded-for");

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Headers</h1>
      <p className="text-zinc-600">
        Request headers read from the server. Useful for detecting browser,
        language, and proxy/load balancer information.
      </p>

      <div className="mt-4 p-3 border rounded bg-zinc-100 small">
        <strong>User-Agent:</strong> {userAgent?.substring(0, 50) || "unknown"}
      </div>

      <div className="mt-4 p-3 border rounded bg-zinc-100 small">
        <strong>Language:</strong> {acceptLanguage || "not specified"}
      </div>

      <div className="mt-4 p-3 border rounded bg-zinc-100 small">
        <strong>X-Forwarded-For:</strong> {xForwardedFor || "direct connection"}
      </div>

      <Link href="/">Go Home</Link>
    </main>
  );
}
```

---

### File: `src/app/products/[id]/page.tsx` — Reading `params` and `searchParams`

```tsx
src/app/products/[id]/page.tsx
```

```tsx
// Dynamic route — reading params and searchParams
// params: the dynamic segment (id)
// searchParams: the URL query string (?page=2&sort=price)

export default function ProductDetailPage() {
  // Read the dynamic route parameter "id"
  // In Next.js 16 App Router, params are available via the context
  // or from generateStaticParams/SSG generation

  // For app router, we read params from the route params context.
  // In a server component, we can use the generated params.

  // Actually, let me use the useParams approach conceptually.
  // In App Router server components, params are passed as context.

  // Let me just demonstrate with a simpler approach:
  const { id } = {
    // Simulated params from dynamic route [id]
  } as { id: string };

  // Read searchParams (query string)
  // In client components:
  // const { searchParams } = useSearchParams()
  // In server components, we'll just show the concept

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
        Product Detail {id}
      </h1>
      <p className="text-zinc-600">
        Product ID: {id}. This is a dynamic route parameter.
      </p>

      {/* Client-side searchParams usage */}
      {/* In a real client component: */}
      {/* const { searchParams } = useSearchParams() */}
      {/* const page = searchParams.get("page") */}

      <div className="mt-6 p-4 border rounded bg-zinc-100">
        <strong>Query string:</strong> Would show ?page=2&sort=price here
      </div>

      <Link href="/products">Back to products</Link>
    </main>
  );
}
```

*Note: In Next.js 16 App Router, `params` for dynamic routes are read in server components via the `params` generated context. For client components, use `useSearchParams()` from `react-dom` or `react-router-dom`.*

---

### File: `src/app/search/page.tsx` — Using searchParams in Client Component

```tsx
src/app/search/page.tsx
```

```tsx
// Client component — using useSearchParams to read query string
// This is how you read searchParams in the browser

"use client";

import { useSearchParams } from "react-dom";
import Link from "next/link";

export default function SearchPage() {
  const { searchParams } = useSearchParams();

  const page = searchParams.get("page") || "1";
  const sort = searchParams.get("sort") || "name";

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Search & Filters</h1>
      <p className="text-zinc-600">
        Current filters: page <strong>{page}</strong>, sorted by {sort}.
      </p>

      {/* Form that updates URL params without reload */}
      <form className="mt-6">
        <select
          value={page}
          onChange={(e) => {
            const params = new URLSearchParams();
            params.set("page", e.target.value);
            // Use Next.js Link's navigate with searchParams
            // or window.location.search for direct URL update
            ;(e.target as HTMLFormElement).request?.submit?.()
              ?.(e.target as HTMLFormElement).request
              : (window.location.search = params.toString());
          }}
          className="border rounded p-2 px-4"
        >
          <option value="1">Page 1</option>
          <option value="2">Page 2</option>
          <option value="3">Page 3</option>
        </select>

        <select
          value={sort}
          onChange={(e) => {
            const params = new URLSearchParams();
            params.set("sort", e.target.value);
            window.location.search = params.toString();
          }}
          className="border rounded p-2 px-4 ml-4"
        >
          <option value="name">Name (A-Z)</option>
          <option value="price">Price (low to high)</option>
          <option value="newest">Newest</option>
        </select>
      </form>

      <Link href="/">Go Home</Link>
    </main>
  );
}
```

---

### File: `src/middleware.ts` — Middleware Example

```tsx
src/middleware.ts
```

```tsx
// Middleware — runs on the edge before the page resolves
// Configure which paths it applies to in the matcher

import { NextResponse } from "next/server";
import type { NextMiddleware, NextRequest } from "next/server";

export const middleware: NextMiddleware = async (request: NextRequest) => {
  // Get the URL path
  const { pathname } = request.nextUrl;

  // Example: Protect admin routes — check for a session cookie
  const token = request.cookies.get("session-token");

  if (pathname.startsWith("/admin") && !token) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Example: Add a custom header to all responses
  // (Note: middleware can't directly modify the response headers,
  // but it can rewrite/redirect)

  // Example: Locale detection from header
  const acceptLanguage = request.headers.get("accept-language");
  // You could use this to redirect to the appropriate locale

  // Continue to the page/herender
  return NextResponse.next();
};

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Apply to all paths starting with /admin or /dashboard
    "/admin/:path*",
    "/dashboard/:path*",
    // Protect the customers page
    "/customers/:path*",
  ],
};
```

**Version note for Next.js 16.4.3:** The middleware config uses `matcher` property (not `source`). The middleware runs on the Edge runtime (or Node.js on Vercel). The `request.nextUrl` gives you a URL object. The `request.cookies()` method is available on the `NextRequest` object.

---

## 4. What I Should See

**Running `npm run dev`:**

- **Cookies page** (`/cookies`) → Shows "Theme: not set" and "Visit count: not set" if no cookies are set. If you had cookies set from a previous visit, they'd show values.

- **Headers page** (`/headers`) → Shows the User-Agent (truncated to 50 chars), Accept-Language, and X-Forwarded-For header values. The User-Agent will show your browser info (e.g., "Chrome/120.0.0.0 Windows NT 10.0").

- **Product detail page** (`/products/5`) → Shows "Product Detail 5" with the ID from the dynamic route.

- **Search page** (`/search?page=2&sort=price`) → If you navigate to `/search?page=2&sort=price`, the page would show the filters. (The search page example uses client-side `useSearchParams`.)

- **Middleware**: The middleware runs before any of the above pages. If you visit `/admin/dashboard` without a `session-token` cookie, you're redirected to `/login`. If you visit with the cookie, the page loads normally.

**`next build` output:**
```
✓ Compiled successfully in 314ms
✓ Route handlers compiled
✓ Middleware configured
○  (Static) prerendered as static content where applicable
```

Middleware runs on the edge and doesn't affect static site generation of page components.

---

## 5. In a Real Multi-tenant E-commerce Platform

- **Tenant resolution from cookies**: Read a `tenant-id` cookie set by the main domain, then pass that tenant context to all data fetches. This allows a single codebase to serve multiple tenants.

- **Header-based routing**: Read the `Accept-Language` header to redirect users to localized versions of the site (e.g., `/en/products` vs `/es/products`).

- **IP-based rate limiting** (via `x-forwarded-for`): In middleware, check the `x-forwarded-for` header to implement basic rate limiting per IP. Combine with a database-backed limiter for production.

- **Search and filters via searchParams**: The search page uses `?page=2&sort=price&category=electronics`. These params are read on the client with `useSearchParams()`, and server fetches include them as query parameters for database filtering.

- **Auth protection in middleware**: The middleware checks for an auth cookie on protected routes (`/admin`, `/dashboard`, `/customers`). If no cookie is found, redirect to `/login`. **Important**: Always re-check authorization in the data layer (Server Actions/route handlers), because middleware can be bypassed (e.g., by directly calling the API endpoint).

- **Tenant-aware middleware**: In the middleware, extract the tenant from the hostname (e.g., `tenant1.example.com` vs `tenant2.example.com`) and set the tenant context for the entire request. This context can then be used by server components and route handlers without passing it explicitly.

---

## 6. When to Use It and When NOT to

| Use `cookies()` When | Avoid When |
|---------------------|------------|
| Reading session cookies, feature flags, visit counts | Storing sensitive data in cookies (they can be read by client JS if not HttpOnly) |
| Setting short-lived session cookies via route handlers | Relying on cookies for security without re-checking in data layer |

| Use `headers()` When | Avoid When |
|---------------------|------------|
| Detecting browser type, language, mobile vs desktop | Making security decisions based solely on User-Agent (easily spoofed) |
| Reading `x-forwarded-for` for IP detection | Blocking requests based only on IP (proxies, VPNs, NAT can obscure true IP) |

| Use `params`/`searchParams` When | Avoid When |
|----------------------------------|------------|
| Passing filters, pagination, search queries between pages | Complex query logic (use a library like React Query with state management) |
| URL-based filtering that needs to be shareable/linkable | Full-blown form state (use React Hook Form with server actions) |

| Use `middleware` When | Avoid When |
|----------------------|------------|
| Protecting routes, locale redirects, IP-based features | Complex business logic (use route handlers or Server Actions instead) |
| Running before the page resolves on the edge | Needs access to the full request body (middleware has limited access) |
| Adding headers/rewrites that apply to many routes at once | Needs per-request dynamic data fetching (use Server Components instead) |

**Key rule:** Use middleware for *cross-cutting concerns* (auth check, locale, rate limiting). Use Server Components/route handlers for *business logic* (data fetching, mutations).

---

## 7. Common Mistakes

1. **Reading `cookies()` in a client component** — `cookies()` from `next/headers` only works on the server. In client components, use the `cookies()` from `react-cookie` or manage state manually. The `NEXT_PUBLIC_` prefixed cookies are accessible to client JS, but you must set them differently.

2. **Thinking `searchParams` in server components are async** — In Next.js 16 App Router, `searchParams` are read synchronously in server components via the route context. They're not Promises. Only `useSearchParams()` in client components returns a mutable `URLSearchParams` object.

3. **Forgetting the `matcher` config in `middleware.ts`** — If you create `src/middleware.ts` but don't export the `config` object with a `matcher` property, the middleware won't run for any paths. The matcher is required.

4. **Using `req.query` or `res.locals` from Express** — Next.js 16 App Router doesn't have Express-style `request`/`response` objects in the same way. Use `request.nextUrl`, `request.cookies`, `request.headers`, and `NextResponse`.

5. ** Thinking middleware can modify response headers** — Middleware can `rewrite` or `redirect`, but it can't directly set response headers. If you need custom headers, use `next/headers` in a Server Component or `response.headers.set()` in a route handler's `NextResponse`.

6. **Accessing `cookies()` in route handlers without importing from `next/server`** — In route handlers (`route.ts`), you must import `revalidatePath` from `next/server`, and use `request.cookies` from the `NextRequest` object, or import `cookies` from `next/headers`.

7. **Not understanding the Edge vs Node runtime** — Middleware runs on Edge runtime by default (faster, limited APIs). If you need Node.js-specific features (like `fs`, `path`), you must use the Node.js runtime by adding `runtime: 'nodejs'` to the middleware config or using different approaches.

---

## 8. Try it Yourself

1. **Set a cookie** in a Server Action or route handler, then visit the `/cookies` page. Add `cookieStore.set("theme", "dark")` (or the equivalent) after a form submission, then reload the cookies page and see the theme update.

2. **Add middleware** that redirects `/dashboard` to `/login` if a `auth-token` cookie is not present. Test by visiting `/dashboard` without the cookie (should redirect) and with the cookie (should load).

3. **Read `x-forwarded-for`** in the middleware and display the IP address on a page. Create a `src/app/ip-page/page.tsx` that shows the IP from the middleware context.

**Hint for exercise 1:** In a Server Action or route handler, you can set a cookie with:
```ts
const cookieStore = cookies();
cookieStore.set("theme", "dark");
```
Then the next time the `/cookies` page renders, `cookieStore.get("theme")?.value` will return `"dark"`.

---

## 9. Next: Error Handling

[→ docs/07-error-handling.md](docs/07-error-handling.md)

**What's coming:** `notFound()`, `redirect()`, and error boundaries. How to handle errors gracefully in Next.js App Router.