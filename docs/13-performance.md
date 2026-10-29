# 13-performance.md

---

## 1. Simple Explanation (Like I'm 7)

Performance is all about making things fast and smooth. In a Next.js app, we want pages to load instantly, animations to be buttery smooth, and the browser not to work too hard.

Think of these tools:

- **`next/image`** — Like a smart image that resizes itself to fit the screen, changes format to the best one (WebP, AVIF), and loads from a CDN. It only loads the size the browser needs, not the huge original file.

- **Dynamic imports** — Like having a toolbox you only open when you need a specific tool. Instead of loading all JavaScript at once, we load pieces on demand. The page starts fast, and other code loads in the background.

- **Bundle size** — The total amount of JavaScript sent to the browser. Smaller is better. We can analyze it with the `next build` output and tools like `why-did-you-render`.

- **Lighthouse** — Like a health checkup. It runs tests and gives a score for Performance, Accessibility, SEO, and Best Practices. Built into Chrome DevTools.

- **Caching mistakes** — Using the wrong cache can make data stale (users see old prices) or too fresh (server overloaded). We need to know which cache to use when.

Rule: Measure before optimizing. Use Lighthouse. Profile the bundle. Then fix the right problem.

---

## 2. Real Name

| Term | Technical Description |
|------|----------------------|
| **`next/image`** | Next.js Image component that automatically optimizes images. Supports `fill`, `priority`, `loading`, `placeholder`. Serves images from the Edge CDN in modern formats (WebP, AVIF). Must be used with a `next-config.js` `images.domains` configuration. |
| **Dynamic imports** | `import(` function()`` syntax or `next/dynamic()`. Loads JavaScript code on demand rather than at initial page load. Reduces initial bundle size. |
| **`next/font`** | Next.js font optimization. Automatically self-hosts Google Fonts or local fonts. Eliminates FOUD (Flash of Unloaded Fonts). Provides `className` and `variable` for use in CSS. |
| **Bundle size** | The total JavaScript sent to the browser over the network. Measured in kilobytes (KB) or megabytes (MB). Smaller bundles = faster page loads. |
| **Lighthouse** | Automated auditing tool built into Chrome DevTools and Next.js (`next build --lighthouse`). Scores pages on Performance, Accessibility, Best Practices, and SEO. |
| **`webpack-bundle-analyzer`** | Third-party tool (or Next.js report) that visualizes the bundle size, showing which modules are the largest. |
| **Time to First Byte (TTFB)** | How long it takes for the browser to receive the first byte of the response from the server. Cached routes have lower TTFB. |
| **Cumulative Layout Shift (CLS)** | A Core Web Vital. Measures visual stability. Images without width/height, ads injected above content, and font size changes cause CLS. |
| **Largest Contentful Paint (LCP)** | A Core Web Vital. Measures loading performance. The time when the main content (hero image, text block) has loaded. |
| **Total Blocking Time (TBT)** | A Core Web Vital. Measures interactivity. How long the main thread is blocked after FCP (First Contentful Paint). |
| **Cache control** | HTTP headers (`Cache-Control`, `stale-while-revalidate`, `max-age`) that tell browsers and CDNs how long to cache responses. Next.js has its own Data Cache, Full Route Cache, and Router Cache on top of this. |

---

## 3. Example

Let me set up performance examples.

### File: `src/app/images/page.tsx` — Using `next/image`

```tsx
src/app/images/page.tsx
```

```tsx
// next/image — optimized image rendering
// Must have images configured in next.config.ts
// The src must be an absolute URL or a path starting with /

export default function ImagesPage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Optimized Images</h1>
      <p className="text-zinc-600">
        Images are automatically optimized, resized, and served from the CDN.
      </p>

      {/* Hero image — with priority, loads immediately */}
      <img
        src="/hero-banner.jpg"
        alt="Hero banner for the admin dashboard"
        className="w-full h-64 object-cover rounded-md"
        // priority={true} — loads this image first (above the fold)
        priority
      />

      {/* Product image — responsive, loads appropriate size */}
      <img
        src="/product-widget.jpg"
        alt="Widget product showcase"
        className="w-full h-48 object-cover rounded-md my-6"
        // sizes tells the browser how much space the image will take
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    </main>
  );
}
```

*Note: In Next.js 16, the `next/image` component requires configuration in `next.config.ts` under the `images` section. Domain URLs need to be whitelisted.*

---

### File: `src/app/performance/dynamic-imports.tsx` — Dynamic Imports

```tsx
src/app/performance/dynamic-imports.tsx
```

```tsx
// Dynamic imports — load code on demand
// Using next/dynamic() or standard import()

import dynamic from "next/dynamic";

// Load a heavy component only when needed
const HeavyChart = dynamic(() => import("./heavy-chart"), {
  // Loading component shown while the heavy code is loading
  loading: () => <p>Loading chart...</p>,

  // Delay before loading the module (in ms)
  delay: 0,

  // Keep the module in memory after unmounting (in ms)
  //skeleton: () => <HeavyChartSkeleton />,

  // onError: () => <ErrorFallback />,
});

// Or using standard dynamic import with lazy:
const LazyButton = lazy(() => import("./button"));
```

