export default function PageShell({ children }) {
  return (
    <div className="min-h-screen">
      <header className="bg-unca-600 text-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">
            UNCA Transfer Equivalency Tool
          </h1>
          <nav className="text-sm opacity-90"></nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
