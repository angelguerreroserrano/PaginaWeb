// script.js — enlazar en el <head> SIN "defer" (así evita parpadeos al cargar).

// Solo animamos si el navegador lo soporta y la persona no ha pedido "reducir movimiento".
const canAnimate =
  'IntersectionObserver' in window &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canAnimate) document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Barra de progreso de lectura ---------- */
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.append(bar);

  let ticking = false;
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--progress', max > 0 ? Math.min(window.scrollY / max, 1) : 0);
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateProgress);
      }
    },
    { passive: true }
  );
  updateProgress();

  if (!canAnimate) return;

  /* ---------- El año "cuenta" hasta su valor final ---------- */
  const countUp = (el) => {
    const final = parseInt(el.textContent, 10);
    if (Number.isNaN(final)) return;
    el.setAttribute('aria-label', final); // los lectores de pantalla leen el año final
    const start = final - 30;
    const duration = 900;
    let t0;
    el.textContent = start;
    const step = (t) => {
      t0 ??= t;
      const p = Math.min((t - t0) / duration, 1);
      el.textContent = Math.round(start + (final - start) * (1 - (1 - p) ** 3)); // ease-out
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- Revelar elementos al entrar en pantalla ---------- */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting, boundingClientRect }) => {
        // Si ya lo hemos dejado atrás (scroll rápido), también lo mostramos
        if (!isIntersecting && boundingClientRect.top >= 0) return;
        target.classList.add('is-visible');
        if (target.matches('article')) countUp(target.querySelector('h1'));
        observer.unobserve(target);
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -5% 0px' }
  );

  document
    .querySelectorAll('main .history article, main .history-img')
    .forEach((el) => observer.observe(el));
});