---

### File: `src/app/performance/page.tsx` — Performance Page

```tsx
src/app/performance/page.tsx
```

```tsx
// Performance demo page — shows LCP, CLS metrics and optimized images

export default function PerformancePage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Performance</h1>
      <p className="text-zinc-600">
        Best practices for Next.js apps: image optimization, dynamic imports,
        bundle size analysis, and Lighthouse auditing.
      </p>

      <ImagesSection />

      <DynamicImportsSection />

      <LighthouseSection />
    </main>
  );
}
```

---

### File: `src/app/next-font/page.tsx` — Using `next/font`

```tsx
src/app/next-font/page.tsx
```

```tsx
// next/font — automatically optimizes Google Fonts or local fonts
// Self-hosts the font, eliminates FOUD (Flash of Unloaded Fonts)

// Import the font
const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

// The inter.className is applied to the html/body element
// The inter.variable is available for CSS var usage

export default function NextFontPage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
        Inter Font (Self-Hosted)
      </h1>
      <p className="text-zinc-600">
        This font is self-hosted by Next.js. No external network request,
        no FOUD. Just fast, consistent rendering.
      </p>

      <p className="font-inter text-lg leading-relaxed">
        This paragraph uses the Inter font. Since the font is already loaded
        from the first render, there's no flash of unloaded fonts.
      </p>
    </main>
  );
}
```

*Note: `font-inter` className is applied by Next.js automatically when the component renders. The font is inlined as a CSS `src: local()` at build time.*

---

### File: `src/app/analyze/bundle-analyzer-report.html` — Bundle Analysis

```html
<!-- This is generated by next build --analyze -->
<!-- Don't edit manually -- generated by Webpack -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bundle Analyzer Report</title>
  <style>
    /* Auto-generated styles for the bundle analyzer */
    body { margin: 0; padding: 0; font-family: sans-serif; background: #f5f5f5; }
    .toggle { cursor: pointer; }
    .module { padding: 8px; margin: 4px; background: #fff; border-radius: 4px; }
    .large { background: #ffd; }
    .medium { background: #ffa; }
    .small { background: #afa; }
  </style>
</head>
<body>
  <h1>Bundle Analyzer Report for nextjs-learn</h1>
  <p>Report generated during <i>next build</i></p>
  <!-- The report content is injected by Webpack's plugin -->
</body>
</html>
```

---

## 4. What I Should See

**Running `npm run dev`:**

- **Images page** (`/images`) → Shows two images:
  - The hero banner loads immediately (priority) and fills the width with a height of 64px.
  - The product widget image is responsive — it resizes based on the `sizes` attribute.
  - Both images are optimized (converted to WebP/AVIF served from CDN), so they load faster than original files.

- **Performance page** (`/performance`) → Shows sections for images, dynamic imports, and Lighthouse auditing.

- **Next font page** (`/next-font`) → The `Inter` font is self-hosted. No "flash of unloaded fonts" — the text renders immediately with the Inter font, even on first paint.

**`next build` output:**
```
✓ Compiled successfully in 341ms
✓ Performance assets generated
○  (Static) prerendered as static content where applicable
```

The `next/image` optimized images are compiled into the build. The `next/font` font is inlined as a CSS data URL or `local()` function.

---

## 5. In a Real Multi-tenant E-commerce Platform

- **Product images with `next/image`**: All product photos use `next/image` with the `priority` prop for hero images and responsive `sizes` for product thumbnails. This ensures fast page loads even with many products, as images are automatically resized and served in WebP/AVIF format.

- **Lazy-loaded below-the-fold images**: Images below the product grid use the standard `next/image` without `priority`, so they only load when the user scrolls near them. The `loading="lazy"` attribute (handled by `next/image`) improves TTFB and LCP.

- **Admin dashboard icons**: SVGs or small icons use `next/image` with `width` and `height` props to avoid layout shifts (CLS). The dimensions are known, so the browser can reserve space ahead of time.

