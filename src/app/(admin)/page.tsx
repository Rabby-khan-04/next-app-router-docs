import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="py-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-zinc-600">
        This is inside (admin) route group. The (admin) group lets us organize
        admin URLs without them appearing in the file tree directly.
      </p>
      <Link href="/(admin)/settings">Admin Settings</Link>
    </main>
  );
}