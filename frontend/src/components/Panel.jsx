export default function Panel({ title, children, actions }) {
  return (
    <section className="bg-white shadow-card rounded-xl border border-slate-200">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-slate-900 font-semibold">{title}</h2>
        <div className="flex gap-2">{actions}</div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
