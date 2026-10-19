// Listado de productos: filtros, orden, contadores y "ver más" sobre las tarjetas de la grilla
// (el estante "Las más elegidas" de arriba se esconde mientras hay filtros aplicados).
// Cada tarjeta (.resultados__item) lleva sus datos en data-*. Las opciones de cada grupo de filtro se arman
// desde ahí y el contador de cada una se recalcula con los demás filtros aplicados (las que quedan en cero
// se apagan). El estado va en la URL (?sub=amd&marca=Asus,MSI&min=…&orden=menor&pagina=2;
// sub es la subcategoría NVIDIA / AMD y pagina, cuántas tandas de "ver más" se abrieron) para poder compartir
// un listado filtrado o volver atrás con los mismos filtros y productos a la vista. Sin JS se ve el catálogo completo.

const listado = document.querySelector('.listado');
const grilla = listado.querySelector('[data-grilla]');
const form = listado.querySelector('[data-filtros]');
const filtros = listado.querySelector('.filtros');
const consulta = (new URLSearchParams(location.search).get('q') || '').trim().slice(0, 80);
// Listado de varias categorías (búsqueda, campañas, Más vendidos, Outlet): con ?q=, data-general en el listado o
// data-listado="general" en el <html> de la página (mas-vendidos.html). En un listado de una categoría se quitan
// los productos de otras categorías (data-solo-general, de muestra)
const general = Boolean(consulta) || listado.hasAttribute('data-general') || document.documentElement.dataset.listado === 'general';
if (!general) grilla.querySelectorAll(':scope > [data-solo-general]').forEach((el) => el.remove());
const items = [...grilla.children].map((el) => ({ el, datos: leer(el) }));

const FILAS_POR_PAGINA = 4; // filas que se ven de entrada; cada "Ver más" suma otras tantas
const PASO_PRECIO = 10000;
const SUBCATEGORIAS = {
  nvidia: 'NVIDIA GeForce', amd: 'AMD Radeon', ssd: 'Discos SSD', ryzen: 'AMD Ryzen', teclados: 'Teclados',
  mouses: 'Mouses', auriculares: 'Auriculares', gamer: 'Monitores gamer', certificadas: 'Fuentes certificadas',
};

// Las que no están en la lista van al final, por orden alfabético
const porLista = (lista) => (a, b) => (lista.indexOf(a) + 1 || 99) - (lista.indexOf(b) + 1 || 99) || a.localeCompare(b);
const numerico = (a, b) => parseFloat(a) - parseFloat(b);

// Grupos de filtro (la clave es el data-* de la tarjeta y el data-grupo del <details>): cómo se ordenan
// sus opciones y, si hace falta, cómo se escriben
const GRUPOS = [
  { clave: 'categoria', orden: (a, b) => a.localeCompare(b) },
  { clave: 'sub', orden: porLista(['nvidia', 'amd']), texto: (v) => SUBCATEGORIAS[v] },
  { clave: 'marca', orden: (a, b) => a.localeCompare(b) },
  {
    clave: 'modelo',
    orden: porLista(['RTX 5070 / 5070 Ti', 'RTX 5060 / 5060 Ti', 'RTX 5050', 'RTX 3060', 'RTX 3050', 'Serie GTX', 'RX 9070 XT', 'RX 9070', 'RX 9060 XT', 'RX 9050', 'RX 7600', 'RX 6600', 'RX 590']),
  },
  { clave: 'vram', orden: numerico },
  { clave: 'memoria', orden: porLista(['GDDR7', 'GDDR6', 'GDDR5']) },
  { clave: 'conector', orden: porLista(['No requiere', '1 × 6 pines', '1 × 8 pines', '2 × 8 pines', '1 × 16 pines (12V-2x6)']) },
  { clave: 'fuente', orden: numerico },
  { clave: 'coolers', orden: numerico, texto: (v) => `${v} ${v === '1' ? 'fan' : 'fans'}` },
  { clave: 'largo', orden: porLista(['Menos de 210 mm', '210 a 270 mm', '271 a 310 mm', 'Más de 310 mm']) },
];

