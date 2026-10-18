// Carrusel genérico. Uso: <div class="carrusel" data-carrusel data-bucle data-autoplay="6000">
//   .carrusel__pista > .carrusel__item  (obligatorio)
//   .carrusel__punto, .carrusel__flecha[data-sentido="-1" | "1"]  (opcionales)
// La pista se desliza con el dedo (scroll-snap nativo) y con el mouse se arrastra; al soltar,
// se desliza suave hasta el ítem más cercano. Avance automático opcional (data-autoplay, en ms).
// data-bucle (para un ítem visible por vez): después del último sigue el primero, y antes del primero, el último.

const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const comportamiento = movimientoReducido ? 'auto' : 'smooth';

// Inicia los carruseles que hay dentro de raiz (cada uno una sola vez)
export function iniciarCarruseles(raiz = document) {
  raiz.querySelectorAll('[data-carrusel]:not(.carrusel--listo)').forEach((carrusel) => {
    carrusel.classList.add('carrusel--listo');
    iniciar(carrusel);
  });
}

function iniciar(carrusel) {
  const pista = carrusel.querySelector('.carrusel__pista');
  const items = [...pista.children];
  const puntos = [...carrusel.querySelectorAll('.carrusel__punto')];
  const flechas = [...carrusel.querySelectorAll('.carrusel__flecha')];
  const intervalo = Number(carrusel.dataset.autoplay) || 0;
  const bucle = 'bucle' in carrusel.dataset && items.length > 1;

  // Solo se arrastra si hay algo para desplazar (en pantallas anchas puede entrar todo)
  const revisarDesplazable = () => {
    carrusel.classList.toggle('carrusel--desplazable', pista.scrollWidth > pista.clientWidth + 1);
    revisarFlechas();
  };
  new ResizeObserver(revisarDesplazable).observe(pista);

  let alTerminar = () => {};

  // ---------- Bucle ----------
  // Copia del último antes del primero y del primero después del último. Al detenerse sobre una copia,
  // salta sin animación al ítem real (idéntico), así el recorrido nunca termina.
  if (bucle) {
    const copia = (item) => {
      const clon = item.cloneNode(true);
      clon.inert = true;
      clon.setAttribute('aria-hidden', 'true');
      return clon;
    };
    const copiaUltimo = copia(items.at(-1));
    const copiaPrimero = copia(items[0]);
    pista.prepend(copiaUltimo);
    pista.append(copiaPrimero);
    pista.scrollLeft = items[0].offsetLeft;

    const cerca = (a, b) => Math.abs(a - b) < 2;
    const saltarSiEsCopia = () => {
      if (carrusel.classList.contains('carrusel--arrastrando')) return;
      if (cerca(pista.scrollLeft, copiaPrimero.offsetLeft)) pista.scrollLeft = items[0].offsetLeft;
      else if (cerca(pista.scrollLeft, copiaUltimo.offsetLeft)) pista.scrollLeft = items.at(-1).offsetLeft;
    };

    alTerminar = saltarSiEsCopia;

    // Fin del desplazamiento: scrollend donde existe; si no, una pausa breve del scroll
    if ('onscrollend' in window) pista.addEventListener('scrollend', saltarSiEsCopia);
    else {
      let espera;
      pista.addEventListener('scroll', () => {
        clearTimeout(espera);
        espera = setTimeout(saltarSiEsCopia, 120);
      });
    }
  }

  // Posiciones donde puede detenerse la pista (una por ítem, sin pasarse del final)
  function posiciones() {
    const maximo = pista.scrollWidth - pista.clientWidth;
    return [...new Set([...pista.children].map((item) => Math.min(item.offsetLeft, maximo)))];
  }

  function siguiente() {
    const alFinal = pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 1;
    if (alFinal && !bucle) pista.scrollTo({ left: 0, behavior: comportamiento });
    else pista.scrollBy({ left: pista.clientWidth, behavior: comportamiento });
  }

  // ---------- Flechas ----------
  // Pasan lo que se ve; el ajuste (snap) acomoda la pista en el ítem más cercano.
  // En los extremos quedan desactivadas con aria-disabled (con disabled se perdería el foco)
  function revisarFlechas() {
    const maximo = pista.scrollWidth - pista.clientWidth;
    for (const flecha of flechas) {
      const enExtremo = flecha.dataset.sentido < 0 ? pista.scrollLeft <= 1 : pista.scrollLeft >= maximo - 1;
      flecha.setAttribute('aria-disabled', enExtremo);
    }
  }

  flechas.forEach((flecha) =>
    flecha.addEventListener('click', () => {
      if (flecha.getAttribute('aria-disabled') === 'true') return;
      pista.scrollBy({ left: flecha.dataset.sentido * pista.clientWidth, behavior: comportamiento });
    })
  );
  if (flechas.length) pista.addEventListener('scroll', revisarFlechas, { passive: true });

  puntos.forEach((punto, i) =>
    punto.addEventListener('click', () => pista.scrollTo({ left: items[i].offsetLeft, behavior: comportamiento }))
  );

  // Ítem visible: marca su punto. En bucle (un ítem por vez), los que no se ven quedan fuera del foco
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const { target, intersectionRatio } of entradas) {
        const visible = intersectionRatio >= 0.6;
        if (bucle) target.inert = !visible;
        if (visible) puntos.forEach((p, i) => p.setAttribute('aria-current', items[i] === target));
      }
    },
    { root: pista, threshold: [0, 0.6] }
  );
  items.forEach((item) => observador.observe(item));

  // ---------- Arrastre con el mouse ----------

  let arrastre = null;
  let recienArrastrado = false;

  pista.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if (!carrusel.classList.contains('carrusel--desplazable')) return;
    arrastre = { x: e.clientX, inicio: pista.scrollLeft, dx: 0, movido: false };
  });

  pista.addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    arrastre.dx = e.clientX - arrastre.x;
    // Recién después de unos píxeles cuenta como arrastre (si no, es un clic normal)
    if (!arrastre.movido && Math.abs(arrastre.dx) > 6) {
      arrastre.movido = true;
      pista.setPointerCapture(e.pointerId);
      carrusel.classList.add('carrusel--arrastrando');
    }
    if (arrastre.movido) pista.scrollLeft = arrastre.inicio - arrastre.dx;
  });

  function soltar() {
    if (!arrastre) return;
    const { inicio, dx, movido } = arrastre;
    arrastre = null;
    if (!movido) return;

    // Destino: la posición más cercana; si casi no cambió pero el gesto fue claro, avanza una en esa dirección
    const lista = posiciones();
    let destino = lista.reduce((a, b) => (Math.abs(b - pista.scrollLeft) < Math.abs(a - pista.scrollLeft) ? b : a));
    if (destino === inicio && Math.abs(dx) > 40) {
      const i = lista.indexOf(inicio) + (dx < 0 ? 1 : -1);
      destino = lista[Math.max(0, Math.min(lista.length - 1, i))];
    }

    recienArrastrado = true;
    setTimeout(() => (recienArrastrado = false));
    pista.scrollTo({ left: destino, behavior: comportamiento });

    // El ajuste (snap) vuelve cuando termina el deslizamiento
    let restaurado = false;
    const restaurar = () => {
      if (restaurado) return;
      restaurado = true;
      carrusel.classList.remove('carrusel--arrastrando');
      alTerminar();
    };
    pista.addEventListener('scrollend', restaurar, { once: true });
    setTimeout(restaurar, 700);
  }

  pista.addEventListener('pointerup', soltar);
  pista.addEventListener('pointercancel', soltar);
  pista.addEventListener('dragstart', (e) => e.preventDefault());
  // Un arrastre no debe abrir el enlace sobre el que se soltó
  pista.addEventListener('click', (e) => {
    if (recienArrastrado) e.preventDefault();
  }, true);

  // ---------- Avance automático ----------
  // Se detiene mientras se usa el carrusel, cuando sale de la pantalla o con la pestaña oculta. Con movimiento
  // reducido no corre

  if (!intervalo || movimientoReducido) return;

  let enUso = false;
  let aLaVista = true;
  let temporizador;

  function actualizar() {
    clearInterval(temporizador);
    if (!enUso && aLaVista && !document.hidden) temporizador = setInterval(siguiente, intervalo);
  }

  new IntersectionObserver(([e]) => {
    aLaVista = e.isIntersecting;
    actualizar();
  }).observe(carrusel);

  const usar = (valor) => () => {
    enUso = valor;
    actualizar();
  };
  carrusel.addEventListener('pointerenter', usar(true));
  carrusel.addEventListener('pointerleave', usar(false));
  carrusel.addEventListener('focusin', usar(true));
  carrusel.addEventListener('focusout', (e) => {
    if (!carrusel.contains(e.relatedTarget)) usar(false)();
  });
  document.addEventListener('visibilitychange', actualizar);

  actualizar();
}
