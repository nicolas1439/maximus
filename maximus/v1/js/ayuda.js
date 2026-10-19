// Centro de ayuda: buscador en vivo (filtra las preguntas, resalta las coincidencias y cuenta por tema), temas
// con el actual marcado al hacer scroll, enlaces directos a una pregunta (#p-…: la abre y la marca) y el
// formulario de contacto (de muestra: valida y confirma, no envía nada).

const asuntos = [...document.querySelectorAll('[data-asunto]')];
const items = [...document.querySelectorAll('[data-asunto] .faq__item')];
const nav = document.querySelector('[data-asuntos]');
const enlacesNav = nav ? [...nav.querySelectorAll('a')] : [];

// El texto de cada pregunta va en un span: la pregunta es flex (texto | flecha) y, al resaltar, las marcas
// partirían el texto en varios elementos separados
items.forEach((item) => {
  const pregunta = item.querySelector('summary');
  const texto = document.createElement('span');
  texto.append(...[...pregunta.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE));
  pregunta.prepend(texto);
});

// ---------- Cantidad de preguntas por tema ----------

function contar(visibles) {
  asuntos.forEach((asunto) => {
    const total = asunto.querySelectorAll('.faq__item').length;
    const cant = visibles ? asunto.querySelectorAll('.faq__item:not([hidden])').length : total;
    const chip = nav?.querySelector(`[data-cant="${asunto.id}"]`);
    if (chip) chip.textContent = cant;
    chip?.closest('a').toggleAttribute('data-vacio', visibles && cant === 0);
  });
}

contar(false);

// ---------- Tema actual al hacer scroll ----------

let enBusqueda = false;

function marcarActual(id) {
  enlacesNav.forEach((a) => {
    if (a.getAttribute('href') === `#${id}`) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
  // En celular, la pestaña elegida queda a la vista dentro de la fila deslizable (sin mover la página)
  const actual = nav.querySelector('[aria-current]');
  if (actual && nav.scrollWidth > nav.clientWidth) {
    nav.scrollTo({ left: actual.offsetLeft - (nav.clientWidth - actual.offsetWidth) / 2, behavior: 'smooth' });
  }
}

if (nav && 'IntersectionObserver' in window) {
  const visibles = new Map();
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => visibles.set(e.target.id, e.isIntersecting));
      const primero = asuntos.find((a) => visibles.get(a.id) && !a.hidden);
      if (primero) marcarActual(primero.id);
    },
    { rootMargin: '-20% 0px -55% 0px' }
  );
  asuntos.forEach((a) => observador.observe(a));
  if (asuntos[0]) marcarActual(asuntos[0].id);
}

// ---------- Enlace a una pregunta: la abre, la lleva a la vista y la marca un momento ----------

function irA(hash, { suave = true } = {}) {
  const destino = hash.length > 1 && document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!destino || !destino.closest('.centro')) return false;
  if (enBusqueda && destino.closest('[hidden]')) limpiarBusqueda();
  if (destino.matches('details')) {
    destino.open = true;
    destino.classList.remove('faq__item--destacada');
    void destino.offsetWidth;
    destino.classList.add('faq__item--destacada');
  }
  destino.scrollIntoView({ behavior: suave ? 'smooth' : 'instant', block: 'start' });
  return true;
}

document.addEventListener('click', (e) => {
  const enlace = e.target.closest('a[href^="#"]');
  if (!enlace) return;
  // Enlaces que eligen el motivo del formulario de contacto
  if (enlace.dataset.motivo) elegirMotivo(enlace.dataset.motivo);
  if (irA(enlace.getAttribute('href'))) {
    e.preventDefault();
    history.replaceState(null, '', enlace.getAttribute('href'));
  }
});

// ---------- Buscador ----------

const buscador = document.querySelector('[data-buscador]');
const campo = buscador?.querySelector('input');
const estado = document.querySelector('[data-estado-busqueda]');
const sinResultados = document.querySelector('[data-sin-resultados]');
const extras = [...document.querySelectorAll('.sucursales, .plazos')];
const vacias = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'lo', 'mi', 'mis', 'tu', 'que', 'como', 'en', 'y', 'o', 'un', 'una', 'por', 'para', 'con', 'se', 'me', 'es', 'al', 'si', 'no', 'puedo', 'hay']);

// Sin tildes y en minúsculas, letra por letra (así las posiciones coinciden con el texto original)
const normalizar = (texto) => [...texto].map((c) => c.normalize('NFD')[0].toLowerCase()).join('');

