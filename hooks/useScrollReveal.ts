import { useEffect } from 'react';

export default function useScrollReveal() {
  useEffect(() => {
    // Defensive SSR guard — useEffect is client-only, but if window is somehow
    // unavailable, reveal everything so nothing stays hidden.
    if (typeof window === 'undefined') {
      (document.querySelectorAll('[data-reveal]') as NodeListOf<HTMLElement>).forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
      return;
    }

    const elements = Array.from(
      document.querySelectorAll('[data-reveal]')
    ) as HTMLElement[];

    // Apply the hidden-before-reveal state via JS so the hook fully controls
    // visibility (inline styles win over the CSS [data-reveal] rule).
    elements.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    const reveal = (el: HTMLElement) => {
      const delay = el.dataset.revealDelay ?? '0';
      el.style.transitionDelay = delay + 'ms';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    };

    // Low threshold so even partially-visible elements trigger on mobile.
    // rootMargin keeps the trigger zone comfortably inside the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => {
      // Elements whose top edge is already inside the viewport get revealed
      // immediately — no need to wait for the observer.
      if (el.getBoundingClientRect().top < window.innerHeight) {
        reveal(el);
      } else {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);
}
