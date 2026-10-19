// Flotantes: el sticker de la campaña vigente se puede cerrar y queda cerrado durante la visita (sessionStorage).
// Uso: iniciarFlotantes(contenedor).

const CLAVE = 'sticker-oculto';

export function iniciarFlotantes(raiz = document) {
  const sticker = raiz.querySelector('[data-sticker]');
  if (!sticker || sticker.dataset.flotanteListo !== undefined) return;
  sticker.dataset.flotanteListo = ''; // una vez por sticker
  try {
    if (sessionStorage.getItem(CLAVE)) sticker.hidden = true;
  } catch {}
  sticker.querySelector('[data-cerrar-sticker]')?.addEventListener('click', () => {
    sticker.hidden = true;
    try { sessionStorage.setItem(CLAVE, '1'); } catch {}
  });
}
