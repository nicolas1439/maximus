// Campos de formulario con error propio: cada control marcado con data-requerido="grupo" se valida al enviar y,
// con error, se revisa con cada tecla hasta que se corrige. El mensaje va debajo del control (.campo__error) y
// depende del tipo (data-campo). "Sin número" (data-sin-numero) deshabilita el número de su campo.
// Lo usan el checkout (Factura A y dirección nueva) y Mi cuenta (direcciones y Mis datos).

const ERRORES = {
  calle: 'Ingresá la calle.',
  numero: 'Ingresá el número o marcá "Sin número".',
  cp: 'Ingresá un código postal válido (4 números, o el CPA de 8 caracteres).',
  localidad: 'Ingresá la localidad.',
  correo: 'Ingresá un correo válido.',
  clave: 'Ingresá una contraseña.',
  nombre: 'Ingresá un nombre para reconocerla.',
  recibe: 'Ingresá quién recibe.',
  telefono: 'Ingresá un teléfono de contacto.',
};

// Pone o saca el error de un control (texto vacío = sin error)
export function marcarError(control, texto) {
  const campo = control.closest('.campo');
  let error = campo?.querySelector('.campo__error[data-error-campo]');
  if (!texto) {
    error?.remove();
    control.removeAttribute('aria-invalid');
    control.classList.remove('con-error');
    return;
  }
  control.setAttribute('aria-invalid', 'true');
  control.classList.add('con-error');
  if (!error) {
    // Pegado al control (o a la contraseña con su botón), antes de "Sin número" y de la ayuda
    error = document.createElement('p');
    error.className = 'campo__error';
    error.dataset.errorCampo = '';
    (control.closest('.clave, .cuit') || control).after(error);
  }
  error.innerHTML = `<svg class="icono icono--s" aria-hidden="true"><use href="#i-alerta"/></svg>${texto}`;
}

export function validarCampo(control) {
  const valor = control.value.trim();
  const tipo = control.dataset.campo;
  let ok = Boolean(valor) || control.disabled;
  if (ok && tipo === 'cp' && !control.disabled) ok = /^\d{4}$/.test(valor) || /^[A-Z]\d{4}[A-Z]{3}$/i.test(valor);
  if (ok && tipo === 'correo') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
  marcarError(control, ok ? '' : ERRORES[tipo] || 'Completá este dato.');
  return ok;
}

// Valida los campos de un grupo dentro de raiz; el foco va al primero con error
export function validarCampos(raiz, grupo) {
  const campos = [...raiz.querySelectorAll(`[data-requerido="${grupo}"]`)];
  const conError = campos.filter((c) => !validarCampo(c));
  conError[0]?.focus();
  return !conError.length;
}

// Revisión en vivo de los campos con error y "Sin número"
export function iniciarCampos(raiz, { alCambiar } = {}) {
  raiz.addEventListener('input', (e) => {
    if (e.target.matches('[data-requerido][aria-invalid="true"]')) validarCampo(e.target);
  });
  raiz.querySelectorAll('[data-sin-numero]').forEach((casilla) =>
    casilla.addEventListener('change', () => {
      const numero = casilla.closest('.campo').querySelector('input.campo__control');
      numero.disabled = casilla.checked;
      if (casilla.checked) {
        numero.value = '';
        marcarError(numero, '');
      }
      alCambiar?.();
    })
  );
}

// CUIT con su dígito verificador (11 números)
export function cuitValido(cuit) {
  if (!/^\d{11}$/.test(cuit)) return false;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((s, p, i) => s + p * Number(cuit[i]), 0);
  const resto = 11 - (suma % 11);
  const digito = resto === 11 ? 0 : resto === 10 ? 9 : resto;
  return digito === Number(cuit[10]);
}
