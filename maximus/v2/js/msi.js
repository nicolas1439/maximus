// Landing Powered by MSI: elegir una gama muestra solo su sección (?gama=essential|advanced|ultimate), como en
// maximus.com.ar; "Ver todas las gamas" vuelve a la vista general. Sin JS los enlaces recargan la página con la
// gama en la URL y se ven todas.

const gamas = document.querySelector('[data-gamas]');
if (gamas) iniciar();

function iniciar() {
  const estantes = [...document.querySelectorAll('[data-estante]')];
  const tarjetas = [...gamas.querySelectorAll('[data-gama]')];
  const todas = document.querySelector('[data-todas]');
  const claves = estantes.map((e) => e.dataset.estante);
  const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)');

  function ver(gama, { desplazar = false } = {}) {
    if (!claves.includes(gama)) gama = null;
    estantes.forEach((e) => (e.hidden = gama !== null && e.dataset.estante !== gama));
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
    history.pushState(null, '', url);
  }

  tarjetas.forEach((t) =>
    t.addEventListener('click', (e) => {
      e.preventDefault();
      escribir(t.dataset.gama);
      ver(t.dataset.gama, { desplazar: true });
    })
  );

  todas.addEventListener('click', (e) => {
    e.preventDefault();
    escribir(null);
    ver(null);
  });

  addEventListener('popstate', () => ver(new URLSearchParams(location.search).get('gama')));
  ver(new URLSearchParams(location.search).get('gama'));
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
