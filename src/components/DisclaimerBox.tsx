import { useTranslation } from 'react-i18next'

interface DisclaimerBoxProps {
  variant: 'legal' | 'safety' | 'both'
}

export default function DisclaimerBox({ variant }: DisclaimerBoxProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 p-4 text-sm text-stone-700 dark:text-stone-300 space-y-2">
      {(variant === 'legal' || variant === 'both') && (
        <p className="leading-relaxed">
          <strong className="font-semibold text-stone-800 dark:text-stone-200">
            {t('disclaimer.legalLabel')}{' '}
          </strong>
          {t('disclaimer.legalText')}
        </p>
      )}
      {(variant === 'safety' || variant === 'both') && (
        <p className="leading-relaxed">
          <strong className="font-semibold text-stone-800 dark:text-stone-200">
            {t('disclaimer.safetyLabel')}{' '}
          </strong>
          {t('disclaimer.safetyText')}
        </p>
      )}
    </div>
  )
}
