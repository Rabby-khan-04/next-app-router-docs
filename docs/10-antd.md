# 10-antd.md

---

## 1. Simple Explanation (Like I'm 7)

Ant Design is a collection of beautiful React components (like buttons, tables, forms, menus) that help you build good-looking UIs quickly. But Ant Design components are "stateful" — they need to run in the browser to work properly.

Next.js App Router defaults to "Server Components," which run on the server and send HTML to the browser. If you put Ant Design components above the `"use client"` line, they'll try to run on the server and fail.

Think of it like this:
- **Server Components** = Like a PDF document. People can read it, but they can't fill out the forms or click buttons.
- **Client Components** = Like a web page. People can interact with it, click buttons, fill forms.

Rule: Ant Design needs `"use client"` somewhere in the tree so the interactive components run in the browser.

---

## 2. Real Name

| Term | Technical Description |
|------|----------------------|
| **`"use client"`** | Directive at the top of a file that makes it a Client Component. Required for Ant Design components, any component using `useState`/`useEffect`, and any component with event handlers. |
| **Ant Design (antd)** | A React UI component library with hundreds of pre-styled components (`<Button>`, `<Table>`, `<Form>`, `<Modal>`, `<Avatar>`, etc.). Imported from `antd` with CSS from `antd/dist/antd.css`. |
| **SSR (Server-Side Rendering) registry** | Ant Design's way of managing global state (like theme, locale) across server and client. In Next.js, the registry must be initialized on the client because the server doesn't have a `window` object. |
| **`antd-es` / `antd`** | The npm package. `antd` includes both the components and the CSS. `antd-es` is the ES module build. Both work with Next.js 16. |
| **`Provider`** | Ant Design's top-level component that wraps the app and provides context (theme, locale, etc.). Usually `<ThemeProvider>` or `<AuthProvider>`. |
| **`StyleProvider`** | Ant Design component for customizing CSS variables (primary color, border radius, etc.) without modifying the source code. |
| **Flicker** | The moment where the server-rendered HTML shows up first, then the client-side JavaScript loads and re-renders the components with different styling. Can cause a "flash" of unstyled content. |

---

## 3. Example

Let me set up Ant Design examples with the App Router.

### File: `src/app/antd/client-component.tsx` — Client Component with Ant Design

```tsx
src/app/antd/client-component.tsx
```

```tsx
// Client Component — Ant Design needs "use client"
// This is the top-level directive that enables Ant Design

"use client";

import React, { useState } from "react";
import { Button, Table, message } from "antd";
import "antd/dist/antd.css"; // Import Ant Design CSS

// Table component — needs client side
interface Row {
  key: string;
  name: string;
  age: number;
  address: string;
}

export default function AntdTable() {
  const [dataSource, setDataSource] = useState<Row[]>([
    { key: "1", name: "John Brown", age: 32, address: "New York No. 1 Lake Park" },
    { key: "2", name: "Jim Green", age: 42, address: "Chicago No. 1 Lake Park" },
    { key: "3", name: "Joe Black", age: 32, address: "New Jersey No. 1 Lake Park" },
    { key: "4", name: "Jim Red", age: 32, address: "New Jersey No. 1 Lake Park" },
  ]);

  const [visible, setVisible] = useState(false);

  const showDetail = (record: Row) => {
    message.info(`Detail of ${record.name}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Ant Design Table</h2>

      <Table
        dataSource={dataSource}
        columns={[
          {
            title: "Name",
            dataIndex: "name",
            key: "name",
          },
          {
            title: "Age",
            dataIndex: "age",
            key: "age",
          },
          {
            title: "Action",
            key: "action",
            render: (info) => (
              <Button type="primary" onClick={() => showDetail(info.record)}>
                Detail
              </Button>
            ),
          },
        ]}
        pagination={{ pageSize: 4 }}
        rowSelection={{
          selectedRowKeys: [],
          onChange: selectedRowKeys => console.log(selectedRowKeys),
        }}
      />

      {/* Modal button */}
      <Button
        type="primary"
        onClick={() => setVisible(true)}
        className="mt-4"
      >
        Add User
      </Button>

      {/* Ant Design Modal — also needs client state */}
      <React.Fragment>
        {visible && (
          <div>
            <h3>Add User Form</h3>
            <p>This modal would appear here.</p>
            <button onClick={() => setVisible(false)}>Close</button>
          </div>
        )}
      </React.Fragment>
    </div>
  );
}
```

---

### File: `src/app/antd/page.tsx` — Page Using Ant Design Components

```tsx
src/app/antd/page.tsx
```

```tsx
// Page — Server Component that imports and uses the Client Component
// The page itself is a Server Component, but it renders the Client Component

