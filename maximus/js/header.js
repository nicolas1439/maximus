// Header: tema claro/oscuro, menú lateral, departamentos y fila fija compacta.

const raiz = document.documentElement;

// ---------- Tema ----------

const botonesTema = document.querySelectorAll('[data-tema-toggle]');

function aplicarTema(tema) {
  if (tema === 'oscuro') raiz.dataset.tema = 'oscuro';
  else delete raiz.dataset.tema;
  botonesTema.forEach((b) => b.setAttribute('aria-pressed', tema === 'oscuro'));
}

// El tema nuevo se revela en un círculo que crece desde el botón que lo cambió (View Transitions; base.css anula
// el fundido por defecto). Sin soporte o con "reducir movimiento", cambia al instante.
function cambiarTema(tema, boton) {
  const aplicar = () => aplicarTema(tema);
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return aplicar();

  const r = boton.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const duracion = parseFloat(getComputedStyle(raiz).getPropertyValue('--duracion-lenta')) * 1000 || 900;

  raiz.classList.add('tema-en-cambio');
  const transicion = document.startViewTransition(aplicar);
  transicion.ready
    .then(() =>
      raiz.animate(
        { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
        { duration: duracion, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
      )
    )
    .catch(() => {}); // si el navegador salta la transición (ej. pestaña oculta), el tema igual cambió
  transicion.finished.finally(() => raiz.classList.remove('tema-en-cambio')).catch(() => {});
}

botonesTema.forEach((boton) =>
  boton.addEventListener('click', () => {
    const tema = raiz.dataset.tema === 'oscuro' ? 'claro' : 'oscuro';
    cambiarTema(tema, boton);
    try { localStorage.setItem('tema', tema); } catch {}
  })
);

aplicarTema(raiz.dataset.tema === 'oscuro' ? 'oscuro' : 'claro');

// ---------- Menú lateral (mobile/tablet) ----------

const menu = document.querySelector('.menu');
const botonAbrir = document.querySelector('.cabecera__menu');
const fueraDelMenu = document.querySelectorAll('.barra-sup, .cabecera, main');
const escritorio = matchMedia('(min-width: 1024px)');

function abrirMenu() {
  menu.classList.add('menu--abierto');
  botonAbrir.setAttribute('aria-expanded', 'true');
  fueraDelMenu.forEach((el) => (el.inert = true));
  menu.querySelector('button, a').focus();
}

function cerrarMenu() {
  if (!menu.classList.contains('menu--abierto')) return;
  menu.classList.remove('menu--abierto');
  botonAbrir.setAttribute('aria-expanded', 'false');
  fueraDelMenu.forEach((el) => (el.inert = false));
  activarCategoria(null);
  botonAbrir.focus();
}

botonAbrir.addEventListener('click', abrirMenu);
document.querySelector('.menu__cerrar').addEventListener('click', cerrarMenu);
document.querySelector('.menu-capa').addEventListener('click', cerrarMenu);
escritorio.addEventListener('change', () => {
  cerrarMenu();
  alternarCatalogo(false);
});

// ---------- Catálogo (botón Productos y mega menú) ----------
// Escritorio: el botón abre el mega menú y cada categoría muestra sus subcategorías al pasar el mouse o el foco.
// Mobile/tablet: tocar una categoría abre su segundo nivel dentro del panel lateral.

const catalogo = document.querySelector('.catalogo');
const botonCatalogo = catalogo.querySelector('.catalogo__btn');
const categorias = catalogo.querySelectorAll('button.catalogo__cat');
let esperaHover;

function activarCategoria(activa) {
  categorias.forEach((b) => b.setAttribute('aria-expanded', b === activa));
}

function alternarCatalogo(abrir) {
  botonCatalogo.setAttribute('aria-expanded', abrir);
  catalogo.classList.toggle('catalogo--abierto', abrir);
  activarCategoria(abrir ? categorias[0] : null);
}

botonCatalogo.addEventListener('click', () =>
  alternarCatalogo(botonCatalogo.getAttribute('aria-expanded') !== 'true')
);

categorias.forEach((boton) => {
  boton.addEventListener('click', () => {
    activarCategoria(boton);
    if (!escritorio.matches) boton.nextElementSibling.querySelector('.catalogo__volver').focus();
  });

  // La demora evita que, al cruzar en diagonal hacia las subcategorías, se active otra categoría
  boton.addEventListener('mouseenter', () => {
    if (!escritorio.matches) return;
    clearTimeout(esperaHover);
    esperaHover = setTimeout(() => activarCategoria(boton), 120);
  });
  boton.addEventListener('mouseleave', () => clearTimeout(esperaHover));
  boton.addEventListener('focus', () => {
    if (escritorio.matches) activarCategoria(boton);
  });
});

function volverACategorias() {
  const abierta = [...categorias].find((b) => b.getAttribute('aria-expanded') === 'true');
  if (!abierta) return false;
  activarCategoria(null);
  abierta.focus();
  return true;
}

catalogo.querySelectorAll('.catalogo__volver').forEach((b) => b.addEventListener('click', volverACategorias));

document.addEventListener('click', (e) => {
  if (escritorio.matches && !catalogo.contains(e.target)) alternarCatalogo(false);
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (escritorio.matches) {
    if (botonCatalogo.getAttribute('aria-expanded') !== 'true') return;
    alternarCatalogo(false);
    botonCatalogo.focus();
  } else if (!volverACategorias()) {
    cerrarMenu();
  }
});

// ---------- Luz del botón Productos ----------
// La luz del degradado (ver header.css) sigue al puntero con retraso: cada 1/60 s recorre una fracción
// (--luz-seguimiento, en header.css) de lo que le falta. Se calcula por tiempo real, así el retraso es el
// mismo a cualquier frecuencia de pantalla.

let seguimiento = 0.035;
let luzObjetivo, luzActual, luzCuadro = 0, luzUltimo = 0;

function pintarLuz() {
  botonCatalogo.style.setProperty('--x', `${luzActual.x}px`);
  botonCatalogo.style.setProperty('--y', `${luzActual.y}px`);
}

function animarLuz(ahora) {
  const cuadros = luzUltimo ? Math.min((ahora - luzUltimo) / (1000 / 60), 10) : 1;
  const paso = 1 - (1 - seguimiento) ** cuadros;
  luzUltimo = ahora;
  luzActual.x += (luzObjetivo.x - luzActual.x) * paso;
  luzActual.y += (luzObjetivo.y - luzActual.y) * paso;
  pintarLuz();
  const lejos = Math.abs(luzObjetivo.x - luzActual.x) > 0.3 || Math.abs(luzObjetivo.y - luzActual.y) > 0.3;
  luzCuadro = lejos ? requestAnimationFrame(animarLuz) : 0;
  if (!lejos) luzUltimo = 0;
}

function seguirLuz(e) {
  const r = botonCatalogo.getBoundingClientRect();
  luzObjetivo = { x: e.clientX - r.left, y: e.clientY - r.top };
  if (e.type === 'pointerenter' || !luzActual) {
    seguimiento = parseFloat(getComputedStyle(botonCatalogo).getPropertyValue('--luz-seguimiento')) || seguimiento;
    luzActual = { ...luzObjetivo };
    pintarLuz();
    return;
  }
  if (!luzCuadro) luzCuadro = requestAnimationFrame(animarLuz);
}

['pointerenter', 'pointermove', 'pointerleave'].forEach((ev) => botonCatalogo.addEventListener(ev, seguirLuz));

// ---------- Fila principal compacta al hacer scroll ----------
// Se compacta en cuanto queda fija (al salir de pantalla la barra superior): un solo achique

const cabecera = document.querySelector('.cabecera');
const barraSup = document.querySelector('.barra-sup');
const campoBuscar = document.querySelector('.buscador__campo');
const celular = matchMedia('(max-width: 767px)');

// Al bajar se esconde algo y vuelve cuando el usuario sube un tramo (UMBRAL_SUBIR): en escritorio, la fila del
// menú, que queda pegada debajo de la fila principal; en celular, el buscador. Arriba de todo queda todo en su
// lugar, con la barra superior. En tablet no se esconde nada (el buscador comparte fila con el logo).

const UMBRAL_SUBIR = 160; // px que hay que subir para que vuelva
const UMBRAL_BAJAR = 12; // px que hay que bajar para que se esconda
let ultimoY = scrollY;
let subido = 0;
let bajado = 0;

function esconder(ocultar) {
  if (escritorio.matches) {
    menu.classList.toggle('menu--oculto', ocultar);
    if (ocultar && botonCatalogo.getAttribute('aria-expanded') === 'true') alternarCatalogo(false);
    return;
  }
  // Mientras se escribe en el buscador no se esconde (el teclado del celular también provoca scroll)
  if (ocultar && document.activeElement === campoBuscar) return;
  cabecera.classList.toggle('cabecera--sin-buscador', ocultar);
}

function alDesplazar() {
  const y = scrollY;
  const compacta = y > barraSup.offsetHeight;
  cabecera.classList.toggle('cabecera--compacta', compacta);

  if (!compacta || !(escritorio.matches || celular.matches)) {
    menu.classList.remove('menu--pegado', 'menu--oculto');
    cabecera.classList.remove('cabecera--sin-buscador');
    subido = bajado = 0;
    ultimoY = y;
    return;
  }

  if (escritorio.matches) menu.classList.add('menu--pegado');
  const delta = y - ultimoY;
  ultimoY = y;
  if (delta > 0) {
    bajado += delta;
    subido = 0;
    if (bajado > UMBRAL_BAJAR) esconder(true);
  } else if (delta < 0) {
    subido -= delta;
    bajado = 0;
    if (subido > UMBRAL_SUBIR) esconder(false);
  }
}

addEventListener('scroll', alDesplazar, { passive: true });
escritorio.addEventListener('change', alDesplazar);
celular.addEventListener('change', alDesplazar);

// Si la página carga ya desplazada, arranca escondido
alDesplazar();
if (cabecera.classList.contains('cabecera--compacta') && (escritorio.matches || celular.matches)) esconder(true);
