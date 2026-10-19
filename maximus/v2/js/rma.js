// Garantía y RMA: trámite en 3 etapas (producto, falla, tus datos) con la verificación de la garantía según el
// tipo de producto y la fecha de compra (plazos del centro de ayuda), fotos con vista previa y la confirmación.
// Con la sesión de muestra (la guarda acceso.js) se elige el producto de las compras de Mi cuenta y los datos ya
// vienen cargados; sin sesión, se carga a mano con la factura. De muestra: no se envía nada.

const tramite = document.querySelector('[data-tramite]');
const form = document.querySelector('[data-form-rma]');
const icono = (id) => `<svg class="icono" aria-hidden="true"><use href="#${id}"/></svg>`;

let conSesion = false;
try {
  conSesion = Boolean(localStorage.getItem('sesion'));
} catch {}

// ---------- Plazos de garantía (centro de ayuda) ----------

const reglas = {
  pc: { meses: 12, nombre: 'Las PC armadas por Maximus tienen 12 meses de garantía' },
  hardware: { meses: 6, nombre: 'El hardware tiene 6 meses de garantía con Maximus' },
  periferico: { meses: 6, nombre: 'Los periféricos tienen 6 meses de garantía con Maximus' },
  conectividad: { meses: 6, nombre: 'Los productos de conectividad tienen 6 meses de garantía con Maximus' },
  accesorio: { meses: 6, nombre: 'Los accesorios tienen 6 meses de garantía con Maximus' },
  notebook: { dias: 10, tipo: 'notebooks' },
  monitor: { dias: 10, tipo: 'monitores' },
  impresora: { dias: 10, tipo: 'impresoras' },
  logitech: { dias: 10, tipo: 'productos Logitech', marca: 'Logitech' },
  seagate: { dias: 10, tipo: 'productos Seagate', marca: 'Seagate' },
};

const fechaLarga = (d) => d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

function hoy() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Devuelve { elegible, tipo (ok | info | aviso), chip, titulo, texto }
function verificar({ categoria, fecha, marca, rma }) {
  if (rma) {
    return {
      elegible: false, tipo: 'info', chip: 'RMA en curso', icono: 'i-reloj',
      titulo: 'Este producto ya tiene una garantía en curso',
      texto: `Es el RMA #${rma}. Seguí su estado en <a href="mi-cuenta.html#garantias">Mis garantías</a>.`,
    };
  }
  const regla = reglas[categoria];
  if (!regla || !fecha) return null;
  const compra = new Date(`${fecha}T00:00:00`);
  if (compra > hoy()) {
    return { elegible: false, tipo: 'aviso', icono: 'i-alerta', titulo: 'Revisá la fecha de compra', texto: 'No puede ser posterior a hoy.' };
  }

  const hasta = new Date(compra);
  if (regla.meses) hasta.setMonth(hasta.getMonth() + regla.meses);
  else hasta.setDate(hasta.getDate() + regla.dias);

  if (hoy() <= hasta) {
    return {
      elegible: true, tipo: 'ok', chip: 'En garantía', icono: 'i-check',
      titulo: 'Está en garantía con Maximus',
      texto: regla.meses
        ? `Hasta el ${fechaLarga(hasta)}: ${regla.meses} meses desde la compra. Seguí con la falla.`
        : `Hasta el ${fechaLarga(hasta)}: los primeros 10 días la gestionamos nosotros. Seguí con la falla.`,
    };
  }

  if (regla.dias) {
    return {
      elegible: false, tipo: 'info', chip: 'Con el fabricante', icono: 'i-garantia',
      titulo: `La garantía es con ${marca || regla.marca || 'el fabricante'}`,
      texto: `En ${regla.tipo}, después de los 10 días desde la compra la garantía la da el servicio oficial de la marca. <a href="centro-de-ayuda.html#p-garantias-fabricante">Ver los teléfonos de los fabricantes</a>.`,
    };
  }

  return {
    elegible: false, tipo: 'aviso', chip: 'Garantía vencida', icono: 'i-alerta',
    titulo: `La garantía venció el ${fechaLarga(hasta)}`,
    texto: `${regla.nombre}. Si igual necesitás ayuda, <a href="https://wa.me/541123575522" target="_blank" rel="noopener">escribinos por WhatsApp</a>.`,
  };
}

// ---------- Errores en los campos (como en Ingresar y Centro de ayuda) ----------

