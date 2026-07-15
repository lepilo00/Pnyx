// Hand-drawn line-art scene for the "How to get there" card: the Acropolis
// on the left, a dashed walking path with a tiny walker, and the stepped
// rocks of the Pnyx with cypresses on the right (matches the mockup's
// engraving style — scenery in stone strokes, path in amber).
export default function HowToGetThereIllustration() {
  return (
    <svg
      viewBox="0 0 340 132"
      className="w-full h-auto text-stone-500 dark:text-stone-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* ── Acropolis (left) ── */}
      {/* hill */}
      <path d="M4 100 Q30 84 56 80 Q86 76 110 92" />
      <path d="M14 100 q8 -6 18 -7" strokeWidth="1" opacity="0.5" />
      {/* stylobate */}
      <path d="M26 72 H94" />
      <path d="M30 66 H90" />
      {/* columns */}
      <path d="M34 48 V66" />
      <path d="M45 48 V66" />
      <path d="M56 48 V66" />
      <path d="M67 48 V66" />
      <path d="M78 48 V66" />
      <path d="M86 48 V66" />
      {/* entablature + pediment */}
      <path d="M30 48 H90" />
      <path d="M27 44 H93" />
      <path d="M27 44 L60 26 L93 44" />

      {/* ── Dashed walking path ── */}
      <path
        d="M104 96 C 145 112, 200 112, 248 94"
        className="text-amber-600 dark:text-amber-500"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeDasharray="7 7"
      />

      {/* ── Walker (middle) ── */}
      <g strokeWidth="1.6">
        <circle cx="176" cy="83" r="3.6" />
        <path d="M176 87 V98" />
        <path d="M176 90 L170 95 M176 90 L182 94" />
        <path d="M176 98 L171 107 M176 98 L181 106" />
      </g>

      {/* ── Pnyx (right) ── */}
      {/* stepped rock terraces */}
      <path d="M244 100 h22 v-9 h20 v-9 h22 v-8 h20" />
      <path d="M252 100 v-5 M282 91 v-5 M306 82 v-4" strokeWidth="1" opacity="0.5" />
      <path d="M240 106 Q290 96 336 70" strokeWidth="1" opacity="0.4" />
      {/* bema block */}
      <path d="M312 74 h14 v-8 h-14 z" />
      {/* cypress trees */}
      <path d="M252 78 q5 -14 0 -26 q-5 12 0 26 z" />
      <path d="M252 78 V86" />
      <path d="M296 96 q4 -11 0 -21 q-4 10 0 21 z" />
      <path d="M296 96 V102" />

      {/* ground */}
      <path d="M6 112 H140 M200 112 H334" strokeWidth="1" opacity="0.35" />
    </svg>
  )
}
