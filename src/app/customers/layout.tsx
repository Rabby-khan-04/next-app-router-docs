import "../globals.css";

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* This layout wraps the customers page */}
      <nav className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-medium">Admin Panel</h2>
      </nav>
      <div className="p-4">{children}</div>
    </div>
  );
}