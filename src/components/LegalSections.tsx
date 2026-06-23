import { Trans } from 'react-i18next'

export interface LegalSection {
  heading: string
  paragraphs: string[]
}

interface LegalSectionsProps {
  sections: LegalSection[]
}

export default function LegalSections({ sections }: LegalSectionsProps) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.heading} className="space-y-2">
          <h2 className="font-semibold text-stone-800 dark:text-stone-200 text-lg">{section.heading}</h2>
          {section.paragraphs.map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed">
              <Trans defaults={paragraph} components={{ strong: <strong /> }} />
            </p>
          ))}
        </section>
      ))}
    </>
  )
}
