// Mi cuenta: una sección a la vista por vez según el enlace de la navegación (#resumen, #pedidos, #favoritos…),
// el diálogo para subir el comprobante de una transferencia, mostrar u ocultar la contraseña y la confirmación de
// los formularios (de muestra: no se envía nada). Sin JS se ven todas las secciones una debajo de la otra.
// Revisión final (tanda 3c): estados reales del pedido y del comprobante, "Comprobantes pendientes", cancelar pedido,
// comprobantes de hasta 5 archivos, estados vacíos y de carga, Mis datos fijos, direcciones y presupuesto en PDF.

import { validarCampos, iniciarCampos, marcarError, cuitValido } from './campos.js';

// Estado de la demostración (en el sitio real lo da el sistema)
const demo = { errorCancelar: false, errorSubir: false, errorEliminar: false };

// Aviso breve
const aviso = document.querySelector('[data-aviso]');
let avisoTemporizador;
function avisar(texto) {
  if (!aviso) return;
  aviso.textContent = texto;
  aviso.classList.add('aviso--visible');
  clearTimeout(avisoTemporizador);
  avisoTemporizador = setTimeout(() => aviso.classList.remove('aviso--visible'), 2400);
}

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
// Hasta 5 archivos por pedido, de a uno: PDF, JPG, PNG, HEIC o WEBP de hasta 20 MB cada uno. Errores: formato no
// admitido, archivo muy grande, varios a la vez ("Subilos de a uno"), el máximo de 5 y no se pudo subir (WhatsApp)

const dialogo = document.querySelector('[data-dialogo-comprobante]');
const FORMATOS = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'webp'];
const MAXIMO = 5;
const TOPE = 20 * 1024 * 1024;

