// Pausa las animaciones que no están a la vista: auroras, tira de marcas, luz del borde y lo marcado con
// data-pausa. Mientras están fuera de pantalla llevan la clase .en-pausa (base.css detiene sus animaciones).
// Uso: iniciarPausa(contenedor).

const SELECTOR = '.aurora, .marcas, [data-pausa]';

export function iniciarPausa(raiz = document) {
  const observador = new IntersectionObserver((entradas) => {
    for (const e of entradas) e.target.classList.toggle('en-pausa', !e.isIntersecting);
  });
  raiz.querySelectorAll(SELECTOR).forEach((el) => observador.observe(el));
}
