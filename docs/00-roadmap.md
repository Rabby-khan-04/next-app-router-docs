# Next.js App Router Learning Roadmap

**Project:** `nextjs-learn/` | **Next.js:** 16.4.3 | **React:** 19.3.0 | **Node.js:** v24.19.0

A numbered table of contents from beginner to advanced, covering all topics needed to build and maintain an admin dashboard and multi-tenant e-commerce frontend with Next.js, TypeScript, and Ant Design.

---

## Table of Contents

1. [Foundations](docs/01-foundations.md) — Project structure, file-system routing, `page`, `layout`, `template`, `loading`, `error`, `not-found`, `Link` and navigation, dynamic routes, route groups, private folders
2. [Server vs Client Components](docs/02-server-client-components.md) — What runs where, `"use client"`, the boundary, passing props across it, what cannot cross it, composition patterns, common hydration errors
3. [Data Fetching](docs/03-data-fetching.md) — `fetch` in server components, request memoization, caching layers (request memoization, Data Cache, Full Route Cache, Router Cache), `revalidate`, tags, `revalidatePath`, `revalidateTag`, dynamic vs static rendering, how to tell which mode a route uses
4. [Rendering Modes](docs/04-rendering-modes.md) — Static, dynamic, ISR, streaming with Suspense, partial prerendering, `generateStaticParams`
5. [Route Handlers & Server Actions](docs/05a-route-handlers.md) — `route.ts`, Server Actions, forms, `useActionState`, `useFormStatus`, mutations followed by revalidation
6. [Request APIs](docs/05b-request-apis.md) — `cookies()`, `headers()`, `params`, `searchParams` (async or not), middleware (renamed equivalent in newer versions), what it can and cannot do
7. [Metadata & SEO](docs/06-metadata-seo.md) — Metadata and SEO, images, fonts, scripts, environment variables (`NEXT_PUBLIC_*` and what leaks to the browser)
8. [Error Handling](docs/07-error-handling.md) — `notFound()`, `redirect()`, error boundaries
9. [Advanced Routing](docs/08-advanced-routing.md) — Parallel routes, intercepting routes, modals
10. [Auth in Next.js](docs/09-auth.md) — Protecting routes safely (middleware plus re-checking in data layer), keeping secrets out of client code
11. [Ant Design with App Router](docs/10-antd.md) — `"use client"` requirement, SSR style registry, avoiding flicker
12. [Client Data Libraries](docs/11-client-data.md) — When to use React Query or SWR instead of server fetching
13. [Multi-tenant Apps](docs/12-multitenant.md) — Resolving tenant from hostname/custom domain, passing tenant context safely
14. [Performance](docs/13-performance.md) — Bundle size, dynamic imports, `next/image`, caching mistakes, measuring with Lighthouse and build output
15. [Deployment](docs/14-deployment.md) — `next build`, standalone output, Docker, environment config, self-hosting caveats
16. [Real-World Patterns](docs/15-realworld.md) — Admin customers table (server fetch + client Ant Design table with pagination/filters in searchParams), protected dashboard layout, mutation with Server Action and revalidation, tenant-aware storefront, pitfalls of each
17. [Checklist](docs/17-checklist.md) — One checkbox per topic

---

> **⏸️ Pause here** — Review the roadmap above. Approve or request changes before continuing to Step 3.