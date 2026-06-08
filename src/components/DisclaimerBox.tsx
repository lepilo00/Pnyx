interface DisclaimerBoxProps {
  variant: 'legal' | 'safety' | 'both'
}

const LEGAL_TEXT =
  'This is a self-guided educational audio walk for independent visitors. It is not an official guided tour, not a licensed tourist guide service, and it is not affiliated with the Hellenic Ministry of Culture, the City of Athens, or any official archaeological authority.'

const SAFETY_TEXT =
  'Visitors are responsible for their own safety. Check weather conditions, wear suitable footwear, carry water, avoid extreme heat, and follow all local rules and signs.'

export default function DisclaimerBox({ variant }: DisclaimerBoxProps) {
  return (
    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 p-4 text-sm text-stone-700 dark:text-stone-300 space-y-2">
      {(variant === 'legal' || variant === 'both') && (
        <p className="leading-relaxed">
          <strong className="font-semibold text-stone-800 dark:text-stone-200">Legal notice: </strong>
          {LEGAL_TEXT}
        </p>
      )}
      {(variant === 'safety' || variant === 'both') && (
        <p className="leading-relaxed">
          <strong className="font-semibold text-stone-800 dark:text-stone-200">Safety: </strong>
          {SAFETY_TEXT}
        </p>
      )}
    </div>
  )
}
