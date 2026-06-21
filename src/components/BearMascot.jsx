import React from 'react'

// SVG Bear mascot – flat style, pinkish-brown, dead eyes, thick outline
export default function BearMascot({ size = 80, shake = false, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`${shake ? 'bear-shake' : ''} ${className}`}
      style={{ display: 'inline-block' }}
    >
      {/* Left ear – small round, slightly behind head */}
      <circle cx="24" cy="32" r="11" fill="#A8857A" stroke="#2A1A0E" strokeWidth="3.5" />
      {/* Right ear */}
      <circle cx="76" cy="32" r="11" fill="#A8857A" stroke="#2A1A0E" strokeWidth="3.5" />

      {/* Head – large round, pinkish-brown */}
      <ellipse cx="50" cy="56" rx="38" ry="37" fill="#B8907F" stroke="#2A1A0E" strokeWidth="4" />

      {/* Left eye – dead/half-closed: eyebrow dash + pupil dot */}
      {/* Left eyebrow dash */}
      <rect x="29" y="43" width="13" height="3.5" rx="2" fill="#2A1A0E" />
      {/* Left pupil – sits just below brow, half hidden */}
      <circle cx="35" cy="52" r="4" fill="#2A1A0E" />

      {/* Right eye */}
      {/* Right eyebrow dash */}
      <rect x="58" y="43" width="13" height="3.5" rx="2" fill="#2A1A0E" />
      {/* Right pupil */}
      <circle cx="65" cy="52" r="4" fill="#2A1A0E" />

      {/* Nose – small round dot */}
      <circle cx="50" cy="64" r="3" fill="#2A1A0E" />

      {/* Mouth – flat straight line, unamused */}
      <rect x="43" y="72" width="14" height="3" rx="1.5" fill="#2A1A0E" />
    </svg>
  )
}
