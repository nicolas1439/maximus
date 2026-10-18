// Ficha de producto: galería (miniaturas, zoom al pasar el mouse y visor a pantalla completa), cantidad,
// compartir, favorito, avisos breves y la barra de compra fija de mobile. El deslizamiento de la galería
// (dedo, arrastre con el mouse y puntos) lo maneja carrusel.js.

import { pedirIngresoFavorito } from './tarjeta.js';

const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const comportamiento = movimientoReducido ? 'auto' : 'smooth';

// ---------- Aviso breve ----------

const aviso = document.querySelector('[data-aviso]');
let avisoTemporizador;

// Con error: el aviso en rojo y un poco más de tiempo para leerlo (se cierra solo)
function avisar(texto, { error = false } = {}) {
  if (!aviso) return;
  aviso.textContent = texto;
  aviso.classList.toggle('aviso--error', error);
  aviso.classList.add('aviso--visible');
  clearTimeout(avisoTemporizador);
  avisoTemporizador = setTimeout(() => aviso.classList.remove('aviso--visible'), error ? 4000 : 2200);
}

// ---------- Galería ----------

const galeria = document.querySelector('[data-galeria]');

if (galeria) {
  const pista = galeria.querySelector('.carrusel__pista');
  const fotos = [...pista.querySelectorAll('.galeria__foto')];
  const miniaturas = [...galeria.querySelectorAll('.galeria__miniatura')];
  const visor = document.querySelector('[data-visor]');
  let actual = 0;

  const irA = (i, modo = comportamiento) => pista.scrollTo({ left: fotos[i].offsetLeft, behavior: modo });

  miniaturas.forEach((miniatura, i) => miniatura.addEventListener('click', () => irA(i)));

  // Foto a la vista: marca su miniatura
  function marcar() {
    const i = Math.round(pista.scrollLeft / pista.clientWidth);
    if (i === actual) return;
    actual = i;
    miniaturas.forEach((miniatura, j) => miniatura.setAttribute('aria-current', j === i));
  }
  pista.addEventListener('scroll', marcar, { passive: true });

  // Visor a pantalla completa (dialog): flechas, teclado y deslizamiento con el dedo
  if (visor) {
    const img = visor.querySelector('.visor__img');
    const contador = visor.querySelector('.visor__contador');
    let enVisor = 0;

    function mostrar(i) {
      enVisor = (i + fotos.length) % fotos.length;
      const foto = fotos[enVisor].querySelector('img');
      img.src = foto.currentSrc || foto.src;
      img.alt = foto.alt;
      contador.textContent = `${enVisor + 1} / ${fotos.length}`;
    }

    function abrir(i) {
      mostrar(i);
      visor.showModal();
    }

    pista.addEventListener('click', (e) => {
      const foto = e.target.closest('.galeria__foto');
      if (foto) abrir(fotos.indexOf(foto));
    });
    galeria.querySelector('.galeria__ampliar')?.addEventListener('click', () => abrir(actual));

    visor.querySelectorAll('.visor__flecha').forEach((flecha) =>
      flecha.addEventListener('click', () => mostrar(enVisor + Number(flecha.dataset.sentido)))
    );
    visor.querySelector('[data-cerrar]').addEventListener('click', () => visor.close());

    // Clic fuera de la foto: cierra
    visor.addEventListener('click', (e) => {
      if (!e.target.closest('img, button')) visor.close();
    });

    visor.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') mostrar(enVisor + 1);
      if (e.key === 'ArrowLeft') mostrar(enVisor - 1);
    });

    let toque = null;
    visor.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') toque = e.clientX;
    });
    visor.addEventListener('pointerup', (e) => {
      if (toque === null) return;
      const dx = e.clientX - toque;
      toque = null;
      if (Math.abs(dx) > 40) mostrar(enVisor + (dx < 0 ? 1 : -1));
    });

    // Al cerrar, la galería queda en la foto que se estaba viendo
    visor.addEventListener('close', () => irA(enVisor, 'auto'));
  }
}

// ---------- Cantidad ----------

