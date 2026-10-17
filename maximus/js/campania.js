// Landing de campaña: cuenta regresiva hasta data-fin y pestañas que filtran las ofertas por categoría (data-cat).
// La pestaña elegida queda en la URL (?cat=…) para compartir o volver atrás. Sin JS se ven todas las ofertas.

const cuenta = document.querySelector('.cuenta[data-fin]');
const pestanias = document.querySelector('[data-pestanias]');
const grilla = document.querySelector('[data-ofertas]');

// ---------- Cuenta regresiva ----------

if (cuenta) {
  const fin = new Date(cuenta.dataset.fin).getTime();
  const partes = ['dias', 'horas', 'minutos', 'segundos'].map((p) => cuenta.querySelector(`[data-${p}]`));
  const dos = (n) => String(n).padStart(2, '0');

  function actualizar() {
    const resta = Math.max(0, fin - Date.now());
    const s = Math.floor(resta / 1000);
    const valores = [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
    partes.forEach((el, i) => (el.textContent = i ? dos(valores[i]) : valores[i]));
    if (!resta) {
      cuenta.querySelector('.cuenta__rotulo').textContent = 'La campaña terminó';
      clearInterval(intervalo);
    }
  }

  const intervalo = setInterval(actualizar, 1000);
  actualizar();
}

// ---------- Pestañas por categoría ----------

if (pestanias && grilla) {
  const botones = [...pestanias.querySelectorAll('[data-cat]')];
  const items = [...grilla.children];
  const cantidad = document.querySelector('[data-ofertas-cant]');

  // Las pestañas sin productos no se muestran
  botones.forEach((b) => (b.hidden = b.dataset.cat !== 'todo' && !items.some((i) => i.dataset.cat === b.dataset.cat)));

  function elegir(cat, { escribir = true } = {}) {
    if (!botones.some((b) => b.dataset.cat === cat && !b.hidden)) cat = 'todo';
    botones.forEach((b) => b.setAttribute('aria-pressed', b.dataset.cat === cat));
    // En celular las pestañas se deslizan: la elegida queda a la vista
    const elegida = botones.find((b) => b.dataset.cat === cat);
    pestanias.scrollTo({ left: elegida.offsetLeft - pestanias.offsetLeft - 16, behavior: 'smooth' });
    let n = 0;
    items.forEach((item) => {
      const ver = cat === 'todo' || item.dataset.cat === cat;
      item.hidden = !ver;
      if (ver) {
        item.style.setProperty('--retraso', `${Math.min(n++ * 30, 300)}ms`);
        item.classList.remove('ofertas__item--nuevo');
        void item.offsetWidth; // reinicia la animación de entrada
        item.classList.add('ofertas__item--nuevo');
      }
    });
    if (cantidad) cantidad.textContent = n;
    if (escribir) {
      const url = new URL(location.href);
      if (cat === 'todo') url.searchParams.delete('cat');
      else url.searchParams.set('cat', cat);
      history.replaceState(null, '', url);
    }
  }

  pestanias.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-cat]');
    if (boton) elegir(boton.dataset.cat);
  });

  elegir(new URLSearchParams(location.search).get('cat') || 'todo', { escribir: false });
}
