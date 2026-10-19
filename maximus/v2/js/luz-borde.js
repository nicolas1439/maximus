// Luz del borde (tarjeta de Ingresar y Crear cuenta): con mouse, la luz va hacia el puntero en toda la página;
// aparece en el borde más cercano cuando el puntero está a menos de LEJOS px de la tarjeta (o adentro) y crece a
// medida que se acerca, con un retraso corto como el degradado vivo. Sin mouse, la luz recorre el borde sola (CSS).
// Uso: iniciarLuzBorde(tarjeta, claseConPuntero). El CSS usa --x, --y y --alcance.

const conMouse = matchMedia('(hover: hover) and (pointer: fine)');

export function iniciarLuzBorde(tarjeta, claseConPuntero) {
  if (!tarjeta || !conMouse.matches || tarjeta.dataset.luzBordeLista !== undefined) return;
  tarjeta.dataset.luzBordeLista = ''; // una vez por tarjeta
  const RADIO = 260; // radio de la luz con el puntero sobre el borde
  const LEJOS = 180; // desde esta distancia a la tarjeta empieza a aparecer
  const luz = { x: 0, y: 0, alcance: 0 };
  let destino = null;
  let puntero = null;
  let cuadro = 0;
  let previo = 0;

  if (claseConPuntero) tarjeta.classList.add(claseConPuntero);

  function apuntar() {
    if (!puntero) return;
    const r = tarjeta.getBoundingClientRect();
    const x = puntero.x - r.left;
    const y = puntero.y - r.top;
    // Distancia del puntero a la tarjeta (0 si está adentro)
    const dx = Math.max(-x, 0, x - r.width);
    const dy = Math.max(-y, 0, y - r.height);
    const cerca = Math.max(0, 1 - Math.hypot(dx, dy) / LEJOS);
    if (!destino) Object.assign(luz, { x, y });
    destino = { x, y, alcance: RADIO * cerca };
    if (!cuadro) {
      previo = 0;
      cuadro = requestAnimationFrame(paso);
    }
  }

  function paso(t) {
    const dt = previo ? Math.min((t - previo) / (1000 / 60), 4) : 1;
    previo = t;
    const k = 1 - Math.pow(1 - 0.16, dt);
    for (const c of ['x', 'y', 'alcance']) luz[c] += (destino[c] - luz[c]) * k;
    tarjeta.style.setProperty('--x', `${luz.x.toFixed(1)}px`);
    tarjeta.style.setProperty('--y', `${luz.y.toFixed(1)}px`);
    tarjeta.style.setProperty('--alcance', `${Math.max(luz.alcance, 0).toFixed(1)}px`);
    const quieto = ['x', 'y', 'alcance'].every((c) => Math.abs(destino[c] - luz[c]) < 0.5);
    cuadro = quieto ? 0 : requestAnimationFrame(paso);
  }

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    puntero = { x: e.clientX, y: e.clientY };
    apuntar();
  }, { passive: true });

  // Al hacer scroll la tarjeta se mueve bajo el puntero quieto; al salir de la ventana, la luz se apaga
  addEventListener('scroll', apuntar, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => {
    puntero = null;
    if (!destino) return;
    destino = { ...destino, alcance: 0 };
    if (!cuadro) cuadro = requestAnimationFrame(paso);
  });
}