if (dialogo) {
  const form = dialogo.querySelector('[data-comprobante-form]');
  const archivo = dialogo.querySelector('input[type="file"]');
  const caja = dialogo.querySelector('[data-archivo-caja]');
  const nombre = dialogo.querySelector('[data-archivo-nombre]');
  const listaArchivos = dialogo.querySelector('[data-archivos]');
  const error = dialogo.querySelector('[data-archivo-error]');
  const enviar = dialogo.querySelector('[data-enviar]');
  const pasoCargar = dialogo.querySelector('[data-paso="cargar"]');
  const pasoListo = dialogo.querySelector('[data-paso="listo"]');
  let elegidos = [];

  const peso = (bytes) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`);

  function mostrarError(texto) {
    error.innerHTML = texto ? `<svg class="icono icono--s" aria-hidden="true"><use href="#i-alerta"/></svg><span>${texto}</span>` : '';
    error.hidden = !texto;
  }

  function pintar() {
    listaArchivos.innerHTML = elegidos
      .map(
        (f, i) => `<li class="archivos__item"><svg class="icono icono--s" aria-hidden="true"><use href="#i-comprobante"/></svg><span class="archivos__nombre">${f.name.replace(/[<>&]/g, '')}</span><span class="archivos__peso">${peso(f.size)}</span><button class="boton-icono archivos__quitar" type="button" aria-label="Quitar ${f.name.replace(/"/g, '')}" data-quitar-archivo="${i}"><svg class="icono icono--s" aria-hidden="true"><use href="#i-cerrar"/></svg></button></li>`
      )
      .join('');
    listaArchivos.hidden = !elegidos.length;
    const lleno = elegidos.length >= MAXIMO;
    caja.hidden = lleno;
    nombre.textContent = elegidos.length ? 'Agregar otro archivo' : 'Elegí el archivo del comprobante';
    caja.classList.toggle('archivo--lleno', false);
    enviar.disabled = !elegidos.length;
  }

  function reiniciar() {
    form.reset();
    elegidos = [];
    mostrarError('');
    pintar();
    pasoCargar.hidden = false;
    pasoListo.hidden = true;
  }

  document.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-comprobante]');
    if (!boton) return;
    dialogo.querySelector('[data-comprobante-pedido]').textContent = `#MAX-${boton.dataset.comprobante}`;
    dialogo.querySelector('[data-comprobante-total]').textContent = boton.dataset.total || '';
    reiniciar();
    dialogo.showModal();
  });

  archivo.addEventListener('change', () => {
    const nuevos = [...archivo.files];
    archivo.value = '';
    if (!nuevos.length) return;
    if (nuevos.length > 1) return mostrarError('Subilos de a uno.');
    const [f] = nuevos;
    const extension = f.name.split('.').pop().toLowerCase();
    if (!FORMATOS.includes(extension)) return mostrarError('Este formato no se admite: subí un PDF, JPG, PNG, HEIC o WEBP.');
    if (f.size > TOPE) return mostrarError(`El archivo pesa ${peso(f.size)}: el máximo es 20 MB.`);
    if (elegidos.length >= MAXIMO) return mostrarError('Ya cargaste 5 archivos, el máximo por pedido.');
    mostrarError('');
    elegidos.push(f);
    pintar();
  });

  listaArchivos.addEventListener('click', (e) => {
    const quitar = e.target.closest('[data-quitar-archivo]');
    if (!quitar) return;
    elegidos.splice(Number(quitar.dataset.quitarArchivo), 1);
    mostrarError('');
    pintar();
  });

  // De muestra: no se sube nada. El pedido pasa a "Pedido en revisión" con los comprobantes subidos
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!elegidos.length) return;
    enviar.classList.add('cargando');
    enviar.disabled = true;
    await new Promise((listo) => setTimeout(listo, 700));
    enviar.classList.remove('cargando');
    enviar.disabled = false;
    if (demo.errorSubir) {
      mostrarError('No pudimos subir el comprobante. Probá de nuevo o <a href="https://wa.me/541123575522?text=Hola%2C%20no%20pude%20subir%20el%20comprobante">envialo por WhatsApp</a>.');
      return;
    }
    pasoCargar.hidden = true;
    pasoListo.hidden = false;
    document.querySelectorAll('[data-pendiente]').forEach((n) => (n.hidden = true));
    document.querySelectorAll('[data-pendiente-nav]').forEach((n) => (n.hidden = true));
    verComprobante('subidos', elegidos.length);
    verPedido('revision');
  });

  dialogo.querySelectorAll('[data-cerrar]').forEach((b) => b.addEventListener('click', () => dialogo.close()));
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
    const documento = form.querySelector('[data-documento]:not(:disabled)');
    const tipoDoc = form.querySelector('#dato-doc-tipo')?.value;
    const numero = documento?.value.replace(/\D/g, '') || '';
    const docMal = documento && !(tipoDoc === 'CUIT' ? cuitValido(numero) : /^\d{7,8}$/.test(numero));
    if (documento) marcarError(documento, docMal ? 'El CUIT o DNI no es válido.' : '');
    if (vacio) error = 'Completá todos los campos.';
    else if (docMal) error = 'Revisá el documento.';
    else if (claves.length === 2 && claves[0].value.length < 8) error = 'La contraseña tiene que tener al menos 8 caracteres.';
    else if (claves.length === 2 && claves[0].value !== claves[1].value) error = 'Las contraseñas no coinciden.';

    estado.classList.toggle('formulario__estado--error', Boolean(error));
    estado.textContent = error || `${form.dataset.formulario}.`;
    if (error) (vacio || (docMal && documento) || claves[0]).focus();
    else if (claves.length) form.reset();
  })
);

// ---------- Estados del pedido ----------
// Cada estado real del sitio con su color y su lugar en los 5 pasos (Confirmado, Pago, Preparación, En camino o
// Para retirar, Entregado o Retirado). "Cancelar pedido" solo antes de que se confirme el pago.