const ORDENES = {
  vendidos: (a, b) => a.datos.vendidos - b.datos.vendidos,
  menor: (a, b) => a.datos.precio - b.datos.precio,
  mayor: (a, b) => b.datos.precio - a.datos.precio,
  descuento: (a, b) => b.datos.descuento - a.datos.descuento || a.datos.vendidos - b.datos.vendidos,
};

const precios = items.map((i) => i.datos.precio);
const PRECIO_MIN = Math.floor(Math.min(...precios) / PASO_PRECIO) * PASO_PRECIO;
const PRECIO_MAX = Math.ceil(Math.max(...precios) / PASO_PRECIO) * PASO_PRECIO;

const estado = {
  local: false,
  min: null,
  max: null,
  orden: 'vendidos',
  grupos: Object.fromEntries(GRUPOS.map((g) => [g.clave, new Set()])),
};
let paginas = 1;

function leer(el) {
  const d = { ...el.dataset };
  d.precio = Number(d.precio);
  d.descuento = Number(d.descuento);
  d.vendidos = Number(d.vendidos);
  d.local = d.local === '1';
  // Texto en el que busca ?q=: nombre, marca y datos clave, sin tildes ni mayúsculas
  d.texto = normalizar([el.querySelector('.producto__nombre')?.textContent, d.marca, d.modelo, d.vram, d.memoria, d.sub === 'amd' ? 'amd radeon' : d.sub === 'nvidia' ? 'nvidia geforce' : '', d.categoria].join(' '));
  return d;
}

const pesos = (n) => '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const escapar = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const textoDe = (grupo, valor) => (grupo.texto ? grupo.texto(valor) : valor);

// ---------- Búsqueda (?q=, la usa el buscador del header: buscar.html) ----------
// Muestra los productos que tienen todas las palabras buscadas, sin importar tildes ni mayúsculas ("rtx 5060",
// "radeon 16gb"). El listado pasa a ser de resultados: título con lo buscado, sin el estante ni la guía de la
// categoría y, si no hay nada, su propio estado vacío con búsquedas populares. En el sitio real busca el backend.

function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/(\d)\s+(gb|w|mm)\b/g, '$1$2'); // "16 GB" y "16GB" son lo mismo
}

const escritas = normalizar(consulta).split(/\s+/).filter(Boolean);

// Tres casos además del exacto (en el sitio real los resuelve el buscador del backend):
// - corregida: una palabra mal escrita se corrige por la más parecida del catálogo ("rxt" → "rtx");
// - parecida: no hay resultados con todas las palabras, se muestran los que tienen alguna;
// - ninguna: sin coincidencias, el estado vacío con productos sugeridos y búsquedas populares.
const todas = (lista, d) => lista.every((p) => d.texto.includes(p));
const alguna = (lista, d) => lista.some((p) => p.length > 1 && d.texto.includes(p));
const vocabulario = [...new Set(items.flatMap((i) => i.datos.texto.split(/[^a-z0-9]+/)).filter((w) => w.length > 2))];
// Cambios para pasar de una palabra a otra (letra de más, de menos, distinta o dos letras invertidas)
function distancia(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + costo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}
function corregir(p) {
  if (p.length < 3 || items.some((i) => i.datos.texto.includes(p))) return p;
  const tope = p.length > 5 ? 2 : 1;
  let mejor = p, menor = tope + 1;
  for (const w of vocabulario) {
    const d = distancia(p, w);
    if (d < menor) [mejor, menor] = [w, d];
  }
  return mejor;
}

let tipoBusqueda = 'exacta';
let palabras = escritas;
if (consulta && !items.some((i) => todas(escritas, i.datos))) {
  const corregidas = escritas.map(corregir);
  if (corregidas.join(' ') !== escritas.join(' ') && items.some((i) => todas(corregidas, i.datos))) {
    palabras = corregidas;
    tipoBusqueda = 'corregida';
  } else {
    tipoBusqueda = items.some((i) => alguna(escritas, i.datos)) ? 'parecida' : 'ninguna';
  }
}
const coincide = (d) => (tipoBusqueda === 'parecida' ? alguna(palabras, d) : todas(palabras, d));
const hallados = items.filter((i) => coincide(i.datos));

