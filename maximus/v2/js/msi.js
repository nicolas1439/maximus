// Landing Powered by MSI: elegir una gama muestra solo su sección (?gama=essential|advanced|ultimate), como en
// maximus.com.ar; "Ver todas las gamas" vuelve a la vista general. La vista general muestra cada gama en su fila
// deslizable; con una gama elegida, todas sus PC van en grilla (.estante-msi--grilla) de a 2 filas con "Ver más" y
// las páginas numeradas debajo (?pagina=: cuántas tandas se abrieron, como en el listado). Sin JS los enlaces
// recargan la página con la gama en la URL y se ven todas en filas.

const FILAS_POR_TANDA = 2; // filas que se ven de entrada con una gama elegida; cada "Ver más" suma otras tantas

const gamas = document.querySelector('[data-gamas]');
if (gamas) iniciar();

function iniciar() {
  const estantes = [...document.querySelectorAll('[data-estante]')];
  const tarjetas = [...gamas.querySelectorAll('[data-gama]')];
  const todas = document.querySelector('[data-todas]');
  const claves = estantes.map((e) => e.dataset.estante);
  const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)');
  let actual = null;
  let tandas = 1;

  // Columnas de la grilla en este ancho (las define msi.css)
  // (oculta, el navegador devuelve el valor sin resolver: "repeat(2, …)")
  const columnas = (pista) => {
    const valor = getComputedStyle(pista).gridTemplateColumns;
    const repetidas = valor.match(/repeat\((\d+)/);
    return repetidas ? Number(repetidas[1]) : valor === 'none' ? 1 : valor.split(' ').length;
  };

  function pintar(estante) {
    const pista = estante.querySelector('.carrusel__pista');
    const items = [...pista.children];
    const grilla = estante.dataset.estante === actual;
    estante.classList.toggle('estante-msi--grilla', grilla);
    if (!grilla) {
      items.forEach((i) => (i.hidden = false));
      return;
    }
    const porTanda = columnas(pista) * FILAS_POR_TANDA;
    const paginas = Math.ceil(items.length / porTanda);
    tandas = Math.min(Math.max(tandas, 1), paginas || 1);
    const limite = tandas * porTanda;
    items.forEach((item, k) => (item.hidden = k >= limite));

    const pie = estante.querySelector('[data-mas-gama]');
    if (!pie) return;
    const vistos = Math.min(limite, items.length);
    pie.querySelector('[data-mostrando]').textContent = vistos;
    pie.querySelector('[data-total]').textContent = items.length;
    pie.querySelector('[data-barra]').style.setProperty('--progreso', `${items.length ? (vistos / items.length) * 100 : 0}%`);
    pie.querySelector('[data-ver-mas]').hidden = vistos >= items.length;
    const nav = pie.querySelector('[data-paginas]');
    nav.hidden = paginas < 2;
    nav.querySelector('ol').innerHTML = Array.from({ length: paginas }, (_, i) => {
      const esta = i + 1 === tandas;
      const params = new URLSearchParams({ gama: actual });
      if (i) params.set('pagina', i + 1);
      return `<li><a class="paginas__enlace${esta ? ' actual' : ''}" href="?${params}"${esta ? ' aria-current="page"' : ''}>${i + 1}</a></li>`;
    }).join('');
  }

  function ver(gama, { desplazar = false } = {}) {
    if (!claves.includes(gama)) gama = null;
    actual = gama;
    estantes.forEach((e) => {
      e.hidden = gama !== null && e.dataset.estante !== gama;
      pintar(e);
    });
    tarjetas.forEach((t) => {
      if (t.dataset.gama === gama) t.setAttribute('aria-current', 'true');
      else t.removeAttribute('aria-current');
    });
    gamas.classList.toggle('gamas--elegida', Boolean(gama));
    todas.hidden = !gama;
    if (desplazar && gama) document.getElementById(gama).scrollIntoView({ behavior: sinMovimiento.matches ? 'auto' : 'smooth', block: 'start' });
  }

  function escribir(gama) {
    const url = new URL(location.href);
    if (gama) url.searchParams.set('gama', gama);
    else url.searchParams.delete('gama');
    url.searchParams.delete('pagina');
    history.pushState(null, '', url);
  }

  const leerURL = () => {
    const params = new URLSearchParams(location.search);
    tandas = Number(params.get('pagina')) || 1;
    ver(params.get('gama'));
  };

  tarjetas.forEach((t) =>
    t.addEventListener('click', (e) => {
      e.preventDefault();
      escribir(t.dataset.gama);
      tandas = 1;
      ver(t.dataset.gama, { desplazar: true });
    })
  );

  todas.addEventListener('click', (e) => {
    e.preventDefault();
    escribir(null);
    tandas = 1;
    ver(null);
  });

  // "Ver más": suma una tanda, la deja en la URL y pasa el foco a la primera PC nueva sin mover la página
  estantes.forEach((estante) =>
    estante.querySelector('[data-ver-mas]')?.addEventListener('click', () => {
      const pista = estante.querySelector('.carrusel__pista');
      const primera = columnas(pista) * FILAS_POR_TANDA * tandas;
      tandas += 1;
      pintar(estante);
      const url = new URL(location.href);
      url.searchParams.set('pagina', tandas);
      history.replaceState(null, '', url);
      pista.children[primera]?.querySelector('.producto__enlace')?.focus({ preventScroll: true });
    })
  );

  // Al cambiar el ancho cambian las columnas: se repinta la gama elegida con las mismas tandas
  let columnasAntes = 0;
  addEventListener('resize', () => {
    const estante = estantes.find((e) => e.dataset.estante === actual);
    if (!estante) return;
    const ahora = columnas(estante.querySelector('.carrusel__pista'));
    if (ahora === columnasAntes) return;
    columnasAntes = ahora;
    pintar(estante);
  });

  addEventListener('popstate', leerURL);
  leerURL();
}

// Estados de muestra de las gamas (vista previa): con productos, cargando o sin productos. En el sitio real cada
// gama muestra el estado que corresponde según lo que trae el backend
document.querySelectorAll('[data-ver-gamas]').forEach((boton) =>
  boton.addEventListener('click', () => {
    const estado = boton.dataset.verGamas;
    document.querySelectorAll('[data-ver-gamas]').forEach((b) => b.setAttribute('aria-pressed', b === boton));
    document.querySelectorAll('[data-estado-gama]').forEach((el) => (el.hidden = el.dataset.estadoGama !== estado));
  })
);