function resaltar(raiz, terminos) {
  const recorrido = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement.closest('svg, mark') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodos = [];
  while (recorrido.nextNode()) nodos.push(recorrido.currentNode);

  for (const nodo of nodos) {
    const texto = nodo.data;
    const norm = normalizar(texto);
    const rangos = [];
    for (const t of terminos) {
      for (let i = norm.indexOf(t); i !== -1; i = norm.indexOf(t, i + t.length)) rangos.push([i, i + t.length]);
    }
    if (!rangos.length) continue;
    rangos.sort((a, b) => a[0] - b[0]);
    const unidos = [rangos[0]];
    for (const r of rangos.slice(1)) {
      const ultimo = unidos[unidos.length - 1];
      if (r[0] <= ultimo[1]) ultimo[1] = Math.max(ultimo[1], r[1]);
      else unidos.push(r);
    }
    const partes = document.createDocumentFragment();
    let desde = 0;
    for (const [a, b] of unidos) {
      partes.append(texto.slice(desde, a));
      const marca = document.createElement('mark');
      marca.textContent = texto.slice(a, b);
      partes.append(marca);
      desde = b;
    }
    partes.append(texto.slice(desde));
    nodo.replaceWith(partes);
  }
}

function quitarResaltado() {
  document.querySelectorAll('.centro__contenido mark').forEach((m) => {
    const padre = m.parentNode;
    m.replaceWith(m.textContent);
    padre.normalize();
  });
}

function limpiarBusqueda() {
  if (campo) campo.value = '';
  buscar('');
}

function buscar(consulta) {
  const terminos = normalizar(consulta.trim())
    .split(/\s+/)
    .filter((t) => t.length > 1 && !vacias.has(t));
  quitarResaltado();
  buscador?.querySelector('[data-limpiar]')?.toggleAttribute('hidden', !consulta.trim());

  // Sin búsqueda: todo a la vista y se cierran las preguntas que abrió la búsqueda
  if (!terminos.length) {
    enBusqueda = false;
    items.forEach((item) => {
      item.hidden = false;
      if (item.hasAttribute('data-abierta-busqueda')) {
        item.open = false;
        item.removeAttribute('data-abierta-busqueda');
      }
    });
    asuntos.forEach((a) => (a.hidden = false));
    extras.forEach((x) => (x.hidden = false));
    estado.hidden = true;
    sinResultados.hidden = true;
    contar(false);
    return;
  }

  enBusqueda = true;
  const encontrados = items.filter((item) => {
    const texto = normalizar(item.textContent);
    const coincide = terminos.every((t) => texto.includes(t));
    item.hidden = !coincide;
    return coincide;
  });

  asuntos.forEach((a) => (a.hidden = !a.querySelector('.faq__item:not([hidden])')));
  extras.forEach((x) => (x.hidden = true));
  encontrados.forEach((item) => resaltar(item, terminos));

  // Pocas respuestas: se abren solas
  items.forEach((item) => {
    const abrir = encontrados.length <= 3 && encontrados.includes(item);
    if (abrir && !item.open) {
      item.open = true;
      item.setAttribute('data-abierta-busqueda', '');
    } else if (!abrir && item.hasAttribute('data-abierta-busqueda')) {
      item.open = false;
      item.removeAttribute('data-abierta-busqueda');
    }
  });

  const n = encontrados.length;
  estado.hidden = n === 0;
  estado.querySelector('[data-estado-texto]').textContent = `${n} ${n === 1 ? 'respuesta' : 'respuestas'} para “${consulta.trim()}”`;
  sinResultados.hidden = n > 0;
  sinResultados.querySelector('[data-consulta]').textContent = consulta.trim();
  contar(true);
}

