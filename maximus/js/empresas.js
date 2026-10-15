// Empresas: formulario de cotización de muestra. Valida los campos obligatorios, el correo y el CUIT (si se
// cargó) y muestra la confirmación en el lugar del formulario. No se envía nada.

const form = document.querySelector('[data-cotizacion]');

if (form) {
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
