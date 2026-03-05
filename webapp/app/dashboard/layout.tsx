import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-lg text-gray-900">Task Manager</span>
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
          Prezentare
        </Link>
        <Link href="/dashboard/tasks" className="text-sm text-gray-600 hover:text-gray-900">
          Sarcini
        </Link>
        <Link href="/dashboard/analytics" className="text-sm text-gray-600 hover:text-gray-900">
          Analitice
        </Link>
        <Link href="/dashboard/team" className="text-sm text-gray-600 hover:text-gray-900">
          Echipa
        </Link>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
