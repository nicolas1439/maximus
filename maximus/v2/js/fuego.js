// Fuego de las campañas (Ofertas del menú, etiquetas y chips de campaña, data-fuego): al pasar el mouse (o con el
// foco del teclado) la llama flamea: la punta se balancea y sube y baja con ondas superpuestas, redibujando el trazo
// en cada cuadro. Solo con mouse (en táctil no hay salida del hover) y sin "reducir movimiento"; al salir vuelve al
// dibujo original. Uso: iniciarFuego(contenedor).

const conMouse = matchMedia('(hover: hover)');
const reducirMovimiento = matchMedia('(prefers-reduced-motion: reduce)');

export function iniciarFuego(raiz = document) {
  raiz.querySelectorAll('[data-fuego]:not(.fuego--listo)').forEach((enlace) => {
    const llama = enlace.querySelector('path');
    if (!llama) return;
    enlace.classList.add('fuego--listo');

    const original = llama.getAttribute('d');
    let cuadro = 0;
    let inicio = 0;
    let hover = false;
    let foco = false;

    function animar(ahora) {
      const t = (ahora - inicio) / 1000;
      const entrada = Math.min(1, t / 0.18);
      const balanceo = (Math.sin(t * 7) * 0.95 + Math.sin(t * 12) * 0.25) * entrada;
      const altura = Math.sin(t * 9) * 0.8 * entrada;

      llama.setAttribute(
        'd',
        `M8.5 14.5 A2.5 2.5 0 0 0 11 12
         C11 10.62 ${10.5 + balanceo * 0.2} 10 ${10 + balanceo * 0.3} 9
         C${8.928 + balanceo * 0.6} ${6.857 + altura * 0.4} ${9.776 + balanceo} ${4.946 + altura * 0.7} ${12 + balanceo} ${3 + altura}
         C${12.5 + balanceo} ${5.5 + altura * 0.6} ${14 + balanceo * 0.4} 7.9 16 9.5
         C18 11.1 19 13 19 15 A7 7 0 1 1 5 15 C5 13.847 5.433 12.706 6 12 A2.5 2.5 0 0 0 8.5 14.5 Z`
      );

      cuadro = requestAnimationFrame(animar);
    }

    function actualizar() {
      cancelAnimationFrame(cuadro);
      if ((hover || foco) && conMouse.matches && !reducirMovimiento.matches) {
        inicio = performance.now();
        cuadro = requestAnimationFrame(animar);
      } else {
        llama.setAttribute('d', original);
      }
    }

    enlace.addEventListener('mouseenter', () => { hover = true; actualizar(); });
    enlace.addEventListener('mouseleave', () => { hover = false; actualizar(); });
    enlace.addEventListener('focus', () => { foco = true; actualizar(); });
    enlace.addEventListener('blur', () => { foco = false; actualizar(); });
    reducirMovimiento.addEventListener('change', actualizar);
  });
}
