// Ingresar y Crear cuenta: una vista por vez según el enlace (#ingresar, #registro, #recuperar), validación en
// línea, mostrar la contraseña, aviso de Bloq Mayús, sugerencia de correo mal escrito, fuerza de la contraseña,
// registro en dos pasos (con Consumidor final, nombre y apellido; con otra condición fiscal, el CUIT completa la
// razón social), errores de cada formulario, degradado vivo de los botones y confeti al crear la cuenta. Todo es de muestra:
// no se envía nada. Sin JS se ven todas las vistas.

import { confeti } from './confeti.js';
import { iniciarLuz } from './luz.js';
import { iniciarLuzBorde } from './luz-borde.js';
import { cuitValido } from './campos.js';

const acceso = document.querySelector('[data-acceso]');
const icono = (id) => `<svg class="icono" aria-hidden="true"><use href="#${id}"/></svg>`;
const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms));
const digitos = (v) => v.replace(/\D/g, '');

// Datos de muestra que dan cada estado (también se pueden escribir en las páginas completas)
const MUESTRA = {
  claveIncorrecta: 'incorrecta', // Ingresar: "Correo o contraseña incorrectos"
  correoSinEnvio: /^error@/i, // Recuperar: falla el envío del correo
  correosRegistrados: ['martin.gonzalez@correo.com'], // el cliente de muestra de Mi cuenta
  documentosRegistrados: ['34567890', '20345678906'],
  // Padrón: lo que devuelve la consulta del CUIT (cualquier otro CUIT válido no se encuentra)
  padron: { '30712345671': 'Distribuidora Andina SRL', '20345678906': 'Martín González' },
};

// Lo que muestra cada botón de "Estados de muestra" (lo completa cada sección)
const muestras = {};

// ---------- Vistas ----------

const vistas = [...document.querySelectorAll('[data-vista]')];
const tarjeta = document.querySelector('.ingreso__tarjeta');
const modo = document.querySelector('[data-modo]');
const orden = ['recuperar', 'ingresar', 'registro', 'bienvenida'];
const titulos = { ingresar: 'Ingresar', recuperar: 'Recuperar contraseña', registro: 'Crear cuenta', bienvenida: 'Cuenta creada' };
let actual = null;
let cuentaCreada = false;

