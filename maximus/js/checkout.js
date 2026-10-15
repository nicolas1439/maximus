// Carrito y checkout: un paso a la vista por vez (Carrito, Facturación, Entrega, Pago y Resumen), los ítems del
// carrito (cantidad, quitar), las opciones de cada paso con sus subpaneles, los totales (detalle de la compra,
// barra fija y carrito del header) y la revisión final. Todo de muestra: no se envía nada y "Confirmar compra"
// solo avisa. Sin JS se ven todos los pasos uno debajo del otro.

const checkout = document.querySelector('.checkout');
if (checkout) iniciar();

function iniciar() {
  const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pesos = (n) => `$${Math.round(n).toLocaleString('es-AR')}`;
  const $ = (selector, raiz = document) => raiz.querySelector(selector);
  const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];
  const elegido = (nombre) => $(`input[name="${nombre}"]:checked`);

  const DESCUENTO_TRANSFERENCIA = 0.1; // el 10% del sitio por transferencia o depósito
  const total = { lista: 0, campania: 0, productos: 0, cantidad: 0, envio: 0, seguro: 0, descuento: 0, final: 0 };

  // ---------- Aviso breve ----------

  const aviso = $('[data-aviso]');
  let avisoTemporizador;

  function avisar(texto) {
    if (!aviso) return;
    aviso.textContent = texto;
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
    if (nombre === 'facturacion' && elegido('facturacion')?.value === 'a') mensaje = faltante(paso, 'a') ? 'Completá los datos de la empresa.' : '';
    if (nombre === 'entrega') {
      if (elegido('entrega')?.value === 'envio') {
        if (elegido('direccion')?.value === 'nueva' && faltante(paso, 'nueva')) mensaje = 'Completá la dirección nueva.';
        else if (!elegido('modalidad')) mensaje = 'Elegí una modalidad de envío.';
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

  // Primer campo requerido vacío de un grupo (data-requerido="grupo"), y le da el foco
  function faltante(paso, grupo) {
    const campo = $$(`[data-requerido="${grupo}"]`, paso).find((c) => !c.value.trim());
    campo?.focus();
    return campo;
  }

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

  // Último paso: de muestra, no confirma nada
  const confirmar = () => avisar('Vista previa: acá se confirmaría la compra');
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
  const items = () => $$('[data-item]', lista);

  function actualizarItem(item) {
    const cantidad = Number($('input', item).value) || 1;
    const precio = Number(item.dataset.precio);
    const lista = Number(item.dataset.lista) || 0; // precio de lista, solo con campaña
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

  function sincronizarTodo() {
    sincronizar('facturacion');
    $('[data-empresa]').hidden = elegido('facturacion')?.value !== 'a';
    sincronizar('entrega');
    $('[data-sucursal]').hidden = elegido('modalidad')?.value !== 'ocasucursal';
    sincronizar('pago');
    $('[data-nota-retiro]').hidden = elegido('entrega')?.value !== 'retiro';
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
    const calle = $('[data-nueva-calle]').value.trim();
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
    total.seguro = envio ? Number(envio.dataset.seguro) : 0;
    const transferencia = elegido('pago')?.value === 'transferencia';
    total.descuento = transferencia ? Math.round(total.productos * DESCUENTO_TRANSFERENCIA) : 0;
    total.final = total.productos + total.envio + total.seguro - total.descuento;
  }

  function actualizarTotales() {
    calcular();
    const ahorro = Math.round(total.productos * DESCUENTO_TRANSFERENCIA);
    const entrega = elegido('entrega')?.value;
    const modalidad = elegido('modalidad');
    const pago = elegido('pago')?.value;
    const cuotas = elegido('cuotas');

    // Detalle de la compra
    const itemsResumen = $('[data-resumen-items]');
    // El envío y su seguro (o el retiro) van como un ítem más, recién cuando se eligió cómo recibir el pedido.
    // Ícono genérico en el lugar de la foto hasta tener sus imágenes desde el sistema.
    const extra = (icono, texto, monto) =>
      `<li><span class="resumen__icono"><svg class="icono icono--s" aria-hidden="true"><use href="recursos/iconos.svg?v=2#${icono}"/></svg></span><span>${texto}</span><strong>${monto}</strong></li>`;
    let extras = '';
    if (entrega === 'envio' && modalidad) extras = extra('i-envio', modalidad.dataset.texto, pesos(total.envio)) + extra('i-garantia', 'Seguro de envío', pesos(total.seguro));
    else if (entrega === 'retiro') extras = extra('i-tienda', elegido('retiro')?.dataset.texto || 'Retiro en tienda', 'Gratis');
    itemsResumen.innerHTML =
      items()
        .map((item) => {
          const n = Number($('input', item).value) || 1;
          const foto = $('img', item).getAttribute('src');
          return `<li><img src="${foto}" alt="" width="600" height="600"><span>${item.dataset.nombre}<small> × ${n}</small></span><strong>${pesos(Number(item.dataset.precio) * n)}</strong></li>`;
        })
        .join('') + extras;

    $('[data-total-cantidad]').textContent = total.cantidad;
    $('[data-total-lista]').textContent = pesos(total.lista);
    $('[data-fila-campania]').hidden = !total.campania;
    $('[data-campania-nombre]').textContent = items().find((i) => i.dataset.campania)?.dataset.campania || 'Campaña';
    $('[data-total-campania]').textContent = `−${pesos(total.campania)}`;
    $('[data-fila-descuento]').hidden = !total.descuento;
    $('[data-total-descuento]').textContent = `−${pesos(total.descuento)}`;
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
        const foto = $('img', item).getAttribute('src');
        return `<li><img src="${foto}" alt="" width="600" height="600"><span>${item.dataset.nombre}<small>${n} × ${pesos(precio)}</small></span><strong>${pesos(precio * n)}</strong></li>`;
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

    const empresa = elegido('facturacion')?.value === 'a';
    $('[data-revision-facturacion]').textContent = empresa
      ? `Factura A a nombre de ${$('[data-empresa] input').value.trim() || 'la empresa'}`
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
    ).observe(boton);
  }

  barraBtn?.addEventListener('click', () => (pasos[actual].dataset.paso === 'resumen' ? confirmar() : continuar()));

  // ---------- Arranque ----------

  checkout.classList.add('checkout--js');
  sincronizarTodo();
  actualizarTotales();
  const inicial = nombres.indexOf(location.hash.slice(1));
  // Sin recorrido previo, el único paso alcanzable es el primero
  if (inicial > 0) history.replaceState(null, '', '#carrito');
  mostrar(0, { desplazar: false });
}