document.querySelectorAll('[data-cantidad]').forEach((caja) => {
  const campo = caja.querySelector('input');
  const menos = caja.querySelector('[data-paso="-1"]');
  const mas = caja.querySelector('[data-paso="1"]');
  const minimo = Number(campo.min) || 1;
  const maximo = Number(campo.max) || 99;

  function fijar(valor) {
    const n = Math.min(maximo, Math.max(minimo, Math.round(valor) || minimo));
    campo.value = n;
    menos.disabled = n <= minimo;
    mas.disabled = n >= maximo;
  }

  menos.addEventListener('click', () => fijar(Number(campo.value) - 1));
  mas.addEventListener('click', () => fijar(Number(campo.value) + 1));
  campo.addEventListener('change', () => fijar(Number(campo.value)));
  fijar(Number(campo.value));
});

// ---------- Compartir, favorito y agregar ----------

// Compartir: menú con Facebook, X, WhatsApp y Copiar enlace (los enlaces llevan la dirección de la página)
document.querySelectorAll('.compartir').forEach((caja) => {
  const boton = caja.querySelector('[data-compartir]');
  const menu = caja.querySelector('[data-compartir-menu]');
  const url = encodeURIComponent(location.href);
  const texto = encodeURIComponent(document.title);
  const destinos = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    x: `https://x.com/intent/post?url=${url}&text=${texto}`,
    whatsapp: `https://wa.me/?text=${texto}%20${url}`,
  };
  menu.querySelectorAll('[data-red]').forEach((a) => (a.href = destinos[a.dataset.red]));
  const abrir = (si) => {
    menu.hidden = !si;
    boton.setAttribute('aria-expanded', String(si));
    boton.classList.toggle('abierto', si);
  };
  boton.addEventListener('click', () => abrir(menu.hidden));
  menu.querySelector('[data-copiar-enlace]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); } catch {}
    abrir(false);
    avisar('Enlace copiado');
  });
  document.addEventListener('click', (e) => { if (!caja.contains(e.target)) abrir(false); });
  caja.addEventListener('keydown', (e) => { if (e.key === 'Escape') { abrir(false); boton.focus(); } });
});

// Sin sesión, el favorito pide ingresar o crear la cuenta (el diálogo de la tarjeta, tarjeta.js)
document.querySelectorAll('.ficha__favorito').forEach((boton) =>
  boton.addEventListener('click', () => {
    let sesion = false;
    try { sesion = Boolean(localStorage.getItem('sesion')); } catch {}
    if (!sesion) return pedirIngresoFavorito(document.querySelector('.ficha__nombre, h1')?.textContent.trim() || '');
    const marcado = boton.getAttribute('aria-pressed') !== 'true';
    boton.setAttribute('aria-pressed', marcado);
    boton.classList.toggle('marcado', marcado);
    avisar(marcado ? 'Guardado en favoritos' : 'Quitado de favoritos');
  })
);

// Sin carrito todavía: solo el aviso. "Comprar" agrega y va directo al checkout
document.querySelectorAll('[data-agregar], [data-agregar-combo]').forEach((boton) =>
  boton.addEventListener('click', () => avisar(boton.matches('[data-agregar-combo]') ? 'Combo agregado al carrito' : 'Agregado al carrito'))
);

// ---------- Barra de compra fija (mobile y tablet) ----------
// Aparece cuando el botón principal de compra queda arriba, fuera de la vista

const barra = document.querySelector('[data-barra]');
const agregar = document.querySelector('.compra__agregar');

if (barra && agregar) {
  new IntersectionObserver(
    ([entrada]) =>
      barra.classList.toggle('ficha__barra--visible', !entrada.isIntersecting && entrada.boundingClientRect.top < 0),
    { threshold: 0 }
  ).observe(agregar);
}

// ---------- Cotizador de envío (de muestra: en el sitio real cotiza el sistema con el código postal) ----------

