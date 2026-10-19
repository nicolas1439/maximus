// Seguimiento de pedido: busca por número de pedido (4 a 7 números) o de guía de OCA (19) y muestra el estado,
// los pasos del pedido y el historial del envío. Los pedidos son de muestra; en el sitio real los da el backend
// (hoy ya convierte el pedido en su guía) y el estado de la guía lo consulta a OCA desde el servidor.
// Sin JS el formulario recarga la página con ?n=numero; con JS se lee ese ?n= al entrar y se actualiza al buscar.
// Estados de muestra (tanda 3d): esperando el pago, en preparación y para retirar (Florida y Floresta), guía sin
// movimientos, en camino, OCA no responde, visita fallida, en sucursal de OCA, devuelto a Maximus, entregado y cancelado.

const icono = (id, clase = 'icono icono--s') =>
  `<svg class="${clase}" aria-hidden="true"><use href="#${id}"/></svg>`;

const WHATSAPP = 'https://wa.me/541123575522';
const OCA = 'https://www.oca.com.ar/Seguimiento/Paquetes/';

// Pasos del pedido (los mismos de Mi cuenta). En retiro, los dos últimos cambian de nombre
const PASOS_ENVIO = ['Confirmado', 'Pago', 'Preparación', 'En camino', 'Entregado'];
const PASOS_RETIRO = ['Confirmado', 'Pago', 'Preparación', 'Para retirar', 'Retirado'];

const RETIRO_FLORESTA = {
  lugar: 'Oficinas de Maximus, Floresta',
  direccion: 'R. de Escalada de San Martín 3875, CABA',
  horario: 'Lun a vie de 9 a 17 h<br>Sáb de 10 a 14 h',
  mapa: 'https://www.google.com/maps/search/?api=1&query=R.+de+Escalada+de+San+Mart%C3%ADn+3875,+CABA',
};

const RETIRO_FLORIDA = {
  lugar: 'Local y showroom de Florida',
  direccion: 'Florida 537, Local 379 (PB), Galería Jardín, CABA',
  horario: 'Lun a vie de 10 a 19 h<br>Sáb de 10 a 14:30 h',
  mapa: 'https://www.google.com/maps/search/?api=1&query=Florida+537,+CABA',
};

const ENVIO_24 = 'Envío a domicilio con OCA, 24 hs hábiles';