// Listado de varias categorías: filtros de categoría y subcategoría y atributos generales; los propios de una
// categoría se esconden
const GENERALES = ['categoria', 'sub', 'marca'];
form.querySelectorAll('details[data-grupo]').forEach((d) => {
  const g = d.dataset.grupo;
  if (g !== 'precio') d.hidden = general ? !GENERALES.includes(g) : g === 'categoria';
});
if (general) {
  const titulo = listado.querySelector('[data-vacio] .resultados__vacio-titulo');
  if (titulo) titulo.textContent = 'No encontramos productos con esos filtros';
}

// Página de varias categorías con nombre propio (data-titulo en el <html>, ej. "Más vendidos"): su título y sus migas,
// sin el estante ni la guía de la categoría
function modoGeneral() {
  const nombre = document.documentElement.dataset.titulo;
  if (consulta || !nombre) return;
  listado.querySelector('.listado__titulo').textContent = nombre;
  const migas = listado.querySelector('.migas ol');
  if (migas) migas.innerHTML = `<li><a href="index.html">Inicio</a></li><li aria-current="page">${escapar(nombre)}</li>`;
  destacados?.remove();
  document.querySelector('.guia')?.remove();
}

function modoBusqueda() {
  if (!consulta) return;
  const titulo = listado.querySelector('.listado__titulo');
  titulo.textContent = `Resultados para “${consulta}”`;
  document.title = `Buscar: ${consulta} | Maximus Gaming Hardware`;
  // Migas: Inicio → Búsqueda
  const migas = listado.querySelector('.migas ol');
  if (migas) migas.innerHTML = '<li><a href="index.html">Inicio</a></li><li aria-current="page">Búsqueda</li>';
  destacados?.remove();
  bannerListado?.remove();
  document.querySelector('.guia')?.remove();
  // Corregida o parecida: el aviso arriba de la grilla
  const aviso = listado.querySelector('[data-aviso-busqueda]');
  if (tipoBusqueda === 'corregida') {
    aviso.innerHTML = `Mostramos resultados para <strong>${escapar(palabras.join(' '))}</strong>. Buscaste “${escapar(consulta)}”.`;
    aviso.hidden = false;
    titulo.textContent = `Resultados para “${palabras.join(' ')}”`;
  }
  if (tipoBusqueda === 'parecida') {
    aviso.innerHTML = `No encontramos resultados exactos para <strong>“${escapar(consulta)}”</strong>. Te mostramos los más parecidos.`;
    aviso.hidden = false;
  }
  // Sin resultados: el estado vacío de la búsqueda (sin filtros ni orden) con productos sugeridos (los más vendidos)
  if (!hallados.length) {
    const vacioBusqueda = listado.querySelector('[data-vacio-busqueda]');
    vacioBusqueda.querySelector('[data-consulta]').textContent = consulta;
    const sugeridos = vacioBusqueda.querySelector('[data-sugeridos]');
    if (sugeridos) {
      const masVendidos = [...items].sort(ORDENES.vendidos).slice(0, 4);
      sugeridos.append(...masVendidos.map(({ el }) => { const copia = el.cloneNode(true); copia.hidden = false; copia.removeAttribute('class'); return copia; }));
    }
    vacioBusqueda.hidden = false;
    listado.classList.add('listado--sin-resultados');
  }
}

// ---------- Elementos ----------

const cuentas = listado.querySelectorAll('[data-cuenta]');
const cuentasTexto = listado.querySelectorAll('[data-cuenta-texto]');
const activos = listado.querySelector('[data-activos]');
const vacio = listado.querySelector('[data-vacio]');
const pie = listado.querySelector('[data-pie]');
const mostrando = listado.querySelector('[data-mostrando]');
const barra = listado.querySelector('[data-barra]');
const verMas = listado.querySelector('[data-ver-mas]');
const destacados = listado.querySelector('[data-destacados]');
const bannerListado = listado.querySelector('.listado__banner');
const selectOrden = listado.querySelector('[data-orden]');
const filtrosN = listado.querySelector('[data-filtros-n]');
const rangoMin = form.elements['rango-min'];
const rangoMax = form.elements['rango-max'];
const campoMin = form.elements.min;
const campoMax = form.elements.max;
const relleno = form.querySelector('[data-relleno]');