import AntdTable from "./antd/client-component";

export default function AntdPage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Ant Design Components</h1>
      <p className="text-zinc-600">
        Below are Ant Design components that run in the browser.
      </p>

      {/* The AntDesignTable component is a Client Component 
          (has "use client" at the top) */}
      <AntdTable />
    </main>
  );
}
```

---

### File: `src/app/antd/theme-provider.tsx` — Ant Design Theme Customization

```tsx
src/app/antd/theme-provider.tsx
```

```tsx
// ThemeProvider — customize Ant Design CSS variables
// This must be a Client Component since it uses window

"use client";

import { StyleProvider } from "antd";

const theme = {
  // Primary color
  primaryColor: "#1890ff",
  // Border radius
  borderRadius: 4,
  // Color config
  colorConfig: {
    error: "#f5222d",
    warning: "#faad14",
    success: "#52c41a",
    info: "#1890ff",
  },
};

export default function AntdThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StyleProvider theme={theme}>
      {children}
    </StyleProvider>
  );
}
```

---

### File: `src/app/antd/layout-with-antd.tsx` — Layout Using Ant Design

```tsx
src/app/antd/layout-with-antd.tsx
```

```tsx
// Layout with Ant Design — sidebar using Ant Design components
// The layout itself can be a Server Component,
// but Ant Design child components need "use client"

"use client";

import React from "react";
import { Layout, Menu, Breadcrumb } from "antd";
import "antd/dist/antd.css";

const { Header, Sider, Content } = Layout;