// Pedidos de muestra. paso: índice del paso actual (los anteriores están hechos); fechas: una por paso hecho o actual.
// eventos: del más nuevo al más viejo; origen OCA o Maximus. Un evento sin día ni hora es uno que todavía no llegó
// (guía sin movimientos, OCA no responde). alerta: lo que el cliente tiene que saber o hacer, con su tono y su acción
// (comprobante, oca, reintentar, coordinar). cancelado: los pasos apagados y sin paso actual; detenido: el paso
// actual quieto, en ámbar (el envío no avanza). sucursal: el envío va a una sucursal de OCA (en lugar del destino).
const PEDIDOS = {
  // Pago pendiente: falta el comprobante (el de Mi cuenta)
  423518: {
    fecha: '12/10/2026',
    estado: ['aviso', 'Esperando el pago'],
    titulo: 'Falta el comprobante de pago',
    entrega: ENVIO_24,
    destino: 'Caballito, CABA',
    alerta: {
      tono: 'aviso',
      titulo: 'Preparamos tu pedido cuando se acredite el pago.',
      texto: 'Si ya transferiste, subí el comprobante desde Mi cuenta.',
      accion: 'comprobante',
    },
    pasos: PASOS_ENVIO,
    paso: 1,
    fechas: ['12/10', null],
    eventos: [['12/10', '19:02', 'Recibimos tu pedido', 'Maximus']],
  },
  // Retiro en Florida, todavía en preparación: hay que esperar el correo de que está listo
  423731: {
    fecha: '15/10/2026',
    estado: ['exito', 'Pago confirmado'],
    titulo: 'Lo estamos preparando',
    entrega: 'Retiro sin cargo',
    retiro: RETIRO_FLORIDA,
    alerta: {
      tono: 'info',
      icono: 'i-mail',
      titulo: 'Esperá el correo para pasar a buscarlo',
      texto: 'Te lo mandamos cuando el pedido esté preparado, facturado y listo en el local: 24 a 48 hs hábiles desde la confirmación del pago.',
    },
    pasos: PASOS_RETIRO,
    paso: 2,
    fechas: ['15/10', '15/10', '16/10'],
    eventos: [
      ['16/10', '09:40', 'Estamos preparando tu pedido', 'Maximus · Florida'],
      ['15/10', '12:51', 'Pago aprobado', 'Maximus'],
      ['15/10', '12:48', 'Recibimos tu pedido', 'Maximus'],
    ],
  },
  // Retiro en Floresta, listo
  423640: {
    fecha: '14/10/2026',
    estado: ['exito', 'Para retirar'],
    titulo: 'Ya podés retirarlo',
    entrega: 'Retiro sin cargo',
    retiro: RETIRO_FLORESTA,
    pasos: PASOS_RETIRO,
    paso: 3,
    fechas: ['14/10', '14/10', '15/10', '15/10'],
    eventos: [
      ['15/10', '11:30', 'Tu pedido está listo para retirar', 'Maximus · Floresta'],
      ['15/10', '10:05', 'Preparamos tu pedido', 'Maximus'],
      ['14/10', '16:48', 'Pago aprobado', 'Maximus'],
      ['14/10', '16:45', 'Recibimos tu pedido', 'Maximus'],
    ],
  },
  // Despachado, con la guía todavía sin movimientos en OCA (despachado el viernes: llega el lunes)
  423705: {
    fecha: '15/10/2026',
    estado: ['info', 'Despachado'],
    titulo: 'Llega el lunes 19 de octubre',
    entrega: ENVIO_24,
    destino: 'Villa Crespo, CABA',
    guia: '5746700000000403527',
    alerta: {
      tono: 'info',
      icono: 'i-reloj',
      titulo: 'La guía todavía no tiene movimientos',
      texto: 'Es normal: OCA los informa cuando procesa el paquete y pueden tardar unas horas en aparecer. Volvé a mirar más tarde.',
    },
    pasos: PASOS_ENVIO,
    paso: 3,
    fechas: ['15/10', '15/10', '15/10', '16/10'],
    eventos: [
      [null, null, 'Esperando el primer movimiento de OCA', 'OCA'],
      ['16/10', '11:30', 'Despachamos tu pedido', 'Maximus'],
      ['15/10', '15:40', 'Preparamos tu pedido', 'Maximus'],
      ['15/10', '09:15', 'Pago aprobado', 'Maximus'],
      ['15/10', '09:12', 'Recibimos tu pedido', 'Maximus'],
    ],
  },
  // En camino (el de Mi cuenta)
  422907: {
    fecha: '08/10/2026',
    estado: ['info', 'En camino'],
    titulo: 'Llega el jueves 15 de octubre',
    entrega: ENVIO_24,
    destino: 'Caballito, CABA',
    guia: '5746700000000398214',
    pasos: PASOS_ENVIO,
    paso: 3,
    fechas: ['08/10', '08/10', '09/10', '13/10'],
    eventos: [
      ['14/10', '08:12', 'Llegó a la sucursal de OCA de destino', 'OCA · Sucursal Caballito'],
      ['13/10', '15:10', 'OCA retiró tu envío', 'OCA'],
      ['13/10', '11:40', 'Despachamos tu pedido', 'Maximus'],
      ['09/10', '17:05', 'Preparamos tu pedido', 'Maximus'],
      ['08/10', '10:24', 'Pago aprobado', 'Maximus'],
      ['08/10', '10:22', 'Recibimos tu pedido', 'Maximus'],
    ],
  },
  // OCA no responde: se ve lo que sabe Maximus, sin los movimientos de la guía
  423622: {
    fecha: '14/10/2026',
    estado: ['info', 'Despachado'],
    titulo: 'Lo despachamos el jueves 15 de octubre',
    entrega: ENVIO_24,
    destino: 'Belgrano, CABA',
    guia: '5746700000000402118',
    alerta: {
      tono: 'error',
      titulo: 'OCA no responde en este momento',
      texto: 'No pudimos traer los movimientos del envío. Probá de nuevo en unos minutos o miralos en la web de OCA.',
      accion: ['oca', 'reintentar'],
    },
    pasos: PASOS_ENVIO,
    paso: 3,
    fechas: ['14/10', '14/10', '14/10', '15/10'],
    eventos: [
      [null, null, 'Los movimientos de OCA no están disponibles por ahora', 'OCA'],
      ['15/10', '11:15', 'Despachamos tu pedido', 'Maximus'],
      ['14/10', '17:30', 'Preparamos tu pedido', 'Maximus'],
      ['14/10', '11:01', 'Pago aprobado', 'Maximus'],
      ['14/10', '10:58', 'Recibimos tu pedido', 'Maximus'],
    ],
  },
  // Visita fallida: OCA vuelve a intentar (hasta 3 visitas)
  423589: {
    fecha: '13/10/2026',
    estado: ['aviso', 'Visita fallida'],
    titulo: 'OCA no pudo entregar tu pedido',
    entrega: ENVIO_24,
    destino: 'Ramos Mejía, Buenos Aires',
    guia: '5746700000000401762',
    alerta: {
      tono: 'aviso',
      titulo: 'Visita 1 de 3: no había nadie en el domicilio',
      texto: 'OCA vuelve a intentarlo el siguiente día hábil y solo entrega a alguien que esté en esa dirección. Si no puede entregarlo en 3 visitas, el paquete pasa a la sucursal de OCA más cercana.',
    },
    pasos: PASOS_ENVIO,
    paso: 3,
    fechas: ['13/10', '13/10', '13/10', '14/10'],
    eventos: [
      ['15/10', '13:10', 'Visita 1 de 3: no había nadie en el domicilio', 'OCA · Sucursal Ramos Mejía'],
      ['15/10', '08:50', 'Salió a visita a domicilio', 'OCA · Sucursal Ramos Mejía'],
      ['15/10', '07:30', 'Llegó a la sucursal de OCA de destino', 'OCA · Sucursal Ramos Mejía'],
      ['14/10', '15:45', 'OCA retiró tu envío', 'OCA'],
      ['14/10', '11:20', 'Despachamos tu pedido', 'Maximus'],
      ['13/10', '16:30', 'Preparamos tu pedido', 'Maximus'],
      ['13/10', '09:44', 'Pago aprobado', 'Maximus'],
      ['13/10', '09:40', 'Recibimos tu pedido', 'Maximus'],
    ],
  },
  // Envío a sucursal de OCA (la modalidad Normal a sucursal del checkout), listo para retirar
  423602: {
    fecha: '13/10/2026',
    estado: ['exito', 'Para retirar en OCA'],
    titulo: 'Ya podés retirarlo en OCA',
    entrega: 'Envío a sucursal de OCA',
    sucursal: 'Sucursal de OCA Flores, CABA',
    guia: '5746700000000401905',
    alerta: {
      tono: 'info',
      icono: 'i-sucursal',
      titulo: 'Lo retira el titular de la compra',
      texto: 'Con su DNI y, si pagó con tarjeta, la tarjeta. La dirección y el horario de la sucursal están en OCA. Si no se retira a tiempo, vuelve a Maximus y el nuevo envío corre por tu cuenta.',
    },
    pasos: PASOS_RETIRO,
    paso: 3,
    fechas: ['13/10', '13/10', '14/10', '16/10'],
    eventos: [
      ['16/10', '10:40', 'Llegó a la sucursal de OCA: ya podés retirarlo', 'OCA · Sucursal Flores'],
      ['14/10', '15:45', 'OCA retiró tu envío', 'OCA'],
      ['14/10', '12:40', 'Despachamos tu pedido', 'Maximus'],
      ['14/10', '10:15', 'Preparamos tu pedido', 'Maximus'],
      ['13/10', '11:27', 'Pago aprobado', 'Maximus'],
      ['13/10', '11:25', 'Recibimos tu pedido', 'Maximus'],
    ],
  },
  // Devuelto a Maximus: 3 visitas sin entregar y no se retiró de la sucursal de OCA
  421386: {
    fecha: '28/09/2026',
    estado: ['aviso', 'Devuelto a Maximus'],
    titulo: 'Tu pedido volvió a Maximus',
    entrega: ENVIO_24,
    destino: 'Villa Urquiza, CABA',
    guia: '5746700000000387340',
    alerta: {
      tono: 'aviso',
      titulo: 'OCA no pudo entregarlo en 3 visitas',
      texto: 'Tampoco se retiró a tiempo de la sucursal de OCA, así que volvió a nuestro depósito. Escribinos para coordinar un nuevo envío: corre por tu cuenta, con una nueva factura.',
      accion: 'coordinar',
    },
    pasos: PASOS_ENVIO,
    paso: 3,
    detenido: true,
    fechas: ['28/09', '28/09', '28/09', '29/09'],
    eventos: [
      ['14/10', '10:40', 'Tu pedido volvió a nuestro depósito', 'Maximus'],
      ['13/10', '15:20', 'OCA lo devolvió a Maximus: no se retiró de la sucursal', 'OCA · Sucursal Villa Urquiza'],
      ['02/10', '17:30', 'Quedó en la sucursal de OCA para retirar', 'OCA · Sucursal Villa Urquiza'],
      ['02/10', '13:05', 'Visita 3 de 3: no había nadie en el domicilio', 'OCA · Sucursal Villa Urquiza'],
      ['01/10', '12:20', 'Visita 2 de 3: no había nadie en el domicilio', 'OCA · Sucursal Villa Urquiza'],
      ['30/09', '11:45', 'Visita 1 de 3: no había nadie en el domicilio', 'OCA · Sucursal Villa Urquiza'],
      ['30/09', '07:40', 'Llegó a la sucursal de OCA de destino', 'OCA · Sucursal Villa Urquiza'],
      ['29/09', '15:30', 'OCA retiró tu envío', 'OCA'],
      ['29/09', '11:10', 'Despachamos tu pedido', 'Maximus'],
      ['28/09', '17:20', 'Preparamos tu pedido', 'Maximus'],
      ['28/09', '10:06', 'Pago aprobado', 'Maximus'],
      ['28/09', '10:03', 'Recibimos tu pedido', 'Maximus'],
    ],
  },
  // Entregado
  418230: {
    fecha: '08/07/2026',
    estado: ['exito', 'Entregado'],
    titulo: 'Entregado el viernes 10 de julio',
    entrega: ENVIO_24,
    destino: 'Caballito, CABA',
    guia: '5746700000000351776',
    pasos: PASOS_ENVIO,
    paso: 5,
    fechas: ['08/07', '08/07', '08/07', '08/07', '10/07'],
    eventos: [
      ['10/07', '12:31', 'OCA entregó tu envío', 'OCA'],
      ['10/07', '09:02', 'Salió a visita a domicilio', 'OCA · Sucursal Caballito'],
      ['09/07', '07:45', 'Llegó a la sucursal de OCA de destino', 'OCA · Sucursal Caballito'],
      ['08/07', '16:20', 'OCA retiró tu envío', 'OCA'],
      ['08/07', '12:10', 'Despachamos tu pedido', 'Maximus'],
      ['08/07', '09:15', 'Pago aprobado', 'Maximus'],
      ['08/07', '09:12', 'Recibimos tu pedido', 'Maximus'],
    ],
  },
  // Cancelado antes de confirmarse el pago (en el sitio real, el motivo lo da el backend)
  423571: {
    fecha: '13/10/2026',
    estado: ['error', 'Cancelado'],
    titulo: 'Pedido cancelado',
    entrega: ENVIO_24,
    destino: 'Palermo, CABA',
    guiaNota: 'No se generó: el pedido se canceló antes del despacho.',
    alerta: {
      tono: 'error',
      titulo: 'Cancelaste este pedido el martes 13 de octubre',
      texto: 'Si ya habías pagado, pedí la devolución desde el <a href="centro-de-ayuda.html#contacto">Centro de ayuda</a> o escribinos por WhatsApp.',
    },
    pasos: PASOS_ENVIO,
    paso: 1,
    cancelado: true,
    fechas: ['13/10'],
    eventos: [
      ['13/10', '18:40', 'Cancelaste el pedido', 'Maximus'],
      ['13/10', '10:15', 'Recibimos tu pedido', 'Maximus'],
    ],
  },
};

