import { AdminLoginForm } from "@/components/admin/admin-login-form";

interface AdminLoginPageProps {
  searchParams?: {
    next?: string;
    error?: string;
  };
}

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const nextPath =
    typeof searchParams?.next === "string" && searchParams.next.startsWith("/admin")
      ? searchParams.next
      : "/admin";

  const initialError =
    searchParams?.error === "missing_admin_token"
      ? "MLS_SYNC_ADMIN_TOKEN is not configured on the server."
      : null;

  return (
    <section className="site-container py-12 sm:py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
        <h1 className="font-heading text-3xl text-brand-900">Admin Sign In</h1>
        <p className="mt-2 text-sm text-brand-700">Enter your MLS sync admin token to access the dashboard.</p>
        <AdminLoginForm nextPath={nextPath} initialError={initialError} />
      </div>
    </section>
  );
}
