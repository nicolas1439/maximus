// Seguimiento de pedido: busca por número de pedido (4 a 7 números) o de guía de OCA (19) y muestra el estado,
// los pasos del pedido y el historial del envío. Los pedidos son de muestra; en el sitio real los da el backend
// (hoy ya convierte el pedido en su guía) y el estado de la guía lo consulta a OCA desde el servidor.
// Sin JS el formulario recarga la página con ?n=numero; con JS se lee ese ?n= al entrar y se actualiza al buscar.

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

// Pedidos de muestra. paso: índice del paso actual (los anteriores están hechos); fechas: una por paso hecho o actual.
// eventos: del más nuevo al más viejo; origen OCA o Maximus.
const PEDIDOS = {
  422907: {
    fecha: '08/10/2026',
    estado: ['info', 'En camino'],
    titulo: 'Llega el jueves 15 de octubre',
    entrega: 'Envío a domicilio con OCA, 24 hs hábiles',
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
  423518: {
    fecha: '12/10/2026',
    estado: ['aviso', 'Esperando el pago'],
    titulo: 'Falta el comprobante de pago',
    entrega: 'Envío a domicilio con OCA, 24 hs hábiles',
    destino: 'Caballito, CABA',
    pendiente: true,
    pasos: PASOS_ENVIO,
    paso: 1,
    fechas: ['12/10', null],
    eventos: [['12/10', '19:02', 'Recibimos tu pedido', 'Maximus']],
  },
  418230: {
    fecha: '08/07/2026',
    estado: ['exito', 'Entregado'],
    titulo: 'Entregado el viernes 10 de julio',
    entrega: 'Envío a domicilio con OCA, 24 hs hábiles',
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
};

const GUIAS = Object.fromEntries(
  Object.entries(PEDIDOS).filter(([, p]) => p.guia).map(([numero, p]) => [p.guia, numero])
);

// 5746700000000398214 → 5746 7000 0000 0398 214 (más fácil de comparar con la etiqueta)
const agrupar = (guia) => guia.replace(/(\d{4})(?=\d)/g, '$1 ');

function pasosHtml(p, numero) {
  const items = p.pasos.map((nombre, i) => {
    const hecho = i < p.paso;
    const actual = i === p.paso;
    const clase = hecho ? ' seguimiento__paso--hecho' : actual ? ' seguimiento__paso--actual' : '';
    const fecha = p.fechas[i] ? `<small>${p.fechas[i]}</small>` : '';
    return `<li class="seguimiento__paso${clase}"${actual ? ' aria-current="step"' : ''}>`
      + `<span class="seguimiento__punto">${hecho ? icono('i-check', 'icono') : ''}</span>`
      + `<span class="seguimiento__texto">${nombre}${fecha}</span></li>`;
  });
  return `<ol class="seguimiento" aria-label="Pasos del pedido #MAX-${numero}">${items.join('')}</ol>`;
}

function datosHtml(p) {
  const filas = [['Entrega', p.entrega]];
  if (p.retiro) {
    filas.push(['Dónde', `${p.retiro.lugar}<br>${p.retiro.direccion}`], ['Horario', p.retiro.horario]);
  } else {
    filas.push(['Destino', p.destino]);
    filas.push(['Guía de OCA', p.guia
      ? `<span class="resultado__guia">${agrupar(p.guia)}</span><button class="boton-texto" type="button" data-copiar="${p.guia}">Copiar</button>`
      : '<span class="resultado__suave">Te la mandamos por mail cuando despachemos el pedido.</span>']);
  }
  return `<dl class="resultado__datos">${filas.map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`).join('')}</dl>`;
}

function historialHtml(p) {
  const eventos = p.eventos.map(([dia, hora, texto, origen]) =>
    `<li class="historial__evento"><p class="historial__texto">${texto}</p>`
    + `<p class="historial__meta"><time>${dia} · ${hora} h</time><span>${origen}</span></p></li>`);
  return `<section class="historial" aria-labelledby="historial-titulo">`
    + `<h3 class="historial__titulo" id="historial-titulo">Historial</h3>`
    + `<ol class="historial__lista">${eventos.join('')}</ol></section>`;
}

function render(numero) {
  const p = PEDIDOS[numero];
  const whatsapp = `${WHATSAPP}?text=${encodeURIComponent(`Hola Maximus, quiero consultar por mi pedido #MAX-${numero}.`)}`;

  const pendiente = p.pendiente
    ? `<div class="resultado__alerta">${icono('i-alerta', 'icono resultado__alerta-icono')}`
      + '<div><p><strong>Preparamos tu pedido cuando se acredite el pago.</strong></p>'
      + '<p>Si ya transferiste, subí el comprobante desde Mi cuenta.</p></div>'
      + `<a class="boton boton--primario" href="mi-cuenta.html#pedidos">${icono('i-subir')}Subir comprobante</a></div>`
    : '';

  const acciones = [
    p.guia ? `<a class="boton boton--secundario" href="${OCA}${p.guia}" target="_blank" rel="noopener">Ver en OCA${icono('i-flecha')}</a>` : '',
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
    ${pendiente}
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
    ayudaWhatsapp.href = `${WHATSAPP}?text=${encodeURIComponent(`Hola Maximus, quiero consultar por mi pedido #MAX-${numero}.`)}`;
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