const GUIAS = Object.fromEntries(
  Object.entries(PEDIDOS).filter(([, p]) => p.guia).map(([numero, p]) => [p.guia, numero])
);

// 5746700000000398214 → 5746 7000 0000 0398 214 (más fácil de comparar con la etiqueta)
const agrupar = (guia) => guia.replace(/(\d{4})(?=\d)/g, '$1 ');

const whatsappDe = (texto) => `${WHATSAPP}?text=${encodeURIComponent(texto)}`;

function pasosHtml(p, numero) {
  const items = p.pasos.map((nombre, i) => {
    const hecho = i < p.paso;
    // Cancelado: sin paso actual (el pedido no sigue)
    const actual = !p.cancelado && i === p.paso;
    const clase = hecho ? ' seguimiento__paso--hecho' : actual ? ' seguimiento__paso--actual' : '';
    const fecha = p.fechas[i] ? `<small>${p.fechas[i]}</small>` : '';
    return `<li class="seguimiento__paso${clase}"${actual ? ' aria-current="step"' : ''}>`
      + `<span class="seguimiento__punto">${hecho ? icono('i-check', 'icono') : ''}</span>`
      + `<span class="seguimiento__texto">${nombre}${fecha}</span></li>`;
  });
  const clase = p.cancelado ? ' seguimiento--cancelado' : p.detenido ? ' seguimiento--detenido' : '';
  const rotulo = `Pasos del pedido #MAX-${numero}${p.cancelado ? ' (cancelado)' : ''}`;
  return `<ol class="seguimiento${clase}" aria-label="${rotulo}">${items.join('')}</ol>`;
}

