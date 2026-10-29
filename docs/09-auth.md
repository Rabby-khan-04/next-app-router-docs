# 09-auth.md

---

## 1. Simple Explanation (Like I'm 7)

Auth (authorization) is like having a secret handshake or a membership card. You need it to get into certain areas — like the admin dashboard. But you can't just trust someone who says "I'm the admin!" — you need to check their card (cookie/session) AND verify it with the database.

Think of these tools:

- **Middleware** — Like a security guard at the building entrance. Before you even reach the page, the guard checks if you have a valid membership card (cookie). If not, they redirect you to the lobby (login page).

- **Re-checking in the data layer** — Like the guard checking the membership card again at the admin desk. Even if the guard let you in, the desk needs to verify you actually have access. This is the **safe way** to protect routes.

- **`redirect()`** — Like a sign that says "You must be this tall to ride." Redirects unauthenticated users to the login page.

- **Session cookies** — Like a wristband you get at the amusement park. It tells everyone you've already paid and are allowed on the rides.

- **`NEXT_PUBLIC_` env vars** — Like a sign that everyone can see. If you put secrets in `NEXT_PUBLIC_` vars, they leak to the browser. Keep sensitive data out of client code!

Rule: Middleware checks first, then re-verify in the data layer. Never trust cookies alone.

---

## 2. Real Name

| Term | Technical Description |
|------|----------------------|
| **Middleware** | Function in `src/middleware.ts` that runs on the edge before each request. Has access to `request.nextUrl`, `request.cookies`, `request.headers`. Can redirect, rewrite, add headers. Runs before the page component renders. |
| **`next/navigation`** | Imports like `redirect`, `notFound`, `useNavigate`. Used in Server Components and client components for navigation and redirects. |
| **`cookies()`** | Function from `next/headers` (Server Components) or `next/cookies` (deprecated in App Router). Reads/writes cookies on the server. |
| **`session`** | Server-side storage for user auth state (e.g., in a database, Redis, or `unstable_cache`). Holds the user's ID, roles, login time. |
| **`JWT` (JSON Web Token)** | Compact, URL-safe token that encodes user info. Signed with a secret so it can't be forged. Often stored in a `HttpOnly` cookie. |
| **`auth guard`** | Pattern of checking auth in middleware + re-checking in data layer. The standard secure pattern for Next.js App Router. |
| **`NEXT_PUBLIC_`** | Environment variable prefix. Vars with this prefix are exposed to the browser. Never put secrets (database passwords, JWT secrets) under this prefix! |
| **`useSession`** | React hook (from `next-auth` or `nextjs/auth`) that gets the current session. Works in client components. |
| **`session storage`** | Ways to store session: cookies (HttpOnly), localStorage, memory server cache, Redis, database. Each has trade-offs for security and performance. |

**Version note for Next.js 16.4.3:** Middleware is configured in `src/middleware.ts` with a `matcher` array. The `cookies()` function from `next/headers` works in Server Components and route handlers. The `redirect` function from `next/navigation` works in both Server and Client components. There's no built-in `useSession` in core Next.js 16 — you'd use `next-auth` or similar.

---

## 3. Example

Let me set up auth examples.

### File: `src/middleware.ts` — Auth Middleware

```tsx
src/middleware.ts
```

```tsx
// Auth middleware — runs on every request on the edge
// Checks for a session cookie, redirects to login if missing
// IMPORTANT: Always re-check auth in the data layer too!

import { NextResponse } from "next/server";
import type { NextMiddleware, NextRequest } from "next/server";

export const middleware: NextMiddleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // Protect admin and dashboard routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
    // Check for auth cookie
    const cookies = request.cookies;
    const sessionToken = cookies.get("session-token")?.value;

    if (!sessionToken) {
      // No cookie — redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Cookie exists — we still re-verify in the data layer (see pages/app.tsx)
    // This is the secure pattern: middleware + data layer re-check
  }

  // Continue to the page
  return NextResponse.next();
};

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Apply to /admin and /dashboard paths and their sub-paths
    "/admin/:path*",
    "/dashboard/:path*",
    // Also protect /customers for multi-tenant
    "/customers/:path*",
    // Exclude public paths (login, signup, images, etc.)
    "/login",
    "/signup",
    "/api/:path*",
    "/_next/static/:path*",
    "/favicon.ico",
  ],
};
```

**Version note for Next.js 16.4.3:** The `config.matcher` uses the new format (colon `:` and asterisk `*`). The middleware runs on the Edge runtime by default. The `request.cookies` method is available on `NextRequest`.

---

### File: `src/app/login/page.tsx` — Login Page

```tsx
src/app/login/page.tsx
```