// ---------- Filtrado ----------

// Pasa todos los filtros, salvo el del grupo indicado (para contar las opciones de ese grupo)
function pasa(d, excepto) {
  if (palabras.length && !coincide(d)) return false;
  if (excepto !== 'local' && estado.local && !d.local) return false;
  if (excepto !== 'precio') {
    if (estado.min !== null && d.precio < estado.min) return false;
    if (estado.max !== null && d.precio > estado.max) return false;
  }
  for (const { clave } of GRUPOS) {
    if (clave === excepto) continue;
    const elegidos = estado.grupos[clave];
    if (elegidos.size && !elegidos.has(d[clave])) return false;
  }
  return true;
}

function aplicar({ reiniciar = true, animarTodo = false } = {}) {
  const visibles = items.filter((i) => pasa(i.datos)).sort(ORDENES[estado.orden]);
  const porTanda = columnas() * FILAS_POR_PAGINA;
  paginas = reiniciar ? 1 : Math.min(paginas, Math.max(1, Math.ceil(visibles.length / porTanda)));
  const limite = paginas * porTanda;
  const yaSeVeian = new Set(items.filter((i) => !i.el.hidden).map((i) => i.el));

  // Orden en el DOM: primero los visibles (en su orden), después el resto escondido
  items.forEach((i) => (i.el.hidden = true));
  visibles.forEach((i, n) => (i.el.hidden = n >= limite));
  grilla.append(...visibles.map((i) => i.el), ...items.filter((i) => !visibles.includes(i)).map((i) => i.el));

  // Las que aparecen entran con fundido escalonado
  let n = 0;
  for (const { el } of visibles.slice(0, limite)) {
    if (!animarTodo && yaSeVeian.has(el)) continue;
    el.style.setProperty('--retraso', `${Math.min(n++ * 30, 300)}ms`);
    el.classList.add('resultados__item--nuevo');
    el.addEventListener('animationend', () => el.classList.remove('resultados__item--nuevo'), { once: true });
  }

  // Cantidad, pie y estado vacío
  const total = visibles.length;
  const vistos = Math.min(limite, total);
  cuentas.forEach((el) => (el.textContent = total));
  cuentasTexto.forEach((el) => (el.textContent = total === 1 ? 'producto' : 'productos'));
  mostrando.textContent = vistos;
  barra.style.setProperty('--progreso', `${total ? (vistos / total) * 100 : 0}%`);
  verMas.hidden = vistos >= total;
  pintarPaginas(Math.ceil(total / porTanda));
  pie.hidden = total === 0;
  vacio.hidden = total > 0 || !hallados.length;

  pintarFiltros();
  pintarActivos();
  escribirUrl();
}

// ---------- Páginas numeradas ----------
// "Ver más" es la navegación principal; debajo, enlaces reales a cada página (?pagina=n), para que Google indexe
// todas. La página n abre las primeras n tandas
const navPaginas = listado.querySelector('[data-paginas]');
function pintarPaginas(cantidad) {
  if (!navPaginas) return;
  navPaginas.hidden = cantidad < 2;
  const base = new URLSearchParams(location.search);
  navPaginas.querySelector('ol').innerHTML = Array.from({ length: cantidad }, (_, i) => {
    const n = i + 1;
    base.set('pagina', n);
    if (n === 1) base.delete('pagina');
    const href = `${location.pathname.split('/').pop()}${base.toString() ? '?' + base : ''}`;
    return `<li><a class="paginas__enlace${n === paginas ? ' actual' : ''}" href="${escapar(href)}"${n === paginas ? ' aria-current="page"' : ''}>${n}</a></li>`;
  }).join('');
}

// ---------- Panel de filtros ----------