const cotizador = document.querySelector('[data-cotizador]');
if (cotizador) {
  const abrir = document.querySelector('[data-abrir-cotizador]');
  const form = cotizador.querySelector('[data-cotizador-form]');
  const cargando = cotizador.querySelector('[data-cot-cargando]');
  const error = cotizador.querySelector('[data-cot-error]');
  const sin = cotizador.querySelector('[data-cot-sin]');
  const resultado = cotizador.querySelector('[data-cot-resultado]');
  const modalidades = cotizador.querySelector('[data-cot-modalidades]');

  abrir.addEventListener('click', () => {
    cotizador.hidden = !cotizador.hidden;
    abrir.setAttribute('aria-expanded', String(!cotizador.hidden));
    if (!cotizador.hidden) form.elements.cp.focus();
  });

  // AMBA: CABA o los códigos postales del conurbano (1000 a 1999). El resto del país, sin 24 hs y con más días
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const provincia = form.elements.provincia.value;
    const cp = form.elements.cp.value.trim();
    [error, sin, resultado].forEach((el) => (el.hidden = true));
    const amba = provincia === 'Ciudad Autónoma de Buenos Aires' || (provincia === 'Buenos Aires' && /^1\d{3}$/.test(cp));
    if (!/^\d{4}$/.test(cp) || (provincia === 'Ciudad Autónoma de Buenos Aires' && !/^1[0-4]\d{2}$/.test(cp))) {
      error.hidden = false;
      form.elements.cp.setAttribute('aria-invalid', 'true');
      return;
    }
    form.elements.cp.removeAttribute('aria-invalid');
    cargando.hidden = false;
    await new Promise((listo) => setTimeout(listo, 700));
    cargando.hidden = true;
    if (provincia === 'Tierra del Fuego') {
      sin.hidden = false;
      return;
    }
    const grande = document.querySelector('.ficha')?.classList.contains('ficha--grande');
    const lista = amba
      ? [['OCA 24 hs a domicilio', 'Llega el siguiente día hábil', '$4.892', true], ['OCA Normal a domicilio', 'Llega en 4 días hábiles desde el despacho', '$8.367'], ['OCA Normal a sucursal', 'Disponible en 4 días hábiles desde el despacho', '$6.694']]
      : [['OCA Normal a domicilio', 'Llega en 6 días hábiles desde el despacho', '$12.480'], ['OCA Normal a sucursal', 'Disponible en 6 días hábiles desde el despacho', '$9.950']];
    modalidades.innerHTML = lista
      .filter(([, , , rapido]) => !(rapido && grande))
      .map(([nombre, plazo, precio]) => `<li><span><strong>${nombre}</strong>${plazo}</span><strong>${precio}</strong></li>`)
      .join('');
    resultado.querySelector('[data-cot-destino]').textContent = `CP ${cp}, ${provincia}`;
    resultado.querySelector('[data-cot-grande]').hidden = !(grande && amba);
    resultado.hidden = false;
  });
}

// ---------- Avisame cuando vuelva (sin stock; de muestra) ----------
// Con un correo válido se habilita "Aceptar". Resultados de muestra según el correo: con "ya", ya estaba suscripto;
// con "falla", no se pudo completar; con "error", error general; cualquier otro, suscripción confirmada

const avisame = document.querySelector('[data-avisame]');
if (avisame) {
  const campo = avisame.elements.correo;
  const aceptar = avisame.querySelector('button');
  const resultado = document.querySelector('[data-avisame-resultado]');
  const valido = () => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(campo.value.trim());
  campo.addEventListener('input', () => (aceptar.disabled = !valido()));
  avisame.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!valido()) return;
    aceptar.disabled = true;
    aceptar.classList.add('cargando');
    await new Promise((listo) => setTimeout(listo, 600));
    aceptar.classList.remove('cargando');
    aceptar.disabled = false;
    const correo = campo.value.trim().toLowerCase();
    const [texto, esError] = correo.includes('error')
      ? ['Hubo un error. Probá de nuevo en unos minutos.', true]
      : correo.includes('falla')
        ? ['No pudimos completar la suscripción. Probá de nuevo o escribinos por WhatsApp.', true]
        : correo.includes('ya')
          ? [`Ya estabas suscripto: te avisamos a ${correo} cuando vuelva.`, false]
          : [`Listo: te avisamos a ${correo} cuando vuelva.`, false];
    resultado.textContent = texto;
    resultado.classList.toggle('con-error', esError);
    resultado.hidden = false;
  });
}