const ESTADOS_PEDIDO = {
  pendiente: ['aviso', 'Pendiente de pago', 1],
  ingreso: ['info', 'Ingreso del pedido', 0],
  revision: ['info', 'Pedido en revisión', 1],
  pago: ['exito', 'Pago confirmado', 2],
  despachar: ['info', 'Listo para despachar', 3],
  despachado: ['info', 'Despachado', 3],
  retirar: ['exito', 'Listo para retirar', 3, true],
  facturado: ['info', 'Facturado', 3],
  entregado: ['exito', 'Entregado', 5],
  cancelado: ['error', 'Cancelado', -1],
};

const tarjetaDemo = document.querySelector('[data-pedido-demo]');

function verPedido(estado) {
  if (!tarjetaDemo) return;
  const [tono, texto, actual, retiro] = ESTADOS_PEDIDO[estado];
  const pill = tarjetaDemo.querySelector('[data-estado-pedido]');
  pill.className = `estado estado--${tono}`;
  pill.textContent = texto;
  tarjetaDemo.querySelector('.pedido').classList.toggle('pedido--cancelado', estado === 'cancelado');
  const nombres = ['Confirmado', 'Pago', 'Preparación', retiro ? 'Para retirar' : 'En camino', retiro ? 'Retirado' : 'Entregado'];
  tarjetaDemo.querySelectorAll('[data-pasos-pedido] .seguimiento__paso').forEach((paso, i) => {
    const hecho = actual > i;
    paso.classList.toggle('seguimiento__paso--hecho', hecho);
    paso.classList.toggle('seguimiento__paso--actual', i === actual);
    if (i === actual) paso.setAttribute('aria-current', 'step');
    else paso.removeAttribute('aria-current');
    paso.querySelector('.seguimiento__punto').innerHTML = hecho ? '<svg class="icono" aria-hidden="true"><use href="#i-check"/></svg>' : '';
    paso.querySelector('.seguimiento__texto').innerHTML = nombres[i] + (hecho ? '<small>12/10</small>' : '');
  });
  tarjetaDemo.querySelector('[data-pasos-pedido]').classList.toggle('seguimiento--cancelado', estado === 'cancelado');
  const cancelable = ['pendiente', 'ingreso', 'revision'].includes(estado);
  tarjetaDemo.querySelector('[data-cancelar-pedido]').hidden = !cancelable;
  if (estado !== 'cancelado') tarjetaDemo.querySelector('[data-cancelado-ok]').hidden = true;
  document.querySelectorAll('[data-ver-pedido]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.verPedido === estado)));
  // El pedido del resumen y de últimas compras muestra el mismo estado
  document.querySelectorAll('[data-pendiente-estado]').forEach((n) => {
    if (n === pill) return;
    n.className = `estado estado--${tono}`;
    n.textContent = texto;
  });
}

// ---------- Estados del comprobante ----------

const ESTADOS_COMPROBANTE = {
  subir: ['aviso', 'i-alerta', 'Subí el comprobante de la transferencia dentro de las 24 hs: sin él, el pedido no pasa a preparación y se libera el stock.', 'Subir comprobante'],
  subidos: ['info', 'i-comprobante', 'Comprobantes subidos ({n}): los revisamos y te avisamos por correo cuando se acredite el pago.', 'Agregar otro comprobante'],
  revision: ['info', 'i-reloj', 'Comprobante en revisión: te avisamos por correo cuando se acredite el pago.'],
  verificacion: ['info', 'i-reloj', 'En verificación de datos: Mercado Pago está validando el pago. Puede tardar hasta 48 hs hábiles.'],
  confirmado: ['exito', 'i-check', 'Pago confirmado el 12/10/2026.'],
  retirar: ['neutro', 'i-efectivo', 'Pago al retirar: pagás en efectivo cuando pasás a buscarlo por el local.'],
  factura: ['exito', 'i-comprobante', 'Tu factura ya está disponible.', null, true],
};

function verComprobante(estado, cantidad = 2) {
  if (!tarjetaDemo) return;
  const [tono, icono, texto, accion, factura] = ESTADOS_COMPROBANTE[estado];
  const caja = tarjetaDemo.querySelector('[data-comprobante-estado]');
  caja.className = `comprobante-estado comprobante-estado--${tono}`;
  caja.querySelector('[data-comprobante-texto]').innerHTML = `<svg class="icono icono--s" aria-hidden="true"><use href="#${icono}"/></svg><span>${texto.replace('{n}', cantidad)}</span>`;
  const boton = tarjetaDemo.querySelector('[data-accion-comprobante]');
  boton.hidden = !accion;
  if (accion) boton.querySelector('[data-accion-texto]').textContent = accion;
  boton.classList.toggle('boton--primario', estado === 'subir');
  boton.classList.toggle('boton--secundario', estado !== 'subir');
  tarjetaDemo.querySelector('[data-accion-factura]').hidden = !factura;
  // Solo los que esperan comprobante cuentan en "Comprobantes pendientes"
  tarjetaDemo.toggleAttribute('data-espera-comprobante', estado === 'subir');
  document.querySelectorAll('[data-ver-comprobante]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.verComprobante === estado)));
  contarPendientes();
}

// ---------- Comprobantes pendientes ----------

let filtro = 'todas';
function contarPendientes() {
  const pendientes = document.querySelectorAll('.pedidos > li[data-espera-comprobante]').length;
  document.querySelectorAll('[data-cant-pendientes]').forEach((n) => (n.textContent = pendientes));
  document.querySelectorAll('[data-pendiente-nav]').forEach((n) => {
    n.textContent = pendientes;
    n.hidden = !pendientes;
    n.setAttribute('aria-label', `${pendientes} pendiente${pendientes === 1 ? '' : 's'}`);
  });
  document.querySelectorAll('[data-pendiente]').forEach((n) => (n.hidden = !pendientes));
  document.querySelectorAll('[data-cant-todas]').forEach((n) => (n.textContent = document.querySelectorAll('.pedidos > li').length));
  filtrar(filtro);
}

function filtrar(valor) {
  filtro = valor;
  const lista = document.querySelector('.pedidos');
  if (!lista || lista.hidden) return;
  let visibles = 0;
  lista.querySelectorAll(':scope > li').forEach((li) => {
    li.hidden = valor === 'comprobantes' && !li.hasAttribute('data-espera-comprobante');
    if (!li.hidden) visibles++;
  });
  const vacioComprobantes = document.querySelector('[data-vacio="comprobantes"]');
  if (vacioComprobantes) vacioComprobantes.hidden = !(valor === 'comprobantes' && !visibles);
  document.querySelectorAll('.chip-filtro[data-filtro-pedidos]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filtroPedidos === valor)));
}

document.addEventListener('click', (e) => {
  const boton = e.target.closest('[data-filtro-pedidos]');
  if (boton) filtrar(boton.dataset.filtroPedidos);
});

// ---------- Cancelar pedido ----------

const dialogoCancelar = document.querySelector('[data-dialogo-cancelar]');
if (dialogoCancelar) {
  document.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-cancelar-pedido]');
    if (!boton) return;
    dialogoCancelar.querySelector('[data-cancelar-numero]').textContent = `#MAX-${boton.dataset.cancelarPedido}`;
    dialogoCancelar.showModal();
  });
  dialogoCancelar.querySelector('[data-confirmar-cancelar]').addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    boton.classList.add('cargando');
    boton.disabled = true;
    await new Promise((listo) => setTimeout(listo, 600));
    boton.classList.remove('cargando');
    boton.disabled = false;
    dialogoCancelar.close();
    const error = tarjetaDemo.querySelector('[data-cancelado-error]');
    error.hidden = !demo.errorCancelar;
    if (demo.errorCancelar) return;
    verPedido('cancelado');
    verComprobante('retirar');
    tarjetaDemo.querySelector('[data-comprobante-estado]').hidden = true;
    tarjetaDemo.querySelector('[data-accion-comprobante]').hidden = true;
    tarjetaDemo.removeAttribute('data-espera-comprobante');
    contarPendientes();
    tarjetaDemo.querySelector('[data-cancelado-ok]').hidden = false;
  });
  dialogoCancelar.querySelectorAll('[data-cerrar]').forEach((b) => b.addEventListener('click', () => dialogoCancelar.close()));
}