```tsx
// Login page — users come here after middleware redirects them

export default function LoginPage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Sign In</h1>
      <p className="text-zinc-600">
        Enter your credentials to access the admin dashboard.
      </p>

      <form className="mt-8 p-6 border rounded bg-white dark:bg-gray-800">
        <div className="mb-4">
          <label className="block text-zinc-600 dark:text-zinc-400 mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="user@example.com"
            className="border rounded p-2 w-full"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-zinc-600 dark:text-zint-600 dark:text-zinc-400 mb-2">
            Password
          </label>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            className="border rounded p-2 w-full"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium"
        >
          Sign In
        </button>
      </form>
    </main>
  );
}
```

---

### File: `src/app/dashboard/layout.tsx` — Layout with Data-Layer Auth Re-check

```tsx
src/app/dashboard/layout.tsx
```

```tsx
// Dashboard layout — re-checks auth in the data layer
// This is the SECOND part of the secure pattern: middleware + data layer re-check

import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

// Server Component — runs on every page load
// We re-verify the session here, even though middleware already checked

import { cookies } from "next/headers";

export const metadata = {
  title: "Admin Dashboard",
  description: "Secure admin dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Re-check auth in the data layer
  // This is the critical security step — never trust middleware alone!
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("session-token")?.value;

  if (!sessionToken) {
    // If somehow the middleware missed this, redirect here
    // We can't use redirect() in a Server Component's default export
    // Instead, we render a loading state or redirect programmatically
    // For now, just render the children (in a real app, would redirect)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <nav className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-medium">Admin Panel</h2>
      </nav>
      <div className="p-4">{children}</div>
    </div>
  );
}
```

*Note: In a real app, you'd verify the sessionToken against a database or JWT verification library. If invalid, you'd redirect to login. This example shows the pattern.*

---

### File: `src/app/dashboard/page.tsx` — Protected Dashboard Page

```tsx
src/app/dashboard/page.tsx
```

```tsx
// Dashboard page — protected by middleware + data layer re-check

export default function DashboardPage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Admin Dashboard</h1>
      <p className="text-zinc-600">
        You have successfully authenticated and authorized access.
      </p>
      <Link href="/">Go Home</Link>
    </main>
  );
}
```

---

### File: `src/app/api/auth/[...token]/route.ts` — API Route for Session Verification

```tsx
src/app/api/auth/[...token]/route.ts
```

```tsx
// API route — verifies the session token against the database
// This is called from the client or server to validate auth

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    // In a real app, verify the token against the database:
    // const payload = await verifyJWT(token, process.env.JWT_SECRET);
    // const user = await db.users.findById(payload.userId);

    // For demo: simulate a valid token
    const isValidToken = token === "valid-token-123";

    if (isValidToken) {
      return NextResponse.json({ 
        valid: true, 
        user: { id: "1", role: "admin" } 
      });
    } else {
      return NextResponse.json({ valid: false }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

---

### File: `src/app/(admin)/page.tsx` — Admin Route Group with Auth

```tsx
src/app/(admin)/page.tsx
```

```tsx
// Admin route group — protected with middleware
// The (admin) group organizes admin URLs without changing the file tree

