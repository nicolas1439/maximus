// Ficha de producto: galería (miniaturas, zoom al pasar el mouse y visor a pantalla completa), cantidad,
// compartir, favorito, avisos breves y la barra de compra fija de mobile. El deslizamiento de la galería
// (dedo, arrastre con el mouse y puntos) lo maneja carrusel.js.

const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const comportamiento = movimientoReducido ? 'auto' : 'smooth';

// ---------- Aviso breve ----------

const aviso = document.querySelector('[data-aviso]');
let avisoTemporizador;

function avisar(texto) {
  if (!aviso) return;
  aviso.textContent = texto;
  aviso.classList.add('aviso--visible');
  clearTimeout(avisoTemporizador);
  avisoTemporizador = setTimeout(() => aviso.classList.remove('aviso--visible'), 2200);
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

document.querySelectorAll('[data-compartir]').forEach((boton) =>
  boton.addEventListener('click', async () => {
    try {
      if (navigator.share) await navigator.share({ title: document.title, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        avisar('Enlace copiado');
      }
    } catch {}
  })
);

document.querySelectorAll('.ficha__favorito').forEach((boton) =>
  boton.addEventListener('click', () => {
    const marcado = boton.getAttribute('aria-pressed') !== 'true';
    boton.setAttribute('aria-pressed', marcado);
    avisar(marcado ? 'Guardado en favoritos' : 'Quitado de favoritos');
  })
);

// Sin carrito todavía: solo el aviso
document.querySelectorAll('[data-agregar]').forEach((boton) =>
  boton.addEventListener('click', () => avisar('Agregado al carrito'))
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
