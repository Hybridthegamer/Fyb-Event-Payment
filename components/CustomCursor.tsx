'use client';

import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth <= 768) return;

    document.body.style.cursor = 'none';
    const dot = dotRef.current;
    if (!dot) return;
    dot.style.display = 'block';

    let mouseX = 0;
    let mouseY = 0;
    let curX = 0;
    let curY = 0;
    let animId: number;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onEnter = () => {
      if (!dot) return;
      dot.style.transform = 'translate(-50%, -50%) scale(2.5)';
      dot.style.background = 'var(--bam-red)';
    };

    const onLeave = () => {
      if (!dot) return;
      dot.style.transform = 'translate(-50%, -50%) scale(1)';
      dot.style.background = 'var(--bam-cream)';
    };

    const attach = () => {
      document.querySelectorAll('a, button').forEach((el) => {
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
      });
    };

    attach();

    const loop = () => {
      curX += (mouseX - curX) * 0.18;
      curY += (mouseY - curY) * 0.18;
      if (dot) {
        dot.style.left = curX + 'px';
        dot.style.top = curY + 'px';
      }
      animId = requestAnimationFrame(loop);
    };

    document.addEventListener('mousemove', onMove);
    loop();

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('mousemove', onMove);
      document.body.style.cursor = '';
      document.querySelectorAll('a, button').forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
  }, []);

  return (
    <div
      ref={dotRef}
      style={{
        display: 'none',
        position: 'fixed',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'var(--bam-cream)',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 99999,
        transition: 'transform 150ms ease, background 150ms ease',
      }}
    />
  );
}