function mostrar(nombre, { enfocar = false } = {}) {
  if (!orden.includes(nombre) || (nombre === 'bienvenida' && !cuentaCreada)) {
    nombre = document.documentElement.dataset.inicio || 'ingresar';
  }
  if (nombre === actual) return;

  // La vista nueva entra desde el lado hacia donde se movió la marca de Ingresar | Crear cuenta
  const desde = actual ? Math.sign(orden.indexOf(nombre) - orden.indexOf(actual)) * 24 : 0;
  acceso.style.setProperty('--desde', `${desde}px`);
  actual = nombre;

  vistas.forEach((v) => (v.hidden = v.dataset.vista !== nombre));
  document.querySelectorAll('[data-para]').forEach((n) => (n.hidden = !n.dataset.para.split(' ').includes(nombre)));
  acceso.dataset.vistaActual = nombre;

  const opcion = nombre === 'registro' || nombre === 'bienvenida' ? 'registro' : 'ingresar';
  modo.dataset.actual = opcion;
  modo.querySelectorAll('a').forEach((a) => {
    const elegida = a.getAttribute('href') === `#${opcion}`;
    a.classList.toggle('actual', elegida);
    if (elegida) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  document.title = `${titulos[nombre]} | Maximus Gaming Hardware`;

  if (nombre === 'recuperar') reiniciarRecuperar();

  if (enfocar) {
    // Si el comienzo de la tarjeta quedó arriba, fuera de la vista (enlaces del pie en celular), sube hasta ahí
    if (tarjeta.getBoundingClientRect().top < 0) tarjeta.scrollIntoView({ block: 'start', behavior: 'smooth' });
    const titulo = vistas.find((v) => !v.hidden).querySelector('.vista__titulo');
    titulo.tabIndex = -1;
    titulo.focus({ preventScroll: true });
  }
}

// Abre una vista sin sumar un paso al historial (botones de muestra)
function ir(nombre) {
  mostrar(nombre);
  history.replaceState(null, '', `#${nombre}`);
}

// ---------- Validación ----------

const reglas = {
  correo: (v) => (!v ? 'Escribí tu correo.' : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Revisá el correo: falta algo (ej.: nombre@correo.com).'),
  nombre: (v) => (v ? '' : 'Escribí tu nombre.'),
  apellido: (v) => (v ? '' : 'Escribí tu apellido.'),
  documento: (v) => {
    const n = digitos(v);
    const cuit = tipoDocumento() === 'CUIT';
    if (!n) return cuit ? 'Escribí tu número de CUIT.' : 'Escribí tu número de DNI.';
    if (!cuit) return n.length >= 7 && n.length <= 8 ? '' : 'El DNI tiene 7 u 8 números.';
    if (n.length !== 11) return 'El CUIT tiene 11 números.';
    return cuitValido(n) ? '' : 'El CUIT no es válido: revisá los 11 números.';
  },
  telefono: (v) => {
    const n = digitos(v).replace(/^54/, '').replace(/^0/, '');
    if (!n) return 'Escribí un teléfono de contacto.';
    return n.length === 10 ? '' : 'Con el código de área son 10 números (ej.: 11 1234-5678).';
  },
  provincia: (v) => (v ? '' : 'Elegí tu provincia.'),
  localidad: (v) => (v ? '' : 'Escribí tu localidad.'),
  cp: (v) => (/^\d{4}$/.test(v) ? '' : v ? 'El código postal tiene 4 números.' : 'Escribí tu código postal.'),
  direccion: (v) => (v ? '' : 'Escribí tu dirección.'),
};

// Contraseña: al ingresar alcanza con que esté; al crear la cuenta tiene que cumplir los requisitos
function reglaClave(campo) {
  const v = campo.value;
  if (!v) return 'Escribí tu contraseña.';
  if (campo.autocomplete !== 'new-password') return '';
  return v.length >= 8 && /[a-z]/i.test(v) && /\d/.test(v) ? '' : 'Usá al menos 8 caracteres, con letras y números.';
}

function errorDe(campo) {
  if (campo.name === 'clave') return reglaClave(campo);
  const regla = reglas[campo.name];
  return regla ? regla(campo.value.trim()) : '';
}

// Suma o quita un id de aria-describedby
function describir(campo, id, sumar) {
  const ids = new Set((campo.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
  if (sumar) ids.add(id);
  else ids.delete(id);
  if (ids.size) campo.setAttribute('aria-describedby', [...ids].join(' '));
  else campo.removeAttribute('aria-describedby');
}

// Error de un campo: borde rojo y el mensaje debajo (texto vacío = sin error)
function marcar(campo, mensaje) {
  const caja = campo.closest('.campo');
  let nota = caja.querySelector('.campo__error');
  if (!mensaje) {
    campo.removeAttribute('aria-invalid');
    campo.classList.remove('con-error');
    if (nota) {
      describir(campo, nota.id, false);
      nota.remove();
    }
    if (campo.dataset.senalado) {
      describir(campo, campo.dataset.senalado, false);
      delete campo.dataset.senalado;
    }
    return;
  }
  if (!nota) {
    nota = document.createElement('p');
    nota.className = 'campo__error';
    nota.id = `${campo.id}-error`;
    (campo.closest('.clave, .selector') || campo).after(nota);
  }
  describir(campo, nota.id, true);
  nota.innerHTML = `${icono('i-alerta')}<span>${mensaje}</span>`;
  campo.setAttribute('aria-invalid', 'true');
  campo.classList.add('con-error');
}

// Campo en rojo cuyo problema explica una alerta (correo o contraseña incorrectos, CUIT no encontrado): se limpia
// al escribir en él o al volver a validar
function senalar(campo, alerta) {
  campo.setAttribute('aria-invalid', 'true');
  campo.classList.add('con-error');
  campo.dataset.senalado = alerta.id;
  describir(campo, alerta.id, true);
}

// Alerta junto a un campo (correo o documento que ya tienen cuenta): se lee al aparecer y el campo la referencia
function mostrarAlerta(alerta, campo) {
  alerta.hidden = false;
  describir(campo, alerta.id, true);
  alerta.focus();
}

function ocultarAlerta(alerta, campo) {
  if (!alerta) return;
  alerta.hidden = true;
  describir(campo, alerta.id, false);
}

// Valida los campos y enfoca el primero con error; devuelve si están todos bien
function validar(campos) {
  let primero = null;
  campos.forEach((campo) => {
    const mensaje = errorDe(campo);
    marcar(campo, mensaje);
    if (mensaje && !primero) primero = campo;
  });
  primero?.focus();
  return !primero;
}

// Al salir de un campo se valida (si tiene algo escrito); mientras tiene un error, se revisa con cada tecla. Un campo
// que señala una alerta queda en rojo hasta que se escribe en él
document.addEventListener('focusout', (e) => {
  const campo = e.target.closest?.('[data-form] .campo__control, [data-form] .selector__campo');
  if (campo && campo.value && campo.required && !campo.dataset.senalado) marcar(campo, errorDe(campo));
});

document.addEventListener('input', (e) => {
  const campo = e.target;
  if (campo.matches?.('[data-solo-numeros]')) campo.value = digitos(campo.value);
  if (campo.getAttribute?.('aria-invalid')) marcar(campo, errorDe(campo));
});

document.addEventListener('change', (e) => {
  if (e.target.matches?.('select[aria-invalid]')) marcar(e.target, errorDe(e.target));
});

// Botón de envío: ruedita y texto de espera mientras "procesa" (de muestra). Al terminar, el foco vuelve al botón
async function procesar(boton, texto, ms) {
  const etiqueta = boton.querySelector('.enviar__texto');
  const antes = etiqueta.textContent;
  boton.setAttribute('aria-busy', 'true');
  boton.classList.add('cargando');
  boton.disabled = true;
  etiqueta.textContent = texto;
  await esperar(ms);
  boton.removeAttribute('aria-busy');
  boton.classList.remove('cargando');
  boton.disabled = false;
  etiqueta.textContent = antes;
  boton.focus({ preventScroll: true });
}

function avisar(texto) {
  const aviso = document.querySelector('[data-aviso]');
  if (!aviso) return;
  aviso.textContent = texto;
  aviso.classList.add('aviso--visible');
  clearTimeout(avisar.t);
  avisar.t = setTimeout(() => aviso.classList.remove('aviso--visible'), 2600);
}

// Escribe un valor como si lo tipeara la persona (botones de muestra)
function poner(campo, valor) {
  campo.value = valor;
  campo.dispatchEvent(new Event(campo.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
}

// ---------- Contraseña: mostrar, Bloq Mayús ----------

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

document.querySelectorAll('.clave input').forEach((campo) => {
  const mayus = campo.closest('.campo').querySelector('.clave__mayus');
  const revisar = (e) => (mayus.hidden = !e.getModifierState?.('CapsLock'));
  campo.addEventListener('keydown', revisar);
  campo.addEventListener('keyup', revisar);
  campo.addEventListener('blur', () => (mayus.hidden = true));
});

// ---------- Correo mal escrito: "¿Quisiste decir …@gmail.com?" ----------

const dominios = ['gmail.com', 'hotmail.com', 'hotmail.com.ar', 'outlook.com', 'live.com', 'yahoo.com', 'yahoo.com.ar', 'icloud.com'];

// Cambios que separan dos textos (letra de más, de menos, distinta o dos letras invertidas: "gmial")
function distancia(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length];
}

document.querySelectorAll('[data-form] input[type="email"]').forEach((campo) => {
  const sugerencia = document.createElement('p');
  sugerencia.className = 'sugerencia-correo';
  sugerencia.hidden = true;
  sugerencia.innerHTML = '¿Quisiste decir <button type="button"></button>?';
  campo.after(sugerencia);
  const boton = sugerencia.querySelector('button');

  campo.addEventListener('blur', () => {
    const [usuario, dominio] = campo.value.trim().toLowerCase().split('@');
    const parecido = dominio && !dominios.includes(dominio) && dominios.find((d) => distancia(dominio, d) <= 2);
    sugerencia.hidden = !parecido;
    if (parecido) boton.textContent = `${usuario}@${parecido}`;
  });

  boton.addEventListener('click', () => {
    poner(campo, boton.textContent);
    sugerencia.hidden = true;
    marcar(campo, errorDe(campo));
    campo.focus();
  });
});

// ---------- Sesión de muestra ----------

// La demostración recuerda en el navegador que se ingresó (localStorage "sesion"). La leen el header (el ícono de
// usuario lleva a Mi cuenta o a Ingresar) y mi-cuenta.html (sin sesión, manda a ingresar.html?volver=…); la borra
// "Cerrar sesión" de Mi cuenta. En el sitio real la sesión la maneja el servidor.
function iniciarSesion() {
  try {
    localStorage.setItem('sesion', '1');
  } catch {}
}

// Después de ingresar: la página que pidió el ingreso (?volver=, solo páginas del sitio) o Mi cuenta
function destinoIngreso() {
  const volver = new URLSearchParams(location.search).get('volver');
  return volver && /^[\w-]+\.html(#[\w-]*)?$/.test(volver) ? volver : formIngresar.getAttribute('action');
}

// ---------- Ingresar ----------

const formIngresar = document.querySelector('[data-form="ingresar"]');

if (formIngresar) {
  const alerta = formIngresar.querySelector('[data-alerta="ingresar"]');
  const { correo, clave } = formIngresar.elements;
  const boton = formIngresar.querySelector('.enviar');
  let ocupado = false;

  formIngresar.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (ocupado) return;
    alerta.hidden = true;
    [correo, clave].forEach((c) => c.dataset.senalado && marcar(c, ''));
    // De muestra: con el formulario vacío ingresa directo con la cuenta de muestra; si se escribió algo, se valida.
    // Cualquier correo y contraseña ingresan, salvo la contraseña "incorrecta"
    const campos = [correo, clave];
    if (campos.some((c) => c.value.trim()) && !validar(campos)) return;

    ocupado = true;
    await procesar(boton, 'Ingresando…', 1100);
    if (clave.value === MUESTRA.claveIncorrecta) {
      // Correo o contraseña incorrectos: sin decir cuál (no se revela si el correo tiene cuenta); se borra la
      // contraseña para volver a escribirla
      ocupado = false;
      alerta.hidden = false;
      senalar(correo, alerta);
      senalar(clave, alerta);
      clave.value = '';
      clave.focus();
      return;
    }
    iniciarSesion();
    boton.querySelector('.enviar__texto').textContent = '¡Hola de nuevo!';
    boton.querySelector('use').setAttribute('href', '#i-check');
    await esperar(500);
    location.href = destinoIngreso();
  });

  muestras['ingresar-error'] = () => {
    ir('ingresar');
    poner(correo, MUESTRA.correosRegistrados[0]);
    poner(clave, MUESTRA.claveIncorrecta);
    formIngresar.requestSubmit();
  };
}

// ---------- Recuperar contraseña ----------

const formRecuperar = document.querySelector('[data-form="recuperar"]');
const vistaRecuperar = document.querySelector('[data-vista="recuperar"]');
const reenviar = document.querySelector('[data-reenviar]');
const alertaRecuperar = formRecuperar?.querySelector('[data-alerta="recuperar"]');
let cuentaAtras = 0;

function reiniciarRecuperar() {
  if (!vistaRecuperar) return;
  vistaRecuperar.querySelector('[data-paso="cargar"]').hidden = false;
  vistaRecuperar.querySelector('[data-paso="listo"]').hidden = true;
  alertaRecuperar.hidden = true;
  // Trae el correo que se haya escrito al ingresar
  const correo = formIngresar?.elements.correo.value.trim();
  if (correo && !formRecuperar.elements.correo.value) formRecuperar.elements.correo.value = correo;
}

function esperarReenvio() {
  let resta = 30;
  reenviar.disabled = true;
  clearInterval(cuentaAtras);
  const pintar = () => (reenviar.textContent = resta > 0 ? `Reenviar correo (${resta} s)` : 'Reenviar correo');
  pintar();
  cuentaAtras = setInterval(() => {
    resta--;
    pintar();
    if (resta <= 0) {
      clearInterval(cuentaAtras);
      reenviar.disabled = false;
    }
  }, 1000);
}

formRecuperar?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const boton = formRecuperar.querySelector('.enviar');
  if (boton.disabled) return;
  alertaRecuperar.hidden = true;
  if (!validar([formRecuperar.elements.correo])) return;
  await procesar(boton, 'Enviando…', 900);
  const correo = formRecuperar.elements.correo.value.trim();
  // De muestra: un correo que empieza con "error@" no se puede enviar; el botón queda para volver a intentar
  if (MUESTRA.correoSinEnvio.test(correo)) {
    alertaRecuperar.hidden = false;
    return;
  }
  const listo = vistaRecuperar.querySelector('[data-paso="listo"]');
  listo.querySelector('[data-correo]').textContent = correo;
  vistaRecuperar.querySelector('[data-paso="cargar"]').hidden = true;
  listo.hidden = false;
  listo.focus();
  esperarReenvio();
});

reenviar?.addEventListener('click', () => {
  avisar('Te lo reenviamos');
  esperarReenvio();
});

if (formRecuperar) {
  muestras['recuperar-error'] = () => {
    ir('recuperar');
    poner(formRecuperar.elements.correo, 'error@correo.com');
    formRecuperar.requestSubmit();
  };
}

// ---------- Cuenta creada ----------

// Arma el saludo con lo que haya: "Hola, Lucía. Te mandamos un correo a lucia@… con todo lo que podés hacer desde tu
// cuenta."; sin nombre o sin correo, la frase queda completa sin ellos
function mostrarBienvenida({ nombre = '', correo = '' } = {}) {
  const bienvenida = document.querySelector('[data-vista="bienvenida"]');
  const destacado = document.createElement('strong');
  destacado.textContent = correo;
  bienvenida.querySelector('[data-bienvenida-texto]').replaceChildren(
    nombre ? `Hola, ${nombre}. ` : 'Te damos la bienvenida a Maximus. ',
    'Te mandamos un correo',
    ...(correo ? [' a ', destacado] : []),
    ' con todo lo que podés hacer desde tu cuenta.'
  );
  // Si el registro lo pidió otra página (?volver=: el checkout, un favorito), el botón principal vuelve ahí
  const volver = new URLSearchParams(location.search).get('volver');
  if (volver && destinoIngreso() === volver) {
    const principal = bienvenida.querySelector('.listo__acciones .boton--primario');
    principal.href = volver;
    principal.textContent = volver.startsWith('carrito.html') ? 'Volver a tu compra' : 'Continuar';
  }
  cuentaCreada = true;
  mostrar('bienvenida', { enfocar: true });
  // Sale del check cuando ya terminó de aparecer (y de subir la página, si hizo falta)
  setTimeout(() => confeti(bienvenida.querySelector('.listo__icono')), 500);
}

// ---------- Crear cuenta ----------

const formRegistro = document.querySelector('[data-form="registro"]');

if (formRegistro) {
  const pasos = [...formRegistro.querySelectorAll('[data-registro-paso]')];
  const avance = document.querySelector('[data-pasos]');
  const nombresPaso = ['Tus datos', 'Contacto y domicilio'];
  const campos = formRegistro.elements;
  const botonSiguiente = formRegistro.querySelector('[data-siguiente]');
  const botonCrear = formRegistro.querySelector('[type="submit"]');
  const alertas = Object.fromEntries([...formRegistro.querySelectorAll('[data-alerta]')].map((a) => [a.dataset.alerta, a]));
  let paso = 1;
  let ocupado = false;

  function irAPaso(n) {
    paso = n;
    alertas.faltan.hidden = true;
    acceso.style.setProperty('--desde', `${n === 2 ? 24 : -24}px`);
    pasos.forEach((p) => (p.hidden = Number(p.dataset.registroPaso) !== n));
    avance.querySelector('[data-paso-numero]').textContent = n;
    avance.querySelector('[data-paso-nombre]').textContent = nombresPaso[n - 1];
    avance.querySelectorAll('.avance__tramo')[1].classList.toggle('avance__tramo--hecho', n === 2);
    if (tarjeta.getBoundingClientRect().top < 0) tarjeta.scrollIntoView({ block: 'start', behavior: 'smooth' });
    const texto = avance.querySelector('.avance__texto');
    texto.tabIndex = -1;
    texto.focus({ preventScroll: true });
  }

  pasos.forEach((p) => (p.hidden = p.dataset.registroPaso !== '1'));

  // Los obligatorios del paso que están a la vista (con otra condición fiscal no van nombre ni apellido)
  const camposDe = (n) => [...pasos[n - 1].querySelectorAll('[required]')].filter((c) => !c.closest('[hidden]'));
  const vacio = (c) => !c.value.trim();

  // Valida el paso; si quedaron obligatorios vacíos, arriba del formulario "Faltan datos"
  function validarPaso(n) {
    const lista = camposDe(n);
    const ok = validar(lista);
    alertas.faltan.hidden = ok || !lista.some(vacio);
    return ok;
  }

  // "Faltan datos" se va sola cuando ya no queda ningún obligatorio vacío
  const revisarFaltan = () => {
    if (!alertas.faltan.hidden && !camposDe(paso).some(vacio)) alertas.faltan.hidden = true;
  };
  formRegistro.addEventListener('input', revisarFaltan);
  formRegistro.addEventListener('change', revisarFaltan);

  // ----- Condición fiscal y documento -----

  const condicion = formRegistro.querySelector('[data-condicion]');
  const documento = formRegistro.querySelector('[data-documento]');
  const rotulo = formRegistro.querySelector('[data-documento-rotulo]');
  const tipos = [...formRegistro.querySelectorAll('[data-tipo-documento]')];
  const razon = formRegistro.querySelector('[data-razon-social]');
  const cajaRazon = formRegistro.querySelector('[data-razon-caja]');
  const textoRazon = razon.placeholder;
  const conCuit = () => condicion.selectedIndex !== 0; // otra condición que Consumidor final

  function actualizarDocumento() {
    const cuit = tipoDocumento() === 'CUIT';
    tipos.forEach((t) => t.closest('.doc-fiscal__opcion').classList.toggle('elegida', t.checked));
    rotulo.textContent = cuit ? 'Número de CUIT' : 'Número de DNI';
    documento.placeholder = cuit ? '11 números, sin guiones' : 'Sin puntos';
    documento.maxLength = cuit ? 13 : 8;
    documento.value = digitos(documento.value).slice(0, cuit ? 11 : 8);
    if (documento.value) marcar(documento, errorDe(documento));
    else marcar(documento, '');
    ocultarAlerta(alertas['documento-registrado'], documento);
  }

  // Con Consumidor final: nombre, apellido y DNI o CUIT. Con otra condición: el CUIT completa la razón social
  function aplicarCondicion() {
    const tipo = conCuit() ? 'otra' : 'final';
    formRegistro.querySelectorAll('[data-fiscal]').forEach((n) => {
      n.hidden = n.dataset.fiscal !== tipo;
      if (n.hidden) n.querySelectorAll('.campo__control').forEach((c) => marcar(c, ''));
    });
    tipos.find((t) => t.value === (conCuit() ? 'CUIT' : 'DNI')).checked = true;
    limpiarCuit();
    actualizarDocumento();
  }

  tipos.forEach((t) => t.addEventListener('change', actualizarDocumento));
  condicion.addEventListener('change', aplicarCondicion);

  // Consulta del CUIT (de muestra: MUESTRA.padron). Guarda la última para no repetirla al continuar
  let consulta = { cuit: '', promesa: null };

  function limpiarCuit() {
    consulta = { cuit: '', promesa: null };
    razon.value = '';
    razon.placeholder = textoRazon;
    razon.removeAttribute('aria-busy');
    cajaRazon.classList.remove('cargando');
    ocultarAlerta(alertas['cuit-no-encontrado'], documento);
  }

  function buscarCuit() {
    const cuit = digitos(documento.value);
    if (consulta.cuit === cuit && consulta.promesa) return consulta.promesa;
    limpiarCuit();
    const esta = { cuit, promesa: null };
    consulta = esta;
    razon.placeholder = 'Buscando el CUIT…';
    razon.setAttribute('aria-busy', 'true');
    cajaRazon.classList.add('cargando');
    esta.promesa = esperar(700).then(() => {
      if (consulta !== esta) return false; // el CUIT cambió mientras se buscaba
      razon.placeholder = textoRazon;
      razon.removeAttribute('aria-busy');
      cajaRazon.classList.remove('cargando');
      const nombre = MUESTRA.padron[cuit];
      if (nombre) {
        razon.value = nombre;
        return true;
      }
      alertas['cuit-no-encontrado'].hidden = false;
      senalar(documento, alertas['cuit-no-encontrado']);
      return false;
    });
    return esta.promesa;
  }

  documento.addEventListener('input', () => {
    documento.value = documento.value.replace(/[^\d-]/g, '');
    ocultarAlerta(alertas['documento-registrado'], documento);
    if (!conCuit()) return;
    const n = digitos(documento.value);
    if (n !== consulta.cuit) limpiarCuit();
    // Con los 11 números: si el dígito verificador coincide se busca; si no, el error aparece ya
    if (n.length === 11) {
      if (cuitValido(n)) buscarCuit();
      else marcar(documento, errorDe(documento));
    }
  });

  // El CUIT se muestra con guiones al salir del campo (20-12345678-9)
  documento.addEventListener('blur', () => {
    const n = digitos(documento.value);
    if (tipoDocumento() === 'CUIT' && n.length === 11) documento.value = `${n.slice(0, 2)}-${n.slice(2, 10)}-${n.slice(10)}`;
  });

  // Al cargar (o si el navegador recordó la condición elegida), los campos coinciden con la condición fiscal
  aplicarCondicion();

  campos.correo.addEventListener('input', () => ocultarAlerta(alertas['correo-registrado'], campos.correo));

  // "Ingresar" y "Recuperar contraseña" del correo ya registrado llevan el correo escrito
  formRegistro.querySelectorAll('[data-llevar-correo]').forEach((enlace) =>
    enlace.addEventListener('click', () => {
      const correo = campos.correo.value.trim();
      if (formIngresar) formIngresar.elements.correo.value = correo;
      if (formRecuperar) formRecuperar.elements.correo.value = correo;
    })
  );

  // ----- Pasos -----

  // Paso 1: valida, completa la razón social si hace falta y revisa (de muestra) que el correo y el documento no
  // tengan cuenta antes de pasar al 2
  async function siguiente() {
    if (ocupado || !validarPaso(1)) return;
    ocupado = true;
    try {
      if (conCuit() && !(await buscarCuit())) {
        if (!alertas['cuit-no-encontrado'].hidden) senalar(documento, alertas['cuit-no-encontrado']);
        documento.focus();
        return;
      }
      await procesar(botonSiguiente, 'Revisando…', 700);
      if (MUESTRA.correosRegistrados.includes(campos.correo.value.trim().toLowerCase())) {
        mostrarAlerta(alertas['correo-registrado'], campos.correo);
        return;
      }
      if (MUESTRA.documentosRegistrados.includes(digitos(documento.value))) {
        alertas['documento-registrado'].querySelector('[data-documento-tipo]').textContent = tipoDocumento();
        mostrarAlerta(alertas['documento-registrado'], documento);
        return;
      }
      irAPaso(2);
    } finally {
      ocupado = false;
    }
  }

  botonSiguiente.addEventListener('click', siguiente);
  formRegistro.querySelector('[data-anterior]').addEventListener('click', () => irAPaso(1));

  formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Enter en el primer paso: continúa al segundo
    if (paso === 1) return siguiente();
    if (ocupado || !validarPaso(2)) return;
    ocupado = true;
    await procesar(botonCrear, 'Creando tu cuenta…', 1300);
    ocupado = false;
    iniciarSesion();
    mostrarBienvenida({
      nombre: conCuit() ? razon.value : campos.nombre.value.trim(),
      correo: campos.correo.value.trim(),
    });
  });

  // ----- Fuerza de la contraseña y requisitos, en vivo -----

  const clave = campos.clave;
  const fuerza = formRegistro.querySelector('[data-fuerza]');
  const textoFuerza = fuerza.querySelector('[data-fuerza-texto]');
  const requisitos = {
    largo: (v) => v.length >= 8,
    mezcla: (v) => /[a-z]/i.test(v) && /\d/.test(v),
  };

  clave.addEventListener('input', () => {
    const v = clave.value;
    let puntos = 0;
    if (v) {
      puntos = 1;
      if (requisitos.largo(v) && requisitos.mezcla(v)) puntos = 2;
      if (puntos === 2 && (/[^a-z0-9]/i.test(v) || (/[a-z]/.test(v) && /[A-Z]/.test(v)))) puntos = 3;
      if (puntos === 3 && v.length >= 12) puntos = 4;
    }
    fuerza.dataset.fuerza = puntos;
    textoFuerza.textContent = ['', 'Débil', 'Aceptable', 'Buena', 'Muy segura'][puntos];
    Object.entries(requisitos).forEach(([nombre, cumple]) =>
      formRegistro.querySelector(`[data-requisito="${nombre}"]`).toggleAttribute('data-cumple', cumple(v))
    );
  });

  // ----- Estados de muestra -----

  // Formulario en blanco, en el paso 1, sin errores ni alertas
  function reiniciarRegistro() {
    ir('registro');
    formRegistro.reset();
    formRegistro.querySelectorAll('.campo__control, .selector__campo').forEach((c) => marcar(c, ''));
    alertas.faltan.hidden = true;
    ocultarAlerta(alertas['correo-registrado'], campos.correo);
    ocultarAlerta(alertas['documento-registrado'], documento);
    formRegistro.querySelectorAll('.sugerencia-correo').forEach((s) => (s.hidden = true));
    aplicarCondicion();
    clave.dispatchEvent(new Event('input'));
    if (paso !== 1) irAPaso(1);
  }

  const persona = { nombre: 'Lucía', apellido: 'Fernández', documento: '38123456', correo: 'lucia.fernandez@correo.com', clave: 'Maximus2026' };

  // Completa el paso 1: con documento de 11 números va como empresa (otra condición fiscal)
  function completarPaso1(datos) {
    reiniciarRegistro();
    if (datos.documento.length === 11) poner(condicion, 'Responsable inscripto');
    Object.entries(datos).forEach(([nombre, valor]) => {
      if (!campos[nombre].closest('[hidden]')) poner(campos[nombre], valor);
    });
  }

  muestras['correo-registrado'] = () => {
    completarPaso1({ ...persona, nombre: 'Martín', apellido: 'González', correo: MUESTRA.correosRegistrados[0] });
    siguiente();
  };
  muestras['documento-registrado'] = () => {
    completarPaso1({ ...persona, documento: MUESTRA.documentosRegistrados[0] });
    siguiente();
  };
  muestras.empresa = () => {
    completarPaso1({ documento: '30712345671', correo: 'compras.andina@correo.com', clave: 'Maximus2026' });
    documento.dispatchEvent(new Event('blur'));
  };
  muestras['cuit-invalido'] = () => {
    completarPaso1({ documento: '30712345670', correo: 'compras.andina@correo.com', clave: 'Maximus2026' });
    documento.focus();
  };
  muestras['cuit-no-encontrado'] = () => {
    completarPaso1({ documento: '30712345689', correo: 'compras.andina@correo.com', clave: 'Maximus2026' });
    documento.dispatchEvent(new Event('blur'));
  };
  muestras.faltan = () => {
    reiniciarRegistro();
    poner(campos.correo, persona.correo);
    siguiente();
  };
  muestras.bienvenida = () => {
    reiniciarRegistro();
    mostrarBienvenida({ nombre: persona.nombre, correo: persona.correo });
  };
  muestras['bienvenida-empresa'] = () => {
    reiniciarRegistro();
    mostrarBienvenida({ nombre: MUESTRA.padron['30712345671'], correo: 'compras.andina@correo.com' });
  };
}

function tipoDocumento() {
  return document.querySelector('[data-tipo-documento]:checked')?.value || 'DNI';
}

// ---------- Estados de muestra (barra de la vista previa, data-demo) ----------

const botonesMuestra = [...document.querySelectorAll('[data-muestra]')];
botonesMuestra.forEach((boton) =>
  boton.addEventListener('click', () => {
    botonesMuestra.forEach((b) => {
      b.setAttribute('aria-pressed', b === boton);
      b.classList.toggle('marcado', b === boton);
    });
    muestras[boton.dataset.muestra]?.();
  })
);

// ---------- Degradado vivo de los botones y luz del borde de la tarjeta (luz.js y luz-borde.js) ----------

document.querySelectorAll('.enviar').forEach((boton) => iniciarLuz(boton, { tramo: 0.06 }));
iniciarLuzBorde(tarjeta, 'ingreso__tarjeta--puntero');

// ---------- Inicio ----------

if (acceso) {
  acceso.classList.add('ingreso--js');
  mostrar(location.hash.slice(1));
  addEventListener('hashchange', () => mostrar(location.hash.slice(1), { enfocar: true }));
}
