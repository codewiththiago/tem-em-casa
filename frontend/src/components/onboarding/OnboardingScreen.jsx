import { useState } from 'react';

const SLIDES = [
  {
    icon: '🏡',
    title: 'Seu estoque em dia',
    text: 'Cadastre produtos com quantidade mínima e validade. O app avisa quando está acabando ou perto de vencer.',
  },
  {
    icon: '🔔',
    title: 'Alertas inteligentes',
    text: 'Receba notificações antes de acabar. Nunca mais fique sem o essencial em casa.',
  },
  {
    icon: '👨‍👩‍👧',
    title: 'Família conectada',
    text: 'Todos no mesmo grupo, sempre atualizados em tempo real. Convide com um código ou link.',
  },
];

export default function OnboardingScreen({ onDone }) {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  return (
    <div className="ob-screen">
      <button className="ob-skip" onClick={onDone}>Pular</button>

      <div className="ob-slides">
        <div className="ob-icon">{slide.icon}</div>
        <h2 className="ob-title">{slide.title}</h2>
        <p className="ob-text">{slide.text}</p>
      </div>

      <div className="ob-dots">
        {SLIDES.map((_, i) => (
          <div key={i} className={`ob-dot ${i === idx ? 'on' : ''}`} />
        ))}
      </div>

      <button
        className="btn-primary ob-btn"
        onClick={() => isLast ? onDone() : setIdx(idx + 1)}
      >
        {isLast ? '🚀 Começar' : 'Próximo →'}
      </button>
    </div>
  );
}