// El mensaje va justo después del control (o de su zona, selector, grupo de pastillas o casilla)
function marcar(control, mensaje) {
  const ancla = control.closest('.adjuntos, .selector, .fallas__lista, .casilla') || control;
  let nota = ancla.nextElementSibling?.classList.contains('campo__error') ? ancla.nextElementSibling : null;
  const marcado = control.closest('.adjuntos') || control;
  if (!mensaje) {
    marcado.removeAttribute('aria-invalid');
    nota?.remove();
    return;
  }
  if (!nota) {
    nota = document.createElement('p');
    nota.className = 'campo__error';
    ancla.after(nota);
  }
  nota.innerHTML = `${icono('i-alerta')}<span>${mensaje}</span>`;
  marcado.setAttribute('aria-invalid', 'true');
}

function errorDe(control) {
  const v = (control.value || '').trim();
  if (control.type === 'radio') {
    return form.querySelector(`[name="${control.name}"]:checked`) ? '' : 'Elegí una opción.';
  }
  if (control.type === 'checkbox') return control.checked ? '' : 'Confirmalo para seguir.';
  if (control.type === 'file') return '';
  if (control.required && !v) return control.tagName === 'SELECT' ? 'Elegí una opción.' : 'Completá este campo.';
  if (control.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Revisá el correo (ej.: nombre@correo.com).';
  if (control.name === 'falla' && v && v.length < 15) return 'Contanos un poco más (al menos 15 caracteres).';
  if (control.name === 'telefono' && v && v.replace(/\D/g, '').length < 8) return 'Revisá el número.';
  return '';
}

// Valida los controles visibles de una etapa; devuelve el primero con error
function validar(controles) {
  let primero = null;
  const vistos = new Set();
  controles.forEach((c) => {
    if (c.type === 'radio') {
      if (vistos.has(c.name)) return;
      vistos.add(c.name);
    }
    const error = errorDe(c);
    marcar(c, error);
    if (error && !primero) primero = c;
  });
  return primero;
}

if (tramite && form) {
  const etapas = [...form.querySelectorAll('[data-etapa]')];
  const pasos = [...tramite.querySelectorAll('.pasos__paso')];
  const veredicto = form.querySelector('[data-veredicto]');
  const bloqueCompras = form.querySelector('[data-con-sesion]');
  const bloqueManual = form.querySelector('[data-manual]');
  const enviada = tramite.querySelector('[data-enviada]');
  let etapa = 1;
  let alcanzada = 1;
  let modo = conSesion ? 'compras' : 'manual';
  let resultado = null;
  let fotos = [];

  // ---------- Modo: compras de Mi cuenta o carga a mano ----------

  function aplicarModo() {
    bloqueCompras.hidden = modo !== 'compras';
    bloqueManual.hidden = modo !== 'manual';
    form.querySelector('[data-sin-sesion]').hidden = conSesion;
    form.querySelector('[data-modo-compras]').hidden = !conSesion;
    form.querySelectorAll('[data-solo-manual]').forEach((n) => (n.hidden = modo !== 'manual'));
    actualizarVeredicto();
  }

  // Estado de cada compra (chip) y verificación de la elegida
  form.querySelectorAll('.compra-rma .opcion__radio').forEach((radio) => {
    const r = verificar({ ...radio.dataset });
    const chip = radio.closest('.compra-rma').querySelector('[data-estado-compra]');
    chip.textContent = r.chip;
    chip.classList.add(`compra-rma__estado--${r.tipo}`);
  });

  function datosProducto() {
    if (modo === 'compras') {
      const radio = form.querySelector('.compra-rma .opcion__radio:checked');
      return radio ? { ...radio.dataset } : null;
    }
    return {
      categoria: form.elements.categoria.value,
      fecha: form.elements.fecha.value,
      producto: form.elements.producto.value.trim(),
    };
  }

  function actualizarVeredicto() {
    const datos = datosProducto();
    resultado = datos && verificar(datos);
    veredicto.hidden = !resultado;
    if (!resultado) return;
    veredicto.className = `veredicto veredicto--${resultado.tipo}`;
    veredicto.innerHTML = `${icono(resultado.icono)}<p class="veredicto__titulo">${resultado.titulo}</p><p>${resultado.texto}</p>`;
    form.querySelector('[data-etapa="1"] .etapa__estado').textContent = '';
  }

  form.addEventListener('change', (e) => {
    if (e.target.matches('.compra-rma .opcion__radio, [data-categoria], [data-fecha]')) actualizarVeredicto();
    if (e.target.getAttribute('aria-invalid') || e.target.type === 'radio' || e.target.type === 'checkbox') {
      if (e.target.closest('.campo, .fallas, .casilla')) marcar(e.target, errorDe(e.target));
    }
  });

  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid')) marcar(e.target, errorDe(e.target));
  });

  form.addEventListener('focusout', (e) => {
    if (e.target.matches('.campo__control') && e.target.value) marcar(e.target, errorDe(e.target));
  });

  form.querySelector('[data-modo-manual]').addEventListener('click', () => {
    modo = 'manual';
    aplicarModo();
    form.elements.categoria.focus();
  });

  form.querySelector('[data-modo-compras]').addEventListener('click', () => {
    modo = 'compras';
    aplicarModo();
  });

  form.elements.fecha.max = new Date().toISOString().slice(0, 10);

  // ---------- Etapas ----------

  function irA(n) {
    etapa = n;
    alcanzada = Math.max(alcanzada, n);
    etapas.forEach((f) => (f.hidden = Number(f.dataset.etapa) !== n));
    pasos.forEach((p, i) => {
      const num = i + 1;
      p.classList.toggle('pasos__paso--hecho', num < n || (num < alcanzada && num !== n));
      if (num === n) p.setAttribute('aria-current', 'step');
      else p.removeAttribute('aria-current');
      p.querySelector('button').disabled = num > alcanzada || num === n;
    });
    if (tramite.getBoundingClientRect().top < 0) tramite.scrollIntoView({ behavior: 'smooth', block: 'start' });
    etapas[n - 1].querySelector('legend').focus({ preventScroll: true });
  }

  function etapaValida(n) {
    const caja = etapas[n - 1];
    const estado = caja.querySelector('.etapa__estado');
    estado.textContent = '';

    if (n === 1) {
      if (modo === 'compras' && !form.querySelector('.compra-rma .opcion__radio:checked')) {
        estado.textContent = 'Elegí el producto que falla.';
        return false;
      }
      if (modo === 'manual') {
        const primero = validar([...bloqueManual.querySelectorAll('[required]')]);
        if (primero) return primero.focus(), false;
      }
      actualizarVeredicto();
      if (resultado && !resultado.elegible) {
        estado.textContent = 'Este producto no se puede gestionar con este trámite.';
        veredicto.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return false;
      }
      const datos = datosProducto();
      form.querySelector('[data-producto-elegido]').innerHTML = `Producto: <strong>${datos.producto.replace(/</g, '&lt;')}</strong>`;
      return true;
    }

    const controles = [...caja.querySelectorAll('[required]')].filter((c) => !c.closest('[hidden]'));
    let primero = validar(controles);

    if (n === 2) {
      const campoFotos = form.querySelector('[data-adjuntos="fotos"] input');
      const sinFotos = fotos.length === 0;
      marcar(campoFotos, sinFotos ? 'Subí al menos una foto del producto.' : '');
      if (sinFotos && !primero) primero = campoFotos;
      if (modo === 'manual') {
        const factura = form.querySelector('[data-adjuntos="factura"] input');
        const sinFactura = !factura.files.length;
        marcar(factura, sinFactura ? 'Subí la factura de compra.' : '');
        if (sinFactura && !primero) primero = factura;
      }
    }

    if (primero) {
      (primero.type === 'radio' || primero.type === 'file' ? primero.closest('.campo, .fallas') : primero.closest('.casilla') || primero).scrollIntoView({ behavior: 'smooth', block: 'center' });
      primero.focus({ preventScroll: true });
      return false;
    }
    return true;
  }

  form.querySelectorAll('[data-siguiente]').forEach((b) =>
    b.addEventListener('click', () => etapaValida(etapa) && irA(etapa + 1))
  );
  form.querySelectorAll('[data-anterior]').forEach((b) => b.addEventListener('click', () => irA(etapa - 1)));
  tramite.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => irA(Number(b.dataset.ir))));

  // Enter en un campo de las etapas 1 y 2: continúa en lugar de enviar
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && etapa < 3 && e.target.matches('input')) {
      e.preventDefault();
      if (etapaValida(etapa)) irA(etapa + 1);
    }
  });

  // ---------- Fotos: varias, con vista previa ----------

  const zonaFotos = form.querySelector('[data-adjuntos="fotos"]');
  const inputFotos = zonaFotos.querySelector('input');
  const miniaturas = zonaFotos.querySelector('[data-miniaturas]');

  function pintarFotos() {
    miniaturas.replaceChildren(
      ...fotos.map((f, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<img src="${f.url}" alt="Foto ${i + 1}"><button type="button" aria-label="Quitar la foto ${i + 1}">${icono('i-cerrar')}</button>`;
        li.querySelector('button').addEventListener('click', () => {
          URL.revokeObjectURL(f.url);
          fotos.splice(i, 1);
          pintarFotos();
        });
        return li;
      })
    );
  }

  inputFotos.addEventListener('change', () => {
    const nuevas = [...inputFotos.files].filter((f) => /image\/(jpeg|png)/.test(f.type));
    fotos = fotos.concat(nuevas.map((archivo) => ({ archivo, url: URL.createObjectURL(archivo) }))).slice(0, 5);
    inputFotos.value = '';
    pintarFotos();
    if (fotos.length) marcar(inputFotos, '');
  });

  // Al arrastrar archivos encima, la zona se marca (el input, que la cubre, recibe lo que se suelta)
  form.querySelectorAll('.adjuntos').forEach((zona) => {
    zona.addEventListener('dragenter', () => zona.classList.add('adjuntos--arrastrando'));
    ['dragleave', 'drop'].forEach((t) => zona.addEventListener(t, () => zona.classList.remove('adjuntos--arrastrando')));
  });

  // Factura: un archivo, se muestra su nombre
  const inputFactura = form.querySelector('[data-adjuntos="factura"] input');
  const nombreFactura = form.querySelector('[data-nombre-archivo]');
  const textoFactura = nombreFactura.innerHTML;
  inputFactura.addEventListener('change', () => {
    const archivo = inputFactura.files[0];
    nombreFactura.innerHTML = archivo ? `<strong>${archivo.name.replace(/</g, '&lt;')}</strong>` : textoFactura;
    inputFactura.closest('.adjuntos').classList.toggle('adjuntos--lleno', Boolean(archivo));
    if (archivo) marcar(inputFactura, '');
  });

  // ---------- Datos del cliente de muestra (con sesión) ----------

  if (conSesion) {
    form.elements.nombre.value = 'Martín González';
    form.elements.correo.value = 'martin.gonzalez@correo.com';
    form.elements.telefono.value = '11 5555-0123';
    form.elements.dni.value = '48213';
  }

  // ---------- Enviar (de muestra) ----------

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!etapaValida(3)) return;

    const datos = datosProducto();
    const falla = form.querySelector('[name="tipo_falla"]:checked').value;
    const llenar = (clave, texto) => (enviada.querySelector(`[data-dato="${clave}"]`).textContent = texto);
    llenar('telefono', form.elements.telefono.value.trim());
    llenar('producto', datos.producto);
    llenar('falla', `${falla}. ${form.elements.falla.value.trim()}`);
    llenar('entrega', form.elements.entrega.value === 'local' ? 'Lo llevás al sector de RMA (Floresta)' : 'Lo enviás por correo');
    enviada.querySelector('[data-numero-rma]').textContent = 14907 + Math.floor(Math.random() * 40);

    pasos.forEach((p) => {
      p.classList.add('pasos__paso--hecho');
      p.removeAttribute('aria-current');
      p.querySelector('button').disabled = true;
    });
    form.hidden = true;
    enviada.hidden = false;
    if (tramite.getBoundingClientRect().top < 0) tramite.scrollIntoView({ behavior: 'smooth', block: 'start' });
    enviada.focus({ preventScroll: true });
  });

  tramite.querySelector('[data-otra]').addEventListener('click', () => {
    form.reset();
    fotos.forEach((f) => URL.revokeObjectURL(f.url));
    fotos = [];
    pintarFotos();
    inputFactura.dispatchEvent(new Event('change'));
    form.querySelectorAll('.campo__error').forEach((n) => n.remove());
    form.querySelectorAll('[aria-invalid]').forEach((n) => n.removeAttribute('aria-invalid'));
    if (conSesion) {
      form.elements.nombre.value = 'Martín González';
      form.elements.correo.value = 'martin.gonzalez@correo.com';
      form.elements.telefono.value = '11 5555-0123';
      form.elements.dni.value = '48213';
    }
    modo = conSesion ? 'compras' : 'manual';
    alcanzada = 1;
    enviada.hidden = true;
    form.hidden = false;
    aplicarModo();
    irA(1);
  });

  aplicarModo();
}
