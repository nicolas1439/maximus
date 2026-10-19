// Páginas legales (Términos y condiciones, Política de privacidad): el índice queda plegado en celular y tablet y
// abierto al costado en escritorio, marca la sección que se está leyendo y se pliega al elegir una en celular.
// Sin JS el índice queda abierto.

const indice = document.querySelector('[data-indice]');
if (indice) iniciar();

function iniciar() {
  const escritorio = matchMedia('(min-width: 1024px)');
  const enlaces = [...indice.querySelectorAll('a[href^="#"]')];
  const secciones = enlaces.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);

  const acomodar = () => (indice.open = escritorio.matches);
  acomodar();
  escritorio.addEventListener('change', acomodar);

  // En celular, al elegir una sección el índice se pliega para dejar ver el texto
  indice.addEventListener('click', (e) => {
    if (e.target.closest('a') && !escritorio.matches) indice.open = false;
  });

  // Sección actual: la primera cuyo título pasó por la franja de arriba de la pantalla
  function marcar(id) {
    enlaces.forEach((a) => {
      if (a.hash === `#${id}`) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window) {
    const visibles = new Set();
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => (e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target)));
        const primera = secciones.find((s) => visibles.has(s));
        if (primera) marcar(primera.id);
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );
    secciones.forEach((s) => observador.observe(s));
  }
  if (secciones[0]) marcar(secciones[0].id);
}