// Arma las opciones de cada grupo con los valores que existen en las tarjetas
function armarGrupos() {
  for (const grupo of GRUPOS) {
    const details = form.querySelector(`[data-grupo="${grupo.clave}"]`);
    const valores = [...new Set(items.map((i) => i.datos[grupo.clave]))].sort(grupo.orden);
    details.querySelector('.filtro__opciones').innerHTML = valores
      .map(
        (v) => `<li><label class="filtro-opcion"><input class="sr-only" type="checkbox" name="${grupo.clave}" value="${escapar(v)}"><span class="filtro-opcion__caja"></span><span class="filtro-opcion__texto">${escapar(textoDe(grupo, v))}</span><span class="filtro-opcion__cuenta"></span></label></li>`
      )
      .join('');

    const visibles = Number(details.dataset.visibles) || 0;
    const ocultas = visibles ? valores.length - visibles : 0;
    const boton = details.querySelector('.filtro__ver-mas');
    if (ocultas > 0) {
      boton.hidden = false;
      boton.addEventListener('click', () => {
        details.classList.toggle('filtro--completo');
        recortar(details);
      });
    }
    recortar(details);
  }
}

// Esconde las opciones que sobran (salvo que el grupo esté desplegado) y escribe el "Ver más"
function recortar(details) {
  const visibles = Number(details.dataset.visibles) || 0;
  const lis = [...details.querySelectorAll('.filtro__opciones li')];
  const completo = details.classList.contains('filtro--completo') || !visibles;
  lis.forEach((li, n) => (li.hidden = !completo && n >= visibles));
  const boton = details.querySelector('.filtro__ver-mas');
  if (!boton.hidden) boton.querySelector('span').textContent = completo ? 'Ver menos' : `Ver ${lis.length - visibles} más`;
}

// Estado de cada control del panel: marcado, contador y apagado si no deja resultados
function pintarFiltros() {
  for (const grupo of GRUPOS) {
    const base = items.filter((i) => pasa(i.datos, grupo.clave));
    const details = form.querySelector(`[data-grupo="${grupo.clave}"]`);
    let elegidoEscondido = false;
    details.querySelectorAll('input').forEach((input) => {
      const n = base.filter((i) => i.datos[grupo.clave] === input.value).length;
      input.checked = estado.grupos[grupo.clave].has(input.value);
      input.disabled = n === 0 && !input.checked;
      const opcion = input.closest('.filtro-opcion');
      opcion.querySelector('.filtro-opcion__cuenta').textContent = n;
      opcion.classList.toggle('filtro-opcion--sin', input.disabled);
      if (input.checked && input.closest('li').hidden) elegidoEscondido = true;
    });
    // Si eligió algo que estaba detrás del "Ver más", el grupo se despliega
    if (elegidoEscondido) {
      details.classList.add('filtro--completo');
      recortar(details);
    }
  }

  form.elements.local.checked = estado.local;
  pintarPrecio();
}

function pintarPrecio() {
  const min = estado.min ?? PRECIO_MIN;
  const max = estado.max ?? PRECIO_MAX;
  rangoMin.value = min;
  rangoMax.value = max;
  if (document.activeElement !== campoMin) campoMin.value = estado.min ?? '';
  if (document.activeElement !== campoMax) campoMax.value = estado.max ?? '';
  const ancho = PRECIO_MAX - PRECIO_MIN;
  relleno.style.setProperty('--desde', `${((min - PRECIO_MIN) / ancho) * 100}%`);
  relleno.style.setProperty('--hasta', `${((PRECIO_MAX - max) / ancho) * 100}%`);
}

// ---------- Filtros aplicados (etiquetas removibles) ----------

function listaDeActivos() {
  const lista = [];
  if (estado.local) lista.push({ texto: 'Con stock en el local', quitar: () => (estado.local = false) });
  if (estado.min !== null) lista.push({ texto: `Desde ${pesos(estado.min)}`, quitar: () => (estado.min = null) });
  if (estado.max !== null) lista.push({ texto: `Hasta ${pesos(estado.max)}`, quitar: () => (estado.max = null) });
  for (const grupo of GRUPOS) {
    for (const valor of estado.grupos[grupo.clave]) {
      lista.push({ texto: textoDe(grupo, valor), quitar: () => estado.grupos[grupo.clave].delete(valor) });
    }
  }
  return lista;
}