// ---------- Video: al tocar la miniatura carga el video de YouTube (sin cookies hasta reproducir) ----------

document.querySelectorAll('.video__poster').forEach((poster) =>
  poster.addEventListener('click', () => {
    const id = poster.dataset.video;
    if (!id) return avisar('Video de muestra: en el sitio real se reproduce acá');
    const marco = document.createElement('iframe');
    marco.className = 'video__marco';
    marco.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1`;
    marco.title = poster.getAttribute('aria-label') || 'Video del producto';
    marco.allow = 'autoplay; encrypted-media; picture-in-picture';
    marco.allowFullscreen = true;
    poster.replaceWith(marco);
  })
);

// ---------- Lo último que viste (con sesión): cuando llegan los productos, reemplazan a los esqueletos ----------

const vistos = document.querySelector('[data-vistos-ficha]');
if (vistos) {
  setTimeout(() => {
    const recomendados = [...document.querySelectorAll('.ficha__seccion .productos__lista:not([data-vistos-ficha]) > li')].slice(2, 6);
    if (!recomendados.length) return;
    vistos.replaceChildren(...recomendados.map((li) => li.cloneNode(true)));
    vistos.removeAttribute('aria-busy');
  }, 1200);
}

// ---------- Variantes de muestra (vista previa: data-demo) ----------

const ficha = document.querySelector('.ficha');
const VARIANTES = {
  campania: (v) => ficha.classList.toggle('ficha--sin-campania', v === 'sin'),
  web: (v) => {
    ficha.classList.toggle('ficha--sin-stock', v === 'sin');
    document.querySelector('[data-sin-stock]').hidden = v !== 'sin';
    document.querySelectorAll('[data-stock-web]').forEach((li) => (li.hidden = li.dataset.stockWeb !== v));
  },
  local: (v) => document.querySelectorAll('[data-stock-local]').forEach((li) => (li.hidden = li.dataset.stockLocal !== v)),
  fotos: (v) => {
    document.querySelector('[data-galeria]').classList.toggle('galeria--una', v === 'una');
    ficha.classList.toggle('ficha--una-foto', v === 'una');
  },
  cuotas: (v) => document.querySelectorAll('[data-cuotas]').forEach((el) => (el.hidden = el.dataset.cuotas !== v)),
  detalle: (v) => {
    ficha.classList.toggle('ficha--texto-libre', v === 'libre');
    document.querySelector('[data-texto-libre]').hidden = v !== 'libre';
  },
  producto: (v) => {
    ficha.classList.toggle('ficha--pc', v === 'pc');
    ficha.classList.toggle('ficha--grande', v === 'grande');
    document.querySelectorAll('[data-solo-producto]').forEach((el) => (el.hidden = el.dataset.soloProducto !== v));
    const envio = document.querySelector('[data-envio-texto]');
    if (envio) envio.textContent = v === 'grande' ? 'Excepto Tierra del Fuego. Por su tamaño, sin envío en 24 hs' : 'Excepto Tierra del Fuego. En AMBA llega en 24 hs hábiles';
  },
};
document.querySelectorAll('[data-variante]').forEach((boton) =>
  boton.addEventListener('click', () => {
    const [grupo, valor] = boton.dataset.variante.split(':');
    document.querySelectorAll(`[data-variante^="${grupo}:"]`).forEach((b) => b.setAttribute('aria-pressed', b === boton));
    VARIANTES[grupo]?.(valor);
  })
);
document.querySelectorAll('[data-error-agregar]').forEach((boton) =>
  boton.addEventListener('click', () =>
    avisar(boton.dataset.errorAgregar === 'agotado' ? 'Artículo sin stock: se agotó recién.' : 'Tu pedido no fue procesado, intentá de nuevo más tarde.', { error: true })
  )
);
