# 06-metadata-seo.md

---

## 1. Simple Explanation (Like I'm 7)

Metadata is like the label on a book — it tells people (and search engines) what the page is about without reading the whole thing. In Next.js, you can control what shows up in search results, social media shares, and browser tabs.

Think of these tools:

- **`metadata` object** — Like filling out the book's title, description, and author. You put this in your `layout.tsx` or `page.tsx`.
- **`<title>`** — The text that shows in the browser tab. Like the book's title on the spine.
- **Open Graph tags** — Like sharing info when you paste a link on Facebook/Twitter. Shows the title, description, and image.
- **Twitter Cards** — Like OG tags but for Twitter/X. Customizes how your link looks when shared.
- **`next/image`** — Like a smart image that automatically optimizes size, format, and delivers via CDN. It only loads the size the browser needs.
- **`next/font`** — Like a font that's automatically optimized and self-hosted. No more FOUD (Flash of Unloaded Fonts).

Rule: Add metadata at the top level (layout) for site-wide defaults, override in child pages for specific pages.

---

## 2. Real Name

| Term | Technical Description |
|------|----------------------|
| **`metadata` object** | A JavaScript object exported from `layout.tsx` or `page.tsx` that defines the page metadata. Properties: `title`, `description`, `author`, `keywords`, `openGraph`, `twitter`. Returns a `Metadata` object type. |
| **`next/head`** | Legacy way to add metadata (still works in Next.js 16 for compatibility). Uses `<Head>` component from `next/head`. In App Router, prefer the `metadata` object. |
| **Open Graph (OG)** | Protocol for social media sharing. Key properties: `og:title`, `og:description`, `og:image`, `og:url`. When you share a link, Facebook/Twitter reads these. |
| **Twitter Cards** | Twitter-specific version of OG tags. Key properties: `twitter:title`, `twitter:description`, `twitter:card`, `twitter:image`. |
| **`next/image`** | Next.js image component that automatically optimizes images. Supports `fill`, `priority`, `loading`, `placeholder`. Serves images from the CDN in modern formats (WebP, AVIF). |
| **`next/font`** | Next.js font optimization. Automatically self-hosts Google Fonts or local fonts. Includes `className` and `variable` for use in CSS. |
| **`robots.txt`** | File at `/robots.txt` that tells search engine crawlers which pages to index and which to skip. Next.js generates automatically. |
| **`sitemap.ts`** | Route handler at `/sitemap.xml` that generates the sitemap automatically. Includes all routes and their `lastModified` dates. |

---

## 3. Example

Let me set up metadata and SEO examples.

### File: `src/app/layout.tsx` — Site-Wide Metadata

```tsx
src/app/layout.tsx
```

```tsx
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Next.js Learn - Admin Dashboard",
  description:
    "Learning Next.js App Router with TypeScript and Ant Design",
  keywords: ["nextjs", "app-router", "typescript", "admin", "dashboard"],
  authors: [
    {
      name: "Next.js Learn",
      url: "https://nextjs.org",
    },
  ],
  openGraph: {
    title: "Next.js Learn - Admin Dashboard",
    description:
      "Learning Next.js App Router with TypeScript and Ant Design",
    images: [
      {
        url: "https://nextjs.org social-card.jpg",
        width: 1200,
        height: 630,
        alt: "Next.js Learn social card",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Next.js Learn - Admin Dashboard",
    description:
      "Learning Next.js App Router with TypeScript and Ant Design",
    images: ["https://nextjs.org social-card.jpg"],
  },
  // robotsOptions can control crawler behavior
  robotsOptions: {
    index: true,
    follow: true,
    googleBotIndex: true,
  },
} satisfies Metadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

---

### File: `src/app/dashboard/page.tsx` — Page-Specific Metadata

```tsx
src/app/dashboard/page.tsx
```

```tsx
// Page-specific metadata overrides the layout metadata
// This page has its own title and description

export const metadata = {
  title: "Admin Dashboard - Product Management",
  description:
    "Manage products on the admin dashboard. Add, edit, and remove products.",
  openGraph: {
    title: "Product Management Dashboard",
    description:
      "View and manage the product catalog for the admin dashboard.",
  },
} satisfies Metadata;

export default function DashboardPage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Product Management</h1>
      <p className="text-zinc-600">
        Here you can add, edit, and remove products from the catalog.
      </p>
      <Link href="/">Go to Home</Link>
    </main>
  );
}
```

---

### File: `src/app/not-found/page.tsx` — Custom 404 with Metadata

```tsx
src/app/not-found/page.tsx
```

```tsx
// Custom 404 page with its own metadata
// This replaces the default Next.js 404 page

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

### File: `src/app/sitemap-route.ts` — Sitemap Generation

```tsx
src/app/sitemap-route.ts
```

```tsx
// Sitemap generation route handler
// Generates sitemap.xml automatically
// Next.js can also auto-generate this at /sitemap.xml

import { NextResponse } from "next/server";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://example.com/",
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: "https://example.com/dashboard",
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: "https://example.com/products",
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: "https://example.com/products/1",
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];
}
```

---

### File: `src/app/robots-route.ts` — Robots.txt Generation

```tsx
src/app/robots-route.ts
```

```tsx
// Robots.txt generation route handler
// Serves robots.txt at /robots.txt

import { NextResponse } from "next/server";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/admin", "/dashboard", "/cart"],
      },
    ],
    sitemap: "https://example.com/sitemap.xml",
  };
}
```

---

## 4. What I Should See

**Running `npm run dev`:**

