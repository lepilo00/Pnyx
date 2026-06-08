import Layout from '@/components/Layout'

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="space-y-6 text-stone-700">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-1">Privacy Policy</h1>
          <p className="text-sm text-stone-400">Last updated: June 2025</p>
        </div>

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 text-lg">1. Who we are</h2>
          <p className="text-sm leading-relaxed">
            Democracy Walk is an independent educational project. We are not affiliated with any
            official tourism body, municipality, or cultural institution.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 text-lg">2. What data we collect</h2>
          <p className="text-sm leading-relaxed">
            <strong>Email address:</strong> If you choose to sign up for updates, we collect your
            email address and a record of your consent.
          </p>
          <p className="text-sm leading-relaxed">
            <strong>Feedback:</strong> If you submit feedback, we collect your star rating, optional
            written comments, and your answer to the "would you pay" question.
          </p>
          <p className="text-sm leading-relaxed">
            <strong>Analytics events:</strong> We collect anonymous usage events (e.g. page views,
            audio plays) to understand how visitors use the walk. We do not use third-party
            advertising trackers. No personally identifiable information is linked to analytics events.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 text-lg">3. How we use your data</h2>
          <p className="text-sm leading-relaxed">
            We use your email address only to send you updates about this walk when you have
            explicitly consented. We use feedback and analytics to improve the experience. We do not
            sell, share, or rent your data to third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 text-lg">4. Data processor</h2>
          <p className="text-sm leading-relaxed">
            Your data is stored in Supabase, a cloud database service. Supabase acts as a data
            processor on our behalf. Data is stored in the EU region.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 text-lg">5. Your rights (GDPR)</h2>
          <p className="text-sm leading-relaxed">
            Under GDPR, you have the right to access, correct, or delete your personal data at any
            time. To exercise these rights, contact us. You may unsubscribe from emails at any time
            by clicking the unsubscribe link in any email we send.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 text-lg">6. Retention</h2>
          <p className="text-sm leading-relaxed">
            We retain email signup data for as long as you remain subscribed. Feedback and analytics
            data is retained indefinitely for product improvement purposes and contains no
            personally identifiable information.
          </p>
        </section>
      </div>
    </Layout>
  )
}
