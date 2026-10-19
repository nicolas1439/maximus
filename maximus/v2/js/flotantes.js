// Flotantes: el sticker de la campaña vigente se puede cerrar y queda cerrado durante la visita (sessionStorage).
// No aparece donde distrae o repite: el checkout, la página de la campaña y el botón de arrepentimiento.
// Uso: iniciarFlotantes(contenedor).

const CLAVE = 'sticker-oculto';
const SIN_STICKER = '.checkout, .campania, [data-arrepentimiento]';

export function iniciarFlotantes(raiz = document) {
  const sticker = raiz.querySelector('[data-sticker]');
  if (!sticker || sticker.dataset.flotanteListo !== undefined) return;
  sticker.dataset.flotanteListo = ''; // una vez por sticker
  if (document.querySelector(SIN_STICKER)) {
    sticker.hidden = true;
    return;
  }
  try {
    if (sessionStorage.getItem(CLAVE)) sticker.hidden = true;
  } catch {}
  sticker.querySelector('[data-cerrar-sticker]')?.addEventListener('click', () => {
    sticker.hidden = true;
    try { sessionStorage.setItem(CLAVE, '1'); } catch {}
  });
}