- **Homepage** (`/`) → Browser tab shows "Next.js Learn - Admin Dashboard". Share link on social media shows the title, description, and social card image.
- **Dashboard page** (`/dashboard`) → Browser tab shows "Admin Dashboard - Product Management". Social share shows the overridden OG tags.
- **404 page** (`/nonexistent`) → Custom page with "404" and "Page Not Found", with its own title and description in the browser tab.
- **Sitemap** (`/sitemap.xml`) → Generated XML with all routes and priorities.
- **Robots.txt** (`/robots.txt`) → Shows which paths are allowed/disallowed for crawlers.

**`next build` output:**
```
✓ Compiled successfully in 314ms
✓ Metadata generated
○  (Static) prerendered as static content
```

Metadata is extracted into the static HTML during build. The `next build` process includes all metadata in the generated HTML headers.

---

## 5. In a Real Multi-tenant E-commerce Platform

- **Site-wide metadata** (`layout.tsx`): Sets default title and description for the entire site. Includes the tenant name dynamically if using dynamic route patterns.

- **Page-specific metadata** (`page.tsx`): Each major page (home, product detail, category) overrides the title and description with tenant-specific content. This helps SEO for each tenant's subdomain or custom domain.

- **Open Graph images** (`og:image`): Generate dynamic social media images per tenant. The `openGraph.images[0].url` can point to a dynamic image generation endpoint (e.g., `/api/og-image?tenant=123`) that renders the tenant's logo and product info.

- **Twitter Cards**: Set `twitter:card` to `summary_large_image` for product pages, so when admins share product links on Twitter, they show the product image and price.

- **Tenant-aware sitemap**: The `sitemap.ts` route handler includes URLs for each tenant's pages. In a multi-tenant app, you might dynamically generate sitemap entries based on the tenant's product catalog.

- **Robots.txt per tenant**: The `robots.ts` handler can disallow `/admin` and `/dashboard` for search engines (these are admin-only paths), while allowing `/store` and `/products` to be indexed.

- **Language/locale metadata**: Include `hreflang` tags in metadata for multi-language stores. Each language version of the site gets its own metadata with the correct `hreflang` annotation.

---

## 6. When to Use It and When NOT to

| Use `metadata` object When | Avoid When |
|---------------------------|------------|
| Setting title, description, OG tags for any page | You need legacy `<Head>` component features (use `next/head` for edge cases) |
| Site-wide defaults in `layout.tsx` | You need fine-grained control per-route with `next/head` (possible but redundant) |
| Dynamic metadata based on data (fetch + metadata) | You're on an extremely old Next.js version (pre-App Router) |

| Use `next/head` When | Avoid When |
|---------------------|------------|
| You need to dynamically add/remove metadata after initial render (rare) | You're using App Router (the `metadata` object is the preferred way) |
| You need to conditionally render metadata based on client state | The `metadata` object is sufficient for 95% of use cases |

| Use Open Graph / Twitter Cards When | Avoid When |
|-------------------------------------|------------|
| You want links to look good when shared on social media | You don't care about social share appearance (fine for internal tools) |
| You're building a public-facing website | Never add OG tags (always beneficial for shareability) |

---

## 7. Common Mistakes

1. **Defining `metadata` in both `layout.tsx` and `page.tsx` without overriding** — Both objects merge, but `page.tsx` metadata takes precedence for conflicting keys. If you define the same `title` in both, the page's title wins. This is intentional, but can be confusing if you expect merging behavior.

2. **Forgetting `satisfies Metadata`** — In TypeScript, adding `satisfies Metadata` ensures the object shape is correct. Without it, TypeScript may not catch missing required properties. This is optional but recommended.

3. **Using `next/head` in App Router pages** — The `metadata` object is the App Router way. `next/head` still works for compatibility, but it's the Pages Router pattern and may produce duplicate `<head>` content in App Router.

4. **Omitting `og:image` or Twitter image** — Social media platforms often require an image for "summary_large_image" card type. Without it, the share looks generic or broken.

5. **Hardcoding URLs in OG/Twitter tags** — Use dynamic URLs based on the current request. In Next.js, you can use relative URLs or generate them from the request context.

6. **Not updating metadata for tenant-specific pages** — In a multi-tenant app, each tenant's pages should have unique title/description/metadata, not just the site-wide defaults. This helps with SEO per tenant and prevents duplicate content issues.

7. **Using `satisfies Metadata` with the wrong import** — Make sure you're using the `Metadata` type from `next` (which is the App Router type), not from `next/dist/lib/metadata` (internal).

---

## 8. Try it Yourself

1. **Override the title** for a specific page: In `src/app/dashboard/page.tsx`, add an `export const metadata` object with a different `title`. Visit `/dashboard` and observe the browser tab title changes. Then visit `/` and see the home title.

2. **Add a dynamic OG image**: Create a route handler at `/api/og-image` that generates an image with the current tenant's name. Then reference that URL in `layout.tsx`'s `openGraph.images[0].url`. Visit the home page and share the link on social media (or preview with Twitter Card validator).

3. **Create a custom 404 page**: The docs already have `src/app/not-found/page.tsx`. Visit a non-existent URL like `/nonexistent` and observe the custom 404 page with its own metadata.

**Hint for exercise 2:** The `openGraph.images[0].url` can be a relative URL like `/api/og-image?tenant=123`. The build will embed this in the HTML `<meta>` tags. When shared on Twitter/Facebook, they'll fetch this URL to generate the preview card.

---

## 9. Next: Error Handling

[→ docs/07-error-handling.md](docs/07-error-handling.md)

**What's coming:** `notFound()`, `redirect()`, and error boundaries. How to handle errors gracefully in Next.js App Router.