// Mi cuenta: una sección a la vista por vez según el enlace de la navegación (#resumen, #pedidos, #favoritos…),
// el diálogo para subir el comprobante de una transferencia, mostrar u ocultar la contraseña y la confirmación de
// los formularios (de muestra: no se envía nada). Sin JS se ven todas las secciones una debajo de la otra.

const cuenta = document.querySelector('.cuenta');
const nav = document.querySelector('[data-cuenta-nav]');
const paneles = [...document.querySelectorAll('[data-panel]')];
const enlaces = nav ? [...nav.querySelectorAll('a[href^="#"]')] : [];

// ---------- Secciones ----------

function mostrar(nombre, { desplazar = false } = {}) {
  const panel = paneles.find((p) => p.dataset.panel === nombre) || paneles[0];
  if (!panel) return;
  paneles.forEach((p) => (p.hidden = p !== panel));
  enlaces.forEach((a) => {
    if (a.getAttribute('href') === `#${panel.dataset.panel}`) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  // En celular, la pestaña elegida queda a la vista dentro de la fila deslizable (sin mover la página)
  const actual = nav?.querySelector('[aria-current="page"]');
  if (actual && nav.scrollWidth > nav.clientWidth) {
    nav.scrollTo({ left: actual.offsetLeft - (nav.clientWidth - actual.offsetWidth) / 2, behavior: 'smooth' });
  }

  // Si el comienzo de la sección quedó arriba, fuera de la vista (ej. "Ver todas" al pie del resumen), sube hasta ahí
  if (desplazar && panel.getBoundingClientRect().top < 0) panel.scrollIntoView({ block: 'start' });
}

if (cuenta && paneles.length) {
  cuenta.classList.add('cuenta--js');
  mostrar(location.hash.slice(1));
  addEventListener('hashchange', () => mostrar(location.hash.slice(1), { desplazar: true }));
}

// ---------- Subir comprobante ----------

const dialogo = document.querySelector('[data-dialogo-comprobante]');

if (dialogo) {
  const form = dialogo.querySelector('[data-comprobante-form]');
  const archivo = dialogo.querySelector('input[type="file"]');
  const caja = archivo.closest('.archivo');
  const nombre = dialogo.querySelector('[data-archivo-nombre]');
  const enviar = dialogo.querySelector('[data-enviar]');
  const pasoCargar = dialogo.querySelector('[data-paso="cargar"]');
  const pasoListo = dialogo.querySelector('[data-paso="listo"]');
  let pedido = null;

  function reiniciar() {
    form.reset();
    nombre.textContent = 'Elegí el archivo del comprobante';
    caja.classList.remove('archivo--lleno');
    enviar.disabled = true;
    pasoCargar.hidden = false;
    pasoListo.hidden = true;
  }

  document.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-comprobante]');
    if (!boton) return;
    pedido = boton.dataset.comprobante;
    dialogo.querySelector('[data-comprobante-pedido]').textContent = `#MAX-${pedido}`;
    dialogo.querySelector('[data-comprobante-total]').textContent = boton.dataset.total || '';
    reiniciar();
    dialogo.showModal();
  });

  archivo.addEventListener('change', () => {
    const elegido = archivo.files[0];
    nombre.textContent = elegido ? elegido.name : 'Elegí el archivo del comprobante';
    caja.classList.toggle('archivo--lleno', Boolean(elegido));
    enviar.disabled = !elegido;
  });

  // De muestra: no se sube nada. El pedido pasa a "Pago en revisión" y desaparece el aviso de comprobante pendiente
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!archivo.files.length) return;
    pasoCargar.hidden = true;
    pasoListo.hidden = false;
    document.querySelectorAll('[data-pendiente]').forEach((n) => (n.hidden = true));
    document.querySelectorAll('[data-pendiente-nav]').forEach((n) => n.remove());
    document.querySelectorAll('[data-pendiente-estado]').forEach((n) => {
      n.textContent = 'Pago en revisión';
      n.classList.replace('estado--aviso', 'estado--info');
    });
  });

  dialogo.querySelectorAll('[data-cerrar]').forEach((b) => b.addEventListener('click', () => dialogo.close()));

  // Clic en el fondo (fuera de la caja): cierra
  dialogo.addEventListener('click', (e) => {
    if (e.target === dialogo) dialogo.close();
  });
}

// ---------- Contraseña: mostrar u ocultar ----------

document.querySelectorAll('.clave__ver').forEach((boton) =>
  boton.addEventListener('click', () => {
    const campo = boton.parentElement.querySelector('input');
    const ver = campo.type === 'password';
    campo.type = ver ? 'text' : 'password';
    boton.setAttribute('aria-pressed', ver);
    boton.setAttribute('aria-label', ver ? 'Ocultar contraseña' : 'Mostrar contraseña');
    boton.querySelector('use').setAttribute('href', `#${ver ? 'i-ojo-no' : 'i-ojo'}`);
  })
);

// ---------- Cerrar sesión (de muestra): borra la sesión que guardó acceso.js y lleva a Ingresar ----------

document.querySelectorAll('[data-cerrar-sesion]').forEach((enlace) =>
  enlace.addEventListener('click', () => {
    try {
      localStorage.removeItem('sesion');
    } catch {}
  })
);

// ---------- Formularios (de muestra) ----------

document.querySelectorAll('[data-formulario]').forEach((form) =>
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const estado = form.querySelector('.formulario__estado');
    const claves = [...form.querySelectorAll('input[type="password"], input[autocomplete="new-password"]')];

    let error = '';
    const vacio = [...form.querySelectorAll('[required]')].find((c) => !c.value.trim());
    if (vacio) error = 'Completá todos los campos.';
    else if (claves.length === 2 && claves[0].value.length < 8) error = 'La contraseña tiene que tener al menos 8 caracteres.';
    else if (claves.length === 2 && claves[0].value !== claves[1].value) error = 'Las contraseñas no coinciden.';

    estado.classList.toggle('formulario__estado--error', Boolean(error));
    estado.textContent = error || `${form.dataset.formulario}.`;
    if (error) (vacio || claves[0]).focus();
    else if (claves.length) form.reset();
  })
);
