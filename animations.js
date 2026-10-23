/* ==========================================================================
   animations.js · Animaciones del Grupo 1 Ntra. Sra. del Pilar

   No hace falta tocar el HTML: el script busca los elementos por sus clases
   actuales (.subcover, .identity, .structure, .history, .nuestro-metodo...)
   y les añade los atributos que usa animations.css.

   Si el usuario ha pedido "reducir movimiento" o el navegador es muy antiguo,
   el script no hace nada y la web se ve exactamente como antes.
   ========================================================================== */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  // Activa todas las reglas ".anim ..." del CSS
  document.documentElement.classList.add('anim');

  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  /* ------------------------------------------------------------------
     1. MOTOR DE APARICIÓN AL HACER SCROLL
     ------------------------------------------------------------------ */

  /** Marca elementos para que aparezcan. `step` escalona el retardo entre ellos. */
  const mark = (elements, type = 'up', { step = 0, base = 0 } = {}) => {
    elements.forEach((el, i) => {
      const delay = Math.min(base + i * step, 1400);
      el.dataset.reveal = type;
      el.dataset.d = delay;
      el.style.setProperty('--d', `${delay}ms`);
    });
  };

  /** Cuenta desde `from` hasta `to` (se usa en los años de la historia). */
  const countUp = (el) => {
    const to = Number(el.dataset.count);
    const from = Number(el.dataset.from);
    const duration = 1300;
    setTimeout(() => {
      el.textContent = from;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(from + (to - from) * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, Number(el.dataset.d) || 0);
  };

  /** Hace visible un elemento y todos los marcados que contiene (un "grupo"). */
  const show = (group) => {
    group.classList.add('is-visible');
    $$('[data-reveal]', group).forEach((el) => el.classList.add('is-visible'));
    [group, ...$$('[data-count]', group)].forEach((el) => {
      if (el.dataset.count) countUp(el);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      show(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  const watch = (elements) => elements.forEach((el) => observer.observe(el));

  /* ------------------------------------------------------------------
     2. QUÉ ANIMA CADA PÁGINA
     (los selectores que no existen en una página simplemente no hacen nada)
     ------------------------------------------------------------------ */

  /* index.html · subportada */
  $$('.subcover').forEach((section) => {
    mark([...section.children], 'up', { step: 140 });
    watch([section]);

    // La luz de fondo sigue al ratón
    section.addEventListener('pointermove', (e) => {
      const r = section.getBoundingClientRect();
      section.style.setProperty('--mx', `${e.clientX - r.left}px`);
      section.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* index.html · Misión, Visión y Valores */
  $$('.identity article').forEach((card, i) => {
    [...card.children].forEach((child, j) => {
      mark([child], child.tagName === 'IMG' ? 'img' : 'up', { base: i * 140 + j * 70 });
    });
    watch([card]);
  });

  /* quienes-somos.html · cada bloque: título, imagen que aparece y texto que entra de lado */
  $$('.structure article').forEach((article) => {
    const [title, subtitle, row] = article.children;
    mark([title], 'up');
    mark([subtitle], 'up', { base: 120 });
    const image = row.querySelector(':scope > img');
    const text = row.querySelector(':scope > div');
    if (image) mark([image], 'img', { base: 250 });
    if (text) mark([...text.children], 'right', { step: 110, base: 400 });
    watch([article]);
  });

  /* nuestra-historia.html · cabeceras de sección */
  $$('.history > header').forEach((header) => {
    mark([...header.children], 'up', { step: 110 });
    watch([header]);
  });

  /* nuestra-historia.html · cada hito: el año cuenta hacia arriba, el texto entra desde la derecha */
  $$('.history article').forEach((article) => {
    const year = article.querySelector('.year');
    if (!year) return;
    const body = year.nextElementSibling;

    const finalYear = parseInt(year.textContent, 10);
    if (!Number.isNaN(finalYear)) {
      year.dataset.count = finalYear;
      year.dataset.from = finalYear - 30;
    }
    mark([year], 'left');
    if (body) mark([...body.children], 'up', { step: 100, base: 250 });
    watch([article]);
  });

  /* nuestra-historia.html · fotos finales */
  $$('.history-img').forEach((gallery) => {
    mark($$('img', gallery), 'img', { step: 150 });
    watch([gallery]);
  });

  /* nuestro-metodo.html · cabecera + contenido (imagen, párrafos, listas escalonadas) */
  $$('.nuestro-metodo').forEach((section) => {
    const header = section.querySelector(':scope > header');
    if (header) {
      mark([...header.children], 'up', { step: 120 });
      watch([header]);
    }
    const content = section.querySelector(':scope > div');
    if (!content) return;
    [...content.children].forEach((el) => {
      if (el.tagName === 'UL') {
        mark([...el.children], 'left', { step: 90 });
      } else {
        mark([el], el.tagName === 'IMG' ? 'img' : 'up');
      }
      watch([el]);
    });
  });

  /* Pie de página (todas las páginas): los iconos "saltan" uno a uno */
  $$('footer').forEach((footer) => {
    mark($$('nav svg', footer), 'pop', { step: 130 });
    mark($$(':scope > p', footer), 'up', { base: 450 });
    watch([footer]);
  });

  /* ------------------------------------------------------------------
     3. SCROLL: barra de progreso y parallax de la portada
     ------------------------------------------------------------------ */
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  const cover = document.querySelector('.cover');
  const coverImg = cover && cover.querySelector(':scope > img');
  const coverTitle = cover && cover.querySelector('h1');

  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;

    // Parallax: la foto baja más despacio que el contenido y el título aún más lento
    if (coverImg && y < 600) {
      coverImg.style.translate = `0 ${Math.min(y, 500) * 0.2}px`;
      if (coverTitle) coverTitle.style.translate = `0 ${y * 0.12}px`;
    }
    ticking = false;
  };
  const requestUpdate = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();

  /* ------------------------------------------------------------------
     4. SALIDA DE PÁGINA: el contenido se desvanece antes de cambiar
     ------------------------------------------------------------------ */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (link.hasAttribute('download') || (link.target && link.target !== '_self')) return;

    const url = new URL(link.href, window.location.href);
    if (url.protocol !== window.location.protocol || url.host !== window.location.host) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;

    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(() => { window.location.href = link.href; }, 280);
  });

  // Si el usuario vuelve con el botón "atrás", quitamos el desvanecido
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) document.body.classList.remove('leaving');
  });
})();
