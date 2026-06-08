import Layout from '@/components/Layout'

export default function TermsPage() {
  return (
    <Layout>
      <div className="space-y-6 text-stone-700 dark:text-stone-300">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100 mb-1">Terms of Use</h1>
          <p className="text-sm text-stone-400 dark:text-stone-500">Last updated: June 2025</p>
        </div>

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 dark:text-stone-200 text-lg">1. Nature of this service</h2>
          <p className="text-sm leading-relaxed">
            Democracy Walk is a self-guided educational audio walk for independent visitors. It is
            not an official guided tour, not a licensed tourist guide service, and it is not
            affiliated with the Hellenic Ministry of Culture, the City of Athens, or any official
            archaeological authority.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 dark:text-stone-200 text-lg">2. Visitor responsibility</h2>
          <p className="text-sm leading-relaxed">
            By using this walk, you confirm that you are visiting the Pnyx independently and at
            your own risk. You are responsible for your own safety, including checking weather
            conditions, wearing appropriate footwear, carrying water, and following all signs and
            regulations at the site.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 dark:text-stone-200 text-lg">3. Accuracy of content</h2>
          <p className="text-sm leading-relaxed">
            The historical information in this walk is provided for educational purposes. While we
            aim for accuracy, we make no warranty as to the completeness or correctness of the
            content. For authoritative information, consult academic sources or the official
            Hellenic Ministry of Culture.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 dark:text-stone-200 text-lg">4. Limitation of liability</h2>
          <p className="text-sm leading-relaxed">
            Democracy Walk accepts no liability for any injury, loss, or damage that occurs during
            your visit to the Pnyx or as a result of following this walk. Use this service at your
            own discretion.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 dark:text-stone-200 text-lg">5. Intellectual property</h2>
          <p className="text-sm leading-relaxed">
            The content of this walk, including text and audio, is the property of Democracy Walk.
            You may not reproduce or distribute it without permission. Historical facts in the public
            domain are not claimed as proprietary.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-stone-800 dark:text-stone-200 text-lg">6. Changes to terms</h2>
          <p className="text-sm leading-relaxed">
            We may update these terms from time to time. Continued use of the service after changes
            constitutes acceptance of the revised terms.
          </p>
        </section>
      </div>
    </Layout>
  )
}