// ---------- Favoritos: agregar todos y presupuesto en PDF ----------

document.querySelector('[data-agregar-todos]')?.addEventListener('click', () => {
  const n = document.querySelectorAll('.favoritos > li').length;
  avisar(`Agregamos ${n} productos al carrito`);
});

const dialogoPresupuesto = document.querySelector('[data-dialogo-presupuesto]');
if (dialogoPresupuesto) {
  const hoy = new Date();
  dialogoPresupuesto.querySelector('[data-presupuesto-fecha]').textContent = hoy.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  document.querySelector('[data-abrir-presupuesto]')?.addEventListener('click', () => dialogoPresupuesto.showModal());
  dialogoPresupuesto.querySelectorAll('[data-cerrar]').forEach((b) => b.addEventListener('click', () => dialogoPresupuesto.close()));
  // "Descargar PDF": la impresión del documento solo (en el sitio real, el PDF lo genera el servidor)
  dialogoPresupuesto.querySelector('[data-imprimir-presupuesto]').addEventListener('click', () => {
    document.documentElement.classList.add('imprimiendo-presupuesto');
    print();
    document.documentElement.classList.remove('imprimiendo-presupuesto');
  });
}

// ---------- Direcciones: agregar, editar y eliminar ----------

const formDireccion = document.querySelector('[data-form-direccion]');
if (formDireccion) {
  iniciarCampos(formDireccion);
  const titulo = formDireccion.querySelector('[data-form-direccion-titulo]');
  const abrir = (editar) => {
    formDireccion.reset();
    formDireccion.querySelectorAll('[aria-invalid]').forEach((c) => marcarError(c, ''));
    formDireccion.querySelectorAll('input:disabled').forEach((c) => (c.disabled = false));
    titulo.textContent = editar ? 'Editar dirección' : 'Nueva dirección';
    if (editar) {
      // De muestra: los datos de la dirección elegida, por partes
      const tarjeta = editar.closest('.domicilio');
      const [calle, numero] = tarjeta.querySelector('.domicilio__texto').textContent.split(',')[0].trim().match(/^(.*?)\s(\d+)$/)?.slice(1) || ['', ''];
      formDireccion.querySelector('[data-campo="nombre"]').value = tarjeta.querySelector('h3').textContent;
      formDireccion.querySelector('[data-campo="calle"]').value = calle;
      formDireccion.querySelector('[data-campo="numero"]').value = numero;
      formDireccion.querySelector('[data-campo="cp"]').value = (tarjeta.querySelector('.domicilio__texto').textContent.match(/C(\d{4})/) || [])[1] || '';
      formDireccion.querySelector('[data-campo="localidad"]').value = (tarjeta.querySelector('.domicilio__texto').textContent.match(/· ([^,]+),/) || [])[1] || '';
    }
    formDireccion.hidden = false;
    formDireccion.querySelector('[data-campo="nombre"]').focus();
  };
  document.addEventListener('click', (e) => {
    const nueva = e.target.closest('[data-nueva-direccion]');
    const editar = e.target.closest('[data-editar-direccion]');
    if (nueva || editar) abrir(editar);
  });
  formDireccion.querySelector('[data-cancelar-direccion]').addEventListener('click', () => (formDireccion.hidden = true));
  formDireccion.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validarCampos(formDireccion, 'direccion')) return;
    formDireccion.hidden = true;
    avisar('Guardamos la dirección');
  });

  document.addEventListener('click', (e) => {
    const eliminar = e.target.closest('[data-eliminar-direccion]');
    if (!eliminar) return;
    const tarjeta = eliminar.closest('.domicilio');
    const error = tarjeta.querySelector('[data-error-eliminar]');
    if (demo.errorEliminar) {
      if (error) error.hidden = false;
      return;
    }
    tarjeta.closest('li').remove();
    avisar('Eliminamos la dirección');
    if (!document.querySelector('.direcciones .domicilio')) verVacio('direcciones', true);
  });
}

