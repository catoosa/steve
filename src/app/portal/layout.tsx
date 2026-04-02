export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            Campaign Results
          </h1>
          <span className="text-xs text-gray-400">Powered by Skawk</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      <footer className="text-center py-8 text-xs text-gray-400">
        Powered by{" "}
        <a href="https://skawk.io" className="hover:underline">
          Skawk
        </a>
      </footer>
    </div>
  );
}
