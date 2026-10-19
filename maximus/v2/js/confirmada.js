// Compra confirmada: muestra la compra que guardó checkout.js en sessionStorage al tocar "Confirmar compra" (si no hay
// nada, queda la compra de muestra del HTML), arma la variante según el pago (transferencia: esperando el pago, con
// los datos bancarios y el plazo de 24 hs del comprobante; tarjeta: pago aprobado o pendiente en Mercado Pago),
// "Qué sigue" según el pago y la entrega (OCA 24 hs, OCA normal o retiro), copia los datos bancarios y tira el
// confeti. Todo es de muestra.

import { confeti } from './confeti.js';

const raiz = document.querySelector('[data-confirmada]');
if (raiz) iniciar();

function iniciar() {
  const $ = (selector) => raiz.querySelector(selector);
  const $$ = (selector) => [...raiz.querySelectorAll(selector)];
  const pesos = (n) => `$${Math.round(n).toLocaleString('es-AR')}`;
  const icono = (id) => `<svg class="icono icono--s" aria-hidden="true"><use href="#${id}"/></svg>`;
  const escapar = (texto) => String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  let compra = null;
  try {
    compra = JSON.parse(sessionStorage.getItem('compra'));
  } catch {}

  // ---------- Compra guardada por el checkout ----------

  function completar(c) {
    const t = c.total;
    const lineas = c.items.map(
      (i) =>
        `<li>${i.foto ? `<img src="${escapar(i.foto)}" alt="" width="600" height="600">` : `<span class="lineas__icono">${icono('i-regalo')}</span>`}<span>${escapar(i.nombre)}<small> × ${i.cantidad}</small></span><strong>${i.precio ? pesos(i.precio * i.cantidad) : 'Regalo'}</strong></li>`
    );
    const extra = (id, texto, monto) => `<li><span class="lineas__icono">${icono(id)}</span><span>${escapar(texto)}</span><strong>${monto}</strong></li>`;
    if (c.retiro) lineas.push(extra('i-tienda', c.entrega, 'Gratis'));
    else lineas.push(extra('i-envio', c.entrega.split(' · ')[0], pesos(t.envio)), extra('i-garantia', 'Seguro de envío', pesos(t.seguro)));
    $('[data-lineas]').innerHTML = lineas.join('');

    // Factura A, como en el checkout: el subtotal pasa a ser sin IVA, la campaña y el 10% van sin IVA y se suman los
    // impuestos (con el detalle por alícuota) y las percepciones; las filas suman el total
    const conA = Boolean(c.facturaA);
    $('[data-cantidad]').textContent = t.cantidad;
    $('[data-t-lista]').textContent = pesos(t.lista);
    $('[data-f-lista]').hidden = conA;
    $$('[data-f-a]').forEach((fila) => (fila.hidden = !conA));
    $('[data-f-campania]').hidden = !t.campania;
    $('[data-t-campania-nombre]').textContent = c.campania || 'Campaña';
    $('[data-t-campania]').textContent = `−${pesos(conA ? t.netoCampania : t.campania)}`;
    $('[data-f-descuento]').hidden = !t.descuento;
    $('[data-t-descuento]').textContent = `−${pesos(conA ? t.netoDescuento : t.descuento)}`;
    $('[data-t-total]').textContent = pesos(t.final);
    if (conA) {
      const iva = Object.entries(t.iva || {}).sort(([a], [b]) => a - b);
      $('[data-t-neto]').textContent = pesos(t.netoLista);
      $('[data-t-impuestos]').textContent = pesos(iva.reduce((suma, [, monto]) => suma + monto, 0));
      $('[data-t-iva]').innerHTML = iva
        .map(([alicuota, monto]) => `<div><dt>IVA ${String(alicuota).replace('.', ',')}%</dt><dd>${pesos(monto)}</dd></div>`)
        .join('');
      $('[data-t-percepciones]').textContent = pesos(t.percepciones);
    }

    $('[data-d-entrega]').textContent = c.entrega;
    $('[data-d-entrega-meta]').textContent = c.entregaMeta;
    $('[data-d-facturacion]').textContent = c.facturacion;
    $('[data-d-pago]').textContent = c.pagoTexto;

    $('[data-monto]').textContent = pesos(t.final);
    $('[data-monto] + [data-copiar]').dataset.copiar = String(Math.round(t.final));
    $('[data-monto-tarjeta]').textContent = pesos(c.financiado);
    $('[data-monto-pendiente]').textContent = pesos(c.financiado);
    $('[data-monto-nota]').textContent =
      c.cuotas === 1 ? 'En 1 pago' : `${c.cuotas} cuotas ${c.financiado > t.final ? '' : 'sin interés '}de ${pesos(c.financiado / c.cuotas)}`;
    $('[data-pago-tarjeta]').textContent = `${c.pagoTexto.replace(/ en \d+ cuotas de .*/, c.cuotas === 1 ? '' : ` en ${c.cuotas} cuotas`)}, con Mercado Pago.`;
  }

  if (compra?.items?.length) completar(compra);

  // ---------- Variante según el pago y la entrega ----------

  // Entrega: retiro, OCA 24 hs (llega el siguiente día hábil: no pasa por "24 a 48 hs") u OCA normal
  let entrega = compra ? (compra.retiro ? 'retiro' : /24 hs/.test(compra.entrega) ? 'oca24' : 'oca') : 'oca24';
  let pagoActual = compra?.pago || 'transferencia';
  const mail = (texto) => `<a href="mailto:pagos@maximus.com.ar?subject=Comprobante%20del%20pedido%20%23MAX-424105">${texto}</a>`;

  function pasosSigue(pago, lugar) {
    const lista = [];
    const acreditado = pago === 'tarjeta' ? '' : ' desde que se acredita el pago';
    if (pago === 'transferencia')
      lista.push(
        ['Hacé la transferencia', 'Por el total exacto, con los datos de arriba.'],
        ['Subí el comprobante dentro de las 24 hs', `Pasado ese tiempo se libera el stock. Subilo desde Mi cuenta o envialo a ${mail('pagos@maximus.com.ar')} con el número de pedido.`, true]
      );
    if (pago === 'pendiente') lista.push(['Esperá la acreditación', 'Mercado Pago está verificando los datos del pago. Te avisamos por correo cuando se acredite.']);
    if (lugar === 'oca24') lista.push(['Lo despachamos con OCA 24 hs', `Llega el siguiente día hábil${acreditado}. Te mandamos el número de guía para que lo sigas.`]);
    if (lugar === 'oca')
      lista.push(
        ['Preparamos tu pedido', `En 24 a 48 hs hábiles${acreditado}. Te avisamos por correo cuando sale.`],
        ['Lo despachamos con OCA', 'Llega en 4 días hábiles desde el despacho. Te mandamos el número de guía para que lo sigas.']
      );
    // Con el pago aprobado, el último paso es recibirlo (con transferencia o pendiente la lista ya es larga)
    if (lugar !== 'retiro' && pago === 'tarjeta') lista.push(['Lo recibís', 'En la dirección que elegiste. Lo podés seguir desde Mi cuenta o en Seguí tu pedido.']);
    if (lugar === 'retiro')
      lista.push(
        ['Preparamos tu pedido', `En 24 a 48 hs hábiles${acreditado}. Te avisamos por correo cuando esté listo.`],
        // Con tarjeta lo retira solo el titular; con transferencia puede retirar otra persona con autorización
        ['Esperá el correo para retirarlo', `No te acerques a retirar sin recibir antes el correo de confirmación.${pago === 'transferencia' ? '' : ' Lo retira el titular de la tarjeta, con la tarjeta y su DNI físico.'}`, false, pago === 'transferencia']
      );
    return lista;
  }

  // Los nombres de los estados son los de Mi cuenta
  const ESTADOS = {
    transferencia: ['estado--aviso', 'Pendiente de pago','Reservamos tus productos. Para completar la compra, transferí el total y subí el comprobante dentro de las 24 hs.'],
    tarjeta: ['estado--exito', 'Pago confirmado', 'Tu pago está aprobado y ya estamos con tu pedido.'],
    pendiente: ['estado--info', 'En verificación de datos','Mercado Pago está procesando tu pago. Apenas se acredite, preparamos tu pedido.'],
  };

  function ver(pago = pagoActual, lugar = entrega) {
    pagoActual = pago;
    entrega = lugar;
    $$('[data-variante]').forEach((n) => (n.hidden = n.dataset.variante !== pago));
    $$('[data-ver]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.ver === pago));
    $$('[data-ver-entrega]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.verEntrega === lugar));

    const [clase, texto, bajada] = ESTADOS[pago];
    const estado = $('[data-estado]');
    estado.className = `estado ${clase}`;
    estado.textContent = texto;
    $('[data-bajada]').innerHTML = `${bajada} Te mandamos todo a <strong>martin.gonzalez@correo.com</strong>.`;

    // Pasos del pedido: con el pago aprobado, el pedido pasa a preparación
    const actual = pago === 'tarjeta' ? 2 : 1;
    $$('[data-pasos] .seguimiento__paso').forEach((paso, i) => {
      paso.classList.toggle('seguimiento__paso--hecho', i < actual);
      paso.classList.toggle('seguimiento__paso--actual', i === actual);
      if (i === actual) paso.setAttribute('aria-current', 'step');
      else paso.removeAttribute('aria-current');
      const punto = paso.querySelector('.seguimiento__punto');
      punto.innerHTML = i < actual ? '<svg class="icono" aria-hidden="true"><use href="#i-check"/></svg>' : '';
      const fecha = paso.querySelector('small');
      if (i < actual && !fecha) paso.querySelector('.seguimiento__texto').insertAdjacentHTML('beforeend', '<small>17/10</small>');
      if (i >= actual) fecha?.remove();
    });
    const retiro = lugar === 'retiro';
    $('[data-paso-envio]').firstChild.textContent = retiro ? 'Para retirar' : 'En camino';
    $('[data-paso-final]').firstChild.textContent = retiro ? 'Retirado' : 'Entregado';

    // Sin compra guardada (vista previa), la entrega de la vista previa también cambia el detalle
    if (!compra) {
      const textos = {
        oca24: ['OCA 24 hs a domicilio · Av. Rivadavia 5420, piso 3, depto. B · C1406 Caballito, CABA', 'Llega el siguiente día hábil después de acreditado el pago'],
        oca: ['OCA Normal a domicilio · Av. Rivadavia 5420, piso 3, depto. B · C1406 Caballito, CABA', 'Llega en 4 días hábiles desde el despacho'],
        retiro: ['Retiro en Floresta · R. de Escalada de San Martín 3875, CABA', 'Lun a vie de 9 a 17 h · Sáb de 10 a 14 h · Sin costo'],
      };
      $('[data-d-entrega]').textContent = textos[lugar][0];
      $('[data-d-entrega-meta]').textContent = textos[lugar][1];
    }

    $('[data-sigue]').innerHTML = pasosSigue(pago, lugar)
      .map(
        ([titulo, texto, comprobante, otraPersona], i) => `<li class="sigue__paso"><span class="sigue__num">${i + 1}</span><div>
          <p class="sigue__titulo">${titulo}</p><p class="sigue__texto">${texto}</p>
          ${comprobante ? `<a class="boton boton--primario sigue__btn" href="mi-cuenta.html#pedidos">${icono('i-subir')}Subir comprobante</a>` : ''}
          ${otraPersona ? `<p class="sigue__extra">${icono('i-usuario')}<span><strong>¿Retira otra persona?</strong> Mandá la autorización a <a href="mailto:autorizaciones@maximus.com.ar?subject=Autorizaci%C3%B3n%20de%20retiro%20%23MAX-424105">autorizaciones@maximus.com.ar</a> con el DNI de los dos.</span></p>` : ''}
        </div></li>`
      )
      .join('');
  }

  ver(new URLSearchParams(location.search).get('pago') === 'pendiente' ? 'pendiente' : pagoActual);
  $$('[data-ver]').forEach((b) => b.addEventListener('click', () => ver(b.dataset.ver)));
  $$('[data-ver-entrega]').forEach((b) => b.addEventListener('click', () => ver(pagoActual, b.dataset.verEntrega)));

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
  // Sin festejo mientras el pago está pendiente
  if (compra?.festejada || pagoActual === 'pendiente') return;
  setTimeout(() => confeti($('[data-gracias-icono]')), 500);
  if (compra) {
    try {
      sessionStorage.setItem('compra', JSON.stringify({ ...compra, festejada: true }));
    } catch {}
  }
}
