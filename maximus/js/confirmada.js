// Compra confirmada: muestra la compra que guardó checkout.js en sessionStorage al tocar "Confirmar compra" (si no hay
// nada, queda la compra de muestra del HTML), arma la variante según el pago (transferencia: esperando el pago, con
// los datos bancarios; tarjeta: pago aprobado), copia los datos bancarios y tira el confeti. Todo es de muestra.

import { confeti } from './confeti.js';

const raiz = document.querySelector('[data-confirmada]');
if (raiz) iniciar();

function iniciar() {
  const $ = (selector) => raiz.querySelector(selector);
  const $$ = (selector) => [...raiz.querySelectorAll(selector)];
  const pesos = (n) => `$${Math.round(n).toLocaleString('es-AR')}`;
  const icono = (id) => `<svg class="icono icono--s" aria-hidden="true"><use href="recursos/iconos.svg?v=3#${id}"/></svg>`;
  const escapar = (texto) => String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  let compra = null;
  try {
    compra = JSON.parse(sessionStorage.getItem('compra'));
  } catch {}

  // ---------- Compra guardada por el checkout ----------

  function completar(c) {
    const t = c.total;
    const lineas = c.items.map(
      (i) => `<li><img src="${escapar(i.foto)}" alt="" width="600" height="600"><span>${escapar(i.nombre)}<small> × ${i.cantidad}</small></span><strong>${pesos(i.precio * i.cantidad)}</strong></li>`
    );
    const extra = (id, texto, monto) => `<li><span class="lineas__icono">${icono(id)}</span><span>${escapar(texto)}</span><strong>${monto}</strong></li>`;
    if (c.retiro) lineas.push(extra('i-tienda', c.entrega, 'Gratis'));
    else lineas.push(extra('i-envio', c.entrega.split(' · ')[0], pesos(t.envio)), extra('i-garantia', 'Seguro de envío', pesos(t.seguro)));
    $('[data-lineas]').innerHTML = lineas.join('');

    $('[data-cantidad]').textContent = t.cantidad;
    $('[data-t-lista]').textContent = pesos(t.lista);
    $('[data-f-campania]').hidden = !t.campania;
    $('[data-t-campania-nombre]').textContent = c.campania || 'Campaña';
    $('[data-t-campania]').textContent = `−${pesos(t.campania)}`;
    $('[data-f-descuento]').hidden = !t.descuento;
    $('[data-t-descuento]').textContent = `−${pesos(t.descuento)}`;
    $('[data-t-total]').textContent = pesos(t.final);

    $('[data-d-entrega]').textContent = c.entrega;
    $('[data-d-entrega-meta]').textContent = c.entregaMeta;
    $('[data-d-facturacion]').textContent = c.facturacion;
    $('[data-d-pago]').textContent = c.pagoTexto;

    $('[data-monto]').textContent = pesos(t.final);
    $('[data-monto] + [data-copiar]').dataset.copiar = String(Math.round(t.final));
    $('[data-monto-tarjeta]').textContent = pesos(c.financiado);
    $('[data-monto-nota]').textContent =
      c.cuotas === 1 ? 'En 1 pago' : `${c.cuotas} cuotas ${c.financiado > t.final ? '' : 'sin interés '}de ${pesos(c.financiado / c.cuotas)}`;
    $('[data-pago-tarjeta]').textContent = `${c.pagoTexto.replace(/ en \d+ cuotas de .*/, c.cuotas === 1 ? '' : ` en ${c.cuotas} cuotas`)}, con Mercado Pago.`;
  }

  if (compra?.items?.length) completar(compra);

  // ---------- Variante según el pago ----------

  const retiro = Boolean(compra?.retiro);
  const sigue = {
    transferencia: [
      ['Hacé la transferencia', 'Por el total exacto, con los datos de arriba.'],
      ['Subí el comprobante', 'Sin el comprobante no podemos validar el pago y el pedido no entra en preparación.', true],
      ['Preparamos tu pedido', retiro
        ? 'En 24 a 48 hs hábiles desde que se acredita el pago. Te avisamos por correo cuando puedas pasar a buscarlo.'
        : 'En 24 a 48 hs hábiles desde que se acredita el pago. Te avisamos por correo cuando sale.'],
    ],
    tarjeta: [
      ['Preparamos tu pedido', 'En 24 a 48 hs hábiles. Te avisamos por correo en cada paso.'],
      retiro
        ? ['Te avisamos para retirarlo', 'Lo retira el titular de la tarjeta, con la tarjeta y su DNI físico.']
        : ['Lo despachamos con OCA', 'Te mandamos el número de guía para que lo sigas.'],
      retiro ? ['Pasás a buscarlo', 'En el horario de la sucursal que elegiste.'] : ['Lo recibís', 'En la dirección que elegiste.'],
    ],
  };

  function ver(pago) {
    const transferencia = pago === 'transferencia';
    $$('[data-variante]').forEach((n) => (n.hidden = n.dataset.variante !== pago));
    $$('[data-ver]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.ver === pago));

    const estado = $('[data-estado]');
    estado.className = `estado ${transferencia ? 'estado--aviso' : 'estado--exito'}`;
    estado.textContent = transferencia ? 'Esperando el pago' : 'Pago aprobado';
    $('[data-bajada]').innerHTML = transferencia
      ? 'Reservamos tus productos. Para completar la compra, transferí el total y subí el comprobante. Te mandamos todo a <strong>martin.gonzalez@correo.com</strong>.'
      : 'Tu pago está aprobado y ya estamos con tu pedido. Te mandamos el detalle a <strong>martin.gonzalez@correo.com</strong>.';

    // Pasos del pedido: con tarjeta, el pago ya está hecho y el pedido pasa a preparación
    const actual = transferencia ? 1 : 2;
    $$('[data-pasos] .seguimiento__paso').forEach((paso, i) => {
      paso.classList.toggle('seguimiento__paso--hecho', i < actual);
      paso.classList.toggle('seguimiento__paso--actual', i === actual);
      if (i === actual) paso.setAttribute('aria-current', 'step');
      else paso.removeAttribute('aria-current');
      const punto = paso.querySelector('.seguimiento__punto');
      punto.innerHTML = i < actual ? '<svg class="icono" aria-hidden="true"><use href="recursos/iconos.svg?v=3#i-check"/></svg>' : '';
      const fecha = paso.querySelector('small');
      if (i < actual && !fecha) paso.querySelector('.seguimiento__texto').insertAdjacentHTML('beforeend', '<small>17/10</small>');
      if (i >= actual) fecha?.remove();
    });
    $('[data-paso-envio]').firstChild.textContent = retiro ? 'Para retirar' : 'En camino';
    $('[data-paso-final]').firstChild.textContent = retiro ? 'Retirado' : 'Entregado';

    $('[data-sigue]').innerHTML = sigue[pago]
      .map(
        ([titulo, texto, comprobante], i) => `<li class="sigue__paso"><span class="sigue__num">${i + 1}</span><div>
          <p class="sigue__titulo">${titulo}</p><p class="sigue__texto">${texto}</p>
          ${comprobante ? `<a class="btn btn--primario sigue__btn" href="mi-cuenta.html#pedidos">${icono('i-subir')}Subir comprobante</a>` : ''}
        </div></li>`
      )
      .join('');
  }

  ver(compra?.pago || 'transferencia');
  $$('[data-ver]').forEach((b) => b.addEventListener('click', () => ver(b.dataset.ver)));

  // ---------- Copiar datos bancarios ----------

  const aviso = $('[data-aviso]');
  let temporizador;
  function avisar(texto) {
    aviso.textContent = texto;
    aviso.classList.add('aviso--visible');
    clearTimeout(temporizador);
    temporizador = setTimeout(() => aviso.classList.remove('aviso--visible'), 2200);
  }

  raiz.addEventListener('click', async (e) => {
    const boton = e.target.closest('[data-copiar]');
    if (!boton) return;
    try {
      await navigator.clipboard.writeText(boton.dataset.copiar);
      avisar(`${boton.dataset.copiarNombre} copiado`);
    } catch {
      avisar('No se pudo copiar');
    }
  });

  // ---------- Festejo ----------

  // Una sola vez por compra: al recargar la página ya no sale (en la vista previa, sin compra guardada, siempre)
  raiz.classList.add('confirmada--js');
  if (compra?.festejada) return;
  setTimeout(() => confeti($('[data-gracias-icono]')), 500);
  if (compra) {
    try {
      sessionStorage.setItem('compra', JSON.stringify({ ...compra, festejada: true }));
    } catch {}
  }
}