function pintarActivos() {
  const lista = listaDeActivos();
  activos.hidden = !lista.length;
  activos.innerHTML = '';
  for (const { texto, quitar } of lista) {
    const li = document.createElement('li');
    li.className = 'activo';
    li.innerHTML = `${escapar(texto)}<button class="activo__quitar" type="button" aria-label="Quitar filtro ${escapar(texto)}"><svg class="icono" aria-hidden="true"><use href="#i-cerrar"/></svg></button>`;
    li.querySelector('button').addEventListener('click', () => {
      quitar();
      aplicar();
    });
    activos.append(li);
  }
  if (lista.length) {
    const li = document.createElement('li');
    li.innerHTML = '<button class="activos__limpiar" type="button">Limpiar todo</button>';
    li.querySelector('button').addEventListener('click', limpiar);
    activos.append(li);
  }

  filtrosN.hidden = !lista.length;
  filtrosN.textContent = lista.length;
  listado.querySelector('.filtros__limpiar').hidden = !lista.length;
  // El estante "Las más elegidas" solo se ve con el catálogo sin filtrar
  if (destacados) destacados.hidden = lista.length > 0;
  if (bannerListado) bannerListado.hidden = lista.length > 0;
}

function limpiar() {
  estado.local = false;
  estado.min = estado.max = null;
  GRUPOS.forEach((g) => estado.grupos[g.clave].clear());
  aplicar();
}

// ---------- Estado en la URL ----------

function escribirUrl() {
  const p = new URLSearchParams();
  if (consulta) p.set('q', consulta);
  if (estado.local) p.set('local', '1');
  if (estado.min !== null) p.set('min', estado.min);
  if (estado.max !== null) p.set('max', estado.max);
  for (const { clave } of GRUPOS) if (estado.grupos[clave].size) p.set(clave, [...estado.grupos[clave]].join(','));
  if (estado.orden !== 'vendidos') p.set('orden', estado.orden);
  if (paginas > 1) p.set('pagina', paginas);
  const q = p.toString();
  history.replaceState(null, '', location.pathname + (q ? `?${q}` : '') + location.hash);
}

function leerUrl() {
  const p = new URLSearchParams(location.search);
  estado.local = p.get('local') === '1';
  if (p.has('min')) estado.min = acotar(Number(p.get('min')));
  if (p.has('max')) estado.max = acotar(Number(p.get('max')));
  for (const { clave } of GRUPOS) {
    const valores = new Set(items.map((i) => i.datos[clave]));
    (p.get(clave) || '').split(',').filter((v) => valores.has(v)).forEach((v) => estado.grupos[clave].add(v));
  }
  if (p.get('orden') in ORDENES) estado.orden = p.get('orden');
  selectOrden.value = estado.orden;
  const pagina = Number(p.get('pagina'));
  paginas = Number.isInteger(pagina) && pagina > 1 ? pagina : 1;
}

const acotar = (n) => (Number.isFinite(n) ? Math.min(PRECIO_MAX, Math.max(PRECIO_MIN, n)) : null);

// ---------- Eventos ----------

form.addEventListener('submit', (e) => e.preventDefault());

form.addEventListener('change', (e) => {
  const input = e.target;
  if (input.type !== 'checkbox') return;
  if (input.name === 'local') estado.local = input.checked;
  else if (estado.grupos[input.name]) estado.grupos[input.name][input.checked ? 'add' : 'delete'](input.value);
  aplicar();
});

selectOrden.addEventListener('change', () => {
  estado.orden = selectOrden.value;
  aplicar({ animarTodo: true });
});

listado.querySelectorAll('[data-limpiar]').forEach((b) => b.addEventListener('click', limpiar));

verMas.addEventListener('click', () => {
  paginas += 1;
  aplicar({ reiniciar: false });
  // El foco pasa a la primera tarjeta nueva (teclado y lectores de pantalla) sin mover la página
  grilla.querySelector('.resultados__item--nuevo .producto__enlace')?.focus({ preventScroll: true });
});

