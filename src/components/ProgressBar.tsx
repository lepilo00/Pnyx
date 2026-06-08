interface ProgressBarProps {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100)

  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Stop ${current} of ${total}`}
        className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-1"
      >
        <div
          className="bg-amber-500 h-1 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 text-center font-medium tracking-wide">
        Stop {current} of {total}
      </p>
    </div>
  )
}
