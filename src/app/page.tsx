import Link from "next/link";

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