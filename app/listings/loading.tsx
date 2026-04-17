export default function ListingsLoading() {
  return (
    <section className="site-container py-12">
      <div className="rounded-2xl border border-brand-100 bg-white p-10 shadow-soft">
        <div className="flex items-center gap-3 text-brand-900">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-800" />
          <div>
            <p className="font-semibold">Loading listings</p>
            <p className="text-sm text-brand-700">Searching the latest homes for you.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
