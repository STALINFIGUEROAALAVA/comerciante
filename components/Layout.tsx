import { JSX } from "preact";

interface LayoutProps {
  session?: {
    username: string;
    role: string;
  };
  children: JSX.Element;
}

export default function Layout({ session, children }: LayoutProps) {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  if (!session) {
    return <div>{children}</div>;
  }

  const isAdmin = session.role === "admin";

  return (
    <div class="min-h-screen bg-gray-100">
      <nav class="bg-blue-600 text-white shadow-lg">
        <div class="container mx-auto px-4">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center space-x-4">
              <a href="/" class="text-xl font-bold">
                Billing System
              </a>
              <div class="hidden md:flex space-x-2">
                <a
                  href="/products"
                  class="px-3 py-2 rounded hover:bg-blue-700"
                >
                  Products
                </a>
                <a
                  href="/customers"
                  class="px-3 py-2 rounded hover:bg-blue-700"
                >
                  Customers
                </a>
                <a
                  href="/invoices"
                  class="px-3 py-2 rounded hover:bg-blue-700"
                >
                  Invoices
                </a>
                <a
                  href="/warehouses"
                  class="px-3 py-2 rounded hover:bg-blue-700"
                >
                  Warehouses
                </a>
                <a
                  href="/transfers"
                  class="px-3 py-2 rounded hover:bg-blue-700"
                >
                  Transfers
                </a>
                <a
                  href="/adjustments"
                  class="px-3 py-2 rounded hover:bg-blue-700"
                >
                  Adjustments
                </a>
                <a
                  href="/kardex"
                  class="px-3 py-2 rounded hover:bg-blue-700"
                >
                  Kardex
                </a>
                <a
                  href="/valuation"
                  class="px-3 py-2 rounded hover:bg-blue-700"
                >
                  Valuation
                </a>
                {isAdmin && (
                  <a
                    href="/periods"
                    class="px-3 py-2 rounded hover:bg-blue-700"
                  >
                    Periods
                  </a>
                )}
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <span class="text-sm">
                {session.username} ({session.role})
              </span>
              <button
                onClick={handleLogout}
                class="px-4 py-2 bg-red-500 hover:bg-red-600 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main class="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
