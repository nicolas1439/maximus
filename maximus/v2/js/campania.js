// Landing de campaña: estado según las fechas (data-inicio y data-fin del main: próximamente, en curso o terminada),
// cuenta regresiva al inicio o al fin, pestañas que filtran las ofertas por categoría (data-cat) y la grilla de a 8
// con "Ver más" y páginas numeradas. La pestaña elegida queda en la URL (?cat=…). Sin JS se ven todas las ofertas.
// En la vista previa, los botones de muestra (data-ver-estado) cambian el estado.

const campania = document.querySelector('.campania');
const cuenta = document.querySelector('.regresiva');
const pestanias = document.querySelector('[data-pestanias]');
const grilla = document.querySelector('[data-ofertas]');
const POR_TANDA = 8;

// ---------- Estado de la campaña ----------

const inicio = new Date(campania?.dataset.inicio || 0).getTime();
const fin = new Date(campania?.dataset.fin || 0).getTime();
let estado = Date.now() < inicio ? 'proxima' : Date.now() > fin ? 'terminada' : 'curso';
let intervalo = 0;

function mostrarEstado(nuevo) {
  estado = nuevo;
  campania.dataset.estado = estado;
  document.querySelectorAll('[data-solo]').forEach((el) => (el.hidden = el.dataset.solo !== estado));
  document.querySelectorAll('[data-no-en]').forEach((el) => (el.hidden = el.dataset.noEn === estado));
  document.querySelectorAll('[data-ver-estado]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.verEstado === estado));
  iniciarCuenta();
}

// ---------- Cuenta regresiva: al inicio (próximamente) o al fin (en curso); terminada, el aviso ----------

function iniciarCuenta() {
  if (!cuenta) return;
  clearInterval(intervalo);
  const lista = cuenta.querySelector('.regresiva__lista');
  const rotulo = cuenta.querySelector('[data-rotulo]');
  const fecha = cuenta.querySelector('[data-fecha]');
  const terminada = estado === 'terminada';
  lista.hidden = terminada;
  rotulo.hidden = terminada;
  fecha.hidden = terminada;
  if (terminada) return;

  // En la vista previa, "próximamente" cuenta hasta una fecha cercana si la real ya pasó
  const objetivo = estado === 'proxima' ? Math.max(inicio, Date.now() + 3 * 86400000 + 5 * 3600000) : fin;
  rotulo.textContent = estado === 'proxima' ? 'Empieza en' : 'Termina en';
  fecha.textContent = estado === 'proxima' ? 'Desde el 1 de octubre a las 00 h' : 'Hasta el 31 de octubre o hasta agotar stock';
  cuenta.setAttribute('aria-label', estado === 'proxima' ? 'La campaña empieza el 1 de octubre a las 00 h' : 'La campaña termina el 31 de octubre a las 23:59');
  const partes = ['dias', 'horas', 'minutos', 'segundos'].map((p) => cuenta.querySelector(`[data-${p}]`));
  const dos = (n) => String(n).padStart(2, '0');

  function actualizar() {
    const resta = Math.max(0, objetivo - Date.now());
    const s = Math.floor(resta / 1000);
    const valores = [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
    partes.forEach((el, i) => (el.textContent = i ? dos(valores[i]) : valores[i]));
    if (!resta) {
      clearInterval(intervalo);
      mostrarEstado(estado === 'proxima' ? 'curso' : 'terminada');
    }
  }

  intervalo = setInterval(actualizar, 1000);
  actualizar();
}

// ---------- Pestañas por categoría y "Ver más" ----------

if (pestanias && grilla) {
  const botones = [...pestanias.querySelectorAll('[data-cat]')];
  const items = [...grilla.children];
  const cantidad = document.querySelector('[data-ofertas-cant]');
  const pie = document.querySelector('[data-pie-ofertas]');
  const verMas = pie?.querySelector('[data-ver-mas]');
  let cat = 'todo';
  let tandas = Number(new URLSearchParams(location.search).get('pagina')) || 1;

  // Las pestañas sin productos no se muestran
  botones.forEach((b) => (b.hidden = b.dataset.cat !== 'todo' && !items.some((i) => i.dataset.cat === b.dataset.cat)));

  function pintar() {
    const visibles = items.filter((i) => cat === 'todo' || i.dataset.cat === cat);
    const limite = tandas * POR_TANDA;
    items.forEach((i) => (i.hidden = true));
    let n = 0;
    visibles.forEach((item, k) => {
      item.hidden = k >= limite;
      if (item.hidden) return;
      item.style.setProperty('--retraso', `${Math.min(n++ * 30, 300)}ms`);
      item.classList.remove('ofertas__item--nuevo');
      void item.offsetWidth; // reinicia la animación de entrada
      item.classList.add('ofertas__item--nuevo');
    });
    if (cantidad) cantidad.textContent = visibles.length;
    if (!pie) return;
    const vistos = Math.min(limite, visibles.length);
    pie.querySelector('[data-mostrando]').textContent = vistos;
    pie.querySelector('[data-total]').textContent = visibles.length;
    pie.querySelector('[data-barra]').style.setProperty('--progreso', `${visibles.length ? (vistos / visibles.length) * 100 : 0}%`);
    verMas.hidden = vistos >= visibles.length;
    const paginas = Math.ceil(visibles.length / POR_TANDA);
    const nav = pie.querySelector('[data-paginas]');
    nav.hidden = paginas < 2;
    nav.querySelector('ol').innerHTML = Array.from({ length: paginas }, (_, i) => {
      const actual = i + 1 === tandas;
      // Cada página conserva la pestaña elegida (?cat=)
      const params = new URLSearchParams();
      if (cat !== 'todo') params.set('cat', cat);
      if (i) params.set('pagina', i + 1);
      const href = `primavera-maximus.html${params.size ? `?${params}` : ''}`;
      return `<li><a class="paginas__enlace${actual ? ' actual' : ''}" href="${href}"${actual ? ' aria-current="page"' : ''}>${i + 1}</a></li>`;
    }).join('');
  }

  function elegir(nueva, { escribir = true } = {}) {
    cat = botones.some((b) => b.dataset.cat === nueva && !b.hidden) ? nueva : 'todo';
    tandas = escribir ? 1 : tandas;
    botones.forEach((b) => b.setAttribute('aria-pressed', b.dataset.cat === cat));
    // En celular las pestañas se deslizan: la elegida queda a la vista
    const elegida = botones.find((b) => b.dataset.cat === cat);
    pestanias.scrollTo({ left: elegida.offsetLeft - pestanias.offsetLeft - 16, behavior: 'smooth' });
    pintar();
    if (escribir) {
      const url = new URL(location.href);
      if (cat === 'todo') url.searchParams.delete('cat');
      else url.searchParams.set('cat', cat);
      url.searchParams.delete('pagina');
      history.replaceState(null, '', url);
    }
  }

  pestanias.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-cat]');
    if (boton) elegir(boton.dataset.cat);
  });

  verMas?.addEventListener('click', () => {
    tandas += 1;
    pintar();
    // El foco pasa a la primera tarjeta nueva sin mover la página
    const vistas = items.filter((i) => !i.hidden);
    vistas[(tandas - 1) * POR_TANDA]?.querySelector('.producto__enlace')?.focus({ preventScroll: true });
  });

  elegir(new URLSearchParams(location.search).get('cat') || 'todo', { escribir: false });
}

if (campania) {
  document.querySelectorAll('[data-ver-estado]').forEach((b) => b.addEventListener('click', () => mostrarEstado(b.dataset.verEstado)));
  mostrarEstado(estado);
}
