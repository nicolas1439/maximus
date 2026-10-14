// En pantallas táctiles no hay hover: lo marcado con data-activo-visible recibe la clase "activo" (que en su CSS
// equivale al hover) mientras está a la vista, y la pierde al salir de pantalla. Los elementos que comparten el
// mismo valor forman un grupo donde solo uno está activo a la vez, el más visible (ej. las tarjetas de accesos
// en su fila deslizable); sin valor, cada uno va por su cuenta (ej. el banner).
// Solo sin puntero (hover: none) y hasta 1023px: en escritorio el hover ya hace su trabajo.
// La visibilidad se calcula al desplazarse (página o fila deslizable), recortando por los contenedores que
// desplazan; se mide a mano y no con IntersectionObserver para que responda igual en cualquier entorno.

const MINIMO_VISIBLE = 0.6;
const tactil = matchMedia('(hover: none) and (max-width: 1023px)');
const elementos = [...document.querySelectorAll('[data-activo-visible]')].map((el) => ({
  el,
  grupo: el.dataset.activoVisible,
  recortes: ancestrosQueRecortan(el),
}));
let cuadro = 0;

function ancestrosQueRecortan(el) {
  const lista = [];
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(p);
    if (overflowX !== 'visible' || overflowY !== 'visible') lista.push(p);
  }
  return lista;
}

// Parte del elemento que se ve: dentro de la pantalla y de cada contenedor que lo recorta
function visibilidad({ el, recortes }) {
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return 0;
  let izq = Math.max(r.left, 0), der = Math.min(r.right, innerWidth);
  let arr = Math.max(r.top, 0), aba = Math.min(r.bottom, innerHeight);
  for (const c of recortes) {
    const rc = c.getBoundingClientRect();
    izq = Math.max(izq, rc.left); der = Math.min(der, rc.right);
    arr = Math.max(arr, rc.top); aba = Math.min(aba, rc.bottom);
  }
  return (Math.max(0, der - izq) * Math.max(0, aba - arr)) / (r.width * r.height);
}

function revisar() {
  cuadro = 0;
  const mejor = {};
  for (const item of elementos) {
    const v = visibilidad(item);
    if (item.grupo === '') {
      item.el.classList.toggle('activo', v >= MINIMO_VISIBLE);
      continue;
    }
    if (v >= MINIMO_VISIBLE && (!mejor[item.grupo] || v > mejor[item.grupo].v)) mejor[item.grupo] = { el: item.el, v };
  }
  for (const item of elementos) {
    if (item.grupo !== '') item.el.classList.toggle('activo', mejor[item.grupo]?.el === item.el);
  }
}

function programar() {
  if (!cuadro) cuadro = requestAnimationFrame(revisar);
}

function armar() {
  removeEventListener('scroll', programar, true);
  removeEventListener('resize', programar);
  elementos.forEach(({ el }) => el.classList.remove('activo'));
  if (!tactil.matches || !elementos.length) return;
  addEventListener('scroll', programar, { capture: true, passive: true });
  addEventListener('resize', programar);
  programar();
}

armar();
tactil.addEventListener('change', armar);
