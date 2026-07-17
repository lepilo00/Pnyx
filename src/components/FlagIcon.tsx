interface FlagIconProps {
  code: string
  className?: string
}

export default function FlagIcon({ code, className = 'h-3.5 w-5' }: FlagIconProps) {
  return (
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt=""
      aria-hidden="true"
      className={`${className} flex-shrink-0 rounded-[2px] object-cover shadow-sm ring-1 ring-black/10`}
    />
  )
}