// Precio: los deslizadores filtran en vivo; los campos, al confirmar
[rangoMin, rangoMax].forEach((rango) => {
  rango.min = PRECIO_MIN;
  rango.max = PRECIO_MAX;
  rango.step = PASO_PRECIO;
});
let cuadroPrecio = 0;

rangoMin.addEventListener('input', () => {
  const v = Math.min(Number(rangoMin.value), (estado.max ?? PRECIO_MAX) - PASO_PRECIO);
  estado.min = v <= PRECIO_MIN ? null : v;
  pintarPrecio();
  if (!cuadroPrecio) cuadroPrecio = requestAnimationFrame(() => ((cuadroPrecio = 0), aplicar()));
});

rangoMax.addEventListener('input', () => {
  const v = Math.max(Number(rangoMax.value), (estado.min ?? PRECIO_MIN) + PASO_PRECIO);
  estado.max = v >= PRECIO_MAX ? null : v;
  pintarPrecio();
  if (!cuadroPrecio) cuadroPrecio = requestAnimationFrame(() => ((cuadroPrecio = 0), aplicar()));
});

campoMin.addEventListener('change', () => {
  const v = campoMin.value === '' ? null : acotar(Number(campoMin.value));
  estado.min = v === null || v <= PRECIO_MIN ? null : Math.min(v, (estado.max ?? PRECIO_MAX) - PASO_PRECIO);
  aplicar();
});

campoMax.addEventListener('change', () => {
  const v = campoMax.value === '' ? null : acotar(Number(campoMax.value));
  estado.max = v === null || v >= PRECIO_MAX ? null : Math.max(v, (estado.min ?? PRECIO_MIN) + PASO_PRECIO);
  aplicar();
});

campoMin.placeholder = pesos(PRECIO_MIN).slice(1);
campoMax.placeholder = pesos(PRECIO_MAX).slice(1);

// ---------- Panel en mobile y tablet ----------

const botonAbrir = listado.querySelector('.listado__abrir');
const botonCerrar = listado.querySelector('.filtros__cerrar');
const escritorio = matchMedia('(min-width: 1024px)');

// Todo lo que queda fuera del panel se marca inert mientras está abierto (foco y lectores de pantalla)
function fueraDelPanel() {
  const lista = [];
  let el = filtros;
  while (el && el !== document.body) {
    lista.push(...[...el.parentElement.children].filter((h) => h !== el && !h.classList.contains('filtros-capa')));
    el = el.parentElement;
  }
  return lista;
}

function abrirPanel() {
  filtros.classList.add('filtros--abierto');
  botonAbrir.setAttribute('aria-expanded', 'true');
  fueraDelPanel().forEach((el) => (el.inert = true));
  botonCerrar.focus();
}

function cerrarPanel() {
  if (!filtros.classList.contains('filtros--abierto')) return;
  filtros.classList.remove('filtros--abierto');
  botonAbrir.setAttribute('aria-expanded', 'false');
  fueraDelPanel().forEach((el) => (el.inert = false));
  botonAbrir.focus();
}

botonAbrir.addEventListener('click', abrirPanel);
botonCerrar.addEventListener('click', cerrarPanel);
listado.querySelector('[data-capa]').addEventListener('click', cerrarPanel);
listado.querySelector('[data-ver]').addEventListener('click', cerrarPanel);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarPanel();
});
escritorio.addEventListener('change', () => {
  if (escritorio.matches) cerrarPanel();
});

// Cuántas tarjetas entran por fila (según el ancho); si cambia, se recalcula cuántas se muestran
function columnas() {
  return getComputedStyle(grilla).gridTemplateColumns.split(" ").length;
}

let columnasAntes = columnas();
addEventListener("resize", () => {
  const ahora = columnas();
  if (ahora === columnasAntes) return;
  columnasAntes = ahora;
  aplicar({ reiniciar: false });
});

// ---------- Arranque ----------

modoGeneral();
modoBusqueda();
armarGrupos();
leerUrl();
aplicar({ reiniciar: false, animarTodo: true });