export default function AntdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <Layout className="min-h-screen">
      <Header
        className="bg-zinc-100 dark:bg-zinc-900 p-4 border-b border-gray-200 dark:border-gray-800"
      >
        <Breadcrumb
          style={{ margin: 0, background: 'transparent' }}
          separator=","
        >
          <Breadcrumb.Item>Admin</Breadcrumb.Item>
          <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        </Breadcrumb>
      </Header>

      <Sider
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          background: 'var(--sidebar-bg, #f0f2f5)',
        }}
      >
        <Menu
          mode="inline"
          defaultOpenKeys={['sub1']]
          selectedKeys={['1']]
          style={{ height: 'calc(100vh - 160px)', borderRight: '1px solid #dcdcdc' }}
        >
          <Menu.Item key="1">
            <span className="ant-menu-item-title">Dashboard</span>
          </Menu.Item>
          <SubMenu key="sub1">
            <Menu.Item key="2">Products</Menu.Item>
            <Menu.Item key="3">Orders</Menu.Item>
          </SubMenu>
        </Menu>
      </Sider>

      <Content
        style={{
          marginLeft: collapsed ? 64 : 260,
          padding: 24,
          minHeight: '100vh',
        }}
      >
        {children}
      </Content>
    </Layout>
  );
}
```

---

## 4. What I Should See

**Running `npm run dev`:**

- **Ant Design page** (`/antd`) → Shows "Ant Design Components" heading, then the Ant Design Table with 4 rows (John Brown, Jim Green, Joe Black, Jim Red). The table has pagination (showing 4 rows per column headers) and action buttons. Below the table, a "Add User" button that would toggle a modal.

- **Table interactions** → You can click the "Detail" button on each row to see a message popup (info message). The "Add User" button toggles the modal visibility.

- **CSS is loaded** → Ant Design components have their default styling (blue buttons, table borders, etc.).

- **Terminal output** from `next dev`:
  ```
  ✓ Ready in ...
  ```

- **`next build` output**:
  ```
  ✓ Compiled successfully in 314ms
  ○  (Static) prerendered as static content where applicable
  ```

  The Ant Design client component JavaScript is loaded as a separate chunk. The initial HTML is statically generated for the Server Components part.

---

## 5. In a Real Multi-tenant E-commerce Platform

- **Admin dashboard table**: The admin sees a table of customers, orders, or products using Ant Design `<Table>`. The table supports sorting, filtering, pagination, and row selection. All of these run in the client (`"use client"`), while the initial data is fetched by a parent Server Component.

- **Add/Edit modals**: When the admin clicks "Add Product" or "Edit Product", an Ant Design `<Modal>` opens in a client component. The form inside the modal uses controlled components and validates fields. After submission, the table data refetches (via revalidation).

- **Tenant-aware sidebar**: The sidebar (a `(side)` parallel route) uses Ant Design `<Menu>` and `<Breadcrumb>` to show the current tenant and navigation. The sidebar persists across page changes because it's in a layout.

- **Theme customization**: The app can have a custom Ant Design theme (primary color, border radius) that matches the tenant's branding. The `StyleProvider` component sets CSS variables that apply across all Ant Design components.

- **Avoiding flicker**: The key is to ensure `"use client"` is at the right level. If the top-level layout has `"use client"`, the entire app becomes a client component, which hurts performance. Instead, add `"use client"` only where Ant Design components are used. The server-rendered HTML for non-AntDesign parts still streams from the server, and only the AntDesign parts hydrate on the client.

- **Locale support**: Ant Design supports multiple locales (English, Chinese, etc.). In a multi-tenant app, you can switch the locale based on the tenant's region, using Ant Design's `LocaleProvider`.

---

## 6. When to Use It and When NOT to

| Use Ant Design When | Avoid When |
|---------------------|------------|
| Building admin dashboards, enterprise apps, CRM systems | Building simple marketing pages or content-focused sites |
| Need consistent, professional UI quickly | You need complete custom design control (build from scratch or use Tailwind) |
| Table grids, forms, modals, navigation menus | You only need a few simple buttons or inputs |
| Team familiar with React and Enterprise UI patterns | You're building a highly bespoke, unique design system |

| Use `"use client"` only where needed | Avoid putting `"use client"` at the top of `layout.tsx` or `_app.tsx` |
|---------------------------------------|------------------------------------------------------------|
| Ant Design components, forms, tables, modals | Making the entire app a client component unnecessarily |
| Any component using hooks (`useState`, `useEffect`) | Losing the benefits of Server Components (fast initial load, less JS) |

| Use `antd/dist/antd.css` import When | Avoid when you only need specific components |
|--------------------------------------|---------------------------------------------|
| Most Ant Design components need the full CSS | You only use 2-3 components and want to minimize CSS (import individual component CSS) |

---

## 7. Common Mistakes

1. **Putting `"use client"` in `layout.tsx`** — This makes the entire app a Client Component, losing all Server Component benefits (no data fetching on server, more JavaScript sent to browser). Only add `"use client"` where Ant Design components are used.

2. **Forgetting to import `antd/dist/antd.css`** — Ant Design components won't style themselves. The CSS must be imported somewhere in the tree (usually in the client component that first uses Ant Design, or in `_app.tsx` for Pages Router, but in App Router, import in the client component).

3. **Using Ant Design components in a pure Server Component** — If you write `<Table />` in a file without `"use client"`, Next.js will throw a hydration error because the component tries to use React state/hooks that don't exist on the server.

4. **Importing Ant Design in multiple places** — Import `antd/dist/antd.css` only once (in the first client component that uses Ant Design). Importing it multiple times doesn't cause errors but is unnecessary.

5. **Not using `key` prop on Table rows** — Ant Design's `<Table>` requires a `key` on each data source item for proper virtual rendering. Without it, you may see warnings or rendering issues.

6. **State leaking between Server and Client** — Don't store user input or form state in Server Components if it needs to persist across interactions. Move the form to a Client Component with `"use client"` and use `useState` for the form state.

7. **Using Ant Design v5 with incompatible imports** — Make sure the Ant Design version matches the React version. Next.js 16 uses React 19, so Ant Design v5 (compatible with React 18/19) should work fine.

8. **Not accounting for SSR registry** — Ant Design's global state (theme, locale) needs to be initialized on the client. If you set theme in a Server Component, it won't persist. Use `StyleProvider` in a Client Component, or use `getThemeFromCSSVariable` patterns.

---

## 8. Try it Yourself

1. **Add a `<Modal>`** to the `AntdTable` component. When a row is clicked, open a modal with the row's details and an "Edit" button. The modal should have state management with `useState`.

2. **Create a `<Form>`** using Ant Design's `<Form>`, `<Input>`, `<Rule>` (for validation). Use `useState` to manage form values and `resetFields` after successful submission.

3. **Add a `<ThemeProvider>`** wrapper around the Ant Design components in your app. Set a custom `primaryColor` and observe that all blue buttons and table headers change color.

**Hint for exercise 1:** Use the `visible` state pattern like in the example: `const [visible, setVisible] = useState(false)` and `setVisible(true)` on button click, `setVisible(false)` on modal close.

---

## 9. Next: Client Data Libraries

[→ docs/11-client-data.md](docs/11-client-data.md)

**What's coming:** When to use React Query or SWR instead of server fetching.