// ---------- Estados de la cuenta: con datos, nueva (vacía) o cargando ----------

function verVacio(nombre, vacio) {
  document.querySelectorAll(`[data-vacio="${nombre}"]`).forEach((n) => (n.hidden = !vacio));
  const con = { pedidos: '[data-con-compras]', favoritos: '[data-con-favoritos]', direcciones: '[data-con-direcciones]' }[nombre];
  if (con) document.querySelectorAll(con).forEach((n) => (n.hidden = vacio));
}

function verCuenta(estado) {
  const nueva = estado === 'nueva';
  const cargando = estado === 'cargando';
  document.querySelectorAll('[data-con-compras]').forEach((n) => (n.hidden = nueva || cargando));
  document.querySelectorAll('[data-vacio="resumen"], [data-vacio="pedidos"]').forEach((n) => (n.hidden = !nueva));
  document.querySelector('[data-cargando-pedidos]').hidden = !cargando;
  verVacio('favoritos', nueva);
  verVacio('direcciones', nueva);
  // Sin garantías, la sección no aparece
  document.querySelectorAll('[data-con-garantias]').forEach((n) => (n.hidden = nueva));
  document.querySelectorAll('.cuenta__cant').forEach((n) => (n.hidden = nueva));
  if (nueva) {
    document.querySelectorAll('[data-pendiente], [data-pendiente-nav]').forEach((n) => (n.hidden = true));
    document.querySelector('[data-vacio="comprobantes"]').hidden = true;
  } else contarPendientes();
  if (cargando && !location.hash.startsWith('#pedidos')) location.hash = '#pedidos';
  if (nueva && location.hash === '#garantias') location.hash = '#resumen';
  document.querySelectorAll('[data-ver-cuenta]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.verCuenta === estado)));
}

// ---------- Mis datos: fijos una vez activada la cuenta ----------

function verDatos(estado) {
  const activada = estado === 'activada';
  document.querySelectorAll('[data-fijo]').forEach((c) => (c.disabled = activada));
  document.querySelectorAll('[data-nota-fijos], .campo__candado').forEach((n) => (n.hidden = !activada));
  document.querySelectorAll('[data-ver-datos]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.verDatos === estado)));
}

// ---------- Variantes de muestra (vista previa: data-demo) ----------

document.querySelectorAll('[data-ver-cuenta]').forEach((b) => b.addEventListener('click', () => verCuenta(b.dataset.verCuenta)));
document.querySelectorAll('[data-ver-pedido]').forEach((b) =>
  b.addEventListener('click', () => {
    verPedido(b.dataset.verPedido);
    if (!location.hash.startsWith('#pedidos')) location.hash = '#pedidos';
  })
);
document.querySelectorAll('[data-ver-comprobante]').forEach((b) =>
  b.addEventListener('click', () => {
    tarjetaDemo.querySelector('[data-comprobante-estado]').hidden = false;
    verComprobante(b.dataset.verComprobante);
    if (!location.hash.startsWith('#pedidos')) location.hash = '#pedidos';
  })
);
document.querySelectorAll('[data-ver-datos]').forEach((b) =>
  b.addEventListener('click', () => {
    verDatos(b.dataset.verDatos);
    location.hash = '#datos';
  })
);
const ERRORES_DEMO = { cancelar: ['errorCancelar', '#pedidos'], subir: ['errorSubir', '#pedidos'], eliminar: ['errorEliminar', '#direcciones'] };
document.querySelectorAll('[data-error-cuenta]').forEach((b) =>
  b.addEventListener('click', () => {
    const [clave, seccion] = ERRORES_DEMO[b.dataset.errorCuenta];
    demo[clave] = !demo[clave];
    b.setAttribute('aria-pressed', String(demo[clave]));
    location.hash = seccion;
    avisar(demo[clave] ? 'Listo: la próxima vez que lo intentes, sale el error' : 'Error de muestra apagado');
  })
);

verDatos('activada');
contarPendientes();
