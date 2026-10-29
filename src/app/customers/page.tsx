import Link from "next/link";

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