function datosHtml(p) {
  const filas = [['Entrega', p.entrega]];
  if (p.retiro) {
    filas.push(['Dónde', `${p.retiro.lugar}<br>${p.retiro.direccion}`], ['Horario', p.retiro.horario]);
  } else {
    // Envío a sucursal de OCA: la sucursal en lugar del destino (dirección y horario, en OCA)
    filas.push(p.sucursal ? ['Dónde', p.sucursal] : ['Destino', p.destino]);
    filas.push(['Guía de OCA', p.guia
      ? `<span class="resultado__guia">${agrupar(p.guia)}</span><button class="boton-texto" type="button" data-copiar="${p.guia}">Copiar</button>`
      : `<span class="resultado__suave">${p.guiaNota || 'Te la mandamos por mail cuando despachemos el pedido.'}</span>`]);
  }
  return `<dl class="resultado__datos">${filas.map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`).join('')}</dl>`;
}

// Un evento sin día ni hora todavía no llegó: va arriba, con el punto punteado y sin hora
function historialHtml(p) {
  const eventos = p.eventos.map(([dia, hora, texto, origen]) => (dia
    ? `<li class="historial__evento"><p class="historial__texto">${texto}</p>`
      + `<p class="historial__meta"><time>${dia} · ${hora} h</time><span>${origen}</span></p></li>`
    : `<li class="historial__evento historial__evento--pendiente"><p class="historial__texto">${texto}</p>`
      + `<p class="historial__meta"><span>${origen}</span></p></li>`));
  return `<section class="historial" aria-labelledby="historial-titulo">`
    + `<h3 class="historial__titulo" id="historial-titulo">Historial</h3>`
    + `<ol class="historial__lista">${eventos.join('')}</ol></section>`;
}

// Alerta del resultado (.alerta de base.css): qué pasa y qué hacer. Con una sola acción, desde tablet va a la derecha
const ICONO_ALERTA = { info: 'i-reloj', aviso: 'i-alerta', error: 'i-alerta', exito: 'i-check' };

function alertaHtml(p, numero) {
  const a = p.alerta;
  if (!a) return '';
  const botones = {
    comprobante: `<a class="boton boton--primario" href="mi-cuenta.html#pedidos">${icono('i-subir')}Subir comprobante</a>`,
    oca: `<a class="boton boton--primario" href="${OCA}${p.guia}" target="_blank" rel="noopener">Ver en OCA${icono('i-flecha')}</a>`,
    reintentar: `<button class="boton boton--secundario" type="button" data-reintentar="${numero}">${icono('i-recargar')}Volver a intentar</button>`,
    coordinar: `<a class="boton boton--primario" href="${whatsappDe(`Hola Maximus, mi pedido #MAX-${numero} volvió a Maximus y quiero coordinar un nuevo envío.`)}" target="_blank" rel="noopener">${icono('i-whatsapp')}Coordinar por WhatsApp</a>`,
  };
  const acciones = [a.accion || []].flat().map((clave) => botones[clave]);
  const lado = acciones.length === 1 ? ' resultado__alerta--lado' : '';
  return `<div class="alerta alerta--${a.tono} resultado__alerta${lado}">`
    + icono(a.icono || ICONO_ALERTA[a.tono], 'icono')
    + `<div class="alerta__cuerpo"><p class="alerta__titulo">${a.titulo}</p><p>${a.texto}</p></div>`
    + (acciones.length ? `<div class="alerta__acciones">${acciones.join('')}</div>` : '')
    + '</div>';
}

function render(numero) {
  const p = PEDIDOS[numero];
  const whatsapp = whatsappDe(`Hola Maximus, quiero consultar por mi pedido #MAX-${numero}.`);
  // "Ver en OCA" va en el pie, salvo que ya esté en la alerta (OCA no responde)
  const ocaEnAlerta = [p.alerta?.accion || []].flat().includes('oca');

  const acciones = [
    p.guia && !ocaEnAlerta ? `<a class="boton boton--secundario" href="${OCA}${p.guia}" target="_blank" rel="noopener">Ver en OCA${icono('i-flecha')}</a>` : '',
    p.retiro ? `<a class="boton boton--secundario" href="${p.retiro.mapa}" target="_blank" rel="noopener">${icono('i-sucursal')}Cómo llegar</a>` : '',
    `<a class="boton boton--secundario" href="${whatsapp}" target="_blank" rel="noopener">${icono('i-whatsapp')}Consultar</a>`,
  ].join('');

  const nota = p.guia ? 'Los datos del envío los informa OCA y pueden tardar unas horas en actualizarse.' : '';

  return `<header class="resultado__cab">
      <div>
        <p class="resultado__pedido">Pedido #MAX-${numero} · ${p.fecha}</p>
        <h2 class="resultado__titulo" id="resultado-titulo" tabindex="-1">${p.titulo}</h2>
      </div>
      <span class="estado estado--${p.estado[0]}">${p.estado[1]}</span>
    </header>
    ${alertaHtml(p, numero)}
    ${pasosHtml(p, numero)}
    ${datosHtml(p)}
    ${historialHtml(p)}
    <footer class="resultado__pie">
      ${nota ? `<p class="resultado__nota">${nota}</p>` : ''}
      <div class="resultado__acciones">${acciones}</div>
    </footer>`;
}

