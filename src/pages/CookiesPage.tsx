import Layout from '@/components/Layout'

export default function CookiesPage() {
  return (
    <Layout>
      <div className="space-y-6 text-stone-700">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-1">Cookie Notice</h1>
          <p className="text-sm text-stone-400">Last updated: June 2025</p>
        </div>

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 text-lg">What are cookies?</h2>
          <p className="text-sm leading-relaxed">
            Cookies are small text files stored on your device by your browser. This website uses
            a minimal number of cookies necessary for the service to function.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 text-lg">Cookies we use</h2>
          <div className="rounded-xl border border-stone-200 overflow-hidden text-sm">
            <div className="grid grid-cols-3 gap-2 bg-stone-100 px-4 py-2 font-semibold text-stone-600">
              <span>Cookie</span>
              <span>Purpose</span>
              <span>Duration</span>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 py-3 border-t border-stone-100">
              <span className="font-mono text-xs text-stone-700">sb-auth-token</span>
              <span className="text-stone-600">Admin session authentication (Supabase)</span>
              <span className="text-stone-500">Session</span>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 text-lg">What we do NOT use</h2>
          <p className="text-sm leading-relaxed">
            We do not use advertising cookies, social media tracking cookies, or any third-party
            analytics cookies. The only cookies set by this site are those strictly necessary for
            the admin authentication system to function.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 text-lg">Visitors (non-admin)</h2>
          <p className="text-sm leading-relaxed">
            If you are using this app as a visitor (not logging into the admin area), no cookies
            are set on your device. Analytics events are collected as anonymous server-side
            records with no cookie tracking.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 text-lg">Managing cookies</h2>
          <p className="text-sm leading-relaxed">
            You can manage or delete cookies through your browser settings. Deleting the
            authentication cookie will log you out of the admin area. It has no effect on the
            visitor experience.
          </p>
        </section>
      </div>
    </Layout>
  )
}
