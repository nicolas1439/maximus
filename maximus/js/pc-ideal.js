// Tu PC ideal: embudo en 3 pasos como el de maximus.com.ar (categoría → uso → presupuesto) y el resultado, con las PC
// del uso elegido de menor a mayor potencia (niveles Entrada a Tope), "Ver especificaciones" y "Agregar al carrito".
// Categorías, usos, niveles y textos son los del sitio. Cada uso tiene 5 PC, elegidas entre las armadas del home
// (datos de muestra) y las Powered by MSI del sitio (nombres y precios del 17/10/2026); en el sitio real el backend
// trae las 5 de cada uso, con stock y suplentes. El paso queda en la URL (#elegir/gaming/juegos-livianos/hasta).

const raiz = document.querySelector('[data-elegir]');
if (raiz) iniciar();

function iniciar() {
  const $ = (s, r = raiz) => r.querySelector(s);
  const $$ = (s, r = raiz) => [...r.querySelectorAll(s)];
  const pesos = (n) => `$${Math.round(n).toLocaleString('es-AR')}`;
  const icono = (id, clase = 'icono') => `<svg class="${clase}" aria-hidden="true"><use href="recursos/iconos.svg?v=3#${id}"/></svg>`;
  const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)');

  // ---------- Datos ----------

  // PC: las armadas del home (de muestra) y las Powered by MSI del sitio. Las especificaciones salen del nombre
  const pc = (foto, nombre, precio, antes, s) => ({ foto, nombre, precio, antes, ...s });
  const PCS = {
    ml1: pc('pc-ml1', 'PC Armada AMD Ryzen 3 3200G 8GB 256GB', 489999, 0, { cpu: 'AMD Ryzen 3 3200G', gpu: 'Radeon Vega 8 (integrada)', ram: '8 GB DDR4', disco: 'SSD 256 GB', fuente: '500 W' }),
    ml2: pc('pc-ml2', 'PC Armada AMD Ryzen 5 5600GT 16GB 512GB', 699999, 779999, { cpu: 'AMD Ryzen 5 5600GT', gpu: 'Radeon (integrada)', ram: '16 GB DDR4', disco: 'SSD 512 GB', fuente: '500 W' }),
    ml5: pc('pc-ml5', 'PC Armada AMD Ryzen 7 5700G 16GB 512GB', 849999, 0, { cpu: 'AMD Ryzen 7 5700G', gpu: 'Radeon (integrada)', ram: '16 GB DDR4', disco: 'SSD 512 GB', fuente: '550 W' }),
    ml13: pc('pc-ml13', 'PC Armada AMD Ryzen 7 5700G 32GB 1TB', 1049999, 1149999, { cpu: 'AMD Ryzen 7 5700G', gpu: 'Radeon (integrada)', ram: '32 GB DDR4', disco: 'SSD 1 TB', fuente: '550 W' }),
    ml12: pc('pc-ml12', 'PC Armada AMD Ryzen 5 5500 RTX 3050 16GB 512GB', 1199999, 1379999, { cpu: 'AMD Ryzen 5 5500', gpu: 'NVIDIA RTX 3050', ram: '16 GB DDR4', disco: 'SSD 512 GB', fuente: '650 W' }),
    ml11: pc('pc-ml11', 'PC Armada AMD Ryzen 5 4500 RX 7600 16GB 512GB', 1299999, 1419999, { cpu: 'AMD Ryzen 5 4500', gpu: 'AMD Radeon RX 7600', ram: '16 GB DDR4', disco: 'SSD 512 GB', fuente: '650 W' }),
    ml8: pc('pc-ml8', 'PC Armada AMD Ryzen 5 5500 RTX 5050 16GB 512GB', 1399999, 0, { cpu: 'AMD Ryzen 5 5500', gpu: 'NVIDIA RTX 5050', ram: '16 GB DDR4', disco: 'SSD 512 GB', fuente: '650 W' }),
    msi05: pc('pc-msi-05', 'PC Gamer Powered by MSI Essential AMD Athlon 3000G A520 8GB RAM 256GB NVMe 550W Bronze WiFi', 564319, 0, { cpu: 'AMD Athlon 3000G', gpu: 'Radeon Vega 3 (integrada)', ram: '8 GB DDR4', disco: 'SSD NVMe 256 GB', fuente: '550 W 80 PLUS Bronze', mother: 'MSI A520', wifi: true }),
    msi02: pc('pc-msi-02', 'PC Gamer Powered by MSI Essential AMD Ryzen 3 3200G A520 16GB RAM 256GB NVMe 550W Bronze WiFi', 712189, 0, { cpu: 'AMD Ryzen 3 3200G', gpu: 'Radeon Vega 8 (integrada)', ram: '16 GB DDR4', disco: 'SSD NVMe 256 GB', fuente: '550 W 80 PLUS Bronze', mother: 'MSI A520', wifi: true }),
    msi01: pc('pc-msi-01', 'PC Gamer Powered by MSI Essential AMD Ryzen 5 5600GT A520 16GB RAM 512GB NVMe 550W Bronze WiFi', 1006758, 0, { cpu: 'AMD Ryzen 5 5600GT', gpu: 'Radeon (integrada)', ram: '16 GB DDR4', disco: 'SSD NVMe 512 GB', fuente: '550 W 80 PLUS Bronze', mother: 'MSI A520', wifi: true }),
    msi06: pc('pc-msi-06', 'PC Gamer Powered by MSI Advanced Intel i5 12400 H610M 16GB RAM 512GB NVMe 650W Gold + CPU Cooler WiFi', 1103328, 0, { cpu: 'Intel Core i5 12400', gpu: 'Intel UHD 730 (integrada)', ram: '16 GB DDR4', disco: 'SSD NVMe 512 GB', fuente: '650 W 80 PLUS Gold', mother: 'MSI H610M', frio: 'Cooler de CPU', wifi: true }),
    msi07: pc('pc-msi-07', 'PC Gamer Powered by MSI Advanced Ultra 5 225 B860 16GB RAM 1TB NVMe 850W Gold + CPU Cooler WiFi', 1681856, 0, { cpu: 'Intel Core Ultra 5 225', gpu: 'Intel Graphics (integrada)', ram: '16 GB DDR5', disco: 'SSD NVMe 1 TB', fuente: '850 W 80 PLUS Gold', mother: 'MSI B860', frio: 'Cooler de CPU', wifi: true }),
    msi08: pc('pc-msi-08', 'PC Gamer Powered by MSI Advanced AMD Ryzen 7 8700G B850 16GB RAM 1TB NVMe 850W Gold + CPU Cooler WiFi', 1762856, 0, { cpu: 'AMD Ryzen 7 8700G', gpu: 'Radeon 780M (integrada)', ram: '16 GB DDR5', disco: 'SSD NVMe 1 TB', fuente: '850 W 80 PLUS Gold', mother: 'MSI B850', frio: 'Cooler de CPU', wifi: true }),
    msi09: pc('pc-msi-09', 'PC Gamer Powered by MSI Advanced AMD Ryzen 7 8700G B850 32GB RAM 1TB NVMe 850W Gold + Water 240 WiFi', 2527406, 0, { cpu: 'AMD Ryzen 7 8700G', gpu: 'Radeon 780M (integrada)', ram: '32 GB DDR5', disco: 'SSD NVMe 1 TB', fuente: '850 W 80 PLUS Gold', mother: 'MSI B850', frio: 'Water cooler 240 mm', wifi: true }),
    msi10: pc('pc-msi-10', 'PC Gamer Powered by MSI Advanced Intel i7 14700 B760 32GB RAM 1TB NVMe 850W Gold + Water 240 mm WiFi', 2827556, 0, { cpu: 'Intel Core i7 14700', gpu: 'Intel UHD 770 (integrada)', ram: '32 GB DDR5', disco: 'SSD NVMe 1 TB', fuente: '850 W 80 PLUS Gold', mother: 'MSI B760', frio: 'Water cooler 240 mm', wifi: true }),
    msi18: pc('pc-msi-18', 'PC Powered by MSI Ultimate AMD Ryzen 5 5500 A520 16GB RAM 512GB RTX 3050 650W Gold CPU Cooler WiFi', 1464053, 0, { cpu: 'AMD Ryzen 5 5500', gpu: 'NVIDIA RTX 3050', ram: '16 GB DDR4', disco: 'SSD NVMe 512 GB', fuente: '650 W 80 PLUS Gold', mother: 'MSI A520', frio: 'Cooler de CPU', wifi: true }),
    msi17: pc('pc-msi-17', 'PC Powered by MSI Ultimate AMD Ryzen 5 5500 B550 16GB RAM 1TB NVMe RTX 5050 850W Gold CPU Cooler WiFi', 1924853, 0, { cpu: 'AMD Ryzen 5 5500', gpu: 'NVIDIA RTX 5050', ram: '16 GB DDR4', disco: 'SSD NVMe 1 TB', fuente: '850 W 80 PLUS Gold', mother: 'MSI B550', frio: 'Cooler de CPU', wifi: true }),
    msi11: pc('pc-msi-11', 'PC Powered by MSI Ultimate AMD Ryzen 5 9600X B850 32GB RAM 1TB RTX 5060 850W Gold + CPU Cooler WiFi', 3447386, 0, { cpu: 'AMD Ryzen 5 9600X', gpu: 'NVIDIA RTX 5060', ram: '32 GB DDR5', disco: 'SSD NVMe 1 TB', fuente: '850 W 80 PLUS Gold', mother: 'MSI B850', frio: 'Cooler de CPU', wifi: true }),
    msi14: pc('pc-msi-14', 'PC Powered by MSI Ultimate Intel i5 14600KF B760 32GB RAM 1TB RTX 5060 850W Gold + CPU Cooler WiFi', 3476966, 0, { cpu: 'Intel Core i5 14600KF', gpu: 'NVIDIA RTX 5060', ram: '32 GB DDR5', disco: 'SSD NVMe 1 TB', fuente: '850 W 80 PLUS Gold', mother: 'MSI B760', frio: 'Cooler de CPU', wifi: true }),
    msi12: pc('pc-msi-12', 'PC Powered by MSI Ultimate Intel Ultra 5 245KF B860 WiFi 32GB RAM 1TB RTX 5060 850W Gold + CPU Cooler', 3544762, 0, { cpu: 'Intel Core Ultra 5 245KF', gpu: 'NVIDIA RTX 5060', ram: '32 GB DDR5', disco: 'SSD NVMe 1 TB', fuente: '850 W 80 PLUS Gold', mother: 'MSI B860', frio: 'Cooler de CPU', wifi: true }),
    msi16: pc('pc-msi-16', 'PC Powered by MSI Ultimate Intel Ultra 7 270K Plus B860 32GB RAM 1TB RTX 5070 Ti 850W Water 360 WiFi', 5494880, 0, { cpu: 'Intel Core Ultra 7 270K Plus', gpu: 'NVIDIA RTX 5070 Ti', ram: '32 GB DDR5', disco: 'SSD NVMe 1 TB', fuente: '850 W 80 PLUS Gold', mother: 'MSI B860', frio: 'Water cooler 360 mm', wifi: true }),
    msi15: pc('pc-msi-15', 'PC Powered by MSI Ultimate AMD Ryzen 7 9800X3D B850 32GB RAM 1TB RTX 5070 Ti 850W Gold Water 360 WiFi', 5510000, 0, { cpu: 'AMD Ryzen 7 9800X3D', gpu: 'NVIDIA RTX 5070 Ti', ram: '32 GB DDR5', disco: 'SSD NVMe 1 TB', fuente: '850 W 80 PLUS Gold', mother: 'MSI B850', frio: 'Water cooler 360 mm', wifi: true }),
    msi19: pc('pc-msi-19', 'PC Powered by MSI Ultimate Intel Ultra 9 285K B860 32GB RAM 2TB RTX 5080 850W Gold + Water 360 WiFi', 7405938, 0, { cpu: 'Intel Core Ultra 9 285K', gpu: 'NVIDIA RTX 5080', ram: '32 GB DDR5', disco: 'SSD NVMe 2 TB', fuente: '850 W 80 PLUS Gold', mother: 'MSI B860', frio: 'Water cooler 360 mm', wifi: true }),
  };

  // Las 5 PC de cada tipo de uso, de menor a mayor potencia (una por nivel)
  const BASICAS = ['ml1', 'msi05', 'ml2', 'msi02', 'ml5'];
  const OFICINA = ['ml2', 'ml5', 'msi01', 'ml13', 'msi06'];
  const POTENTES = ['ml5', 'ml13', 'msi06', 'msi07', 'msi09'];
  const LIVIANAS = ['ml2', 'msi01', 'ml12', 'ml8', 'msi18'];
  const GRAFICAS = ['ml12', 'ml11', 'msi18', 'msi17', 'msi11'];
  const EXIGENTES = ['msi17', 'msi11', 'msi14', 'msi16', 'msi15'];
  const PROFESIONALES = ['msi18', 'msi08', 'msi10', 'msi11', 'msi16'];
  const MAXIMAS = ['msi11', 'msi12', 'msi16', 'msi15', 'msi19'];

  const CATEGORIAS = [
    {
      clave: 'gaming', nombre: 'Gaming', icono: 'i-juego', bajada: 'Jugar videojuegos', titulo: '¿Qué tipo de juegos jugás?',
      usos: [
        ['juegos-livianos', 'Juegos casuales y livianos', 'Minecraft, Roblox, LoL y otros juegos livianos', 'i-juego', LIVIANAS],
        ['juegos-competitivos', 'Juegos competitivos', 'Valorant, CS2, Fortnite y juegos online competitivos', 'i-mira', GRAFICAS],
        ['juegos-populares', 'Juegos populares y actuales', 'GTA Online, EA Sports FC, Forza Horizon y similares', 'i-juego', GRAFICAS],
        ['juegos-exigentes', 'Juegos exigentes', 'Warzone, Red Dead Redemption 2 y títulos de alta exigencia', 'i-cat-pc', EXIGENTES],
        ['simuladores', 'Simuladores exigentes', 'Flight Simulator, Assetto Corsa y simuladores avanzados', 'i-cat-cpu', EXIGENTES],
        ['maxima-calidad', 'Juegos con máxima calidad gráfica', 'Para disfrutar juegos exigentes con la mejor calidad visual', 'i-rayo', MAXIMAS],
      ],
    },
    {
      clave: 'streaming', nombre: 'Streaming', icono: 'i-stream', bajada: 'Transmitir y crear contenido', titulo: '¿Qué vas a transmitir?',
      usos: [
        ['charlas', 'Charlas, clases o podcasts', 'Transmití con cámara, micrófono y contenido en pantalla', 'i-charla', OFICINA],
        ['stream-competitivos', 'Streaming de juegos casuales o competitivos', 'Jugá y transmití títulos livianos o competitivos', 'i-stream', GRAFICAS],
        ['stream-exigentes', 'Streaming de juegos exigentes', 'Jugá y transmití títulos que requieren más potencia', 'i-cat-pc', EXIGENTES],
        ['stream-edicion', 'Streaming, grabación y edición', 'Transmití, grabá y editá contenido en la misma PC', 'i-paleta', PROFESIONALES],
      ],
    },
    {
      clave: 'trabajo', nombre: 'Trabajo y estudio', icono: 'i-trabajo', bajada: 'Oficina, estudio y home office', titulo: '¿Qué vas a hacer con la PC?',
      usos: [
        ['tareas-basicas', 'Tareas básicas y clases virtuales', 'Navegación, documentos, videollamadas y plataformas educativas', 'i-estudio', BASICAS],
        ['office', 'Office y trabajo administrativo', 'Word, Excel, facturación y sistemas de gestión', 'i-trabajo', BASICAS],
        ['multitarea', 'Multitarea intensiva', 'Muchos programas, pestañas y archivos abiertos a la vez', 'i-ventanas', OFICINA],
        ['programacion', 'Programación y análisis de datos', 'Desarrollo, bases de datos y herramientas de análisis', 'i-codigo', POTENTES],
        ['profesionales', 'Programas profesionales exigentes', 'Aplicaciones pesadas y tareas profesionales de alta exigencia', 'i-rayo', PROFESIONALES],
      ],
    },
    {
      clave: 'diseno', nombre: 'Diseño y edición', icono: 'i-paleta', bajada: 'Foto, video, audio y 3D', titulo: '¿Qué vas a crear?',
      usos: [
        ['redes', 'Diseño para redes y contenido digital', 'Canva, publicaciones, anuncios y contenido para redes', 'i-paleta', OFICINA],
        ['foto', 'Fotografía y diseño gráfico', 'Photoshop, Illustrator, Lightroom y edición de imágenes', 'i-camara', POTENTES],
        ['video', 'Edición de video', 'Reels, TikTok, YouTube y edición de video en Full HD', 'i-stream', GRAFICAS],
        ['video-4k', 'Edición de video avanzada en 4K', 'Proyectos profesionales y videos en alta resolución', 'i-cat-cpu', PROFESIONALES],
        ['animacion', 'Animaciones y efectos visuales', 'After Effects, motion graphics y efectos para video', 'i-rayo', PROFESIONALES],
        ['audio', 'Edición de audio y producción musical', 'FL Studio, Ableton, Pro Tools y edición de audio', 'i-musica', POTENTES],
      ],
    },
  ].map((c) => ({ ...c, usos: c.usos.map(([clave, nombre, bajada, icono, pcs]) => ({ clave, nombre, bajada, icono, pcs })) }));

  const NIVELES = ['Entrada', 'Intermedia', 'Avanzada', 'Superior', 'Tope'];

  // ---------- Estado ----------

  const estado = { cat: null, uso: null, tope: null };
  const pcsDe = (uso) => uso.pcs.map((id) => ({ id, ...PCS[id] })).sort((a, b) => a.precio - b.precio).map((p, i) => ({ ...p, nivel: NIVELES[i] }));

  // Presupuestos del uso, como en el sitio: "Hasta" (los 3 primeros niveles), "Desde" (los superiores) y todas
  function presupuestos(uso) {
    const pcs = pcsDe(uso);
    return [
      { clave: 'hasta', rotulo: 'Hasta', monto: pesos(pcs[2].precio), texto: 'Entrada, Intermedia y Avanzada', desde: 0, hasta: 3 },
      { clave: 'desde', rotulo: 'Desde', monto: pesos(pcs[3].precio), texto: 'Superior y Tope', desde: 3, hasta: pcs.length },
      { clave: 'todas', rotulo: 'Sin un presupuesto definido', monto: 'Ver todas', texto: 'Compará todos los niveles disponibles', desde: 0, hasta: pcs.length },
    ];
  }

  // ---------- Pintar ----------

  function opcion({ datos, icono: ic, titulo, texto, pie = '', clase = '' }) {
    return `<button class="opcion-pc ${clase}" type="button" ${datos}>${ic ? `<span class="opcion-pc__icono">${icono(ic)}</span>` : ''}<span class="opcion-pc__texto"><span class="opcion-pc__titulo">${titulo}</span><span class="opcion-pc__bajada">${texto}</span></span>${pie || icono('i-derecha', 'icono icono--s opcion-pc__flecha')}</button>`;
  }

  $('[data-categorias]').innerHTML = CATEGORIAS.map((c) => opcion({ datos: `data-cat="${c.clave}"`, icono: c.icono, titulo: c.nombre, texto: c.bajada })).join('');

  function pintarUsos() {
    $('[data-titulo-uso]').textContent = estado.cat.titulo;
    $('[data-usos]').innerHTML = estado.cat.usos.map((u) => opcion({ datos: `data-uso="${u.clave}"`, icono: u.icono, titulo: u.nombre, texto: u.bajada })).join('');
  }

  function pintarPresupuestos() {
    const n = pcsDe(estado.uso).length;
    $('[data-disponibles]').innerHTML = `${icono('i-check', 'icono icono--s')}${n} PC disponibles para ${estado.uso.nombre.toLowerCase()}`;
    $('[data-presupuestos]').innerHTML = presupuestos(estado.uso)
      .map((p) => {
        const cant = p.hasta - p.desde;
        return opcion({
          datos: `data-tope="${p.clave}"`,
          titulo: `<span class="opcion-pc__rotulo">${p.rotulo}</span><span class="opcion-pc__monto">${p.monto}</span>`,
          texto: p.texto,
          pie: `<span class="opcion-pc__pie"><span>Ver ${cant} PC</span>${icono('i-flecha', 'icono icono--s')}</span>`,
          clase: 'opcion-pc--presupuesto',
        });
      })
      .join('');
  }

  function tarjeta(p) {
    const cuota = pesos(p.precio / 0.9 / 3); // 3 cuotas sin interés sobre el precio con tarjeta (10% más)
    return `<li><article class="producto">
      <div class="producto__media">
        <img class="producto__img" loading="lazy" src="recursos/productos/${p.foto}.jpg" alt="" width="600" height="600">
        ${p.antes ? `<span class="etiqueta producto__etiqueta">Ahorrá ${pesos(p.antes - p.precio)}</span>` : ''}
      </div>
      <div class="producto__cuerpo">
        <div class="producto__meta"><span class="nivel-pc nivel-pc--${NIVELES.indexOf(p.nivel)}">${p.nivel}</span></div>
        <h3 class="producto__nombre"><a class="producto__enlace" href="rtx-5070-ti-ventus.html">${p.nombre}</a></h3>
        <ul class="resultado-pc__specs">
          <li>${icono('i-cat-cpu', 'icono icono--s')}<span>${p.cpu}</span></li>
          <li>${icono('i-cat-gpu', 'icono icono--s')}<span>${p.gpu}</span></li>
          <li>${icono('i-caja', 'icono icono--s')}<span>${p.ram} · ${p.disco}</span></li>
        </ul>
        <div class="producto__precios">
          ${p.antes ? `<s class="producto__antes"><span class="sr-only">Antes: </span>${pesos(p.antes)}</s>` : ''}
          <p class="producto__precio">${pesos(p.precio)}</p>
          <p class="producto__nota">Efectivo o transferencia</p>
        </div>
        <p class="producto__cuotas">3 × ${cuota} <span class="producto__cuotas-nota">sin interés</span></p>
        <button class="btn-texto resultado-pc__ver" type="button" data-specs="${p.id}">${icono('i-ojo', 'icono icono--s')}Ver especificaciones</button>
        <button class="btn btn--primario producto__agregar" type="button" data-agregar-pc>${icono('i-carrito', 'icono icono--s')}<span>Agregar<span class="producto__agregar-resto"> al carrito</span></span></button>
      </div>
    </article></li>`;
  }

  function pintarResultado() {
    const pcs = pcsDe(estado.uso);
    const tope = presupuestos(estado.uso).find((p) => p.clave === estado.tope) || { desde: 0, hasta: pcs.length };
    const elegidas = pcs.slice(tope.desde, tope.hasta);
    $('[data-resultado]').innerHTML = elegidas.map(tarjeta).join('');
    $('[data-resultado-bajada]').textContent = `${elegidas.length} ${elegidas.length === 1 ? 'opción' : 'opciones'} para ${estado.uso.nombre.toLowerCase()}, de menor a mayor potencia.`;
    $('[data-pensadas]').innerHTML = `<strong>Pensadas para:</strong> ${estado.uso.bajada}.`;
    const texto = encodeURIComponent(`Hola, estoy buscando una PC para ${estado.uso.nombre.toLowerCase()} y quiero consultar con un asesor.`);
    $('[data-asesor]').href = `https://wa.me/541123575522?text=${texto}`;
    anunciar(`${elegidas.length} PC para vos.`);
  }

  // ---------- Especificaciones ----------

  const dialogo = document.querySelector('[data-specs-pc]');

  function abrirSpecs(id) {
    const p = pcsDe(estado.uso).find((x) => x.id === id);
    $('[data-specs-img]', dialogo).src = `recursos/productos/${p.foto}.jpg`;
    $('[data-specs-nivel]', dialogo).textContent = `Nivel ${p.nivel}`;
    $('[data-specs-nombre]', dialogo).textContent = p.nombre;
    $('[data-specs-precio]', dialogo).innerHTML = `<strong>${pesos(p.precio)}</strong> efectivo o transferencia · 3 × ${pesos(p.precio / 0.9 / 3)} sin interés`;
    const filas = [
      ['i-cat-cpu', 'Procesador', p.cpu],
      ['i-cat-gpu', 'Placa de video', p.gpu],
      ['i-caja', 'Memoria RAM', p.ram],
      ['i-caja', 'Almacenamiento', p.disco],
      ['i-cat-pc', 'Motherboard', p.mother || 'Según disponibilidad'],
      ['i-rayo', 'Fuente', p.fuente],
      ['i-cat-pc', 'Refrigeración', p.frio || 'Cooler de la caja del procesador'],
      ['i-cat-redes', 'Conectividad', p.wifi ? 'WiFi incluido' : 'Ethernet (WiFi opcional)'],
      ['i-ventanas', 'Sistema operativo', 'Windows 11 instalado (versión gratuita, sin licencia)'],
      ['i-garantia', 'Garantía', '12 meses'],
    ];
    $('[data-specs-lista]', dialogo).innerHTML = filas.map(([ic, k, v]) => `<div><dt>${icono(ic, 'icono icono--s')}${k}</dt><dd>${v}</dd></div>`).join('');
    dialogo.showModal();
  }

  dialogo.addEventListener('click', (e) => {
    if (e.target === dialogo || e.target.closest('[data-cerrar-specs]')) dialogo.close();
    if (e.target.closest('[data-specs-agregar]')) {
      dialogo.close();
      avisar('Vista previa: acá se agregaría la PC al carrito');
    }
  });

  // ---------- Pasos ----------

  const anuncio = $('[data-anuncio]');
  const anunciar = (t) => (anuncio.textContent = t);

  function mostrar(vista, { enfocar = true } = {}) {
    $$('[data-vista]').forEach((v) => (v.hidden = v.dataset.vista !== String(vista)));
    const paso = vista === 'resultado' ? 4 : Number(vista);
    $$('[data-paso-ind]').forEach((li) => {
      const n = Number(li.dataset.pasoInd);
      li.classList.toggle('quiz__paso--hecho', n < paso);
      $('button', li).disabled = n >= paso;
      if (n === Math.min(paso, 3)) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    $('.quiz').dataset.pasoActual = vista;
    pintarElegido(paso);
    if (enfocar) {
      $(`[data-vista="${vista}"] .quiz__titulo`).focus({ preventScroll: true });
      // Si el embudo no está arriba de la pantalla, sube hasta él (scroll-margin-top en pc-ideal.css)
      const arriba = raiz.getBoundingClientRect().top;
      if (arriba < 0 || arriba > innerHeight * 0.4) raiz.scrollIntoView({ behavior: sinMovimiento.matches ? 'auto' : 'smooth', block: 'start' });
    }
  }

  // Chips con lo elegido: tocarlos vuelve a ese paso
  function pintarElegido(paso) {
    const caja = $('[data-elegido]');
    const chips = [];
    if (estado.cat && paso > 1) chips.push(`<button class="chip-pc" type="button" data-volver-a="1" aria-label="Cambiar la categoría: ${estado.cat.nombre}">${estado.cat.nombre}${icono('i-cerrar', 'icono icono--s')}</button>`);
    if (estado.uso && paso > 2) chips.push(`<button class="chip-pc" type="button" data-volver-a="2" aria-label="Cambiar el uso: ${estado.uso.nombre}">${estado.uso.nombre}${icono('i-cerrar', 'icono icono--s')}</button>`);
    caja.innerHTML = chips.join('');
    caja.hidden = !chips.length;
  }

  function escribirUrl() {
    const partes = ['elegir', estado.cat?.clave, estado.uso?.clave, estado.tope].filter(Boolean);
    history.replaceState(null, '', `#${partes.join('/')}`);
  }

  function irA(paso, opciones) {
    if (paso <= 1) estado.cat = null;
    if (paso <= 2) estado.uso = null;
    if (paso <= 3) estado.tope = null;
    escribirUrl();
    if (paso === 2) pintarUsos();
    if (paso === 3) pintarPresupuestos();
    mostrar(paso, opciones);
  }

  raiz.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.cat) {
      estado.cat = CATEGORIAS.find((c) => c.clave === b.dataset.cat);
      escribirUrl();
      pintarUsos();
      mostrar(2);
    } else if (b.dataset.uso) {
      estado.uso = estado.cat.usos.find((u) => u.clave === b.dataset.uso);
      escribirUrl();
      pintarPresupuestos();
      mostrar(3);
    } else if (b.dataset.tope) {
      estado.tope = b.dataset.tope;
      escribirUrl();
      pintarResultado();
      mostrar('resultado');
    } else if (b.dataset.volverA) {
      irA(Number(b.dataset.volverA));
    } else if (b.dataset.specs) {
      abrirSpecs(b.dataset.specs);
    } else if ('agregarPc' in b.dataset) {
      avisar('Vista previa: acá se agregaría la PC al carrito');
    }
  });

  // "Encontrar mi PC": baja al embudo y pone el foco en la pregunta actual
  document.querySelectorAll('[data-empezar]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const vista = $$('[data-vista]').find((v) => !v.hidden)?.dataset.vista || 1;
      mostrar(vista);
    })
  );

  // ---------- Aviso breve ----------

  const aviso = document.createElement('p');
  aviso.className = 'aviso';
  aviso.setAttribute('role', 'status');
  document.body.append(aviso);
  let temporizador;
  function avisar(texto) {
    aviso.textContent = texto;
    aviso.classList.add('aviso--visible');
    clearTimeout(temporizador);
    temporizador = setTimeout(() => aviso.classList.remove('aviso--visible'), 2600);
  }

  // ---------- Arranque: retoma lo que dice la URL ----------

  const [ancla, cat, uso, tope] = location.hash.slice(1).split('/');
  estado.cat = ancla === 'elegir' ? CATEGORIAS.find((c) => c.clave === cat) || null : null;
  const u = estado.cat?.usos.find((x) => x.clave === uso);
  if (u && ['hasta', 'desde', 'todas'].includes(tope)) {
    estado.uso = u;
    estado.tope = tope;
    pintarResultado();
    mostrar('resultado', { enfocar: false });
  } else if (u) {
    estado.uso = u;
    pintarPresupuestos();
    mostrar(3, { enfocar: false });
  } else if (estado.cat) {
    pintarUsos();
    mostrar(2, { enfocar: false });
  } else mostrar(1, { enfocar: false });
}