if (buscador) {
  let espera = 0;
  campo.addEventListener('input', () => {
    clearTimeout(espera);
    espera = setTimeout(() => buscar(campo.value), 120);
  });

  // Enter: busca y baja a los resultados
  buscador.addEventListener('submit', (e) => {
    e.preventDefault();
    buscar(campo.value);
    document.querySelector('.centro__cuerpo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.querySelectorAll('[data-limpiar]').forEach((b) =>
    b.addEventListener('click', () => {
      limpiarBusqueda();
      campo.focus();
    })
  );

  // Funciona sin JS con ?q=: al llegar con una búsqueda, se aplica
  const inicial = new URLSearchParams(location.search).get('q');
  if (inicial) {
    campo.value = inicial;
    buscar(inicial);
  }
}

// ---------- Contacto (de muestra) ----------

const form = document.querySelector('[data-contacto]');
const selectMotivo = form?.querySelector('[data-motivo-campo]');

// Rótulo y ayuda del mensaje según el motivo
const mensajes = {
  'Faltante en mi pedido': ['¿Qué producto falta?', 'Escribinos dentro de las 24 hs de recibido el pedido'],
  'Cambio o devolución': ['Motivo del cambio o la devolución', 'Contanos qué pasó con el producto'],
  'Anular una compra (botón de arrepentimiento)': ['Motivo de la anulación', 'Opcional: contanos por qué'],
  'No me llegó el correo de confirmación': ['Tu DNI o CUIT', 'Para encontrar tu compra'],
  'Cambiar la dirección de entrega': ['Dirección nueva', 'Calle y número, piso, localidad y código postal'],
  'Solicitar una factura': ['Tu DNI o CUIT', 'Y cualquier dato que nos ayude a encontrar la compra'],
  'Corregir una factura': ['Datos para corregir la factura', 'Razón social, CUIT, condición fiscal…'],
  'Pedir un presupuesto': ['¿Qué querés presupuestar?', 'Productos, cantidades y para qué los vas a usar'],
  Reclamo: ['Tu reclamo', 'Contanos qué pasó'],
  Sugerencia: ['Tu sugerencia', 'Todo nos sirve para mejorar'],
};

function elegirMotivo(motivo) {
  if (!selectMotivo) return;
  const opcion = [...selectMotivo.options].find((o) => o.text === motivo);
  if (!opcion) return;
  selectMotivo.value = opcion.value;
  selectMotivo.dispatchEvent(new Event('change'));
}

function marcar(control, mensaje) {
  const caja = control.closest('.campo');
  let nota = caja.querySelector('.campo__error');
  if (!mensaje) {
    control.removeAttribute('aria-invalid');
    nota?.remove();
    return;
  }
  if (!nota) {
    nota = document.createElement('p');
    nota.className = 'campo__error';
    nota.id = `${control.id}-error`;
    (control.closest('.selector') || control).after(nota);
    control.setAttribute('aria-describedby', nota.id);
  }
  nota.innerHTML = `<svg class="icono" aria-hidden="true"><use href="recursos/iconos.svg?v=3#i-alerta"/></svg><span>${mensaje}</span>`;
  control.setAttribute('aria-invalid', 'true');
}

function errorDe(control) {
  const v = control.value.trim();
  if (control.required && !v) return control.name === 'motivo' ? 'Elegí un motivo.' : 'Completá este campo.';
  if (control.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Revisá el correo (ej.: nombre@correo.com).';
  return '';
}

if (form) {
  const campoPedido = form.querySelector('[data-campo-pedido]');
  const pedido = campoPedido.querySelector('input');
  const mensaje = form.elements.mensaje;
  const rotulo = form.querySelector('[data-mensaje-rotulo]');
  const pasoCargar = form.querySelector('[data-paso="cargar"]');
  const pasoListo = form.querySelector('[data-paso="listo"]');

  selectMotivo.addEventListener('change', () => {
    const opcion = selectMotivo.selectedOptions[0];
    const conPedido = opcion.hasAttribute('data-pedido');
    campoPedido.hidden = !conPedido;
    pedido.required = conPedido;
    if (!conPedido) marcar(pedido, '');
    const [texto, ayuda] = mensajes[opcion.text] || ['Tu mensaje', 'Contanos en qué te podemos ayudar'];
    rotulo.textContent = texto;
    mensaje.placeholder = ayuda;
    // Arrepentimiento: el mensaje es opcional
    mensaje.required = opcion.text !== 'Anular una compra (botón de arrepentimiento)';
    marcar(selectMotivo, '');
  });

  form.addEventListener('focusout', (e) => {
    if (e.target.matches('.campo__control') && e.target.value) marcar(e.target, errorDe(e.target));
  });

  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid')) marcar(e.target, errorDe(e.target));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const controles = [...form.querySelectorAll('select, input, textarea')].filter((c) => !c.closest('[hidden]'));
    let primero = null;
    controles.forEach((c) => {
      const error = errorDe(c);
      marcar(c, error);
      if (error && !primero) primero = c;
    });
    if (primero) return primero.focus();

    pasoListo.querySelector('[data-correo]').textContent = form.elements.correo.value.trim();
    pasoCargar.hidden = true;
    pasoListo.hidden = false;
    pasoListo.focus();
  });

  form.querySelector('[data-otro]').addEventListener('click', () => {
    form.reset();
    selectMotivo.dispatchEvent(new Event('change'));
    selectMotivo.value = '';
    pasoListo.hidden = true;
    pasoCargar.hidden = false;
  });
}

// ---------- Al llegar con un enlace a una pregunta o tema ----------

// Se repite al terminar de cargar: al recargar, el navegador vuelve a la posición anterior y taparía el enlace
if (location.hash) {
  const llegar = () => irA(location.hash, { suave: false });
  requestAnimationFrame(llegar);
  if (document.readyState === 'complete') setTimeout(llegar);
  else addEventListener('load', () => setTimeout(llegar), { once: true });
}
addEventListener('hashchange', () => irA(location.hash));
