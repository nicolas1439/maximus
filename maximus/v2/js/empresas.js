// Empresas: formulario de cotización de muestra. Valida cada campo (error debajo del control, .campo__error con
// aria-invalid y .con-error; el CUIT con su dígito verificador, cuitValido de campos.js), muestra "Enviando…" y
// después la confirmación en el lugar del formulario o el error de envío, con los datos cargados. No se envía nada. De muestra, el envío sale con error si lo pide la barra de la vista previa
// (data-ver-envio) o si el correo tiene la palabra "error"; el intento siguiente sale bien.
// Los "Cotizar" de las soluciones (data-necesidad) bajan al formulario con la necesidad ya escrita en el detalle.
// "Copiar" del canal (data-copiar) copia el correo de Empresas y lo confirma con un aviso breve.

import { cuitValido } from './campos.js';

const form = document.querySelector('[data-cotizacion]');

// Pone o saca el error de un control (texto vacío = sin error). Va en un span porque el campo es un label
function marcarError(control, texto) {
  const campo = control.closest('.campo');
  let error = campo.querySelector('.campo__error');
  control.classList.toggle('con-error', Boolean(texto));
  if (!texto) {
    control.removeAttribute('aria-invalid');
    error?.remove();
    return;
  }
  control.setAttribute('aria-invalid', 'true');
  if (!error) {
    error = document.createElement('span');
    error.className = 'campo__error';
    (control.closest('.selector') || control).after(error);
  }
  error.innerHTML = `<svg class="icono icono--s" aria-hidden="true"><use href="#i-alerta"/></svg><span>${texto}</span>`;
}

const correoValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

// Mensaje de error de cada campo según su valor (vacío = sin error)
const reglas = {
  empresa: (v) => (v ? '' : 'Ingresá la empresa o razón social.'),
  cuit: (v) => {
    const digitos = v.replace(/\D/g, '');
    if (!v) return '';
    if (digitos.length !== 11) return 'El CUIT tiene 11 números.';
    return cuitValido(digitos) ? '' : 'Revisá el CUIT: el número no es válido.';
  },
  nombre: (v) => (v ? '' : 'Ingresá tu nombre y apellido.'),
  correo: (v) => (!v ? 'Ingresá tu correo.' : correoValido(v) ? '' : 'Revisá el correo (ej.: nombre@empresa.com).'),
  telefono: (v) => (!v ? 'Ingresá un teléfono de contacto.' : v.replace(/\D/g, '').length >= 8 ? '' : 'Revisá el número.'),
  detalle: (v) => (v ? '' : 'Contanos qué necesita tu empresa.'),
};

if (form) {
  const detalle = form.elements.detalle;
  let escrito = ''; // lo último que escribió un "Cotizar": si el detalle sigue igual, el próximo lo reemplaza

  document.querySelectorAll('[data-necesidad]').forEach((enlace) => {
    enlace.addEventListener('click', () => {
      if (!detalle.value.trim() || detalle.value === escrito) {
        escrito = `Necesito cotizar: ${enlace.dataset.necesidad}.\n`;
        detalle.value = escrito;
        if (detalle.getAttribute('aria-invalid')) revisar(detalle);
      }
      // El enlace baja hasta la sección; el foco va al detalle, con el cursor al final, sin cortar ese desplazamiento
      requestAnimationFrame(() => {
        detalle.focus({ preventScroll: true });
        detalle.setSelectionRange(detalle.value.length, detalle.value.length);
      });
    });
  });

  const estado = form.querySelector('.cotizacion__estado');
  const pasoCargar = form.querySelector('[data-paso="cargar"]');
  const pasoListo = form.querySelector('[data-paso="listo"]');
  const errorEnvio = form.querySelector('[data-error-envio]');
  const enviar = form.querySelector('[data-enviar]');
  const controles = Object.keys(reglas).map((nombre) => form.elements[nombre]);
  const demo = { error: false };
  let enviando = false;

  function revisar(control) {
    const mensaje = reglas[control.name](control.value.trim());
    marcarError(control, mensaje);
    return !mensaje;
  }

  // Al salir de un campo con algo escrito, y con cada tecla mientras tiene error
  form.addEventListener('focusout', (e) => {
    if (reglas[e.target.name] && e.target.value.trim()) revisar(e.target);
  });
  form.addEventListener('input', (e) => {
    if (reglas[e.target.name] && e.target.getAttribute('aria-invalid')) revisar(e.target);
    if (!form.querySelector('[aria-invalid="true"]')) mostrarEstado('');
  });

  function mostrarEstado(texto) {
    estado.textContent = texto;
    estado.classList.toggle('cotizacion__estado--error', Boolean(texto));
  }

  // Botón esperando la respuesta: ruedita, "Enviando…" y sin poder tocarlo
  function cargando(boton, si) {
    if (si) boton.dataset.texto = boton.textContent;
    boton.textContent = si ? 'Enviando…' : boton.dataset.texto;
    boton.classList.toggle('cargando', si);
    boton.disabled = si;
    if (si) boton.setAttribute('aria-busy', 'true');
    else boton.removeAttribute('aria-busy');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (enviando) return;

    const malos = controles.filter((c) => !revisar(c));
    if (malos.length) {
      mostrarEstado('Revisá los campos marcados.');
      malos[0].focus();
      return;
    }
    mostrarEstado('');

    // El botón que se tocó (con Enter, el submitter puede ser el de la alerta escondida)
    const boton = e.submitter && !e.submitter.closest('[hidden]') ? e.submitter : enviar;
    const correo = form.elements.correo.value.trim();
    const conError = demo.error || correo.toLowerCase().includes('error');
    enviando = true;
    cargando(boton, true);

    // De muestra: la respuesta tarda un momento
    setTimeout(() => {
      enviando = false;
      cargando(boton, false);
      if (conError && errorEnvio.hidden) {
        errorEnvio.hidden = false;
        errorEnvio.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      errorEnvio.hidden = true;
      pasoListo.querySelector('[data-correo]').textContent = correo;
      pasoCargar.hidden = true;
      pasoListo.hidden = false;
      pasoListo.focus();
    }, 1200);
  });

  // Enviar otra consulta: el formulario vacío, como al llegar
  form.querySelector('[data-otra]').addEventListener('click', () => {
    form.reset();
    escrito = '';
    controles.forEach((c) => marcarError(c, ''));
    pasoListo.hidden = true;
    pasoCargar.hidden = false;
    form.elements.empresa.focus();
  });

  // Barra de la vista previa (data-demo): cómo sale el próximo envío
  document.querySelectorAll('[data-ver-envio]').forEach((b) =>
    b.addEventListener('click', () => {
      demo.error = b.dataset.verEnvio === 'error';
      document.querySelectorAll('[data-ver-envio]').forEach((otro) => otro.setAttribute('aria-pressed', String(otro === b)));
      errorEnvio.hidden = true;
      if (!pasoListo.hidden) form.querySelector('[data-otra]').click();
    })
  );
}

// ---------- Copiar el correo de Empresas ----------

const aviso = document.querySelector('.empresas [data-aviso]');
let temporizador;

function avisar(texto) {
  aviso.textContent = texto;
  aviso.classList.add('aviso--visible');
  clearTimeout(temporizador);
  temporizador = setTimeout(() => aviso.classList.remove('aviso--visible'), 2200);
}

document.querySelectorAll('.empresas [data-copiar]').forEach((boton) =>
  boton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(boton.dataset.copiar);
      avisar('Correo copiado');
    } catch {
      avisar('No se pudo copiar el correo');
    }
  })
);
