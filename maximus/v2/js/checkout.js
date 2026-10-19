// Carrito y checkout: un paso a la vista por vez (Carrito, Facturación, Entrega, Pago y Resumen), los ítems del
// carrito (cantidad, quitar), las opciones de cada paso con sus subpaneles, los totales (detalle de la compra,
// barra fija y carrito del header) y la revisión final. Todo de muestra: no se envía nada y "Confirmar compra"
// solo avisa. Sin JS se ven todos los pasos uno debajo del otro.
// Revisión final (tanda 3c): ingreso dentro del checkout, Factura A con alta de la empresa, domicilio por partes con
// errores por campo, estados del envío (cotizando, sin sucursales, falla, Tierra del Fuego, PC o producto grande,
// excede el tamaño), débito, interés de las cuotas, paso por Mercado Pago, pago no completado, error al grabar el
// pedido y la barra de variantes de la vista previa.

import { marcarError, validarCampos as validarCamposDe, iniciarCampos, cuitValido } from './campos.js';

const checkout = document.querySelector('.checkout');
if (checkout) iniciar();

function iniciar() {
  const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pesos = (n) => `$${Math.round(n).toLocaleString('es-AR')}`;
  const $ = (selector, raiz = document) => raiz.querySelector(selector);
  const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];
  const elegido = (nombre) => $(`input[name="${nombre}"]:checked`);

  const DESCUENTO_TRANSFERENCIA = 0.1; // el 10% del sitio por transferencia o depósito
  // Seguro de envío proporcional al valor de los productos ($12.917 sobre los $2.948.798 del carrito de muestra)
  const TASA_SEGURO = 12917 / 2948798;
  // Factura A, de muestra: IVA incluido en cada precio (data-iva, 21% si no se indica) y percepción de IIBB del 2%
  const PERCEPCION = 0.02;
  const total = { lista: 0, campania: 0, productos: 0, cantidad: 0, envio: 0, seguro: 0, descuento: 0, final: 0, neto: 0, iva: {}, percepciones: 0 };
  // Estado de la demostración (en el sitio real lo dan la sesión, el cliente y las respuestas del sistema)
  const demo = { sesion: true, fiscal: 'cf', envio: 'normal', errorGuardar: false, errorPedido: false };
  // La vista previa (sin el header) arranca con sesión; la página completa, según la sesión de muestra
  try { demo.sesion = Boolean(localStorage.getItem('sesion')) || !document.querySelector('.cabecera'); } catch {}

  // ---------- Aviso breve ----------

  const aviso = $('[data-aviso]');
  let avisoTemporizador;

  function avisar(texto, { error = false } = {}) {
    if (!aviso) return;
    aviso.textContent = texto;
    aviso.classList.toggle('aviso--error', error);
    aviso.classList.add('aviso--visible');
    clearTimeout(avisoTemporizador);
    avisoTemporizador = setTimeout(() => aviso.classList.remove('aviso--visible'), 2600);
  }

  // ---------- Pasos ----------

  const pasos = $$('[data-paso]', checkout).filter((p) => p.classList.contains('paso'));
  const nombres = pasos.map((p) => p.dataset.paso);
  const enlaces = $$('[data-pasos] .pasos__paso');
  let alcanzado = 0; // último paso al que se llegó: hasta ahí se puede volver desde el indicador
  let actual = 0;

  function mostrar(i, { desplazar = true } = {}) {
    actual = i;
    alcanzado = Math.max(alcanzado, i);
    pasos.forEach((p, j) => (p.hidden = j !== i));
    enlaces.forEach((li, j) => {
      li.classList.toggle('pasos__paso--hecho', j < i);
      if (j === i) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
      $('a', li).setAttribute('aria-disabled', j > alcanzado);
    });
    // En el último paso el botón del detalle pasa a ser "Confirmar compra" (pedido del usuario)
    const final = i === nombres.indexOf('resumen');
    checkout.classList.toggle('checkout--final', final);
    $('.resumen__continuar').hidden = final;
    $('.resumen__confirmar').hidden = !final;
    $('[data-legal]').hidden = !final;
    if (final) completarRevision();
    medirCabecera();
    actualizarBarra();
    // Sube hasta el título de la página, con el indicador de pasos a la vista debajo del header fijo
    if (desplazar) {
      // Alto del header completo: la fila principal con el buscador (si está escondido, su alto queda en el margen
      // inferior de la fila, header.css) y, en escritorio, la fila del menú (pegada debajo, aunque esté escondida:
      // al subir hasta acá vuelve a aparecer)
      const cabecera = $('.cabecera');
      const menu = $('.menu');
      const fijo = cabecera
        ? cabecera.offsetHeight +
          parseFloat(getComputedStyle(cabecera).marginBottom) +
          (menu && getComputedStyle(menu).position === 'sticky' ? menu.offsetHeight : 0)
        : 0;
      const tope = checkout.getBoundingClientRect().top + scrollY - fijo - 16;
      scrollTo({ top: Math.max(0, tope), behavior: movimientoReducido ? 'auto' : 'smooth' });
    }
  }

  // Alto de la cabecera del paso a la vista: en escritorio el detalle de la compra arranca debajo de ella,
  // a la altura del contenido (pedido del usuario, 15/10/2026)
  function medirCabecera() {
    const cab = $('.paso__cab', pasos[actual]);
    checkout.style.setProperty('--alto-cab', `${cab ? cab.offsetHeight : 0}px`);
  }
  addEventListener('resize', medirCabecera);

  function irA(nombre, opciones) {
    const i = nombres.indexOf(nombre);
    if (i < 0) return;
    // Por la URL no se puede saltar más allá del último paso alcanzado
    if (i > alcanzado) {
      history.replaceState(null, '', `#${nombres[alcanzado]}`);
      mostrar(alcanzado, opciones);
      return;
    }
    mostrar(i, opciones);
  }

  // Valida el paso actual; si falta algo, lo dice y no avanza
  function validar(i) {
    const paso = pasos[i];
    const error = $('[data-error]', paso);
    let mensaje = '';
    const nombre = nombres[i];

    if (nombre === 'carrito' && !items().length) mensaje = 'Tu carrito está vacío: agregá un producto para continuar.';
    if (nombre === 'facturacion') {
      if (!demo.sesion) mensaje = 'Ingresá o creá tu cuenta para continuar.';
      else if (elegido('facturacion')?.value === 'a') mensaje = 'Verificá el CUIT y completá los datos de la empresa. Después tocá "Dar de alta y continuar".';
    }
    if (nombre === 'entrega') {
      if (elegido('entrega')?.value === 'envio') {
        const nueva = elegido('direccion')?.value === 'nueva';
        if (nueva && !validarCampos('nueva')) mensaje = 'Revisá los datos de la dirección nueva.';
        else if (nueva && demo.errorGuardar) {
          $('[data-error-guardar]').hidden = false;
          mensaje = 'No se pudo guardar el domicilio.';
        } else if (demo.envio === 'cotizando') mensaje = 'Esperá a que termine la cotización del envío.';
        else if (demo.envio === 'falla') mensaje = 'No pudimos cotizar el envío: elegí otro código postal o retirá en tienda.';
        else if (demo.envio === 'tdf') mensaje = 'No hacemos envíos a Tierra del Fuego: elegí otra dirección o retirá en tienda.';
        else if (!elegido('modalidad')) mensaje = 'Elegí una modalidad de envío.';
        else if (elegido('modalidad').value === 'ocasucursal' && demo.envio === 'sin-sucursales') mensaje = 'No hay sucursales de OCA para tu código postal: elegí el envío a domicilio.';
        else if (elegido('modalidad').value === 'ocasucursal' && !$('[data-sucursal-campo]').value) mensaje = 'Elegí la sucursal de OCA donde retirar.';
      }
    }
    if (nombre === 'pago' && !elegido('pago')) mensaje = 'Elegí cómo querés pagar.';

    if (error) {
      error.textContent = mensaje;
      error.hidden = !mensaje;
    }
    return !mensaje;
  }

  // Campos con su error debajo (js/campos.js)
  const validarCampos = (grupo) => validarCamposDe(checkout, grupo);
  iniciarCampos(checkout, { alCambiar: () => actualizarDireccion() });

  function continuar() {
    if (!validar(actual)) return;
    if (actual + 1 < pasos.length) {
      history.pushState(null, '', `#${nombres[actual + 1]}`);
      mostrar(actual + 1);
    }
  }

  function volver() {
    if (actual > 0) {
      history.pushState(null, '', `#${nombres[actual - 1]}`);
      mostrar(actual - 1);
    }
  }

  $$('[data-continuar]').forEach((b) => b.addEventListener('click', continuar));
  $$('[data-volver]').forEach((b) => b.addEventListener('click', volver));

  // Último paso: de muestra, no se envía nada. Guarda lo elegido en sessionStorage y abre la página de compra
  // confirmada, que lo muestra (en el sitio real, el pedido lo crea el backend y la página lo trae de ahí)
  function confirmar() {
    completarRevision();
    // Error al grabar el pedido (de muestra): el carrito queda como estaba
    const errorPedido = $('[data-error-pedido]');
    if (demo.errorPedido) {
      errorPedido.hidden = false;
      errorPedido.scrollIntoView({ block: 'center', behavior: movimientoReducido ? 'auto' : 'smooth' });
      demo.errorPedido = false; // de muestra, el siguiente intento sale bien
      return;
    }
    errorPedido.hidden = true;
    const pago = elegido('pago')?.value;
    const cuotas = elegido('cuotas');
    const n = Number(cuotas?.value || 1);
    const financiado = total.final * Number(cuotas?.dataset.factor || 1);
    const compra = {
      items: items().map((item) => ({
        nombre: $('.item__nombre', item).textContent.trim(),
        marca: $('.item__marca', item).textContent.trim(),
        foto: $('img', item)?.getAttribute('src') || '',
        enlace: $('.item__nombre a', item).getAttribute('href'),
        cantidad: Number($('input', item).value) || 1,
        precio: Number(item.dataset.precio),
      })),
      retiro: elegido('entrega')?.value === 'retiro',
      entrega: $('[data-revision-entrega]').textContent,
      entregaMeta: $('[data-revision-entrega-meta]').textContent,
      facturacion: $('[data-revision-facturacion]').textContent,
      pago: pago === 'transferencia' ? 'transferencia' : 'tarjeta',
      pagoTexto: $('[data-revision-pago]').textContent,
      cuotas: n,
      financiado,
      total: { ...total },
      campania: items().find((i) => i.dataset.campania)?.dataset.campania || '',
    };
    try {
      sessionStorage.setItem('compra', JSON.stringify(compra));
    } catch {}
    // Con tarjeta, el pago sigue en Mercado Pago: aviso de redirección y, de muestra, la vuelta con el pago aprobado
    const dialogoMp = $('[data-dialogo-mp]');
    if (pago === 'mercadopago' && dialogoMp) {
      dialogoMp.showModal();
      setTimeout(() => (location.href = 'compra-confirmada.html'), 1800);
      return;
    }
    location.href = 'compra-confirmada.html';
  }
  $$('[data-confirmar]').forEach((b) => b.addEventListener('click', confirmar));

  // Enlaces internos (indicador de pasos y "Editar" del resumen): cambian el paso sin saltar
  checkout.addEventListener('click', (e) => {
    const enlace = e.target.closest('a[href^="#"]');
    if (!enlace || !nombres.includes(enlace.hash.slice(1))) return;
    e.preventDefault();
    if (enlace.getAttribute('aria-disabled') === 'true') return;
    history.pushState(null, '', enlace.hash);
    irA(enlace.hash.slice(1));
  });

  addEventListener('popstate', () => irA(location.hash.slice(1) || nombres[0]));

  // ---------- Carrito: ítems ----------

  const lista = $('[data-items]');
  const items = () => $$('[data-item]', lista).filter((item) => !item.hidden);

  function actualizarItem(item) {
    const cantidad = Number($('input', item).value) || 1;
    const precio = Number(item.dataset.precio);
    const lista = Number(item.dataset.lista) || 0; // precio de lista, solo con campaña
    if (item.matches('[data-regalo]')) return; // el regalo queda fijo: $0 y su precio de lista
    $('[data-item-total]', item).textContent = pesos(precio * cantidad);
    const antes = $('[data-item-antes]', item);
    antes.hidden = !lista;
    if (lista) antes.innerHTML = `<span class="sr-only">Precio de lista: </span>${pesos(lista * cantidad)}`;
    const unitario = $('[data-item-unitario]', item);
    unitario.textContent = `${pesos(precio)} c/u`;
    unitario.hidden = cantidad < 2;
  }

  $$('[data-cantidad]').forEach((caja) => {
    const campo = $('input', caja);
    const menos = $('[data-paso="-1"]', caja);
    const mas = $('[data-paso="1"]', caja);
    const minimo = Number(campo.min) || 1;
    const maximo = Number(campo.max) || 99;

    function fijar(valor) {
      const n = Math.min(maximo, Math.max(minimo, Math.round(valor) || minimo));
      campo.value = n;
      menos.disabled = n <= minimo;
      mas.disabled = n >= maximo;
      actualizarItem(caja.closest('[data-item]'));
      actualizarTotales();
    }

    menos.addEventListener('click', () => fijar(Number(campo.value) - 1));
    mas.addEventListener('click', () => fijar(Number(campo.value) + 1));
    campo.addEventListener('change', () => fijar(Number(campo.value)));
    fijar(Number(campo.value));
  });

  // Quitar: el ítem se desvanece y se saca; si era el último, queda el carrito vacío
  lista?.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-quitar]');
    if (!boton) return;
    const item = boton.closest('[data-item]');
    const sacar = () => {
      item.remove();
      const vacio = !items().length;
      $('[data-vacio]').hidden = !vacio;
      $$('[data-con-items]').forEach((n) => (n.hidden = vacio));
      actualizarTotales();
      avisar('Producto quitado del carrito');
      // Sin productos no hay compra: se esconde el detalle y los pasos siguientes dejan de estar al alcance
      if (vacio) {
        $('.resumen').hidden = true;
        alcanzado = 0;
        mostrar(0, { desplazar: false });
      }
    };
    if (movimientoReducido) sacar();
    else {
      item.classList.add('item--saliendo');
      item.addEventListener('transitionend', sacar, { once: true });
    }
  });

  // ---------- Opciones y subpaneles ----------

  // Cada grupo de radios muestra el subpanel de la opción elegida (data-<grupo>="valor") y esconde el resto
  function sincronizar(grupo) {
    const valor = elegido(grupo)?.value;
    $$(`[data-${grupo}]`, checkout).forEach((panel) => {
      if (panel.classList.contains('paso')) return;
      panel.hidden = panel.dataset[grupo] !== valor;
    });
  }

  // Factura A: cliente responsable inscripto a su nombre, o una empresa (vinculada o nueva)
  function facturaA() {
    const f = elegido('facturacion')?.value;
    return f === 'vinculada' || f === 'a' || (f === 'b' && demo.fiscal === 'ri');
  }

  function sincronizarTodo() {
    sincronizar('facturacion');
    $('[data-empresa]').hidden = elegido('facturacion')?.value !== 'a';
    $('[data-aviso-a]').hidden = !facturaA();
    $('[data-sello-a]').hidden = demo.fiscal !== 'ri';
    sincronizar('entrega');
    $('[data-sucursal]').hidden = elegido('modalidad')?.value !== 'ocasucursal';
    sincronizar('pago');
    $('[data-nota-retiro]').hidden = elegido('entrega')?.value !== 'retiro';
    // Débito: un único pago, sin la grilla de cuotas
    const debito = elegido('tarjeta')?.value === 'debito';
    $('[data-debito]').hidden = !debito;
    $('[data-cuotas]').hidden = debito;
    if (debito) $('input[name="cuotas"][value="1"]').checked = true;
    actualizarDireccion();
  }

  // ---------- Dirección de entrega ----------
  // Una tarjeta con la dirección elegida; "Cambiar" despliega las guardadas y "Agregar" abre el formulario de una
  // nueva (su radio está oculto). El texto de la nueva se arma con lo que se escribe.

  const listaDirecciones = $('[data-lista-direcciones]');
  const formDireccion = $('[data-direccion-nueva]');
  const btnCambiar = $('[data-cambiar-direccion]');
  const btnAgregar = $('[data-agregar-direccion]');

  function textoDireccionNueva() {
    const numero = $('[data-nueva-numero]');
    const calle = [$('[data-nueva-calle]').value.trim(), numero.disabled ? 'S/N' : numero.value.trim()].filter(Boolean).join(' ');
    const cp = $('[data-nueva-cp]').value.trim();
    const localidad = $('[data-nueva-localidad]').value.trim();
    return [calle, [cp && `C${cp}`, localidad].filter(Boolean).join(' ')].filter(Boolean).join(' · ') || 'Completá los datos de abajo';
  }

  function actualizarDireccion() {
    const radio = elegido('direccion');
    if (!radio) return;
    const nueva = radio.value === 'nueva';
    const detalle = nueva ? textoDireccionNueva() : radio.dataset.texto;
    $('[data-direccion-nombre]').innerHTML = nueva ? radio.dataset.nombre : $('.opcion__titulo', radio.closest('.opcion')).innerHTML;
    $$('[data-direccion-detalle]').forEach((n) => (n.textContent = detalle));
    formDireccion.hidden = !nueva;
    btnAgregar.setAttribute('aria-expanded', nueva);
  }

  btnCambiar?.addEventListener('click', () => {
    const abrir = listaDirecciones.hidden;
    listaDirecciones.hidden = !abrir;
    btnCambiar.setAttribute('aria-expanded', abrir);
  });

  btnAgregar?.addEventListener('click', () => {
    $('input[value="nueva"]', formDireccion).checked = true;
    listaDirecciones.hidden = true;
    btnCambiar.setAttribute('aria-expanded', false);
    actualizarDireccion();
    $('[data-nueva-calle]').focus();
  });

  // Elegida una guardada, la lista se cierra
  listaDirecciones?.addEventListener('change', () => {
    listaDirecciones.hidden = true;
    btnCambiar.setAttribute('aria-expanded', false);
  });

  $('[data-usar-guardada]')?.addEventListener('click', () => {
    $('input[name="direccion"]', listaDirecciones).checked = true;
    actualizarDireccion();
  });

  formDireccion?.addEventListener('input', actualizarDireccion);

  checkout.addEventListener('change', (e) => {
    if (!e.target.matches('input[type="radio"], select')) return;
    sincronizarTodo();
    actualizarTotales();
    const error = $('[data-error]', pasos[actual]);
    if (error) error.hidden = true;
  });

  // Foto del producto en el detalle; el regalo, que no tiene, lleva su ícono
  function miniatura(item) {
    const foto = $('img', item)?.getAttribute('src');
    return foto
      ? `<img src="${foto}" alt="" width="600" height="600">`
      : '<span class="resumen__icono"><svg class="icono icono--s" aria-hidden="true"><use href="#i-regalo"/></svg></span>';
  }

  // ---------- Totales ----------

  function calcular() {
    total.lista = 0;
    total.productos = 0;
    total.cantidad = 0;
    items().forEach((item) => {
      const n = Number($('input', item).value) || 1;
      const precio = Number(item.dataset.precio);
      total.lista += (Number(item.dataset.lista) || precio) * n;
      total.productos += precio * n;
      total.cantidad += n;
    });
    total.campania = total.lista - total.productos; // descuento de campaña (precio de lista menos precio)
    const envio = elegido('entrega')?.value === 'envio' ? elegido('modalidad') : null;
    total.envio = envio ? Number(envio.dataset.costo) : 0;
    total.seguro = envio ? Math.round(total.productos * TASA_SEGURO) : 0;
    const transferencia = elegido('pago')?.value === 'transferencia';
    const bruto = total.productos + total.envio + total.seguro; // el 10% va sobre todo el pedido, envío y seguro incluidos
    total.descuento = transferencia ? Math.round(bruto * DESCUENTO_TRANSFERENCIA) : 0;
    total.final = bruto - total.descuento;
    // Factura A (de muestra): el mismo total separado en neto e IVA por alícuota, más la percepción de IIBB
    total.iva = {};
    total.neto = 0;
    total.percepciones = 0;
    if (facturaA()) {
      const factor = total.final / (bruto || 1); // el descuento por transferencia se reparte en todo
      const sumar = (monto, alicuota) => {
        const neto = (monto * factor) / (1 + alicuota / 100);
        total.neto += neto;
        total.iva[alicuota] = (total.iva[alicuota] || 0) + monto * factor - neto;
      };
      items().forEach((item) => sumar(Number(item.dataset.precio) * (Number($('input', item).value) || 1), Number(item.dataset.iva) || 21));
      sumar(total.envio + total.seguro, 21);
      total.percepciones = Math.round(total.neto * PERCEPCION);
      total.final += total.percepciones;
    }
  }

  function actualizarTotales() {
    calcular();
    const ahorro = Math.round((total.productos + total.envio + total.seguro) * DESCUENTO_TRANSFERENCIA);
    const entrega = elegido('entrega')?.value;
    const modalidad = elegido('modalidad');
    const pago = elegido('pago')?.value;
    const cuotas = elegido('cuotas');

    // Detalle de la compra
    const itemsResumen = $('[data-resumen-items]');
    // El envío y su seguro (o el retiro) van como un ítem más, recién cuando se eligió cómo recibir el pedido.
    // Ícono genérico en el lugar de la foto hasta tener sus imágenes desde el sistema.
    const extra = (icono, texto, monto) =>
      `<li><span class="resumen__icono"><svg class="icono icono--s" aria-hidden="true"><use href="#${icono}"/></svg></span><span>${texto}</span><strong>${monto}</strong></li>`;
    let extras = '';
    if (entrega === 'envio' && modalidad) extras = extra('i-envio', modalidad.dataset.texto, pesos(total.envio)) + extra('i-garantia', 'Seguro de envío', pesos(total.seguro));
    else if (entrega === 'retiro') extras = extra('i-tienda', elegido('retiro')?.dataset.texto || 'Retiro en tienda', 'Gratis');
    itemsResumen.innerHTML =
      items()
        .map((item) => {
          const n = Number($('input', item).value) || 1;
          return `<li>${miniatura(item)}<span>${item.dataset.nombre}<small> × ${n}</small></span><strong>${item.matches('[data-regalo]') ? 'Regalo' : pesos(Number(item.dataset.precio) * n)}</strong></li>`;
        })
        .join('') + extras;

    $('[data-total-cantidad]').textContent = total.cantidad;
    $('[data-total-lista]').textContent = pesos(total.lista);
    $('[data-fila-campania]').hidden = !total.campania;
    $('[data-campania-nombre]').textContent = items().find((i) => i.dataset.campania)?.dataset.campania || 'Campaña';
    $('[data-total-campania]').textContent = `−${pesos(total.campania)}`;
    $('[data-fila-descuento]').hidden = !total.descuento;
    $('[data-total-descuento]').textContent = `−${pesos(total.descuento)}`;
    // Varias campañas o promos a la vez: una sola línea con lo que descuentan entre todas
    if (new Set(items().filter((i) => i.dataset.campania || i.dataset.lista).map((i) => i.dataset.campania || 'promo')).size > 1) $('[data-campania-nombre]').textContent = 'Campañas y promociones';
    // Factura A: neto, impuestos (con el detalle por alícuota) y percepciones
    const conA = facturaA();
    $$('[data-fila-a]').forEach((fila) => (fila.hidden = !conA));
    if (conA) {
      [$('[data-total-lista]').parentElement, $('[data-fila-campania]')].forEach((fila) => (fila.hidden = true));
      $('[data-fila-descuento]').hidden = true;
      const impuestos = Object.values(total.iva).reduce((a, b) => a + b, 0);
      $('[data-total-neto]').textContent = pesos(total.neto);
      $('[data-total-impuestos]').textContent = pesos(impuestos);
      $('[data-detalle-impuestos]').innerHTML = Object.entries(total.iva)
        .sort(([a], [b]) => a - b)
        .map(([alicuota, monto]) => `<div><dt>IVA ${String(alicuota).replace('.', ',')}%</dt><dd>${pesos(monto)}</dd></div>`)
        .join('');
      $('[data-total-percepciones]').textContent = pesos(total.percepciones);
    } else $('[data-total-lista]').parentElement.hidden = false;
    $$('[data-total]').forEach((n) => (n.textContent = pesos(total.final)));
    $$('[data-ahorro]').forEach((n) => (n.textContent = n.matches('.opcion__precio') ? `Ahorrás ${pesos(ahorro)}` : pesos(ahorro)));

    // Nota bajo el total: el descuento por transferencia o el plan de cuotas, recién cuando se eligió el pago
    const nota = $('[data-resumen-nota]');
    if (pago === 'transferencia') nota.innerHTML = `Incluye el 10% de descuento por transferencia: <strong>ahorrás ${pesos(total.descuento)}</strong>.`;
    else if (pago === 'mercadopago' && cuotas) {
      const n = Number(cuotas.value);
      const financiado = total.final * Number(cuotas.dataset.factor);
      nota.innerHTML = n === 1 ? 'En 1 pago con tarjeta.' : `<strong>${n} cuotas de ${pesos(financiado / n)}</strong>${financiado > total.final ? ` · Total financiado ${pesos(financiado)}` : ' sin interés'}.`;
    } else nota.innerHTML = '';
    nota.hidden = !nota.innerHTML;

    // Interés de las cuotas: fila "Interés financiero" y "Total financiado" en el detalle
    const financiadoTotal = pago === 'mercadopago' && cuotas ? total.final * Number(cuotas.dataset.factor) : total.final;
    const interes = Math.round(financiadoTotal - total.final);
    $$('[data-fila-interes]').forEach((fila) => (fila.hidden = interes <= 0));
    $('[data-total-interes]').textContent = pesos(interes);
    $('[data-total-financiado]').textContent = pesos(financiadoTotal);
    $('[data-seguro-texto]').textContent = pesos(Math.round(total.productos * TASA_SEGURO));

    // Cuotas: el valor de cada una sobre el total con tarjeta, y el plan elegido
    $$('.cuota', checkout).forEach((cuota) => {
      const radio = $('input', cuota);
      const n = Number(radio.value);
      const financiado = total.final * Number(radio.dataset.factor);
      $('[data-cuota-valor]', cuota).textContent = pesos(financiado / n);
    });
    if (cuotas) {
      const n = Number(cuotas.value);
      const financiado = total.final * Number(cuotas.dataset.factor);
      $('[data-plan-nombre]').textContent = n === 1 ? '1 pago' : `${n} cuotas${Number(cuotas.dataset.factor) === 1 ? ' sin interés' : ''}`;
      $('[data-plan-cuota]').textContent = pesos(financiado / n);
      $('[data-plan-total]').textContent = pesos(financiado);
      const interesPlan = Math.round(financiado - total.final);
      $('[data-plan-fila-interes]').hidden = interesPlan <= 0;
      $('[data-plan-interes]').textContent = `${pesos(interesPlan)} (${Math.round((Number(cuotas.dataset.factor) - 1) * 100)}%)`;
    }

    // Barra fija y carrito del header
    const barraNota = $('[data-barra-nota]');
    if (barraNota) barraNota.textContent = `${total.cantidad} ${total.cantidad === 1 ? 'producto' : 'productos'}`;
    const carritoHeader = $('.carrito');
    if (carritoHeader) {
      $('.carrito__cant', carritoHeader).textContent = total.cantidad;
      $('.carrito__total', carritoHeader).textContent = pesos(total.productos);
      carritoHeader.setAttribute('aria-label', `Carrito: ${total.cantidad} productos, ${pesos(total.productos)}`);
    }
  }

  // ---------- Revisión final ----------

  function completarRevision() {
    $('[data-revision-items]').innerHTML = items()
      .map((item) => {
        const n = Number($('input', item).value) || 1;
        const precio = Number(item.dataset.precio);
        return `<li>${miniatura(item)}<span>${item.dataset.nombre}<small>${precio ? `${n} × ${pesos(precio)}` : 'Viene con tu compra'}</small></span><strong>${precio ? pesos(precio * n) : 'Regalo'}</strong></li>`;
      })
      .join('');

    const entrega = elegido('entrega')?.value;
    if (entrega === 'retiro') {
      const lugar = elegido('retiro');
      $('[data-revision-entrega]').textContent = lugar.dataset.texto;
      $('[data-revision-entrega-meta]').textContent = `${lugar.dataset.plazo} · Sin costo`;
    } else {
      const modalidad = elegido('modalidad');
      const sucursal = $('[data-sucursal-campo]').value;
      const destino = modalidad?.value === 'ocasucursal' ? `Sucursal OCA ${sucursal}` : $('[data-direccion-detalle]').textContent;
      $('[data-revision-entrega]').textContent = `${modalidad?.dataset.texto} · ${destino}`;
      $('[data-revision-entrega-meta]').textContent = `${modalidad?.dataset.plazo} · ${pesos(total.envio)} más ${pesos(total.seguro)} de seguro`;
    }

    const facturacion = elegido('facturacion')?.value;
    $('[data-revision-facturacion]').textContent =
      facturacion === 'vinculada'
        ? `Factura A a nombre de ${$('[data-vinculada-nombre]').textContent} · CUIT ${$('[data-vinculada-cuit]').textContent}`
        : facturacion === 'a'
          ? `Factura A a nombre de ${$('[data-razon-social]').value.trim() || 'la empresa'}`
          : demo.fiscal === 'ri'
            ? 'Factura A a nombre de Martín González · CUIT 20-34567890-6'
            : 'Factura B a nombre de Martín González';

    const pago = elegido('pago')?.value;
    if (pago === 'transferencia') {
      $('[data-revision-pago]').textContent = 'Transferencia o depósito bancario';
      $('[data-revision-pago-meta]').textContent = `Con el 10% de descuento: ahorrás ${pesos(total.descuento)}. Los datos bancarios aparecen al confirmar.`;
    } else {
      const cuotas = elegido('cuotas');
      const n = Number(cuotas?.value || 1);
      const financiado = total.final * Number(cuotas?.dataset.factor || 1);
      const tipo = elegido('tarjeta')?.value === 'debito' ? 'débito' : 'crédito';
      $('[data-revision-pago]').textContent = n === 1 ? `Tarjeta de ${tipo} en 1 pago` : `Tarjeta de ${tipo} en ${n} cuotas de ${pesos(financiado / n)}`;
      $('[data-revision-pago-meta]').textContent = `Con Mercado Pago${financiado > total.final ? ` · Total financiado ${pesos(financiado)}` : ' · Sin interés'}`;
    }
  }

  // ---------- Barra fija (celular y tablet) ----------
  // Aparece cuando el botón del pie del paso actual queda abajo, fuera de la vista

  const barra = $('[data-barra]');
  const barraBtn = $('[data-barra-btn]');
  let observador;

  function actualizarBarra() {
    if (!barra) return;
    observador?.disconnect();
    // En el último paso sigue al botón "Confirmar compra" del detalle, que queda al pie
    const final = pasos[actual].dataset.paso === 'resumen';
    const boton = final ? $('.resumen__confirmar') : $('.paso__continuar', pasos[actual]);
    if (!boton) {
      barra.classList.remove('checkout__barra--visible');
      return;
    }
    barraBtn.textContent = '';
    barraBtn.append(...[...boton.childNodes].map((n) => n.cloneNode(true)));
    observador = new IntersectionObserver(
      ([entrada]) =>
        barra.classList.toggle('checkout__barra--visible', !entrada.isIntersecting && entrada.boundingClientRect.top > 0),
      { threshold: 0 }
    );
    observador.observe(boton);
  }

  barraBtn?.addEventListener('click', () => (pasos[actual].dataset.paso === 'resumen' ? confirmar() : continuar()));

  // ---------- Sesión: ingresar dentro del checkout ----------
  // Sin sesión, el paso de facturación pide ingresar o crear la cuenta; al ingresar se queda en el paso con el carrito

  function verSesion() {
    $('[data-sin-sesion-checkout]').hidden = demo.sesion;
    $('[data-con-sesion-checkout]').hidden = !demo.sesion;
    // Sin sesión, el paso es solo el ingreso: sin "Continuar" y con su propia bajada
    const paso = $('#facturacion');
    $('.paso__pie', paso).hidden = !demo.sesion;
    $('.paso__bajada', paso).textContent = demo.sesion ? 'Confirmá a nombre de quién se hace esta compra.' : 'Ingresá o creá tu cuenta para seguir con la compra.';
    if (pasos[actual] === paso) actualizarBarra();
  }

  const formIngreso = $('[data-ingreso-checkout]');
  formIngreso?.addEventListener('submit', (e) => {
    e.preventDefault();
    const correo = formIngreso.elements.correo;
    const clave = formIngreso.elements.clave;
    const error = $('[data-ingreso-error]');
    const vacio = !correo.value.trim() || !clave.value;
    // De muestra: con "error" en el correo, el error del sitio
    const mal = !vacio && correo.value.toLowerCase().includes('error');
    error.hidden = !(vacio || mal);
    error.textContent = vacio ? 'Ingresá tu correo y tu contraseña.' : 'Correo o contraseña incorrectos.';
    [correo, clave].forEach((c) => c.setAttribute('aria-invalid', String(vacio ? !c.value.trim() : mal)));
    if (vacio || mal) return;
    try { localStorage.setItem('sesion', 'muestra'); } catch {}
    demo.sesion = true;
    verSesion();
    $('[data-error]', pasos[actual]).hidden = true;
    avisar('¡Hola de nuevo, Martín!');
  });

  // Mostrar la contraseña
  $$('[data-ver-clave]').forEach((boton) =>
    boton.addEventListener('click', () => {
      const campo = $('input', boton.closest('.clave'));
      const ver = campo.type === 'password';
      campo.type = ver ? 'text' : 'password';
      boton.setAttribute('aria-pressed', String(ver));
      boton.setAttribute('aria-label', ver ? 'Ocultar contraseña' : 'Mostrar contraseña');
    })
  );

  // ---------- Factura A: verificar el CUIT y dar de alta la empresa ----------

  const campoCuit = $('[data-cuit]');
  const formatoCuit = (c) => `${c.slice(0, 2)}-${c.slice(2, 10)}-${c.slice(10)}`;

  $('[data-verificar-cuit]')?.addEventListener('click', async (e) => {
    const boton = e.currentTarget;
    const cuit = campoCuit.value.replace(/\D/g, '');
    const registrado = $('[data-cuit-registrado]');
    const datos = $('[data-empresa-datos]');
    registrado.hidden = true;
    datos.hidden = true;
    if (!cuitValido(cuit)) {
      marcarError(campoCuit, 'El CUIT no es válido: revisá los 11 números.');
      campoCuit.focus();
      return;
    }
    marcarError(campoCuit, '');
    campoCuit.value = formatoCuit(cuit);
    boton.classList.add('cargando');
    boton.disabled = true;
    await new Promise((listo) => setTimeout(listo, 600));
    boton.classList.remove('cargando');
    boton.disabled = false;
    if (cuit.startsWith('33')) {
      registrado.hidden = false;
      return;
    }
    // Válido: el sistema completa razón social y condición fiscal (de muestra) y quedan bloqueadas
    $('[data-razon-social]').value = 'Distribuidora Andina SRL';
    $('[data-condicion-fiscal]').value = 'Responsable inscripto';
    datos.hidden = false;
    $('[data-campo="calle"]', datos).focus();
  });

  campoCuit?.addEventListener('input', () => {
    $('[data-empresa-datos]').hidden = true;
    $('[data-cuit-registrado]').hidden = true;
  });

  // Alta: valida cada campo; la empresa queda vinculada a la cuenta y elegida para esta compra
  $('[data-alta-empresa]')?.addEventListener('click', () => {
    if (!validarCampos('a')) return;
    const vinculada = $('[data-empresa-vinculada]');
    $('[data-vinculada-nombre]').textContent = $('[data-razon-social]').value;
    $('[data-vinculada-cuit]').textContent = campoCuit.value;
    vinculada.hidden = false;
    $('input', vinculada).checked = true;
    $('[data-texto-otra-empresa]').textContent = 'Agregar otra empresa';
    sincronizarTodo();
    actualizarTotales();
    avisar('Empresa dada de alta y vinculada a tu cuenta');
    continuar();
  });

  // ---------- Entrega: estados de la cotización y errores del domicilio ----------

  function verEnvio() {
    const estado = demo.envio;
    const cotizado = !['cotizando', 'falla', 'tdf'].includes(estado);
    $$('[data-estado-envio]').forEach((el) => (el.hidden = el.dataset.estadoEnvio === 'cotizado' ? !cotizado : el.dataset.estadoEnvio !== estado));
    $('[data-cp-cotizado]').textContent = 'C1406';
    // PC armada o producto grande: sin 24 hs. Excede el tamaño: 24 hs con el aviso del costo adicional
    const rapido = $('input[name="modalidad"][value="oca24"]');
    rapido.closest('.opcion').hidden = estado === 'grande';
    if (estado === 'grande' && rapido.checked) rapido.checked = false;
    $('[data-nota-grande]').hidden = estado !== 'grande';
    $('[data-nota-excede]').hidden = estado !== 'excede';
    // Sin sucursales para el código postal
    const sinSucursales = estado === 'sin-sucursales';
    $('[data-sin-sucursales]').hidden = !sinSucursales;
    $('[data-sucursal-campo]').closest('.campo').hidden = sinSucursales;
    actualizarTotales();
  }

  $('[data-otro-cp]')?.addEventListener('click', () => {
    btnAgregar.click();
    $('[data-nueva-cp]').focus();
  });
  $('[data-elegir-retiro]')?.addEventListener('click', () => {
    $('input[name="entrega"][value="retiro"]').checked = true;
    sincronizarTodo();
    actualizarTotales();
  });
  $('[data-editar-domicilio]')?.addEventListener('click', () => {
    $('[data-error-domicilio]').hidden = true;
    btnCambiar.click();
  });

  // ---------- Pago no completado (vuelta de Mercado Pago) ----------

  function verPagoNoCompletado() {
    $('[data-alerta-pago]').hidden = false;
  }
  $('[data-ir-pago]')?.addEventListener('click', () => {
    $('[data-alerta-pago]').hidden = true;
    llegarA('pago');
  });

  // Lleva a un paso completando lo mínimo de los anteriores (para las variantes y la vuelta de Mercado Pago)
  function llegarA(nombre) {
    if (!demo.sesion) {
      demo.sesion = true;
      verSesion();
    }
    if (!elegido('modalidad') && demo.envio !== 'grande') $('input[name="modalidad"][value="oca24"]').checked = true;
    if (!elegido('modalidad')) $('input[name="modalidad"][value="ocanormal"]').checked = true;
    if (nombres.indexOf(nombre) > nombres.indexOf('pago') && !elegido('pago')) $('input[name="pago"][value="transferencia"]').checked = true;
    sincronizarTodo();
    actualizarTotales();
    alcanzado = Math.max(alcanzado, nombres.indexOf(nombre));
    history.pushState(null, '', `#${nombre}`);
    mostrar(nombres.indexOf(nombre));
  }

  // ---------- Variantes de muestra (vista previa: data-demo) ----------

  const promo = (si) => {
    $$('[data-solo-promo]').forEach((el) => (el.hidden = !si));
    // La memoria con la promo en pesos: −$10.000 por unidad sobre su precio de lista
    const memoria = $$('[data-item]', lista).find((i) => i.dataset.nombre.startsWith('Memoria'));
    if (memoria) {
      if (si) {
        memoria.dataset.lista = String(Number(memoria.dataset.precio) + 10000);
        memoria.dataset.campania = 'Combo Kingston';
      } else {
        delete memoria.dataset.lista;
        delete memoria.dataset.campania;
      }
      actualizarItem(memoria);
    }
  };

  const VARIANTES = {
    sesion: (v) => {
      demo.sesion = v === 'con';
      verSesion();
    },
    fiscal: (v) => {
      demo.fiscal = v;
      $$('[data-solo-fiscal]').forEach((el) => (el.hidden = !el.dataset.soloFiscal.split(' ').includes(v)));
      if (v !== 'vinculada' && elegido('facturacion')?.value === 'vinculada') $('input[name="facturacion"][value="b"]').checked = true;
      $('[data-texto-otra-empresa]').textContent = v === 'vinculada' ? 'Agregar otra empresa' : 'A nombre de una empresa';
      sincronizarTodo();
    },
    carrito: (v) => promo(v === 'promo'),
    envio: (v) => {
      demo.envio = v;
      verEnvio();
    },
  };

  $$('[data-variante]').forEach((boton) =>
    boton.addEventListener('click', () => {
      const [grupoVariante, valor] = boton.dataset.variante.split(':');
      $$(`[data-variante^="${grupoVariante}:"]`).forEach((b) => b.setAttribute('aria-pressed', String(b === boton)));
      VARIANTES[grupoVariante]?.(valor);
      actualizarTotales();
      $$('[data-error]').forEach((error) => (error.hidden = true));
    })
  );

  const ERRORES = {
    domicilio: () => {
      llegarA('entrega');
      $('[data-error-domicilio]').hidden = false;
    },
    guardar: () => {
      demo.errorGuardar = true;
      llegarA('entrega');
      btnAgregar.click();
      avisar('Completá la dirección nueva y tocá Continuar: no se va a poder guardar');
    },
    pago: () => {
      verPagoNoCompletado();
      llegarA('carrito');
    },
    pedido: () => {
      demo.errorPedido = true;
      llegarA('resumen');
      avisar('Tocá "Confirmar compra" para ver el error');
    },
  };
  $$('[data-error-checkout]').forEach((boton) => boton.addEventListener('click', () => ERRORES[boton.dataset.errorCheckout]()));

  // ---------- Arranque ----------

  checkout.classList.add('checkout--js');
  verSesion();
  $$('[data-variante="sesion:sin"]').forEach((b) => b.setAttribute('aria-pressed', String(!demo.sesion)));
  $$('[data-variante="sesion:con"]').forEach((b) => b.setAttribute('aria-pressed', String(demo.sesion)));
  if (new URLSearchParams(location.search).get('pago') === 'no-completado') verPagoNoCompletado();
  sincronizarTodo();
  actualizarTotales();
  const inicial = nombres.indexOf(location.hash.slice(1));
  // Sin recorrido previo, el único paso alcanzable es el primero
  if (inicial > 0) history.replaceState(null, '', '#carrito');
  mostrar(0, { desplazar: false });
}
