// Hero del home: el fondo de la sección toma el tono de la campaña que está a la vista (data-tono de cada slide
// del carrusel principal) y lo cambia con un fundido cuando cambia el slide (la transición está en hero.css).
// Sigue al punto activo del carrusel, que carrusel.js marca con aria-current.

const hero = document.querySelector('.hero');
const principal = hero?.querySelector('.hero__principal');

if (principal) {
  // Los slides originales, en el orden de los puntos (carrusel.js agrega copias con aria-hidden para el bucle)
  const slides = () => [...principal.querySelectorAll('.carrusel__item[data-tono]:not([aria-hidden="true"])')];
  const puntos = principal.querySelector('.carrusel__puntos');

  const pintar = () => {
    const actual = [...puntos.children].findIndex((p) => p.getAttribute('aria-current') === 'true');
    const tono = slides()[Math.max(0, actual)]?.dataset.tono;
    if (tono) hero.dataset.tono = tono;
  };

  new MutationObserver(pintar).observe(puntos, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
  pintar();
}