const form = document.querySelector('[data-consulta]');

if (form) {
  const campo = form.elements.n;
  const boton = form.querySelector('.consulta__boton');
  const error = form.querySelector('.consulta__error');
  const resultado = document.querySelector('[data-resultado]');
  const ayudaWhatsapp = document.querySelector('[data-whatsapp]');
  const aviso = document.querySelector('[data-aviso]');
  let avisoTemporizador;

  const mostrarError = (texto) => {
    error.querySelector('[data-error]').textContent = texto;
    error.hidden = !texto;
    campo.setAttribute('aria-invalid', String(Boolean(texto)));
  };

  // Valida, "consulta" (una espera corta, como la del pedido real al servidor) y muestra el resultado
  const buscar = async (valor, { enfocar = true } = {}) => {
    // Acepta el pedido con o sin "MAX-" (y con #, espacios o guiones)
    const n = valor.replace(/^\s*#?\s*max/i, '').replace(/[\s#.-]/g, '');
    campo.value = n;
    let texto = '';
    if (!n) texto = 'Ingresá el número de pedido o el de guía.';
    else if (!/^\d+$/.test(n) || !(n.length === 19 || (n.length >= 4 && n.length <= 7))) {
      texto = 'Revisá el número: el de pedido tiene 6 números (con o sin MAX-) y el de guía, 19.';
    }
    if (texto) {
      mostrarError(texto);
      resultado.hidden = true;
      campo.focus();
      return;
    }

    mostrarError('');
    boton.setAttribute('aria-busy', 'true');
    boton.disabled = true;
    await new Promise((listo) => setTimeout(listo, 450));
    boton.removeAttribute('aria-busy');
    boton.disabled = false;

    const numero = n.length === 19 ? GUIAS[n] : PEDIDOS[n] && n;
    if (!numero) {
      mostrarError(n.length === 19
        ? 'No encontramos esa guía entre nuestros envíos. Revisá el número.'
        : 'No encontramos un pedido con ese número. Revisalo o escribinos por WhatsApp.');
      resultado.hidden = true;
      campo.focus();
      return;
    }

    resultado.innerHTML = render(numero);
    resultado.hidden = false;
    ayudaWhatsapp.href = whatsappDe(`Hola Maximus, quiero consultar por mi pedido #MAX-${numero}.`);
    history.replaceState(null, '', `?n=${n}`);
    if (enfocar) {
      const titulo = resultado.querySelector('.resultado__titulo');
      titulo.focus({ preventScroll: true });
      resultado.scrollIntoView({ block: 'start' });
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    buscar(campo.value);
  });

  campo.addEventListener('input', () => {
    if (!error.hidden) mostrarError('');
  });

  document.querySelectorAll('[data-muestra]').forEach((b) =>
    b.addEventListener('click', () => buscar(b.dataset.muestra)));

  // Volver a intentar (OCA no responde): la ruedita en el botón mientras se vuelve a consultar
  resultado.addEventListener('click', (e) => {
    const reintentar = e.target.closest('[data-reintentar]');
    if (!reintentar) return;
    reintentar.classList.add('cargando');
    reintentar.setAttribute('aria-busy', 'true');
    reintentar.disabled = true;
    buscar(reintentar.dataset.reintentar);
  });

  // Copiar la guía
  resultado.addEventListener('click', async (e) => {
    const copiar = e.target.closest('[data-copiar]');
    if (!copiar) return;
    try {
      await navigator.clipboard.writeText(copiar.dataset.copiar);
      aviso.textContent = 'Número de guía copiado';
    } catch {
      aviso.textContent = 'No se pudo copiar el número';
    }
    aviso.classList.add('aviso--visible');
    clearTimeout(avisoTemporizador);
    avisoTemporizador = setTimeout(() => aviso.classList.remove('aviso--visible'), 2200);
  });

  // Enlace directo (?n=numero): desde Mi cuenta o al recargar
  const inicial = new URLSearchParams(location.search).get('n');
  if (inicial) buscar(inicial, { enfocar: false });
}