export default function AdminPage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Admin Area</h1>
      <p className="text-zinc-600">
        This is inside the (admin) route group. The (admin) prefix organizes
        admin URLs without appearing in the file tree structure.
      </p>
      <Link href="/(admin)/customers">Customers</Link>
      <Link href="/(admin/products">Products</Link>
    </main>
  );
}
```

---

## 4. What I Should See

**Running `npm run dev`:**

- **Visiting `/admin/dashboard` without a `session-token` cookie** → The middleware redirects to `/login`. The browser shows the login page.
- **Visiting `/admin/dashboard` with a `session-token` cookie** → The middleware allows the request through, and the Dashboard layout re-verifies the session. If valid, the dashboard page shows "Welcome to the Admin Dashboard".
- **Visiting `/login`** → Public page, middleware doesn't redirect (excluded in `config.matcher`).
- **Visiting `/` (home)** → Public page, middleware doesn't redirect.

**`next build` output:**
```
✓ Compiled successfully in 314ms
✓ Auth middleware compiled
○  (Static) prerendered as static content where applicable
```

Middleware runs on the edge and doesn't affect static generation of public pages.

---

## 5. In a Real Multi-tenant E-commerce Platform

- **Tenant resolution from hostname**: The middleware can extract the tenant from the `host` header (e.g., `tenant1.example.com` vs `tenant2.example.com`). Based on the tenant, it can set tenant-specific cookies or redirect to tenant-specific login pages.

- **Middleware + data layer re-check pattern**: 
  1. Middleware checks for a `tenant-session` cookie on protected routes (`/admin`, `/dashboard`, `/customers`).
  2. If no cookie, redirect to `/login?tenant=123`.
  3. The Dashboard/Layout server component re-verified the session by calling the API `/api/auth/verify` with the token.
  4. The API checks the token against the database for that specific tenant.
  5. If the token is valid for the tenant, the page renders. If not, redirect to login.

- **`NEXT_PUBLIC_` vars never leak**: The JWT secret, database passwords, and other secrets are stored in env vars **without** the `NEXT_PUBLIC_` prefix. They're only used on the server (in middleware, route handlers, API routes). Client code never sees them.

- **Session cookie strategy**: 
  - `HttpOnly` cookie set by the login API — not accessible to JavaScript, preventing XSS theft.
  - or `SameSite=Strict` cookie setting to prevent CSRF.
  - The cookie value is a signed JWT or opaque session ID that the server can verify.

- **Tenant-aware middleware**: In the middleware, check `request.nextUrl.hostname` to determine the tenant. Set `tenant` in the request context or a cookie. Server components and route handlers can read the tenant from the context/cookie and scope all database queries to that tenant.

- **Role-based access control**: The middleware + data layer pattern can check not just authentication but also authorization. After verifying the session, check the user's role (admin, editor, viewer) and render different UI or redirect based on the role.

- **API route protection**: API routes (like `/api/orders`) can verify the session token from the cookie in the route handler, ensuring that even if someone bypasses the middleware, they still need valid auth to access the API.

---

## 6. When to Use It and When NOT to

| Use Middleware When | Avoid When |
|---------------------|------------|
| Checking auth on every request to protected routes | You need per-request dynamic auth that changes based on body data (use route handlers instead) |
| Redirecting unauthenticated users before page loads | You want auth checks that work inside the page component (use Server Component auth checks) |
| Locale detection, IP-based features, rate limiting | You need to modify the response body or add complex logic (use Middleware for simple cross-cutting concerns) |

| Use Data-Layer Re-check When | Avoid When |
|------------------------------|------------|
| **Always** — as the second step after middleware | Never rely on middleware alone for security! |
| Verifying sessions, tokens, user roles | You're building a public blog with no auth (overkill) |

| Use `NEXT_PUBLIC_` When | Avoid When |
|------------------------|------------|
| Truly public data that needs to be accessible in the browser (API keys for frontend, feature flags) | **Never** put secrets (JWT secrets, DB passwords, internal API keys) under `NEXT_PUBLIC_`! |
| Environment variables that should leak to the client | All sensitive configuration |

---

## 7. Common Mistakes

1. **Relying on middleware alone for auth** — Middleware runs on the edge and can be bypassed (e.g., by directly calling the API endpoint, using `next start` without middleware, or using `curl`). Always re-verify in a Server Component, route handler, or API route.

2. **Putting JWT secrets in `NEXT_PUBLIC_` env vars** — These leak to the browser! Always keep secrets without the prefix. Use `process.env.JWT_SECRET` only on the server.

3. **Forgetting to export `config` in `middleware.ts`** — If you create `src/middleware.ts` but don't export the `config` object with a `matcher` property, the middleware won't run for any paths.

4. **Using `cookies()` in a client component** — `cookies()` from `next/headers` only works on the server. In client components, use other methods (like `document.cookie` or a library like `react-cookie`).

5. **Not handling the `matcher` exclusions** — If you protect `/admin/:path*` but don't exclude `/admin/login` or `/admin/signup`, the middleware will redirect users away from the login page, creating a loop.

6. **Using `redirect()` in a Server Component without handling the result** — `redirect()` throws a `Redirect` error. In Server Components, you need to make sure the redirect is the last thing that happens, or handle it properly with try/catch if needed.

7. **Assuming cookies are HttpOnly by default** — Cookies set in `next/headers` `cookieStore.set()` are NOT automatically HttpOnly. If you need HttpOnly, you must set it via the response headers or use a framework-specific approach.

8. **Not cleaning up sessions / invalidating tokens** — After login, set the cookie with appropriate `maxAge`, `httpOnly`, and `sameSite` options. After logout, delete the cookie. Without proper session management, users stay logged in forever.

---

## 8. Try it Yourself

1. **Test the middleware protection**: Run `npm run dev`, then visit `/admin/dashboard` without any cookies. You should be redirected to `/login`. Then visit with a `session-token=valid-token-123` cookie (add it in the browser dev tools) and observe the dashboard appears.

2. **Test the data-layer re-check**: The layout component reads the cookie and checks it. Try removing the cookie while on the dashboard page — the layout should detect the missing cookie. (Note: In this demo, it just renders; in a real app, it would redirect.)

3. **Add a `NEXT_PUBLIC_` var** and verify it's accessible in the browser, then contrast with a non-public var that's only server-side.

**Hint for exercise 1:** Add the cookie in Chrome Dev Tools: Application > Cookies > nextjs-learn > Add a new cookie named `session-token` with value `valid-token-123`. Then refresh `/admin/dashboard`.

---

## 9. Next: Ant Design with App Router

[→ docs/10-antd.md](docs/10-antd.md)

**What's coming:** The `"use client"` requirement, SSR style registry, and avoiding flicker when using Ant Design components.