- **Font optimization with `next/font`**: The app uses `next/font` for all custom fonts (including Ant Design's base font or a custom logo font). This eliminates FOUD and ensures consistent rendering across all pages, including the admin dashboard and storefront.

- **Dynamic imports for admin widgets**: Complex widgets (charts, drag-and-drop grids, large data tables) are loaded via `next/dynamic()`. The initial dashboard load is fast, and these widgets load in the background when the admin navigates to them.

- **Bundle size monitoring**: The `next build --analyze` command generates a report. The dev team reviews this report on every PR. If a new dependency pushes the bundle over a size limit (e.g., 500KB gzipped for the critical path), it's flagged and the team finds an alternative.

- **Lighthouse CI**: The project includes a GitHub Action that runs Lighthouse on every PR. The Performance score must stay above 90. If it drops, the CI fails and the team investigates.

- **Tenant-aware performance**: In a multi-tenant app, each tenant's page load is measured separately. The middleware + tenancy setup shouldn't add significant overhead (typically < 50ms TTFB). If it does, the tenant resolution logic is optimized.

- **Image CDN edge caching**: `next/image` serves images from the Edge CDN. Images are cached at edge locations globally, so users around the world get fast image loading. The `Cache-Control` headers are set automatically based on the image format and caching policy.

---

## 6. When to Use It and When NOT to

| Use `next/image` When | Avoid When |
|----------------------|------------|
| All images in a Next.js app | Static HTML pages without Next.js |
| Optimizing for Core Web Vitals (LCP, CLS) | You have full control over image hosting and optimization already |
| Responsive images that resize per device | Very simple sites with 1-2 small images |
| CDN-delivered, automatically optimized images | You need pixel-perfect control every step of the pipeline (then use a manual pipeline) |

| Use Dynamic imports When | Avoid When |
|-------------------------|------------|
| Large, rarely-used components (charts, editors, complex tables) | Small, always-needed components (buttons, inputs, simple text) |
| Code splitting for faster initial load | You're already using tree-shaking and unused code removal (Next.js does this automatically) |
| Loading admin-only code on admin pages only | You're loading dynamic imports for things needed on every page |

| Use `next/font` When | Avoid When |
|---------------------|------------|
| All custom fonts in a Next.js app | You're using only system fonts (Arial, system-ui, etc.) |
| Eliminating FOUD and improving performance | You need real-time font loading from a CDN (use a regular `<link>` tag) |
| Self-hosting Google Fonts without external requests | You're using variable fonts with complex subsets (Next.js supports most use cases) |

| Use Lighthouse When | Avoid When |
|--------------------|------------|
| Every PR, CI/CD pipeline, and before deployments | One-off manual checks (use Chrome DevTools instead) |
| Automated performance regression testing | You need detailed, custom performance metrics beyond the 6 Lighthouse categories |

---

## 7. Common Mistakes

1. **Using `next/image` without configuring `images.domains`** — If you use external image URLs (not starting with `/`), you must add the domain to `next.config.ts`'s `images.domains` array. Without this, Next.js throws an error: "Unknown domain, please add it to the domains list in the `images` config."

2. **Forgetting `priority` on above-the-fold images** — Without `priority`, the hero/banner image competes with other resources for loading priority. Adding `priority` ensures it loads first, improving LCP.

3. **Not setting `sizes` on responsive images** — The `sizes` attribute tells the browser how much space the image will take at different viewport widths. Without it, the browser may download a large image even on mobile, wasting bandwidth.

4. **Using `next/font` without `display: "swap"`** — The `display` option controls the FOU (Font Optimal Unload) behavior. `display: "swap"` ensures text is immediately visible in a fallback system font, then swaps to the custom font when loaded. Without it, text may be invisible during font load (FOUT) or block rendering (FOIT).

5. **Ignoring bundle size warnings** — If `next build --analyze` shows a large module, don't ignore it. Investigate why it's large and find alternatives (replace the library, use dynamic imports, or tree-shake).

6. **Not using `loading="lazy"` for below-the-fold images** — While `next/image` handles this automatically, if you use native `<img>` tags, you must add `loading="lazy"` yourself. Without it, all images load immediately, even those below the fold.

7. **Not measuring with Lighthouse before/after optimization** — Optimizations may improve some metrics but hurt others. Always run Lighthouse before and after changes to see the full picture.

8. **Over-dynamic importing everything** — If you dynamically import too many components, you lose the benefit of code splitting. The browser has to fetch multiple small chunks instead of one larger initial bundle. Only dynamically import components that are truly "heavy" or "rarely needed."

---

## 8. Try it Yourself

1. **Add `next/image` optimization**: Add an `<img>` tag with `src="/hero.jpg"` and `priority` to the `/images` page. Then run `next build` and observe it compiles. Visit the page and use Chrome DevTools > Network to observe the image request (it should be optimized WebP/AVIF from the CDN).

2. **Add dynamic import**: Create a heavy component (e.g., a chart with large dependencies) in `src/app/performance/heavy-chart/`. Then import it dynamically on another page using `import("./heavy-chart")` or `next/dynamic()`. Observe the initial page load is faster.

3. **Add `next/font`**: Add `const inter = Inter({ subsets: ["latin"] })` to a page component and use `className={inter.className}` on the `<html>` element (or let Next.js auto-apply it). Observe no FOUD.

4. **Run Lighthouse audit**: Open Chrome DevTools, go to the Lighthouse tab, and run an audit. Then check the `next build --analyze` report and identify the largest modules.

**Hint for exercise 1:** If you get an "Unknown domain" error, add the domain to `next.config.ts`:
```ts
images: {
  domains: ["localhost", "example.com"],
},
```

---

## 9. Next: Deployment

[→ docs/14-deployment.md](docs/14-deployment.md)

**What's coming:** `next build`, standalone output, Docker, environment config, and self-hosting caveats.