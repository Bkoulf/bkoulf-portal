'use client'

import { useEffect, useState } from 'react'

export function BkMascot({ size = 180 }: { size?: number }) {
  const [blinking, setBlinking] = useState(false)

  useEffect(() => {
    function blink() {
      setBlinking(true)
      setTimeout(() => setBlinking(false), 120)
      setTimeout(blink, 2500 + Math.random() * 3000)
    }
    const t = setTimeout(blink, 1800)
    return () => clearTimeout(t)
  }, [])

  const s = size
  const eyeW = 11
  const eyeH = blinking ? 2 : 32
  const eyeY = blinking ? 99 : 83

  return (
    <div style={{ width: s, height: s, position: 'relative', animation: 'bk-float 4s ease-in-out infinite' }}>
      <style>{`
        @keyframes bk-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes bk-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 0.85; transform: scale(1.06); }
        }
        @keyframes bk-color-fade {
          0%   { stop-color: #0A1E38; }
          25%  { stop-color: #0D2D55; }
          50%  { stop-color: #102040; }
          75%  { stop-color: #0A2850; }
          100% { stop-color: #0A1E38; }
        }
        @keyframes bk-color-mid {
          0%   { stop-color: #1B4F8A; }
          30%  { stop-color: #2D7DD2; }
          60%  { stop-color: #1B3A6A; }
          100% { stop-color: #1B4F8A; }
        }
        @keyframes bk-color-edge {
          0%   { stop-color: #060F1E; }
          40%  { stop-color: #0A1830; }
          70%  { stop-color: #050D1A; }
          100% { stop-color: #060F1E; }
        }
      `}</style>

      {/* Glow externo pulsante */}
      <div style={{
        position: 'absolute',
        inset: '-20%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(45,125,210,0.4) 0%, rgba(45,125,210,0.1) 50%, transparent 75%)',
        filter: 'blur(20px)',
        animation: 'bk-glow 4s ease-in-out infinite',
      }} />

      <svg
        width={s}
        height={s}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <defs>
          {/* Gradiente base animado — fade de cores com foco no azul */}
          <radialGradient id="bk-sphere" cx="50%" cy="50%" r="65%">
            <stop offset="0%"   stopColor="#1B4F8A">
              <animate attributeName="stop-color"
                values="#1B4F8A;#2D7DD2;#1B3A6A;#2563A8;#1B4F8A"
                dur="5s" repeatCount="indefinite" />
            </stop>
            <stop offset="45%"  stopColor="#0A1E38">
              <animate attributeName="stop-color"
                values="#0A1E38;#0D2D55;#102040;#0A2850;#0A1E38"
                dur="5s" repeatCount="indefinite" />
            </stop>
            <stop offset="80%"  stopColor="#060F1E">
              <animate attributeName="stop-color"
                values="#060F1E;#0A1830;#050D1A;#081525;#060F1E"
                dur="5s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#030810" />
          </radialGradient>

          {/* Gradiente secundário — variação sutil de tons */}
          <radialGradient id="bk-overlay" cx="30%" cy="70%" r="60%">
            <stop offset="0%"   stopColor="rgba(45,125,210,0.18)">
              <animate attributeName="stop-opacity"
                values="0.18;0.35;0.12;0.28;0.18"
                dur="6s" repeatCount="indefinite" />
            </stop>
            <stop offset="60%"  stopColor="rgba(27,79,138,0.08)">
              <animate attributeName="stop-opacity"
                values="0.08;0.18;0.05;0.14;0.08"
                dur="6s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="rgba(45,125,210,0)" />
          </radialGradient>

          <clipPath id="bk-clip">
            <circle cx="100" cy="100" r="96" />
          </clipPath>
        </defs>

        {/* Base animada */}
        <circle cx="100" cy="100" r="96" fill="url(#bk-sphere)" />

        {/* Overlay de cor animado */}
        <circle cx="100" cy="100" r="96" fill="url(#bk-overlay)" clipPath="url(#bk-clip)" />

        {/* Olho esquerdo */}
        <rect
          x="70"
          y={eyeY}
          width={eyeW}
          height={eyeH}
          rx={eyeW / 2}
          fill="white"
          style={{
            transition: 'height 0.08s ease, y 0.08s ease',
            filter: 'drop-shadow(0 0 8px rgba(91,175,245,0.9))',
          }}
        />

        {/* Olho direito */}
        <rect
          x={113}
          y={eyeY}
          width={eyeW}
          height={eyeH}
          rx={eyeW / 2}
          fill="white"
          style={{
            transition: 'height 0.08s ease, y 0.08s ease',
            filter: 'drop-shadow(0 0 8px rgba(91,175,245,0.9))',
          }}
        />

        {/* Borda translúcida */}
        <circle cx="100" cy="100" r="95" stroke="rgba(91,175,245,0.2)" strokeWidth="1" fill="none" />
      </svg>
    </div>
  )
}
