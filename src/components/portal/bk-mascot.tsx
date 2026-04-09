'use client'

import { useEffect, useState } from 'react'

export function BkMascot({ size = 180 }: { size?: number }) {
  const [blinking, setBlinking] = useState(false)

  useEffect(() => {
    function blink() {
      setBlinking(true)
      setTimeout(() => setBlinking(false), 150)
      setTimeout(blink, 2000 + Math.random() * 3000)
    }
    const t = setTimeout(blink, 1500)
    return () => clearTimeout(t)
  }, [])

  const s = size
  const eyeH = blinking ? 3 : s * 0.13
  const eyeW = s * 0.07

  return (
    <div
      style={{
        width: s,
        height: s,
        position: 'relative',
        animation: 'bk-float 3.5s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes bk-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes bk-glow-pulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.9; }
        }
        @keyframes bk-scan {
          0% { transform: translateY(-96px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(96px); opacity: 0; }
        }
        @keyframes bk-orbit {
          from { transform: rotate(0deg) translateX(52px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(52px) rotate(-360deg); }
        }
        @keyframes bk-orbit2 {
          from { transform: rotate(120deg) translateX(38px) rotate(-120deg); }
          to   { transform: rotate(480deg) translateX(38px) rotate(-480deg); }
        }
        @keyframes bk-orbit3 {
          from { transform: rotate(240deg) translateX(68px) rotate(-240deg); }
          to   { transform: rotate(600deg) translateX(68px) rotate(-600deg); }
        }
        @keyframes bk-ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes bk-ring-spin-rev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes bk-hue-shift {
          0%   { stop-color: #00CFFF; }
          25%  { stop-color: #7B2FFF; }
          50%  { stop-color: #00FFB2; }
          75%  { stop-color: #FF2F8E; }
          100% { stop-color: #00CFFF; }
        }
        @keyframes bk-hue-shift2 {
          0%   { stop-color: #2D7DD2; }
          25%  { stop-color: #00FFB2; }
          50%  { stop-color: #7B2FFF; }
          75%  { stop-color: #2D7DD2; }
          100% { stop-color: #2D7DD2; }
        }
        @keyframes bk-pulse-ring {
          0%, 100% { opacity: 0.25; r: 60; }
          50% { opacity: 0.55; r: 68; }
        }
        @keyframes bk-data-flow {
          0%   { stroke-dashoffset: 200; opacity: 0.8; }
          100% { stroke-dashoffset: 0;   opacity: 0.2; }
        }
        @keyframes bk-flicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.3; }
          94% { opacity: 1; }
          97% { opacity: 0.5; }
          98% { opacity: 1; }
        }
      `}</style>

      {/* Glow externo multicor */}
      <div style={{
        position: 'absolute',
        inset: '-25%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,207,255,0.3) 0%, rgba(123,47,255,0.15) 45%, transparent 70%)',
        filter: 'blur(22px)',
        animation: 'bk-glow-pulse 3.5s ease-in-out infinite',
      }} />

      {/* SVG do mascote */}
      <svg
        width={s}
        height={s}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'relative', zIndex: 1, animation: 'bk-flicker 8s ease-in-out infinite' }}
      >
        <defs>
          {/* Gradiente principal - mais escuro para mostrar efeitos */}
          <radialGradient id="bk-sphere" cx="42%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#1a4a7a" />
            <stop offset="40%" stopColor="#0a1f3d" />
            <stop offset="75%" stopColor="#060e20" />
            <stop offset="100%" stopColor="#030810" />
          </radialGradient>

          {/* Gradiente do brilho de vidro */}
          <radialGradient id="bk-glass" cx="38%" cy="28%" r="45%">
            <stop offset="0%" stopColor="rgba(0,207,255,0.2)" />
            <stop offset="60%" stopColor="rgba(0,207,255,0.03)" />
            <stop offset="100%" stopColor="rgba(0,207,255,0)" />
          </radialGradient>

          {/* Gradiente animado interior */}
          <radialGradient id="bk-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,207,255,0.12)" />
            <stop offset="100%" stopColor="rgba(123,47,255,0.04)" />
          </radialGradient>

          {/* Gradiente da linha de scan */}
          <linearGradient id="bk-scan-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,207,255,0)" />
            <stop offset="50%" stopColor="rgba(0,207,255,0.6)" />
            <stop offset="100%" stopColor="rgba(0,207,255,0)" />
          </linearGradient>

          {/* Gradiente do anel 1 */}
          <linearGradient id="bk-ring1-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00CFFF" stopOpacity="0.9">
              <animate attributeName="stop-color" values="#00CFFF;#7B2FFF;#00FFB2;#FF2F8E;#00CFFF" dur="4s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="#7B2FFF" stopOpacity="0.4">
              <animate attributeName="stop-color" values="#7B2FFF;#00FFB2;#FF2F8E;#00CFFF;#7B2FFF" dur="4s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#00FFB2" stopOpacity="0">
              <animate attributeName="stop-color" values="#00FFB2;#FF2F8E;#00CFFF;#7B2FFF;#00FFB2" dur="4s" repeatCount="indefinite" />
            </stop>
          </linearGradient>

          {/* Gradiente do anel 2 */}
          <linearGradient id="bk-ring2-grad" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF2F8E" stopOpacity="0.7">
              <animate attributeName="stop-color" values="#FF2F8E;#00CFFF;#7B2FFF;#00FFB2;#FF2F8E" dur="5s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#00FFB2" stopOpacity="0">
              <animate attributeName="stop-color" values="#00FFB2;#7B2FFF;#00CFFF;#FF2F8E;#00FFB2" dur="5s" repeatCount="indefinite" />
            </stop>
          </linearGradient>

          {/* Clip circular */}
          <clipPath id="bk-circle">
            <circle cx="100" cy="100" r="96" />
          </clipPath>

          {/* Clip menor para efeitos internos */}
          <clipPath id="bk-inner-clip">
            <circle cx="100" cy="100" r="93" />
          </clipPath>
        </defs>

        {/* Esfera base */}
        <circle cx="100" cy="100" r="96" fill="url(#bk-sphere)" />

        {/* Core glow central */}
        <circle cx="100" cy="100" r="96" fill="url(#bk-core)" clipPath="url(#bk-circle)" />

        {/* Grid hexagonal de fundo — linhas sutis */}
        <g clipPath="url(#bk-circle)" opacity="0.12">
          {/* Linhas horizontais */}
          {[40,55,70,85,100,115,130,145,160].map(y => (
            <line key={`h${y}`} x1="10" y1={y} x2="190" y2={y} stroke="#00CFFF" strokeWidth="0.5" />
          ))}
          {/* Linhas verticais */}
          {[40,55,70,85,100,115,130,145,160].map(x => (
            <line key={`v${x}`} x1={x} y1="10" x2={x} y2="190" stroke="#00CFFF" strokeWidth="0.5" />
          ))}
        </g>

        {/* Linha de scan horizontal animada */}
        <g clipPath="url(#bk-inner-clip)">
          <rect
            x="4" y="98" width="192" height="6"
            fill="url(#bk-scan-grad)"
            style={{ animation: 'bk-scan 2.8s ease-in-out infinite' }}
          />
        </g>

        {/* Anel externo girando (colorido) */}
        <g style={{ transformOrigin: '100px 100px', animation: 'bk-ring-spin 6s linear infinite' }}>
          <circle
            cx="100" cy="100" r="78"
            stroke="url(#bk-ring1-grad)"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="30 20 10 40 5 15"
            opacity="0.7"
          />
        </g>

        {/* Anel médio girando reverso */}
        <g style={{ transformOrigin: '100px 100px', animation: 'bk-ring-spin-rev 4s linear infinite' }}>
          <circle
            cx="100" cy="100" r="60"
            stroke="url(#bk-ring2-grad)"
            strokeWidth="1"
            fill="none"
            strokeDasharray="15 25 5 35"
            opacity="0.6"
          />
        </g>

        {/* Anel interno girando */}
        <g style={{ transformOrigin: '100px 100px', animation: 'bk-ring-spin 3s linear infinite' }}>
          <circle
            cx="100" cy="100" r="42"
            stroke="#00FFB2"
            strokeWidth="0.8"
            fill="none"
            strokeDasharray="8 18 3 12"
            opacity="0.35"
          >
            <animate attributeName="stroke" values="#00FFB2;#7B2FFF;#00CFFF;#FF2F8E;#00FFB2" dur="3s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Ponto orbital 1 — ciano */}
        <g style={{ transformOrigin: '100px 100px', animation: 'bk-ring-spin 3s linear infinite' }}>
          <circle cx="100" cy="22" r="4" fill="#00CFFF" opacity="0.9">
            <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="100" cy="22" r="8" fill="#00CFFF" opacity="0.2" />
        </g>

        {/* Ponto orbital 2 — roxo */}
        <g style={{ transformOrigin: '100px 100px', animation: 'bk-ring-spin-rev 4.5s linear infinite' }}>
          <circle cx="178" cy="100" r="3.5" fill="#7B2FFF" opacity="0.9">
            <animate attributeName="r" values="2.5;4.5;2.5" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="178" cy="100" r="7" fill="#7B2FFF" opacity="0.2" />
        </g>

        {/* Ponto orbital 3 — verde */}
        <g style={{ transformOrigin: '100px 100px', animation: 'bk-ring-spin 5s linear infinite' }}>
          <circle cx="162" cy="162" r="3" fill="#00FFB2" opacity="0.85">
            <animate attributeName="r" values="2;4;2" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="162" cy="162" r="6" fill="#00FFB2" opacity="0.15" />
        </g>

        {/* Camada de vidro ciano */}
        <circle cx="100" cy="100" r="96" fill="url(#bk-glass)" clipPath="url(#bk-circle)" />

        {/* Borda colorida animada */}
        <circle cx="100" cy="100" r="95" fill="none" strokeWidth="1.5" opacity="0.6">
          <animate attributeName="stroke" values="#00CFFF;#7B2FFF;#00FFB2;#FF2F8E;#00CFFF" dur="4s" repeatCount="indefinite" />
        </circle>

        {/* Segundo anel de borda mais fino */}
        <circle cx="100" cy="100" r="91" fill="none" strokeWidth="0.5" opacity="0.25">
          <animate attributeName="stroke" values="#7B2FFF;#00FFB2;#FF2F8E;#00CFFF;#7B2FFF" dur="4s" repeatCount="indefinite" />
        </circle>

        {/* Olho esquerdo */}
        <rect
          x="72"
          y={blinking ? 105 : 96}
          width={eyeW}
          height={eyeH}
          rx="9"
          fill="white"
          style={{ transition: 'height 0.08s ease, y 0.08s ease', filter: 'drop-shadow(0 0 4px #00CFFF)' }}
        />

        {/* Olho direito */}
        <rect
          x="110"
          y={blinking ? 105 : 96}
          width={eyeW}
          height={eyeH}
          rx="9"
          fill="white"
          style={{ transition: 'height 0.08s ease, y 0.08s ease', filter: 'drop-shadow(0 0 4px #00CFFF)' }}
        />

        {/* Reflexo especular no topo */}
        <ellipse cx="78" cy="62" rx="20" ry="12" fill="rgba(0,207,255,0.15)" transform="rotate(-30 78 62)" />
        <ellipse cx="72" cy="58" rx="8" ry="5" fill="rgba(255,255,255,0.25)" transform="rotate(-30 72 58)" />
      </svg>
    </div>
  )
}
