// Pausa las animaciones que no están a la vista: auroras, tira de marcas, luz del borde, la barra superior, el paso
// actual de un pedido y lo marcado con data-pausa. Mientras están fuera de pantalla llevan la clase .en-pausa (base.css detiene sus animaciones).
// Uso: iniciarPausa(contenedor).

const SELECTOR = '.aurora, .marcas, .barra-sup, .seguimiento, [data-pausa]';

export function iniciarPausa(raiz = document) {
  const observador = new IntersectionObserver((entradas) => {
    for (const e of entradas) e.target.classList.toggle('en-pausa', !e.isIntersecting);
  });
  raiz.querySelectorAll(SELECTOR).forEach((el) => {
    if (el.dataset.pausaLista !== undefined) return; // una vez por elemento
    el.dataset.pausaLista = '';
    observador.observe(el);
  });
}
