// Degradado vivo (botón Productos del header, botones principales de Ingresar y "Agregar al carrito" del armador):
// con mouse, la luz del degradado sigue al puntero con retraso. Cada 1/60 s recorre una fracción (tramo) de lo que
// le falta, calculado por tiempo real, así el retraso es el mismo a cualquier frecuencia de pantalla.
// Uso: iniciarLuz(boton, { tramo, saltar }). El CSS del botón usa --x e --y. Sin tramo, lo toma de
// --luz-seguimiento del botón (header.css). Con saltar, al entrar la luz aparece directo bajo el puntero.

const conMouse = matchMedia('(hover: hover) and (pointer: fine)');

export function iniciarLuz(boton, { tramo, saltar = false } = {}) {
  if (!boton || !conMouse.matches) return;
  let actual = null;
  let destino = null;
  let dentro = false;
  let cuadro = 0;
  let previo = 0;
  let fraccion = tramo ?? 0.035;

  const posicion = (e) => {
    const r = boton.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const pintar = () => {
    boton.style.setProperty('--x', `${actual.x}px`);
    boton.style.setProperty('--y', `${actual.y}px`);
  };

  function paso(t) {
    const dt = previo ? Math.min((t - previo) / (1000 / 60), 4) : 1;
    previo = t;
    const k = 1 - Math.pow(1 - fraccion, dt);
    actual.x += (destino.x - actual.x) * k;
    actual.y += (destino.y - actual.y) * k;
    pintar();
    const quieto = Math.abs(destino.x - actual.x) < 0.5 && Math.abs(destino.y - actual.y) < 0.5;
    cuadro = quieto && !dentro ? 0 : requestAnimationFrame(paso);
  }

  const arrancar = () => {
    if (cuadro) return;
    previo = 0;
    cuadro = requestAnimationFrame(paso);
  };

  boton.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (tramo === undefined) fraccion = parseFloat(getComputedStyle(boton).getPropertyValue('--luz-seguimiento')) || fraccion;
    dentro = true;
    destino = posicion(e);
    if (saltar || !actual) {
      actual = { ...destino };
      pintar();
    }
    arrancar();
  });
  boton.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !dentro) return;
    destino = posicion(e);
    arrancar();
  });
  boton.addEventListener('pointerleave', (e) => {
    dentro = false;
    if (e.pointerType === 'mouse') destino = posicion(e);
  });
}
