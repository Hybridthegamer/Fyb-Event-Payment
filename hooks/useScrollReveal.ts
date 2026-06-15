import { useEffect } from 'react';

export default function useScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const seen = new WeakSet<HTMLElement>();

    const reveal = (el: HTMLElement) => {
      const delay = el.dataset.revealDelay ?? '0';
      el.style.transitionDelay = delay + 'ms';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target as HTMLElement);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const init = (el: HTMLElement) => {
      if (seen.has(el)) return;
      seen.add(el);
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

      if (el.getBoundingClientRect().top < window.innerHeight) {
        reveal(el);
      } else {
        io.observe(el);
      }
    };

    // Process elements already in the DOM
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(init);

    // Watch for [data-reveal] elements added after async operations (auth checks, etc.)
    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.hasAttribute('data-reveal')) init(node as HTMLElement);
          node.querySelectorAll<HTMLElement>('[data-reveal]').forEach(init);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}
