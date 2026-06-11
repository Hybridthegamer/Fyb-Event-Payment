import { useEffect } from 'react';

export default function useScrollReveal() {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll('[data-reveal]')
    ) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.revealDelay ?? '0';
            el.style.transitionDelay = delay + 'ms';
            el.classList.add('bam-revealed');
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
