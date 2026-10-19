// Empresas: formulario de cotización de muestra. Valida los campos obligatorios, el correo y el CUIT (si se
// cargó) y muestra la confirmación en el lugar del formulario. No se envía nada.
// Los "Cotizar" de las soluciones (data-necesidad) bajan al formulario con la necesidad ya escrita en el detalle.

const form = document.querySelector('[data-cotizacion]');

if (form) {
  const detalle = form.elements.detalle;
  let escrito = ''; // lo último que escribió un "Cotizar": si el detalle sigue igual, el próximo lo reemplaza

  document.querySelectorAll('[data-necesidad]').forEach((enlace) => {
    enlace.addEventListener('click', () => {
      if (!detalle.value.trim() || detalle.value === escrito) {
        escrito = `Necesito cotizar: ${enlace.dataset.necesidad}.\n`;
        detalle.value = escrito;
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

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const vacio = [...form.querySelectorAll('[required]')].find((c) => !c.value.trim());
    const correo = form.elements.correo;
    const cuit = form.elements.cuit;
    const cuitDigitos = cuit.value.replace(/\D/g, '');

    let error = '';
    let campo = null;
    if (vacio) {
      error = 'Completá los campos obligatorios.';
      campo = vacio;
    } else if (!correo.checkValidity()) {
      error = 'Revisá el correo electrónico.';
      campo = correo;
    } else if (cuitDigitos && cuitDigitos.length !== 11) {
      error = 'El CUIT tiene 11 números.';
      campo = cuit;
    }

    estado.classList.toggle('cotizacion__estado--error', Boolean(error));
    estado.textContent = error;
    if (error) {
      campo.focus();
      return;
    }

    pasoListo.querySelector('[data-correo]').textContent = correo.value.trim();
    pasoCargar.hidden = true;
    pasoListo.hidden = false;
    pasoListo.focus();
  });
}
