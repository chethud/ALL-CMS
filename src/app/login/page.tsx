import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  const ready = Boolean(process.env.CMS_ACCESS_PASSWORD);

  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
      <section className="hidden bg-[#0B2341] px-12 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8FBFDC]">Content studio</p>
          <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight">Private editor access.</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-[#D5E8F3]">
            Choose a site, then edit its layouts, insights, testimonials, and homepage. Alliance Square is the first site.
          </p>
        </div>
        <p className="text-sm text-[#8FBFDC]">alliance-square.vercel.app · site id alliance-square</p>
      </section>
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0077A8]">Content studio</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#0B2341]">Editor access</h2>
          {ready ? (
            <>
              <p className="mb-6 mt-2 text-sm leading-6 text-[#5C6B7A]">
                This studio has no public sign-in and no account to create. Enter the private editor password.
              </p>
              <LoginForm />
            </>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[#16324F]">
              Add <code>CMS_ACCESS_PASSWORD</code> to <code>.env.local</code> and restart the app. That password is the only way in.
              Also add the Supabase URL and service role key from <code>.env.example</code>, run <code>supabase/schema.sql</code>, then{" "}
              <code>npm run seed</code>.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
