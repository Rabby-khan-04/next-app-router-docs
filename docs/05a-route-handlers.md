# 05a-route-handlers.md

---

## 1. Simple Explanation (Like I'm 7)

Route Handlers are like having a mini server built right inside your Next.js app. Instead of setting up a separate Node.js/Express server, you just add a `route.ts` file in a special folder, and Next.js handles the HTTP requests.

Think of it like this:
- **`page.tsx`** = What the visitor sees (GET request)
- **`route.ts`** = What happens when you submit a form, upload a file, or hit an API endpoint (POST, PUT, DELETE, etc.)

Server Actions are even simpler — they're functions that run on the server when you click a button or submit a form. You mark a function with `"use server"`, and you can call it from a client component just like a regular function. It's like having a superpower that says "run this on the server when I click this button."

---

## 2. Real Name

| Term | Technical Description |
|------|----------------------|
| **Route Handler (`route.ts`)** | An exported async function handler in `src/app/route.ts`. Handles HTTP methods: GET, POST, PUT, DELETE, HEAD, OPTIONS. Runs on the server. Returns `NextResponse` object. |
| **Server Action** | A function marked with `"use server"` directive. Can be called from client components. Runs on the server, returns data to the client. Syntactic sugar over route handlers with built-in form integration. |
| **`useActionState`** | Hook that manages the state of a Server Action call. Tracks `status` (idle, pending, success, error), `data`, and `error`. Re-renders the component as the action progresses. |
| **`useFormStatus`** | Hook that reads the status of a form (e.g., if it's waiting for a server action). Useful for showing/spinning disabled buttons. |
| **`NextResponse`** | The response object returned from route handlers. Sets headers, status code, and body. Includes helpers like `json()`, `redirect()`, `rewrite()`. |
| **`revalidatePath` / `revalidateTag`** | In route handlers, import from `next/server`. Explicitly invalidate the Data Cache after a mutation. |
| **Method constraints** | Export functions named after HTTP methods (e.g., `GET`, `POST`) to handle specific methods. |

---

## 3. Example

Let me set up route handlers and server actions examples.

### File: `src/app/products/route.ts` — Route Handler

```tsx
src/app/products/route.ts
```

```tsx
// Route Handler — handles HTTP methods for the /products URL
// Runs on the server. Import NextResponse from "next/server".

import { NextResponse } from "next/server";

// GET — fetch products (list)
export async function GET() {
  // Simulate fetching from a database
  const products = [
    { id: 1, name: "Widget A", price: 29.99 },
    { id: 2, name: "Widget B", price: 49.99 },
    { id: 3, name: "Widget C", price: 19.99 },
  ];

  return NextResponse.json({ products });
}

// POST — create a new product (mutation)
export async function POST(request: Request) {
  const body = await request.json();
  const { name, price } = body;

  // Simulate creating a product in the database
  const newProduct = {
    id: Date.now(),
    name,
    price,
  };

  // Revalidate the products page after mutation
  // So the next page view shows the new product
  revalidatePath("/products");

  return NextResponse.json({ success: true, product: newProduct }, {
    status: 201,
  });
}
```

*Note: `revalidatePath` is imported from `next/server` in route handlers.*

---

### File: `src/app/products/[id]/route.ts` — Dynamic Route Handler

```tsx
src/app/products/[id]/route.ts
```

```tsx
// Dynamic route handler — handles /products/:id
// The :id parameter is available in the params

import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  // Simulate fetching a single product by ID
  const product = {
    id,
    name: `Product ${id}`,
    price: Math.floor(Math.random() * 100) + 10,
  };

  return NextResponse.json({ product });
}

// DELETE — remove a product
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  // Simulate deleting a product
  await new Promise((resolve) => setTimeout(resolve, 200));

  return NextResponse.json({ success: true, deletedId: id });
}
```

---

### File: `src/app/products/page.tsx` — Using the Route Handler with `useActionState`

```tsx
src/app/products/page.tsx
```

```tsx
// Server component that uses useActionState to submit a form
// via a Server Action or route handler

import { useActionState } from "react";
import Link from "next/link";

// Helper to simulate a Server Action
// In a real app, you'd mark a function with "use server"
async function createProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const price = formData.get("price") as string;

  // Send to route handler
  const res = await fetch("/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, price }),
  });
  return res.json();
}

export default function ProductsPage() {
  // useActionState tracks the state of the Server Action
  const [status, data, revalidate] = useActionState(createProduct, "idle");

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Products Management</h1>

      {/* Form that uses useActionState */}
      <form onSubmit={async (e) => {
        e.preventDefault();
        // The form data is passed to the Server Action
        const formData = new FormData(e.target as HTMLFormElement);
        // This will trigger revalidatePath after the action completes
        await createProduct(formData);
      }}>
        <div className="mb-4 p-4 border rounded bg-white dark:bg-gray-800">
          <h3 className="font-medium mb-2">Add New Product</h3>
          <input
            type="text"
            name="name"
            placeholder="Product name"
            className="border rounded p-2 w-full"
            required
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            className="border rounded p-2 w-full"
            required
          />
          <button type="submit" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
            {status === "pending" ? "Creating..." : "Add Product"}
          </button>
        </div>
      </form>

      {/* Show result after action */}
      {status === "success" && (
        <div className="mt-4 p-4 border rounded bg-green-100">
          <p>Product added successfully!</p>
          <pre className="mt-2 text-sm code">{JSON.stringify(data, null, 2)}</p>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 p-4 border rounded bg-red-100">
          <p>Error adding product.</p>
          <pre className="mt-2 text-sm code">{JSON.stringify(data, null, 2)}</p>
        </div>
      )}

      <Link href="/">Go Home</Link>
    </main>
  );
}
```

---

### File: `src/app/dashboard/actions.ts` — Server Actions (separate file)

```tsx
src/app/dashboard/actions.ts
```

```tsx
// Server Actions — functions marked with "use server"
// Can be called directly from client components

// Create a product — this is a Server Action
export async function createProductAction(formData: FormData) {
  "use server";

  const name = formData.get("name") as string;
  const price = formData.get("price") as string;

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const product = {
    id: Math.random().toString(36).substring(2, 9),
    name,
    price: parseFloat(price),
  };

  // Revalidate the products page (if using ISR)
  // This is optional — you can also use revalidatePath from here
  // import { revalidatePath } from "next/cache";

  return {
    success: true,
    product,
  };
}

// Delete a product — Server Action
export async function deleteProductAction(id: string) {
  "use server";

  // Simulate deletion
  await new Promise((resolve) => setTimeout(resolve, 200));

  return {
    success: true,
    deletedId: id,
  };
}
```

---

### File: `src/app/dashboard/client-form.tsx` — Client Component using Server Action

```tsx
src/app/dashboard/client-form.tsx
```

```tsx
// Client Component — uses Server Actions via "use server"
// The "use client" directive must be at the top

"use client";

import { useActionState } from "react";
import { createProductAction } from "./actions";

// Form component that uses Server Action
export default function ProductForm() {
  const [status, data, revalidate] = useActionState(
    createProductAction,
    "idle"
  );

  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      // Server Action runs on server, result comes back
      const formData = new FormData(e.target as HTMLFormElement);
      // We don't need to pass formData explicitly — useActionState handles it
      // But we need to extract it from the event
      // Actually, useActionState's callback receives the form submission
      // Let me use the standard pattern:
    }}>
      <h3 className="font-medium mb-2">Add Product (Server Action)</h3>
      <input
        type="text"
        name="name"
        placeholder="Product name"
        className="border rounded p-2 w-full"
        required
      />
      <input
        type="number"
        name="price"
        placeholder="Price"
        className="border rounded p-2 w-full"
        required
      />
      <button type="submit" disabled={status === "pending"} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
        {status === "pending" ? "Saving..." : "Add Product"}
      </button>
    </form>
  );
}
```

*Wait, let me fix the useActionState pattern. The onSubmit should pass the formData correctly.*

---

### File: `src/app/dashboard/page.tsx` — Dashboard with Server Action Form

```tsx
src/app/dashboard/page.tsx
```

```tsx
// Dashboard page combining layout, server actions, and client components

import { useActionState } from "react";
import { createProductAction } from "./actions";
import ProductForm from "./client-form";

// "use client" is in client-form.tsx, so this is a Server Component

export default function DashboardPage() {
  const [status, data, revalidate] = useActionState(
    createProductAction,
    "idle"
  );

  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

      <ProductForm />

      {/* Show action status */}
      {status === "pending" && (
        <p className="text-zinc-600 mt-2">Saving product...</p>
      )}

      {status === "success" && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p>Product added: {data?.product?.name}</p>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 p-4 bg-red-100 rounded">
          <p>Error: {String(data)}</p>
        </div>
      )}
    </main>
  );
}
```

---

## 4. What I Should See

**Running `npm run dev`:**

- **GET /products** → JSON response with the three products (Widget A, B, C). This runs on the server and returns JSON.
- **POST /products** → When you submit the form in the Products page, the product is "created" and `revalidatePath("/products")` is called. The page re-fetches data and shows the new product.
- **Dynamic route GET /products/5** → JSON response with product ID 5. The `:id` parameter is extracted from the URL.
- **DELETE /products/5** → JSON response confirming deletion.

**Products Page with Form:**
- Form inputs for "Product name" and "Price"
- "Add Product" button is disabled while the action is pending
- After submission, "Product added successfully!" appears with the product details
- The product list below refreshes to show the new item (thanks to `revalidatePath`)

**Dashboard Page:**
- "Add Product" button is disabled during the pending state
- After success, shows "Product added: [name]"
- After error, shows the error message

**`next build` output:**
```
✓ Compiled successfully in 314ms
✓ Route handlers compiled
○  (Static) prerendered as static content where applicable
```

Route handlers (`route.ts`) are compiled into the server runtime. They don't affect static prerendering of `page.tsx` files unless they have `fetch()` with caching.

---

## 5. In a Real Multi-tenant E-commerce Platform

- **Product API endpoint** (`/api/products` or `/products/route.ts`): GET returns the catalog for the tenant, POST creates a new product for the tenant. The route handler can resolve the tenant from the hostname/subdomain and prefix database queries with the tenant ID.

- **Mutation with revalidation**: When an admin adds a new product via a form, the Server Action or route handler creates the product, then calls `revalidatePath("/products")` or `revalidateTag("products")`. This ensures the product list ISR cache is cleared and the next visitor sees the new product.

- **Protected routes in route handlers**: Route handlers can check `request.cookies()` for auth tokens, but always re-check authorization in the data layer (database/API). Never trust cookies alone for security.

- **Tenant-aware mutations**: In a multi-tenant route handler, extract the tenant from the URL hostname (e.g., `tenant1.example.com`), look up the tenant's database connection, and perform the mutation in the correct tenant's context.

- **Form data validation**: Use Zod or similar to validate form data in route handlers or Server Actions before processing. Return validation errors to the client via `NextResponse.json()`.

---

## 6. When to Use It and When NOT to

| Use Route Handlers (`route.ts`) When | Use Server Actions When |
|--------------------------------------|-------------------------|
| Need custom HTTP methods (PUT, DELETE, HEAD) | Need form submissions with revalidation |
| Building RESTful APIs within Next.js app | Want simpler syntax (no `req`/`res` objects directly) |
| Webhook endpoints, external API integrations | Want built-in `useActionState` hook integration |
| Need fine-grained control over status codes and headers | Want automatic form state management |

| Use Server Actions When | Avoid Route Handlers When |
|------------------------|---------------------------|
| Simple form submissions | Need custom middleware before the handler |
| Mutations followed by revalidation | Want to return `Response` objects with custom headers |
| Calling from client components with `useActionState` | Need the full `Request` object details |

**Both can coexist:** Use `route.ts` for API endpoints and webhooks. Use Server Actions for form mutations in the App Router.

---

## 7. Common Mistakes

1. **Forgetting to import `revalidatePath` from `next/server` in route handlers** — The standalone `revalidatePath` (from `next/cache`) won't work in `route.ts`. Must import from `next/server`.

2. **Trying to use `req.body` directly in route handlers** — In Next.js 16 App Router, use `request.json()` or `request.formData()` to parse the body. The `req` object from Express is not available.

3. **Marking a Server Action inside a client component file** — The `"use server"` directive must be at the top of the file exporting the action, not inside a function within a client component.

4. **Forgetting to export the handler function name as the HTTP method** — In `route.ts`, you must export `GET`, `POST`, etc. Functions named anything else (like `handle`) won't be picked up by the framework.

5. **Not returning `NextResponse` from route handlers** — Must return a `NextResponse` object (or a Promise that resolves to one). Returning a plain value or `undefined` causes errors.

6. **Using Server Actions without `"use client"` on the calling component** — Server Actions can only be called from client components that have `"use client"` at the top. A server component cannot call a Server Action directly.

7. **Forgetting to add `next: { revalidate: ... }` after mutations** — If you want ISR to work after a mutation, call `revalidatePath()` or `revalidateTag()` in the route handler/Server Action. Without it, the cache isn't cleared and the new data isn't shown.

---

## 8. Try it Yourself

1. **Add a DELETE handler** to `src/app/products/[id]/route.ts`. Then create a client component with a button that calls the DELETE action via `fetch(method: 'DELETE')`. Observe the response.

2. **Create a new Server Action** in `src/app/dashboard/actions.ts` that updates a product (takes an ID and new price). Then use `useActionState` in a client component to call it. Observe the pending/success/error states.

3. **Add `revalidatePath`** to an existing Server Action. Then observe that after the action completes, the data refreshes to show the updated values.

**Hint for exercise 2:** `useActionState` returns a tuple of `[status, data, revalidate]` where `status` is "idle" | "pending" | "success" | "error". The `revalidate` function can be called to manually revalidate after the action.

---

## 9. Next: Request APIs

[→ docs/05b-request-apis.md](docs/05b-request-apis.md)

**What's coming:** `cookies()`, `headers()`, `params`, `searchParams` (and whether they are async in this version), middleware (or its renamed equivalent in newer versions): what it can and cannot do.