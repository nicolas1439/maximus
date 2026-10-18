// Ingresar y Crear cuenta: una vista por vez según el enlace (#ingresar, #registro, #recuperar), validación en
// línea, mostrar la contraseña, aviso de Bloq Mayús, sugerencia de correo mal escrito, fuerza de la contraseña,
// registro en dos pasos, degradado vivo de los botones y confeti al crear la cuenta. Todo es de muestra: no se
// envía nada. Sin JS se ven todas las vistas.

import { confeti } from './confeti.js';
import { iniciarLuz } from './luz.js';
import { iniciarLuzBorde } from './luz-borde.js';

const acceso = document.querySelector('[data-acceso]');
const icono = (id) => `<svg class="icono" aria-hidden="true"><use href="#${id}"/></svg>`;
const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms));

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
    if (a.getAttribute('href') === `#${opcion}`) a.setAttribute('aria-current', 'page');
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

// ---------- Validación ----------

const reglas = {
  correo: (v) => (!v ? 'Escribí tu correo.' : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Revisá el correo: falta algo (ej.: nombre@correo.com).'),
  nombre: (v) => (v ? '' : 'Escribí tu nombre.'),
  apellido: (v) => (v ? '' : 'Escribí tu apellido.'),
  documento: (v, campo) => {
    const n = v.replace(/\D/g, '');
    if (!n) return 'Escribí tu número de documento.';
    if (tipoDocumento() === 'DNI') return n.length >= 7 && n.length <= 8 ? '' : 'El DNI tiene 7 u 8 números.';
    if (n.length !== 11) return 'El CUIT tiene 11 números.';
    return cuitValido(n) ? '' : 'Revisá el CUIT: el último número no coincide.';
  },
  telefono: (v) => {
    const n = v.replace(/\D/g, '').replace(/^54/, '').replace(/^0/, '');
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
  return regla ? regla(campo.value.trim(), campo) : '';
}

function marcar(campo, mensaje) {
  const caja = campo.closest('.campo');
  let nota = caja.querySelector('.campo__error');
  if (!mensaje) {
    campo.removeAttribute('aria-invalid');
    nota?.remove();
    return;
  }
  if (!nota) {
    nota = document.createElement('p');
    nota.className = 'campo__error';
    nota.id = `${campo.id}-error`;
    (campo.closest('.clave, .selector') || campo).after(nota);
    campo.setAttribute('aria-describedby', `${campo.getAttribute('aria-describedby') || ''} ${nota.id}`.trim());
  }
  nota.innerHTML = `${icono('i-alerta')}<span>${mensaje}</span>`;
  campo.setAttribute('aria-invalid', 'true');
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

// Al salir de un campo se valida (si tiene algo escrito); mientras tiene un error, se revisa con cada tecla
document.addEventListener('focusout', (e) => {
  const campo = e.target.closest?.('[data-form] .campo__control, [data-form] .selector__campo');
  if (campo && campo.value && campo.required) marcar(campo, errorDe(campo));
});

document.addEventListener('input', (e) => {
  const campo = e.target;
  if (campo.matches?.('[data-solo-numeros]')) campo.value = campo.value.replace(/\D/g, '');
  if (campo.getAttribute?.('aria-invalid')) marcar(campo, errorDe(campo));
});

document.addEventListener('change', (e) => {
  if (e.target.matches?.('select[aria-invalid]')) marcar(e.target, errorDe(e.target));
});

// Botón de envío: ruedita y texto de espera mientras "procesa" (de muestra)
async function procesar(boton, texto, ms) {
  const etiqueta = boton.querySelector('.enviar__texto');
  const antes = etiqueta.textContent;
  boton.setAttribute('aria-busy', 'true');
  boton.disabled = true;
  etiqueta.textContent = texto;
  await esperar(ms);
  boton.removeAttribute('aria-busy');
  boton.disabled = false;
  etiqueta.textContent = antes;
}

function avisar(texto) {
  const aviso = document.querySelector('[data-aviso]');
  if (!aviso) return;
  aviso.textContent = texto;
  aviso.classList.add('aviso--visible');
  clearTimeout(avisar.t);
  avisar.t = setTimeout(() => aviso.classList.remove('aviso--visible'), 2600);
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
  sugerencia.className = 'sugerencia';
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
    campo.value = boton.textContent;
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

formIngresar?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const estado = formIngresar.querySelector('.ingreso__estado');
  estado.textContent = '';
  // De muestra: con el formulario vacío ingresa directo con la cuenta de muestra; si se escribió algo, se valida.
  // Cualquier correo y contraseña ingresan
  const campos = [...formIngresar.querySelectorAll('[required]')];
  if (campos.some((c) => c.value.trim()) && !validar(campos)) return;

  const boton = formIngresar.querySelector('.enviar');
  await procesar(boton, 'Ingresando…', 1100);
  iniciarSesion();
  boton.querySelector('.enviar__texto').textContent = '¡Hola de nuevo!';
  boton.querySelector('use').setAttribute('href', '#i-check');
  await esperar(500);
  location.href = destinoIngreso();
});

// ---------- Recuperar contraseña ----------

const formRecuperar = document.querySelector('[data-form="recuperar"]');
const vistaRecuperar = document.querySelector('[data-vista="recuperar"]');
const reenviar = document.querySelector('[data-reenviar]');
let cuentaAtras = 0;

function reiniciarRecuperar() {
  if (!vistaRecuperar) return;
  vistaRecuperar.querySelector('[data-paso="cargar"]').hidden = false;
  vistaRecuperar.querySelector('[data-paso="listo"]').hidden = true;
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
  if (!validar([formRecuperar.elements.correo])) return;
  await procesar(formRecuperar.querySelector('.enviar'), 'Enviando…', 900);
  const listo = vistaRecuperar.querySelector('[data-paso="listo"]');
  listo.querySelector('[data-correo]').textContent = formRecuperar.elements.correo.value.trim();
  vistaRecuperar.querySelector('[data-paso="cargar"]').hidden = true;
  listo.hidden = false;
  listo.focus();
  esperarReenvio();
});

reenviar?.addEventListener('click', () => {
  avisar('Te lo reenviamos');
  esperarReenvio();
});

// ---------- Crear cuenta ----------

const formRegistro = document.querySelector('[data-form="registro"]');

if (formRegistro) {
  const pasos = [...formRegistro.querySelectorAll('[data-registro-paso]')];
  const avance = document.querySelector('[data-pasos]');
  const nombresPaso = ['Tus datos de acceso', 'Facturación y contacto'];
  let paso = 1;

  function irAPaso(n) {
    paso = n;
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

  const camposDe = (n) => [...avance[n - 1].querySelectorAll('[required]')];
  const siguiente = () => validar(camposDe(1)) && irAPaso(2);

  formRegistro.querySelector('[data-siguiente]').addEventListener('click', siguiente);
  formRegistro.querySelector('[data-anterior]').addEventListener('click', () => irAPaso(1));

  formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Enter en el primer paso: continúa al segundo
    if (paso === 1) return siguiente();
    if (!validar(camposDe(2))) return;

    await procesar(formRegistro.querySelector('[type="submit"]'), 'Creando tu cuenta…', 1300);
    const bienvenida = document.querySelector('[data-vista="bienvenida"]');
    bienvenida.querySelector('[data-nombre]').textContent = formRegistro.elements.nombre.value.trim();
    bienvenida.querySelector('[data-correo]').textContent = formRegistro.elements.correo.value.trim();
    cuentaCreada = true;
    iniciarSesion();
    mostrar('bienvenida', { enfocar: true });
    // Sale del check cuando ya terminó de aparecer (y de subir la página, si hizo falta)
    setTimeout(() => confeti(bienvenida.querySelector('.listo__icono')), 500);
  });

  // Fuerza de la contraseña y requisitos, en vivo
  const clave = formRegistro.elements.clave;
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

  // Documento: DNI o CUIT. Con una condición fiscal distinta de Consumidor final, pasa solo a CUIT
  const documento = formRegistro.querySelector('[data-documento]');
  const rotulo = formRegistro.querySelector('[data-documento-rotulo]');
  const tipos = [...formRegistro.querySelectorAll('[data-tipo-documento]')];

  function actualizarDocumento() {
    const cuit = tipoDocumento() === 'CUIT';
    rotulo.textContent = cuit ? 'Número de CUIT' : 'Número de DNI';
    documento.placeholder = cuit ? '11 números, sin guiones' : 'Sin puntos';
    documento.maxLength = cuit ? 13 : 8;
    documento.value = documento.value.replace(/\D/g, '').slice(0, cuit ? 11 : 8);
    if (documento.value) marcar(documento, errorDe(documento));
    else marcar(documento, '');
  }

  tipos.forEach((t) => t.addEventListener('change', actualizarDocumento));

  formRegistro.querySelector('[data-condicion]').addEventListener('change', (e) => {
    tipos.find((t) => t.value === (e.target.selectedIndex === 0 ? 'DNI' : 'CUIT')).checked = true;
    actualizarDocumento();
  });

  documento.addEventListener('input', () => (documento.value = documento.value.replace(/[^\d-]/g, '')));

  // El CUIT se muestra con guiones al salir del campo (20-12345678-9)
  documento.addEventListener('blur', () => {
    const n = documento.value.replace(/\D/g, '');
    if (tipoDocumento() === 'CUIT' && n.length === 11) documento.value = `${n.slice(0, 2)}-${n.slice(2, 10)}-${n.slice(10)}`;
  });
}

function tipoDocumento() {
  return document.querySelector('[data-tipo-documento]:checked')?.value || 'DNI';
}

// Dígito verificador del CUIT
function cuitValido(n) {
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((s, p, i) => s + p * Number(n[i]), 0);
  let dv = 11 - (suma % 11);
  if (dv === 11) dv = 0;
  if (dv === 10) dv = 9;
  return dv === Number(n[10]);
}

// ---------- Degradado vivo de los botones y luz del borde de la tarjeta (luz.js y luz-borde.js) ----------

document.querySelectorAll('.enviar').forEach((boton) => iniciarLuz(boton, { tramo: 0.06 }));
iniciarLuzBorde(tarjeta, 'ingreso__tarjeta--puntero');

// ---------- Inicio ----------

if (acceso) {
  acceso.classList.add('ingreso--js');
  mostrar(location.hash.slice(1));
  addEventListener('hashchange', () => mostrar(location.hash.slice(1), { enfocar: true }));
}
