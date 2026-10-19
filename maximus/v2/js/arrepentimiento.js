// Botón de arrepentimiento, de muestra: con la sesión iniciada completa los datos del cliente; valida nombre, correo,
// DNI (7 u 8 números) y número de pedido (con o sin "MAX-") y muestra la confirmación con el número de trámite en el
// lugar del formulario. No se envía nada.

const form = document.querySelector('[data-arrepentimiento]');

if (form) {
  let sesion = false;
  try { sesion = Boolean(localStorage.getItem('sesion')); } catch {}
  if (sesion) form.querySelectorAll('[data-dato]').forEach((c) => { if (!c.value) c.value = c.dataset.dato; });

  const estado = form.querySelector('.arrepentimiento__estado');
  const reglas = {
    nombre: (v) => (v.length >= 3 ? '' : 'Escribí tu nombre y apellido.'),
    correo: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Revisá el correo: falta algo (ej.: nombre@correo.com).'),
    dni: (v) => (/^\d{7,8}$/.test(v.replace(/\./g, '')) ? '' : 'El DNI tiene 7 u 8 números, sin puntos.'),
    pedido: (v) => (/^(#?\s*max[\s-]*)?\d{4,7}$/i.test(v) ? '' : 'Revisá el número de pedido: tiene 6 números (con o sin MAX-).'),
  };

  function marcar(campo, mensaje) {
    const caja = campo.closest('.campo');
    let nota = caja.querySelector('.campo__error');
    if (mensaje) campo.setAttribute('aria-invalid', 'true'); else campo.removeAttribute('aria-invalid');
    campo.classList.toggle('con-error', Boolean(mensaje));
    if (!mensaje) return nota?.remove();
    if (!nota) {
      nota = document.createElement('span');
      nota.className = 'campo__error';
      caja.append(nota);
    }
    nota.textContent = mensaje;
  }

  const revisar = (campo) => {
    const regla = reglas[campo.name];
    if (!regla) return true;
    const mensaje = regla(campo.value.trim());
    marcar(campo, mensaje);
    return !mensaje;
  };

  form.querySelectorAll('input').forEach((c) => {
    c.addEventListener('blur', () => c.value && revisar(c));
    c.addEventListener('input', () => c.hasAttribute('aria-invalid') && revisar(c));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const campos = [...form.querySelectorAll('input')];
    const malos = campos.filter((c) => !revisar(c));
    if (malos.length) {
      estado.textContent = 'Revisá los campos marcados.';
      estado.classList.add('con-error');
      malos[0].focus();
      return;
    }
    estado.textContent = '';
    form.querySelector('[data-correo]').textContent = form.elements.correo.value.trim();
    form.querySelector('[data-paso="cargar"]').hidden = true;
    const listo = form.querySelector('[data-paso="listo"]');
    listo.hidden = false;
    listo.focus();
  });
}
