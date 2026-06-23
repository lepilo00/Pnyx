import { useTranslation } from 'react-i18next'

interface ProgressBarProps {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const { t } = useTranslation()
  const pct = Math.round((current / total) * 100)
  const label = t('stop.eyebrow', { current, total })

  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={label}
        className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-1"
      >
        <div
          className="bg-amber-500 h-1 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 text-center font-medium tracking-wide">
        {label}
      </p>
    </div>
  )
}
