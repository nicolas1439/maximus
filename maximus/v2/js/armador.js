// Armá tu PC: los 13 pasos del armador de maximus.com.ar (relevado el 17/10/2026) con sus textos de ayuda, filtros,
// buscador, avisos y la ficha "+ info", en el orden que se quiera. Cada paso muestra solo lo compatible con lo ya
// elegido (socket del procesador y de la motherboard, tipo de memoria) y, una vez elegido, la foto del producto en
// su cabecera con "Cambiar" y "Quitar". "Tu armado" suma el total, las cuotas (con la tabla de financiación) y avisa
// lo que falta o no conviene.
// Productos: una selección de los que mostraba el sitio ese día, con sus nombres, precios en efectivo y fotos del
// CDN del sitio (las que ya están en recursos/productos/ van de ahí); algunos descuentos, las fichas y la cantidad
// total de cada paso son de muestra. En el sitio real todo eso lo trae el backend.
// El armado queda en la URL (?armado=…) para copiar el link o volver; "Agregar al carrito" es de muestra.
// Revisión final (tanda 3d), las piezas visuales que pone el armador del sitio (sus reglas y textos son de muestra):
// avisos del paso en tres tonos (gabinete con fuente, WiFi y slots según la motherboard, BIOS requerida); marca fija
// en la cabecera de un paso (pieza quitada, paso omitido, servicio en pausa); paso sin compatibles y sin productos;
// la actualización de BIOS que se suma sola y los servicios en pausa (armado e instalación); memoria con varios
// modelos y contador de slots; estados de "Agregar al carrito"; "Empezar de nuevo" con confirmación; armado
// retomado o abierto desde un link, con piezas que ya no están; "+ info" en texto libre. La barra "Estados de
// muestra" de la vista previa (data-demo) arma cada caso.

import { iniciarLuz } from './luz.js';

const raiz = document.querySelector('[data-armador]');
if (raiz) iniciar();

function iniciar() {
  const $ = (s, r = raiz) => r.querySelector(s);
  const $$ = (s, r = raiz) => [...r.querySelectorAll(s)];
  const pesos = (n) => `$${Math.round(n).toLocaleString('es-AR')}`;
  const icono = (id, clase = 'icono icono--s') => `<svg class="${clase}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const cdn = (codigo) => `https://www.maximus.com.ar/Temp/App_WebSite/App_PictureFiles/Items/${codigo}_400.jpg`;
  const local = (nombre) => `recursos/productos/${nombre}.jpg`;
  const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)');
  const conMouse = matchMedia('(hover: hover) and (pointer: fine)');
  const tiene = (...palabras) => (n) => palabras.some((p) => n.toUpperCase().includes(p));
  // El armador no muestra watts (regla del sitio): la ficha de la fuente los saca del nombre
  const sinWatts = (n) => n.replace('Fuente ', '').replace(/\b\d{3,4}\s*W\b\s*/i, '');
  const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // Precio con tarjeta (el de lista): el efectivo tiene 10% menos. Cuotas con los coeficientes del sitio
  const lista = (efectivo) => efectivo / 0.9;
  const CUOTAS = [[1, 1], [3, 1], [6, 1.16], [9, 1.23], [12, 1.31], [18, 1.52], [24, 1.67]];

  // ---------- Datos (de muestra) ----------
  // Marcas de muestra para ver los avisos y servicios (en el sitio real las da cada producto): biosNueva (el
  // procesador pide un BIOS reciente) y biosVieja (la motherboard sale de fábrica con uno anterior), wifi y slots de
  // la motherboard (2 si no se indica), conFuente (gabinete que trae fuente) y libre (descripción en texto libre).

  // "+ info" sin datos por secciones: la descripción llega del sistema como un solo bloque de HTML
  const DESCRIPCION_LIBRE = `<p>Adaptador <strong>WiFi USB de doble banda</strong> y tamaño nano: queda enchufado a la PC sin molestar.</p>
    <h3>Características</h3>
    <ul><li>Doble banda: <strong>5 GHz</strong> para jugar y ver videos, 2,4 GHz para llegar más lejos.</li><li>Se conecta a un puerto USB, sin abrir la PC.</li><li>Compatible con Windows 11, 10, 8.1 y 7.</li></ul>
    <h3>Especificaciones</h3>
    <table><tbody><tr><th>Velocidad</th><td>Hasta 433 Mbps en 5 GHz y 200 Mbps en 2,4 GHz</td></tr><tr><th>Estándar</th><td>WiFi 5 (802.11ac)</td></tr><tr><th>Interfaz</th><td>USB 2.0</td></tr><tr><th>Seguridad</th><td>WPA / WPA2</td></tr></tbody></table>`;

  const PASOS = [
    {
      clave: 'micro', titulo: 'Procesador', saltar: 'No agregar procesador', total: 78, buscar: 'Buscar procesador…',
      ayuda: 'El procesador es el <b>cerebro de tu PC</b> y define cuánta potencia vas a tener. Para gaming conviene frecuencia alta; para edición, streaming o multitarea, más núcleos e hilos. ¿No sabés cuál elegir? Los de gama media son el mejor equilibrio precio-rendimiento.',
      chips: [['AMD', tiene('AMD')], ['Intel', tiene('INTEL')]],
      piezas: [
        { id: 5593, n: 'Micro AMD Ryzen 3 3200G 4.0 Ghz + RX Vega 8 AM4', p: 120870, img: cdn('YD3200C5FHBOX'), socket: 'AM4', video: true },
        { id: 11324, n: 'Micro AMD Ryzen 5 4500 4.1 Ghz AM4', p: 153450, a: 172900, img: cdn('100-1000000644BOX'), socket: 'AM4' },
        { id: 10684, n: 'Micro AMD Ryzen 5 5500 4.2 Ghz AM4', p: 191970, img: local('ryzen-5-5500'), socket: 'AM4' },
        { id: 13477, n: 'Micro Intel i3-14100F 4.7 Ghz 12Mb S.1700', p: 203220, img: cdn('BX8071514100F'), socket: '1700' },
        { id: 20790, n: 'Micro AMD Ryzen 5 8500G 5.0 Ghz AM5', p: 243360, a: 279900, img: cdn('100-100000931'), socket: 'AM5', video: true },
        { id: 11021, n: 'Micro Intel i3-12100 4.3 Ghz 12Mb S.1700', p: 252900, img: cdn('BX8071512100'), socket: '1700', video: true },
        { id: 99010, n: 'Micro AMD Ryzen 7 9800X3D 5.2 Ghz AM5', p: 739999, a: 849999, img: local('ryzen-7-9800x3d'), socket: 'AM5', sinCooler: true, biosNueva: true },
      ],
    },
    {
      clave: 'cooler', titulo: 'Cooler', saltar: 'No incluir cooler', total: 54, buscar: 'Buscar cooler…',
      ayuda: 'El cooler mantiene la <b>temperatura del procesador</b> bajo control: una PC fresca rinde más y dura más. Cuanto más potente el procesador o más horas de uso, más robusto conviene que sea. Los modelos RGB además le suman estética a tu armado.',
      chips: [['ARGB', tiene('ARGB', 'RGB', 'RAINBOW')], ['Blanco', tiene('WHITE')]],
      piezas: [
        { id: 20075, n: 'CPU Cooler Raptor Cryo RGB - 3P', p: 16650, img: cdn('RAP-COOLER-RGB-CPC002-1') },
        { id: 14075, n: 'CPU Cooler Gamemax Gamma 500 Rainbow ARGB', p: 31410, img: cdn('GAMMA-500-RAINBOW') },
        { id: 13524, n: 'CPU Cooler Cooler Master Hyper 212 Spectrum V3 ARGB', p: 32940, img: cdn('RR-S4NA-17PA-R1') },
        { id: 19581, n: 'CPU Cooler Lovingcool LC-X1210W ARGB White', p: 42525, a: 63000, img: cdn('Lovingcool-LC-X1210W-White') },
        { id: 19845, n: 'CPU Cooler MSI MAG CoreFrozr AA13 Black', p: 43650, img: cdn('306-7ZWHA11-L80') },
        { id: 19497, n: 'CPU Cooler Thermaltake UX500 Black ARGB', p: 48330, img: cdn('CL-P144-AL12SW-A') },
      ],
    },
    {
      clave: 'mother', titulo: 'Motherboard', saltar: null, total: 96, buscar: 'Buscar motherboard…',
      ayuda: 'La motherboard es donde se <b>conectan todos los componentes</b>. Una de mayor gama te da más lugares para memoria, soporte de velocidades más altas y más puertos para ampliar tu PC en el futuro.',
      chips: [['AM4', tiene('AM4')], ['AM5', tiene('AM5')], ['Intel 1700', tiene('1700')]],
      piezas: [
        { id: 19997, n: 'Motherboard MSI A520M A Pro AM4', p: 84420, img: local('msi-a520m-a-pro'), socket: 'AM4', ram: 'DDR4' },
        { id: 18222, n: 'Motherboard Gigabyte A520M-K V2 AM4', p: 91620, img: cdn('9MA52MK2-00-G11'), socket: 'AM4', ram: 'DDR4' },
        { id: 18772, n: 'Motherboard MSI Pro H610M-G DDR5 S1700', p: 109710, img: cdn('911-7D46-225'), socket: '1700', ram: 'DDR5' },
        { id: 20890, n: 'Motherboard MSI Pro H610M-G DDR4 S1700', p: 111690, img: cdn('911-7D46-238'), socket: '1700', ram: 'DDR4' },
        { id: 7594, n: 'Motherboard Biostar B550M H 3.0 AM4', p: 119880, a: 139500, img: cdn('B550MH-3.0'), socket: 'AM4', ram: 'DDR4', slots: 4 },
        { id: 16434, n: 'Motherboard MSI A620M-E Pro DDR5 AM5', p: 125640, img: cdn('911-7E28-014'), socket: 'AM5', ram: 'DDR5', biosVieja: true },
        { id: 13840, n: 'Motherboard Gigabyte A620M-H AM5', p: 126000, img: cdn('A620M-H'), socket: 'AM5', ram: 'DDR5', biosVieja: true },
        { id: 20840, n: 'Motherboard MSI B550M-B Pro AM4', p: 126810, img: cdn('911-7d14-024'), socket: 'AM4', ram: 'DDR4', slots: 4, wifi: true },
      ],
    },
    {
      clave: 'ram', titulo: 'Memoria RAM', saltar: 'No agregar memoria RAM', max: 4, total: 61, buscar: 'Buscar memoria…', cantidad: { min: 1, max: 4, inicial: 2 },
      ayuda: 'La memoria RAM define <b>cuántas cosas puede hacer tu PC a la vez</b> sin ponerse lenta. Para gaming y uso general lo recomendado es 16GB (2 módulos de 8GB); para tareas básicas alcanza con 8GB.',
      chips: [['8GB', tiene('8GB')], ['16GB', tiene('16GB')], ['RGB', tiene('RGB')]],
      piezas: [
        { id: 14025, n: 'Memoria RAM Hiksemi Hiker 8GB 3200 Mhz DDR4', p: 133920, img: cdn('HSC408U32Z1-8G'), ram: 'DDR4' },
        { id: 20782, n: 'Memoria RAM Arkham 8GB 3200 Mhz RGB DDR4', p: 140220, a: 159900, img: cdn('ARKU8GD432RGB'), ram: 'DDR4' },
        { id: 6066, n: 'Memoria RAM Corsair Vengeance LPX Black 8GB 3000 Mhz DDR4', p: 155070, img: cdn('CMK8GX4M1D3000C16'), ram: 'DDR4' },
        { id: 13014, n: 'Memoria RAM Adata XPG Spectrix D35G RGB 8GB 3200 Mhz DDR4', p: 155340, img: cdn('AX4U32008G16A-SBKD35G'), ram: 'DDR4' },
        { id: 99001, n: 'Memoria RAM Kingston Fury Beast 16GB RGB 6000 Mhz DDR5', p: 139999, img: local('kingston-fury-beast-ddr5'), ram: 'DDR5' },
      ],
    },
    {
      clave: 'video', titulo: 'Placa de video', saltar: 'No incluir placa de video', saltar2: 'Ya tengo placa de video', total: 112, buscar: 'Buscar placa de video…',
      ayuda: 'La placa de video procesa los <b>gráficos</b>: es EL componente clave para jugar, diseñar, editar o renderizar. Si tu procesador tiene gráficos integrados y no vas a jugar, podés no incluirla.',
      chips: [['NVIDIA', tiene('NVIDIA', 'GEFORCE', 'GT ', 'RTX')], ['AMD Radeon', tiene('RX ', 'RADEON')], ['RTX', tiene('RTX')]],
      piezas: [
        { id: 20882, n: 'Placa de Video PCWINMAX GT 730 4GB DDR3', p: 134748, a: 157600, img: cdn('GT730-4GD3-128-BIT'), w: 300 },
        { id: 20884, n: 'Placa de Video PCWINMAX RX 580 8GB GDDR5', p: 294570, img: cdn('RX580-8GD5-256-BIT'), w: 500 },
        { id: 20885, n: 'Placa de Video PCWINMAX RX 590 8GB GDDR5', p: 311445, a: 384500, img: cdn('RX590-8GD5-256-BIT'), w: 550 },
        { id: 20887, n: 'Placa de Video Centauri RX 5500 8GB GDDR5', p: 362610, img: cdn('RX5500-8G'), w: 450 },
        { id: 13752, n: 'Placa de Video ASUS GeForce RTX 3050 Dual OC 6GB GDDR6', p: 513090, img: cdn('90YV0K60-M0AA00'), w: 450 },
        { id: 99002, n: 'Placa de Video MSI GeForce RTX 5060 Shadow 2X 8GB OC GDDR7', p: 1004850, img: local('msi-rtx-5060-shadow'), w: 550 },
        { id: 99003, n: 'Placa de Video MSI GeForce RTX 5070 Ti Ventus 3X 16GB OC GDDR7', p: 2401920, a: 3139765, img: local('rtx-5070-ti-ventus'), w: 750 },
      ],
    },
    {
      clave: 'discos', titulo: 'Almacenamiento', saltar: 'No agregar disco', max: 2, total: 88, buscar: 'Buscar disco…',
      ayuda: 'Acá viven tu <b>sistema, juegos y archivos</b>. Un SSD NVMe hace que todo arranque y cargue rápido (recomendado para el sistema). Si necesitás más espacio, podés sumar un segundo disco.',
      chips: [['NVMe', tiene('NVME')], ['SATA', tiene('SATA')]],
      piezas: [
        { id: 19757, n: 'Disco Sólido SSD 240GB MSI Spatium S270 SATA', p: 72810, img: cdn('S78-440N070-P83') },
        { id: 14266, n: 'Disco Sólido SSD 256GB Hiksemi Wave M.2 NVMe PCIe 3.0', p: 85500, img: cdn('HS-SSD-WAVE-256G-PCIE3-WW') },
        { id: 99004, n: 'Disco Sólido SSD 1TB Kingston NV3 M.2 NVMe PCIe 4.0', p: 99999, a: 124900, img: local('kingston-nv3-1tb') },
        { id: 4577, n: 'Disco Sólido SSD 240GB Kingston A400 SATA III', p: 111870, img: cdn('SA400S37-240G') },
        { id: 20641, n: 'Disco SSD 512GB Aimerican Agility M.2 NVMe PCIe 3.0', p: 137430, img: cdn('AISSD512NVM3') },
      ],
    },
    {
      clave: 'gabinete', titulo: 'Gabinete', saltar: 'No agregar gabinete', total: 140, buscar: 'Buscar gabinete…',
      ayuda: 'El gabinete es la <b>casa de tu PC</b>: además del estilo, importa que tenga buen flujo de aire para mantener todo fresco y espacio para futuras ampliaciones.',
      chips: [['ARGB', tiene('ARGB', 'RGB')], ['Blanco', tiene('WHITE')], ['Negro', tiene('BLACK')]],
      piezas: [
        { id: 16562, n: 'Gabinete Gamer Zer01 Gaming Centauri 3 Fan Fixed RGB', p: 29889, a: 36900, img: cdn('CENTAURI'), conFuente: true },
        { id: 18460, n: 'Gabinete Sentey GS-6130-SF H30 Black - Sin Cooler Fan', p: 35640, img: cdn('GS-6130-SF-BLACK') },
        { id: 18856, n: 'Gabinete Xigmatek Pucara X Arctic 6 Fan Edition White', p: 40905, a: 60600, img: cdn('EN47190') },
        { id: 4089, n: 'Gabinete Gamemax H601 Black Red', p: 45000, img: cdn('H601-BR') },
        { id: 19443, n: 'Gabinete Xigmatek Aqua M Nano II 7 Fans FRGB Black', p: 45900, a: 60000, img: cdn('EN48845') },
        { id: 20139, n: 'Gabinete Sentey M12 3 Fans ARGB White', p: 49320, img: cdn('M12WHT-SF') },
      ],
    },
    {
      clave: 'fuente', titulo: 'Fuente', saltar: 'No agregar fuente', total: 73, buscar: 'Buscar fuente…',
      ayuda: 'La fuente le da <b>energía a todos los componentes</b>. Una buena fuente protege tu inversión: acá no conviene ahorrar de más, sobre todo si llevás una placa de video potente.',
      chips: [['80 PLUS', tiene('80 PLUS')], ['Certificación Gold', tiene('GOLD')]],
      piezas: [
        { id: 20312, n: 'Fuente 650W LNZ SX650-TS ATX', p: 46170, img: cdn('SX650-TS'), w: 650 },
        { id: 20313, n: 'Fuente 700W LNZ SX700-TS ATX', p: 48240, img: cdn('SX700-TS'), w: 700 },
        { id: 20765, n: 'Fuente 500W Raptor Volt 80 PLUS Bronze', p: 55260, img: cdn('ZU-ATX50xy'), w: 500 },
        { id: 19999, n: 'Fuente 500W Sentey EPP500-GT 80 PLUS Bronze', p: 57600, img: cdn('EPP500-GT'), w: 500 },
        { id: 20741, n: 'Fuente 600W Sentey SDP600-GT 80 PLUS White', p: 60300, img: cdn('SDP600-GT'), w: 600 },
        { id: 99005, n: 'Fuente 650W MSI MAG A650GN II 80 PLUS Gold', p: 134999, a: 154900, img: local('msi-mag-a650gn'), w: 650 },
      ],
    },
    {
      clave: 'armado', titulo: 'Armado de PC', saltar: null, total: 2,
      ayuda: '¿Querés que <b>armemos tu PC</b> por vos? La ensamblamos, testeamos y te la entregamos lista para enchufar, con 12 meses de garantía en la PC armada. Si preferís armarla vos, recibís los componentes en sus cajas (PC en piezas).',
      piezas: [
        { id: 5653, n: 'Servicio de armado de PC (48 hs hábiles)', p: 12510, img: cdn('ARMADODEPC') },
        { id: 7495, n: 'Sin servicio de armado (PC en piezas)', p: 0, img: cdn('noarmadopc') },
      ],
    },
    {
      clave: 'so', titulo: 'Sistema operativo', saltar: 'No agregar sistema operativo', total: 2,
      ayuda: 'Con el <b>servicio de armado</b> te instalamos Windows: es la <b>versión original gratuita (sin licencia)</b> y tu PC llega lista para usar desde el primer encendido. También podés llevar un <b>sistema operativo original</b> de los que tengamos en stock.',
      piezas: [
        { id: 10648, n: 'Instalación de sistema operativo (versión gratuita, sin licencia)', p: 10080, img: cdn('mano-obra-sistema') },
        { id: 11118, n: 'Microsoft Windows 11 Pro 64 Bits OEM Español Original', p: 341820, img: cdn('FQC-10553') },
      ],
    },
    {
      clave: 'monitor', titulo: 'Monitor', saltar: 'No agregar monitor', total: 95, buscar: 'Buscar monitor…', opcional: true,
      ayuda: 'Para gaming buscá <b>75Hz o más</b> (ideal 144Hz+); para trabajo y estudio pesan más el tamaño y la resolución.',
      chips: [['Hasta 25"', tiene('19"', '20"', '22"', '24"', '25"')], ['27"', tiene('27')], ['144Hz o más', tiene('144HZ', '165HZ', '180HZ', '200HZ')]],
      piezas: [
        { id: 20677, n: 'Monitor LED 24" Performance PF236U VGA HDMI', p: 107370, img: cdn('PF236U') },
        { id: 19771, n: 'Monitor LED IPS 22" CX 100Hz CX215U HDMI / VGA', p: 127170, img: cdn('CX215U') },
        { id: 20151, n: 'Monitor LED VA 22" MSI Pro MP225 E12VL 120Hz FHD 1ms', p: 151830, img: cdn('9S6-3PE0CM-024') },
        { id: 19937, n: 'Monitor LED IPS 24" Raptor Hawk Eye FHD 200Hz 1ms Freesync', p: 173259, a: 213900, img: cdn('RAP-MON-24FHD-200IPS') },
        { id: 20678, n: 'Monitor LED 27" CX CX270K FHD 120Hz HDMI / VGA', p: 184590, img: cdn('CX270K') },
        { id: 99006, n: 'Monitor Gamer IPS MSI 24" G242L E14 144Hz HDMI - DP', p: 389999, a: 449999, img: local('msi-g242l') },
      ],
    },
    {
      clave: 'perif', titulo: 'Periféricos', saltar: 'No agregar periféricos', max: 3, total: 310, buscar: 'Buscar teclado, mouse…', opcional: true,
      ayuda: 'Teclado, mouse y auriculares para <b>completar tu setup</b>. En gaming, un teclado mecánico y un mouse con buen sensor marcan la diferencia.',
      chips: [['Teclados', tiene('TECLADO')], ['Mouse', (n) => /MOUSE/i.test(n) && !/PAD/i.test(n)], ['Auriculares', tiene('AURICULAR')]],
      piezas: [
        { id: 1065, n: 'Mouse Logitech M90 Black', p: 6390, img: cdn('910-004053') },
        { id: 7567, n: 'Mouse Pad Redragon P030 Flick M', p: 8460, img: cdn('6950376779885') },
        { id: 13942, n: 'Mouse Logitech M110 Silent Black', p: 9450, img: cdn('910-006756') },
        { id: 99007, n: 'Mouse Logitech G203 Lightsync Black', p: 184999, a: 219999, img: local('logitech-g203') },
        { id: 99008, n: 'Auricular con micrófono Redragon Zeus X H510 White RGB', p: 219999, a: 249999, img: local('redragon-zeus-x') },
        { id: 99009, n: 'Teclado Mecánico Redragon K552 Kumara 2 Rainbow Red Switches', p: 239999, a: 279999, img: local('redragon-k552') },
      ],
    },
    {
      clave: 'wifi', titulo: 'Placa WiFi', saltar: 'No agregar placa WiFi', total: 27, buscar: 'Buscar placa WiFi…', opcional: true,
      ayuda: 'Si tu PC va a estar <b>lejos del router</b> y no podés llegar con cable, una placa WiFi te da conexión inalámbrica (muchas incluyen Bluetooth).',
      piezas: [
        { id: 1028, n: 'Adaptador USB WiFi TP-Link TL-WN725N Nano 150Mbps', p: 11700, img: cdn('TL-WN725N') },
        { id: 19194, n: 'Placa de Red WiFi USB TP-Link Archer TX1U Nano AX300 WiFi 6', p: 12690, img: cdn('Archer-TX1U-Nano') },
        { id: 6949, n: 'Adaptador USB WiFi TP-Link Archer T2U Nano AC600 Dual Band', p: 16290, img: cdn('ARCHER-T2U-NANO'), libre: DESCRIPCION_LIBRE },
        { id: 1302, n: 'Placa de Red PCIe WiFi TP-Link TL-WN881ND 300Mbps', p: 20790, img: cdn('TL-WN881ND') },
        { id: 18965, n: 'Placa de Red WiFi USB TP-Link Archer TX10UB Nano AX900 WiFi 6 + BT', p: 23040, img: cdn('Archer-TX10UB-Nano') },
      ],
    },
  ];

  const PRINCIPALES = ['micro', 'cooler', 'mother', 'ram', 'video', 'discos', 'gabinete', 'fuente'];
  const porClave = Object.fromEntries(PASOS.map((p) => [p.clave, p]));
  const pieza = (paso, id) => porClave[paso].piezas.find((x) => x.id === id);

  // Servicios: el armado y la instalación del sistema (pasos 9 y 10) y la actualización de BIOS, que no se elige:
  // se suma sola cuando el procesador la pide (precio de muestra)
  const ID_ARMADO = 5653;
  const ID_INSTALACION = 10648;
  const BIOS = { n: 'Servicio de actualización de BIOS', p: 9900 };

  // ---------- Fichas "+ info" (plantilla de muestra por paso) ----------
  // Como la del sitio: qué es, usos y rendimiento, compatibilidad e instalación y especificaciones. Los datos que se
  // pueden sacar del nombre (marca, capacidad, frecuencia…) salen de ahí; el resto es texto de muestra del paso.

  const MARCAS = ['Cooler Master', 'AMD', 'Intel', 'MSI', 'Gigabyte', 'ASUS', 'Asus', 'Biostar', 'Kingston', 'Hiksemi', 'Arkham', 'Corsair', 'Adata', 'PCWINMAX', 'Centauri', 'Raptor', 'Gamemax', 'Lovingcool', 'Thermaltake', 'Zer01', 'Sentey', 'Xigmatek', 'LNZ', 'Performance', 'CX', 'Logitech', 'Redragon', 'TP-Link', 'Aimerican', 'Microsoft'];
  const marcaDe = (n) => MARCAS.find((m) => new RegExp(`\\b${m}\\b`, 'i').test(n)) || 'Maximus';
  const busca = (n, re, def = '—') => n.match(re)?.[1] ?? def;
  const siNo = (v) => (v ? 'Sí' : 'No');
  const segmento = (p, corte) => (p.p < corte[0] ? 'Entrada' : p.p < corte[1] ? 'Media' : 'Alta');

  const FICHAS = {
    micro: {
      que: '¿Qué es este procesador?',
      texto: (p) => `El ${p.n.replace('Micro ', '')} es un procesador para socket ${nombreSocket(p.socket)}${p.video ? ' con gráficos integrados, así que puede arrancar sin placa de video' : ' sin gráficos integrados: necesita una placa de video'}. Es una opción de gama ${segmento(p, [180000, 400000]).toLowerCase()} para armar una PC equilibrada.`,
      usos: [['Gaming', 'Mantiene buenos cuadros por segundo acompañado de una placa de video acorde.'], ['Trabajo y estudio', 'Ofimática, navegación y videollamadas sin demoras.'], ['Edición y streaming', 'Sus núcleos e hilos reparten bien las tareas pesadas.'], ['Multitarea', 'Muchos programas abiertos a la vez sin que la PC se ponga lenta.']],
      compat: (p) => `Va en motherboards con socket ${nombreSocket(p.socket)}. ${p.sinCooler ? 'Viene sin cooler: hay que sumar uno.' : 'Trae cooler en la caja; uno dedicado suma si le vas a exigir mucho.'}`,
      specs: (p) => [['Marca', marcaDe(p.n)], ['Modelo', p.n.replace('Micro ', '')], ['Socket', nombreSocket(p.socket)], ['Frecuencia máxima', `${busca(p.n, /(\d\.\d)\s*Ghz/i)} GHz`], ['Gráficos integrados', siNo(p.video)], ['Cooler incluido', siNo(!p.sinCooler)], ['Segmento', segmento(p, [180000, 400000])]],
    },
    cooler: {
      que: '¿Qué es este sistema de refrigeración?',
      texto: (p) => `El ${p.n.replace('CPU Cooler ', '')} es un cooler de aire para el procesador. Disipa el calor por sus heatpipes y su ventilador, y mantiene la PC fresca y silenciosa en sesiones largas.`,
      usos: [['Gaming', 'Sostiene el boost del procesador en partidas largas.'], ['Trabajo continuo', 'En escritorio y ofimática queda prácticamente inaudible.'], ['Renders y edición', 'Mantiene la temperatura con todos los núcleos ocupados.'], ['Silencio y eficiencia', 'Control PWM: gira más rápido solo cuando hace falta.']],
      compat: () => 'Compatible con Intel LGA 1700 y 1200 y con AMD AM5 y AM4, con los soportes incluidos. Conviene revisar la altura máxima de cooler del gabinete.',
      specs: (p) => [['Marca', marcaDe(p.n)], ['Modelo', p.n.replace('CPU Cooler ', '')], ['Tipo', 'Aire'], ['Socket compatible', 'Intel LGA 1700 / 1200, AMD AM5 / AM4'], ['Conector ventilador', 'PWM 4 pines'], ['Iluminación', /RGB|RAINBOW/i.test(p.n) ? 'ARGB' : 'No']],
    },
    mother: {
      que: '¿Qué es esta motherboard?',
      texto: (p) => `La ${p.n.replace('Motherboard ', '')} es una motherboard Micro ATX para procesadores ${nombreSocket(p.socket)} con memoria ${p.ram}. Une todos los componentes y define cuánto vas a poder ampliar tu PC.`,
      usos: [['Gaming', 'Ranura PCIe para la placa de video y M.2 para un SSD rápido.'], ['Oficina', 'Video por HDMI cuando el procesador tiene gráficos integrados.'], ['Ampliación', 'Lugar para sumar memoria y discos más adelante.'], ['Conectividad', 'USB, red y audio integrados.']],
      compat: (p) => `Socket ${nombreSocket(p.socket)} y memoria ${p.ram}. Entra en gabinetes Micro ATX y ATX.`,
      specs: (p) => [['Marca', marcaDe(p.n)], ['Modelo', p.n.replace('Motherboard ', '')], ['Socket', nombreSocket(p.socket)], ['Memoria', p.ram], ['Ranuras de memoria', String(p.slots || 2)], ['Formato', 'Micro ATX'], ['M.2 NVMe', 'Sí'], ['WiFi integrado', siNo(p.wifi)]],
    },
    ram: {
      que: '¿Qué es esta memoria?',
      texto: (p) => `La ${p.n.replace('Memoria RAM ', '')} es un módulo ${p.ram} para PC de escritorio. Con dos módulos iguales la memoria trabaja en doble canal y rinde más.`,
      usos: [['Gaming', '16 GB en dos módulos es lo recomendado para los juegos actuales.'], ['Multitarea', 'Más memoria, más programas abiertos sin demoras.'], ['Edición', 'Proyectos de foto y video más fluidos.'], ['Estética', 'Los modelos RGB suman iluminación al armado.']],
      compat: (p) => `Memoria ${p.ram}: va en motherboards ${p.ram}, un módulo por slot. Conviene usar módulos iguales en pares.`,
      specs: (p) => [['Marca', marcaDe(p.n)], ['Modelo', p.n.replace('Memoria RAM ', '')], ['Tipo', p.ram], ['Capacidad', `${busca(p.n, /(\d+)GB/i)} GB`], ['Frecuencia', `${busca(p.n, /(\d{4})\s*Mhz/i)} MHz`], ['RGB', siNo(/RGB/i.test(p.n))]],
    },
    video: {
      que: '¿Qué es esta placa de video?',
      texto: (p) => `La ${p.n.replace('Placa de Video ', '')} procesa los gráficos de tu PC. Para que rinda bien, acompañala con una fuente de las recomendadas para ella.`,
      usos: [['Gaming', 'Define la resolución y los cuadros por segundo de tus juegos.'], ['Diseño', 'Acelera programas de diseño y 3D.'], ['Edición de video', 'Exporta más rápido con aceleración por hardware.'], ['Streaming', 'Codifica la transmisión sin cargar al procesador.']],
      compat: (p) => `Ranura PCIe x16, presente en todas las motherboards de este armador. Necesita una fuente acorde a su consumo.`,
      specs: (p) => [['Marca', marcaDe(p.n)], ['Modelo', p.n.replace('Placa de Video ', '')], ['Memoria', `${busca(p.n, /(\d+)GB/i)} GB`], ['Tipo de memoria', busca(p.n, /(G?DDR\d)/i)], ['Interfaz', 'PCIe x16']],
    },
    discos: {
      que: '¿Qué es este disco?',
      texto: (p) => `El ${p.n.replace(/Disco (Sólido )?SSD /, 'SSD ')} es un disco de estado sólido: tu sistema y tus juegos arrancan y cargan mucho más rápido que con un disco rígido.`,
      usos: [['Sistema', 'Windows arranca en segundos.'], ['Gaming', 'Menos tiempo en las pantallas de carga.'], ['Trabajo', 'Abre programas y archivos al instante.'], ['Ampliación', 'Sumá un segundo disco para más espacio.']],
      compat: (p) => (/NVME/i.test(p.n) ? 'Va en la ranura M.2 de la motherboard (todas las de este armador la tienen).' : 'Se conecta por SATA; el cable viene con la motherboard.'),
      specs: (p) => [['Marca', marcaDe(p.n)], ['Modelo', p.n.replace(/Disco (Sólido )?SSD /, '')], ['Capacidad', busca(p.n, /(\d+\s*[GT]B)/i)], ['Interfaz', /NVME/i.test(p.n) ? 'M.2 NVMe' : 'SATA III'], ['Tipo', 'SSD']],
    },
    gabinete: {
      que: '¿Qué es este gabinete?',
      texto: (p) => `El ${p.n.replace(/Gabinete (Gamer )?/, '')} es la casa de tu PC: protege los componentes, ordena los cables y, con buen flujo de aire, mantiene todo fresco.`,
      usos: [['Flujo de aire', 'Entrada y salida de aire para mantener todo fresco.'], ['Estética', 'Panel lateral para lucir el armado.'], ['Orden', 'Espacio para esconder los cables.'], ['Ampliación', 'Lugar para sumar discos y ventiladores.']],
      compat: () => 'Admite motherboards Micro ATX y ATX y fuentes ATX. Conviene revisar el largo máximo de placa de video.',
      specs: (p) => [['Marca', marcaDe(p.n)], ['Modelo', p.n.replace(/Gabinete (Gamer )?/, '')], ['Formato', 'Mid tower'], ['Ventiladores incluidos', busca(p.n, /(\d)\s*Fans?/i, 'No')], ['Color', /WHITE/i.test(p.n) ? 'Blanco' : 'Negro'], ['Iluminación', /RGB/i.test(p.n) ? 'RGB' : 'No'], ['Fuente incluida', siNo(p.conFuente)]],
    },
    fuente: {
      que: '¿Qué es esta fuente?',
      texto: (p) => `La ${sinWatts(p.n)} alimenta a todos los componentes de tu PC. Una fuente confiable protege tu inversión.`,
      usos: [['Gaming', 'Alimenta la placa de video sin cortes.'], ['Uso continuo', 'Trabaja estable durante horas.'], ['Eficiencia', 'Las certificadas 80 PLUS desperdician menos energía.'], ['Ampliación', 'Margen de potencia para sumar componentes.']],
      compat: () => 'Formato ATX, para gabinetes estándar. En el resumen te avisamos si queda justa para tu placa de video.',
      specs: (p) => [['Marca', marcaDe(p.n)], ['Modelo', sinWatts(p.n)], ['Certificación', busca(p.n, /(80 PLUS \w+)/i, 'Sin certificación')], ['Formato', 'ATX']],
    },
    armado: {
      que: '¿Qué incluye?',
      texto: (p) => (p.p ? 'Ensamblamos tu PC, ordenamos los cables, actualizamos lo necesario y la testeamos antes de entregarla.' : 'Recibís los componentes en sus cajas para armarla vos.'),
      usos: [['Listo para usar', 'La enchufás y empezás.'], ['Testeada', 'La probamos antes de que salga.'], ['Garantía', '12 meses de garantía en la PC armada.'], ['Plazo', 'Lista en 48 hs hábiles.']],
      compat: () => 'Para cualquier armado de este armador.',
      specs: (p) => [['Servicio', p.n], ['Plazo', p.p ? '48 hs hábiles' : '—']],
    },
    so: {
      que: '¿Qué incluye?',
      texto: (p) => (p.id === 10648 ? 'Instalamos Windows 11 (versión gratuita, sin licencia): queda sin activar, con el aviso de activación.' : 'Licencia original de Windows 11 Pro para una PC.'),
      usos: [['Lista para usar', 'Llega con el sistema instalado.'], ['Actualizada', 'Con las últimas actualizaciones.'], ['Drivers', 'Con los controladores necesarios.'], ['Soporte', 'Te ayudamos si tenés dudas.']],
      compat: () => 'La instalación va con el servicio de armado.',
      specs: (p) => [['Producto', p.n], ['Versión', 'Windows 11']],
    },
    monitor: {
      que: '¿Qué es este monitor?',
      texto: (p) => `El ${p.n.replace(/Monitor (Gamer )?/, '')} es un monitor de ${busca(p.n, /(\d+)"/)} pulgadas. Para gaming conviene 144 Hz o más; para trabajo, tamaño y resolución.`,
      usos: [['Gaming', 'Más hercios, movimientos más fluidos.'], ['Trabajo', 'Espacio para varias ventanas.'], ['Estudio', 'Clases y videollamadas cómodas.'], ['Entretenimiento', 'Series y películas en Full HD.']],
      compat: () => 'Se conecta por HDMI (y DisplayPort o VGA según el modelo).',
      specs: (p) => [['Marca', marcaDe(p.n)], ['Modelo', p.n.replace(/Monitor (Gamer )?/, '')], ['Tamaño', `${busca(p.n, /(\d+)"/)}"`], ['Frecuencia', busca(p.n, /(\d+\s*Hz)/i, '60Hz')], ['Panel', busca(p.n, /\b(IPS|VA)\b/, 'LED')]],
    },
    perif: {
      que: '¿Qué es este periférico?',
      texto: (p) => `${p.n}. Completa tu setup con la comodidad y la precisión que necesitás.`,
      usos: [['Gaming', 'Precisión y respuesta rápida.'], ['Trabajo', 'Cómodo para muchas horas.'], ['Estudio', 'Simple y confiable.'], ['Estética', 'Combina con tu setup.']],
      compat: () => 'Se conecta por USB; no necesita drivers.',
      specs: (p) => [['Marca', marcaDe(p.n)], ['Modelo', p.n], ['Conexión', 'USB']],
    },
    wifi: {
      que: '¿Qué es esta placa?',
      texto: (p) => `${p.n}: le da conexión inalámbrica a tu PC cuando el cable no llega.`,
      usos: [['Conexión', 'Internet sin cables.'], ['Gaming online', 'Las de doble banda bajan la latencia.'], ['Streaming', 'Más estabilidad en 5 GHz.'], ['Bluetooth', 'Algunas suman Bluetooth.']],
      compat: (p) => (/PCI/i.test(p.n) ? 'Va en una ranura PCIe de la motherboard.' : 'Se conecta a un puerto USB.'),
      specs: (p) => [['Marca', marcaDe(p.n)], ['Modelo', p.n], ['Conexión', /PCI/i.test(p.n) ? 'PCIe' : 'USB'], ['Estándar', /AX/i.test(p.n) ? 'WiFi 6' : /AC/i.test(p.n) ? 'WiFi 5' : 'WiFi 4']],
    },
  };

  // ---------- Estado ----------
  // elegido[paso]: null (sin elegir), 'no' / 'tengo' (salteado), 'omitido' ("Omitir este componente por ahora": sigue
  // pendiente, pero el armador no vuelve a abrirlo solo) o [{ id, cant }]
  const elegido = Object.fromEntries(PASOS.map((p) => [p.clave, null]));
  const vista = Object.fromEntries(PASOS.map((p) => [p.clave, { chip: null, orden: 'menor', texto: '' }]));
  // nota[paso]: la pieza que el armador quitó y por qué ({ nombre, texto }); queda en la cabecera hasta elegir otra
  const nota = {};
  // Solo para la demostración (en el sitio real lo dicen el catálogo y el carrito): un paso sin compatibles, uno sin
  // productos y si "Agregar al carrito" falla
  const demo = { sinCompatibles: null, sinProductos: null };
  let abierto = 'micro';

  const unica = (clave) => (Array.isArray(elegido[clave]) ? pieza(clave, elegido[clave][0].id) : null);
  const nombreSocket = (s) => (s === '1700' ? 'Intel 1700' : s);
  const pendiente = (clave) => elegido[clave] === null || elegido[clave] === 'omitido';
  const salteado = (clave) => elegido[clave] === 'no' || elegido[clave] === 'tengo';
  const conServicio = (clave, id) => Array.isArray(elegido[clave]) && elegido[clave][0].id === id;
  // En minúscula solo la inicial: 'Memoria RAM' → 'memoria RAM', 'Placa WiFi' → 'placa WiFi'
  const minus = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  const listaY = (l) => (l.length > 1 ? `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}` : l[0] || '');
  const titulos = (claves) => listaY(claves.map((k) => minus(porClave[k].titulo)));

  // Memoria: los módulos ocupan los slots de la motherboard (sin motherboard, hasta 4)
  const ocupados = () => (Array.isArray(elegido.ram) ? elegido.ram.reduce((s, e) => s + e.cant, 0) : 0);
  const slots = () => (unica('mother') ? unica('mother').slots || 2 : porClave.ram.cantidad.max);

  // La actualización de BIOS se suma sola cuando el procesador la pide y la motherboard no la trae
  const necesitaBios = () => Boolean(unica('micro')?.biosNueva && unica('mother')?.biosVieja);

  // Servicios en pausa: el armado, mientras falte alguno de los principales; la instalación, mientras el armado esté
  // en pausa. No se suman al total ni al carrito hasta completar la PC
  function pausas() {
    const faltan = PRINCIPALES.filter(pendiente);
    const armado = conServicio('armado', ID_ARMADO) && faltan.length > 0;
    return { faltan, armado, so: armado && conServicio('so', ID_INSTALACION) };
  }

  // Compatibilidad: lo que impone lo ya elegido
  function compatible(clave, p) {
    const micro = unica('micro');
    const mother = unica('mother');
    if (demo.sinCompatibles === clave) return false;
    if (clave === 'mother' && micro && p.socket !== micro.socket) return false;
    if (clave === 'micro' && mother && p.socket !== mother.socket) return false;
    if (clave === 'ram' && mother && p.ram !== mother.ram) return false;
    return true;
  }

  function motivoFiltro(clave) {
    const micro = unica('micro');
    const mother = unica('mother');
    if (clave === 'mother' && micro) return `Te mostramos las compatibles con tu procesador (${nombreSocket(micro.socket)}).`;
    if (clave === 'micro' && mother) return `Te mostramos los compatibles con tu motherboard (${nombreSocket(mother.socket)}). Para ver otros, cambiá la motherboard.`;
    if (clave === 'ram' && mother) return `Te mostramos las ${mother.ram}, las que acepta tu motherboard.`;
    return '';
  }

  // Pasos que ponen límites a otro: en un paso sin compatibles, un botón por cada pieza en conflicto para cambiarla
  // (el cooler, por el socket del procesador y la altura que admite el gabinete)
  const LIMITAN = { micro: ['mother'], mother: ['micro'], ram: ['mother'], cooler: ['micro', 'gabinete'] };
  const conflictos = (clave) => (LIMITAN[clave] || []).filter((k) => Array.isArray(elegido[k]));

  // Avisos de cada paso, como los del sitio (según lo ya elegido), en tres tonos: exito (bien), info y alerta
  function avisosPaso(clave) {
    const micro = unica('micro');
    const mother = unica('mother');
    const video = unica('video');
    const gabinete = unica('gabinete');
    const pausa = pausas();
    const lista = [];
    if (clave === 'cooler' && micro && !micro.sinCooler)
      lista.push(['exito', 'El procesador que elegiste ya viene con cooler incluido: no necesitás agregar uno, podés marcar “No incluir cooler” y seguir. Si le vas a exigir mucho o querés un equipo más silencioso, un cooler dedicado siempre suma.']);
    if (clave === 'cooler' && micro?.sinCooler) lista.push(['alerta', 'Tu procesador viene sin cooler: elegí uno para que pueda funcionar.']);
    if (clave === 'video' && micro?.video) lista.push(['info', 'Tu procesador tiene gráficos integrados: si no vas a jugar ni editar, podés no incluir placa de video.']);
    if (clave === 'video' && micro && !micro.video) lista.push(['alerta', 'Tu procesador no tiene gráficos integrados: necesitás una placa de video para tener imagen.']);
    if ((clave === 'micro' || clave === 'mother') && necesitaBios())
      lista.push(['alerta', `Para usar tu procesador, esta motherboard necesita una actualización de BIOS: sumamos el servicio a tu armado (${pesos(BIOS.p)}).`]);
    if (clave === 'ram') {
      if (!mother) lista.push(['info', 'Recomendado: 2 módulos iguales, así la memoria trabaja en doble canal.']);
      else if (ocupados() >= slots()) lista.push(['info', `Ocupaste los ${slots()} slots de tu motherboard: para sumar otro módulo, sacá uno de los que elegiste.`]);
      else lista.push(['info', `Tu motherboard tiene ${slots()} slots de memoria: podés combinar modelos hasta ocuparlos. Recomendado: módulos iguales de a pares, así trabajan en doble canal.`]);
      if (Array.isArray(elegido.ram) && elegido.ram.length > 1) lista.push(['alerta', 'Combinaste modelos distintos: funcionan juntos, pero rinden al nivel del más lento y pierden el doble canal si no quedan de a pares iguales.']);
    }
    if (clave === 'fuente' && gabinete?.conFuente)
      lista.push(['exito', 'El gabinete que elegiste ya trae fuente: no necesitás agregar otra, podés marcar “No agregar fuente” y seguir. Si preferís una de mejor calidad, elegila acá.']);
    if (clave === 'fuente' && video) lista.push(['info', 'Elegí una fuente de las recomendadas para tu placa de video.']);
    if (clave === 'wifi' && mother)
      lista.push(mother.wifi
        ? ['exito', 'Tu motherboard ya trae WiFi: no necesitás una placa, podés marcar “No agregar placa WiFi” y seguir.']
        : ['info', 'Tu motherboard no trae WiFi: si la PC va a estar lejos del router y no llegás con cable, sumá una placa.']);
    if (clave === 'armado' && pausa.armado) lista.push(['info', `El armado queda en pausa hasta que elijas ${titulos(pausa.faltan)}: mientras tanto no se suma al total.`]);
    if (clave === 'so' && pausa.so) lista.push(['info', 'La instalación queda en pausa mientras el armado esté en pausa: no se suma al total.']);
    else if (clave === 'so' && !conServicio('armado', ID_ARMADO)) lista.push(['info', 'La instalación del sistema operativo va con el servicio de armado.']);
    return lista;
  }

  // Al cambiar el procesador o la motherboard, lo que deja de ser compatible se quita (y queda la marca en su paso);
  // la memoria se ajusta a los slots de la motherboard
  const CAUSA = { micro: 'No era compatible con tu motherboard', mother: 'No era compatible con tu procesador', ram: 'No era compatible con tu motherboard' };

  function revisarCompatibilidad() {
    const mensajes = [];
    const quitados = [];
    for (const clave of ['micro', 'mother', 'ram']) {
      const lista = elegido[clave];
      if (!Array.isArray(lista)) continue;
      const quedan = lista.filter((e) => compatible(clave, pieza(clave, e.id)));
      if (quedan.length < lista.length) {
        elegido[clave] = quedan.length ? quedan : null;
        if (!quedan.length) nota[clave] = { nombre: pieza(clave, lista[0].id).n, texto: CAUSA[clave] };
        quitados.push(minus(porClave[clave].titulo));
      }
    }
    if (quitados.length) mensajes.push(`Quitamos ${quitados.join(' y ')}: no era compatible`);
    let sobran = ocupados() - slots();
    if (sobran > 0) {
      const lista = elegido.ram.map((e) => ({ ...e }));
      for (; sobran > 0; sobran--) {
        const ultimo = lista[lista.length - 1];
        if (ultimo.cant > 1) ultimo.cant--;
        else lista.pop();
      }
      elegido.ram = lista;
      mensajes.push(`Memoria ajustada a los ${slots()} slots`);
    }
    if (mensajes.length) avisar(mensajes.join('. '));
  }

  // ---------- Pintar los pasos ----------

  const AVISO_ICONO = { exito: 'i-check', alerta: 'i-alerta', info: 'i-ayuda' };

  $('[data-pasos-arm]').innerHTML = PASOS.map(
    (p, i) => `<li class="paso-arm" data-paso="${p.clave}" id="paso-${p.clave}">
      <div class="paso-arm__cab">
        <button class="paso-arm__abrir" type="button" aria-expanded="false" aria-controls="cuerpo-${p.clave}" data-abrir="${p.clave}">
          <span class="paso-arm__marca" data-marca>
            <span class="paso-arm__n">${i + 1}</span>
            <img class="paso-arm__foto" alt="" width="400" height="400" hidden>
            <span class="paso-arm__insignia" aria-hidden="true">${icono('i-check')}<span>${i + 1}</span></span>
            <span class="paso-arm__mas" hidden></span>
          </span>
          <span class="paso-arm__textos">
            <span class="paso-arm__titulo">${p.titulo}${p.opcional ? '<span class="paso-arm__opcional">Opcional</span>' : ''}</span>
            <span class="paso-arm__elegido" data-elegido-texto></span>
            <span class="paso-arm__precio" data-elegido-precio></span>
            <span class="paso-arm__estado" data-estado-paso hidden></span>
          </span>
          ${icono('i-abajo', 'icono icono--s paso-arm__flecha')}
        </button>
        <div class="paso-arm__acciones" data-acciones hidden>
          <button class="paso-arm__cambiar" type="button" data-abrir="${p.clave}">Cambiar</button>
          <button class="boton-icono paso-arm__quitar" type="button" data-quitar aria-label="Quitar ${minus(p.titulo)}">${icono('i-cerrar')}</button>
        </div>
      </div>
      <div class="paso-arm__cuerpo" id="cuerpo-${p.clave}" hidden>
        <p class="paso-arm__ayuda">${p.ayuda}</p>
        <div class="paso-arm__avisos" data-avisos-paso hidden></div>
        ${p.saltar ? `<div class="saltos">
          <button class="salto" type="button" data-saltar="no" aria-pressed="false">${icono('i-cerrar')}${p.saltar}</button>
          ${p.saltar2 ? `<button class="salto" type="button" data-saltar="tengo" aria-pressed="false">${icono('i-check')}${p.saltar2}</button>` : ''}
        </div>` : ''}
        <p class="paso-arm__filtro" data-filtro hidden>${icono('i-check')}<span></span></p>
        ${p.cantidad ? '<div class="slots-arm" data-slots></div>' : ''}
        ${p.buscar ? `<div class="herramientas-arm">
          <label class="buscar-arm">${icono('i-buscar')}<span class="sr-only">${p.buscar}</span><input class="buscar-arm__campo" type="search" placeholder="${p.buscar}" data-buscar autocomplete="off"></label>
          ${p.chips ? `<div class="chips-arm" role="group" aria-label="Filtrar ${minus(p.titulo)}"><button class="chip-arm" type="button" data-chip="" aria-pressed="true">Todas</button>${p.chips.map(([t], j) => `<button class="chip-arm" type="button" data-chip="${j}" aria-pressed="false">${t}</button>`).join('')}</div>` : ''}
        </div>` : ''}
        <div class="paso-arm__resultados"><p class="paso-arm__cuenta" data-cuenta-paso></p>${p.buscar ? `<label class="orden-arm"><span class="sr-only">Ordenar</span><span class="selector"><select class="selector__campo" data-orden><option value="menor">Menor a mayor</option><option value="mayor">Mayor a menor</option></select>${icono('i-abajo', 'icono icono--s selector__flecha')}</span></label>` : ''}</div>
        <ul class="piezas" data-piezas></ul>
        <div class="paso-arm__pie">
          ${p.total > p.piezas.length ? `<button class="boton boton--secundario paso-arm__mas-productos" type="button" data-mas-productos>${icono('i-abajo')}<span>Ver más <span class="paso-arm__mas-palabra">productos </span>(<span data-restantes></span> restantes)</span></button>` : ''}
          ${p.max > 1 ? `<button class="boton boton--primario paso-arm__listo" type="button" data-listo>Listo, seguir${icono('i-flecha')}</button>` : ''}
          ${p.opcional ? '' : `<button class="boton-texto boton-texto--suave paso-arm__omitir" type="button" data-saltar="omitido" aria-pressed="false">${icono('i-reloj')}Omitir este componente por ahora</button>`}
        </div>
      </div>
    </li>`
  ).join('');

  function pintarPiezas(clave) {
    const paso = porClave[clave];
    const li = $(`[data-paso="${clave}"]`);
    const { chip, orden, texto } = vista[clave];
    const elegidos = Array.isArray(elegido[clave]) ? elegido[clave] : [];
    const catalogo = demo.sinProductos === clave ? [] : paso.piezas;
    let piezas = catalogo.filter((p) => compatible(clave, p));
    const compatibles = piezas.length;
    if (chip !== null && paso.chips) piezas = piezas.filter((p) => paso.chips[chip][1](p.n));
    if (texto) {
      const palabras = normalizar(texto).split(/\s+/).filter(Boolean);
      piezas = piezas.filter((p) => palabras.every((w) => normalizar(p.n).includes(w)));
    }
    piezas = [...piezas].sort((a, b) => (orden === 'menor' ? a.p - b.p : b.p - a.p));
    const libres = slots() - ocupados();

    // Paso sin productos: la sección vacía o nada compatible con lo elegido (un botón por cada pieza en conflicto).
    // Se esconden el buscador, los filtros, la cantidad y "Ver más productos"
    const vacio = !catalogo.length ? 'seccion' : !compatibles ? 'compatibles' : null;
    li.classList.toggle('paso-arm--vacio', Boolean(vacio));
    const enConflicto = conflictos(clave);

    $('[data-piezas]', li).innerHTML = vacio === 'seccion'
      ? `<li class="piezas__vacio">${icono('i-caja', 'icono')}<strong class="piezas__vacio-titulo">Por ahora no hay productos en esta sección</strong><span>Estamos reponiendo stock: seguí con el resto del armado y volvé más tarde.</span><span class="piezas__vacio-acciones"><button class="boton boton--secundario" type="button" data-listo>Seguir con el armado${icono('i-flecha')}</button></span></li>`
      : vacio === 'compatibles'
        ? `<li class="piezas__vacio">${icono('i-alerta', 'icono')}<strong class="piezas__vacio-titulo">No hay productos compatibles con lo que elegiste</strong><span>${enConflicto.length ? `Para ver opciones, cambiá ${enConflicto.length > 1 ? 'alguna de estas piezas' : 'esta pieza'}:` : 'Cambiá alguna de las piezas que elegiste para ver opciones.'}</span>${enConflicto.length ? `<span class="piezas__vacio-acciones">${enConflicto.map((k) => `<button class="boton boton--secundario" type="button" data-abrir="${k}">Cambiar ${minus(porClave[k].titulo)}</button>`).join('')}</span>` : ''}</li>`
        : piezas.length
          ? piezas
              .map((p) => {
                const sel = elegidos.find((e) => e.id === p.id);
                // Memoria: módulos de cada modelo elegido, hasta ocupar los slots de la motherboard
                const cant = sel && paso.cantidad
                  ? `<div class="pieza__cant"><button class="cantidad__btn" type="button" data-cant="-1" data-id="${p.id}" aria-label="Un módulo menos"${sel.cant <= paso.cantidad.min ? ' disabled' : ''}>${icono('i-menos')}</button><span>${sel.cant} ${sel.cant === 1 ? 'módulo' : 'módulos'}</span><button class="cantidad__btn" type="button" data-cant="1" data-id="${p.id}" aria-label="Un módulo más"${sel.cant >= paso.cantidad.max || libres <= 0 ? ' disabled' : ''}>${icono('i-mas')}</button></div>`
                  : '';
                return `<li class="pieza${sel ? ' pieza--elegida elegida' : ''}">
                  <button class="pieza__btn" type="button" data-pieza="${p.id}" aria-pressed="${Boolean(sel)}">
                    <span class="pieza__media"><img src="${p.img}" alt="" width="400" height="400" loading="lazy">${p.a ? `<span class="etiqueta etiqueta--secundaria pieza__ahorro">Ahorrá ${pesos(p.a - p.p)}</span>` : ''}</span>
                    <span class="pieza__nombre">${p.n}</span>
                    <span class="pieza__precios">${p.a ? `<s class="pieza__antes"><span class="sr-only">Antes: </span>${pesos(p.a)}</s>` : ''}<span class="pieza__precio">${p.p ? pesos(p.p) : 'Sin cargo'}</span><span class="pieza__nota">${p.p ? 'Efectivo o transferencia' : '&nbsp;'}</span></span>
                    <span class="pieza__marca">${icono('i-check')}</span>
                  </button>
                  <button class="pieza__info" type="button" data-info="${p.id}" aria-label="Ver especificaciones de ${p.n}">+ info</button>
                  ${cant}
                </li>`;
              })
              .join('')
          : `<li class="piezas__vacio">${icono('i-buscar', 'icono')}<span>No encontramos productos${texto ? ` para “${texto}”` : ' con este filtro'}.</span></li>`;

    // Cuántos se ven y cuántos hay en el catálogo (el total es de muestra; con filtros, los que quedan)
    const filtrando = chip !== null || texto || compatibles < paso.piezas.length;
    const total = filtrando ? piezas.length : paso.total;
    $('[data-cuenta-paso]', li).innerHTML = `Mostrando <strong>${piezas.length}</strong> de <strong>${total}</strong> ${total === 1 ? 'producto' : 'productos'}`;
    const mas = $('[data-mas-productos]', li);
    if (mas) {
      mas.hidden = filtrando;
      $('[data-restantes]', mas).textContent = paso.total - piezas.length;
    }

    const motivo = vacio ? '' : motivoFiltro(clave);
    const filtro = $('[data-filtro]', li);
    filtro.hidden = !motivo;
    $('span', filtro).textContent = motivo;

    // Slots de memoria: los ocupados en verde, sobre los que tiene la motherboard
    const caja = $('[data-slots]', li);
    if (caja) {
      const hay = slots();
      const usados = Math.min(ocupados(), hay);
      caja.innerHTML = `<p class="slots-arm__texto">${unica('mother') ? `Slots de memoria ocupados <strong>${usados} de ${hay}</strong>` : `Módulos elegidos <strong>${usados}</strong> · los slots dependen de la motherboard`}</p>
        <span class="slots-arm__slots${unica('mother') ? '' : ' slots-arm__slots--sin-mother'}" aria-hidden="true">${Array.from({ length: hay }, (_, n) => `<span class="slots-arm__slot${n < usados ? ' marcado' : ''}"></span>`).join('')}</span>`;
      caja.classList.toggle('slots-arm--completo', Boolean(unica('mother')) && usados >= hay);
    }

    const avisos = avisosPaso(clave);
    const lugar = $('[data-avisos-paso]', li);
    lugar.hidden = !avisos.length;
    lugar.innerHTML = avisos.map(([tono, t]) => `<p class="aviso-paso aviso-paso--${tono}">${icono(AVISO_ICONO[tono])}<span>${t}</span></p>`).join('');

    $$('[data-chip]', li).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.chip === String(chip ?? ''))));
    $$('[data-saltar]', li).forEach((b) => {
      const marcado = elegido[clave] === b.dataset.saltar;
      b.setAttribute('aria-pressed', String(marcado));
      b.classList.toggle('marcado', marcado);
    });
  }

  // ---------- Resumen ----------

  const resumen = document.querySelector('[data-resumen-arm]');
  const barra = document.querySelector('[data-barra-arm]');
  const agregar = $('[data-agregar-arm]', resumen);
  const agregarBarra = $('[data-agregar-barra]', barra);
  let agregando = false;

  // Cada producto del armado; la actualización de BIOS va después de la motherboard. Los servicios en pausa quedan
  // en la lista pero no se cobran (cobrables)
  function lineas() {
    const pausa = pausas();
    const out = [];
    for (const paso of PASOS) {
      const e = elegido[paso.clave];
      if (Array.isArray(e)) for (const { id, cant } of e) out.push({ paso, p: pieza(paso.clave, id), cant, pausada: Boolean(pausa[paso.clave]) });
      if (paso.clave === 'mother' && necesitaBios()) out.push({ paso, p: BIOS, cant: 1, pausada: false, solo: true });
    }
    return out;
  }

  const cobrables = () => lineas().filter((l) => !l.pausada);
  const totalEfectivo = () => cobrables().reduce((s, l) => s + l.p.p * l.cant, 0);

  function avisos() {
    const lista = [];
    const micro = unica('micro');
    const video = unica('video');
    const fuente = unica('fuente');
    const pausa = pausas();
    if (micro && !micro.video && (elegido.video === 'no' || pendiente('video')))
      lista.push(['alerta', 'Tu procesador no tiene gráficos integrados: vas a necesitar una placa de video.', 'video']);
    if (micro?.sinCooler && !Array.isArray(elegido.cooler))
      lista.push(['alerta', 'Tu procesador viene sin cooler: sumá uno para que funcione.', 'cooler']);
    if (video && fuente && fuente.w < video.w)
      lista.push(['alerta', 'La fuente que elegiste queda justa para tu placa de video: te recomendamos una de más potencia.', 'fuente']);
    if (conServicio('so', ID_INSTALACION) && !conServicio('armado', ID_ARMADO))
      lista.push(['alerta', 'La instalación del sistema operativo va con el servicio de armado.', 'armado']);
    if (pausa.armado)
      lista.push(['info', `${pausa.so ? 'El armado y la instalación del sistema quedan' : 'El armado queda'} en pausa hasta que elijas ${titulos(pausa.faltan)}.`, pausa.faltan[0]]);
    else if (lineas().length && pausa.faltan.length)
      lista.push(['info', `Para una PC completa te falta: ${pausa.faltan.map((k) => minus(porClave[k].titulo)).join(', ')}.`, pausa.faltan[0]]);
    return lista;
  }

  // Marca fija en la cabecera del paso (y su línea en "Tu armado"): pieza quitada, paso omitido, servicio en pausa
  // o el servicio que suma. [tono, ícono, texto]
  function estadoPaso(clave, pausa) {
    if (elegido[clave] === 'omitido') return ['neutro', 'i-reloj', 'Omitido por ahora'];
    if (elegido[clave] === null && nota[clave]) return ['aviso', 'i-alerta', nota[clave].texto];
    if (pausa[clave]) return ['info', 'i-reloj', 'En pausa hasta completar la PC'];
    if (clave === 'mother' && necesitaBios()) return ['info', 'i-herramienta', 'Suma la actualización de BIOS'];
    return null;
  }

  const marcaEstado = (estado, clase) => (estado ? `<span class="${clase} ${clase}--${estado[0]}">${icono(estado[1])}<span>${estado[2]}</span></span>` : '');

  function pintarResumen() {
    const pausa = pausas();
    const cobrar = cobrables();
    const total = totalEfectivo();
    const componentes = cobrar.reduce((s, l) => s + l.cant, 0);
    const hechos = PRINCIPALES.filter((k) => !pendiente(k)).length;

    $('[data-resumen-lista]', resumen).innerHTML = PASOS.map((paso) => {
      const e = elegido[paso.clave];
      const estado = estadoPaso(paso.clave, pausa);
      let texto = '<span class="resumen-arm__vacio">Sin elegir</span>';
      let precio = '';
      if (e === 'no') texto = '<span class="resumen-arm__vacio">No incluido</span>';
      if (e === 'tengo') texto = '<span class="resumen-arm__vacio">Ya tengo</span>';
      if (e === 'omitido' || (e === null && nota[paso.clave])) texto = marcaEstado(estado, 'resumen-arm__nota');
      if (Array.isArray(e)) {
        texto = e.map(({ id, cant }) => `<span class="resumen-arm__nombre">${cant > 1 ? `${cant} × ` : ''}${pieza(paso.clave, id).n}</span>`).join('');
        if (pausa[paso.clave]) texto += marcaEstado(estado, 'resumen-arm__nota');
        precio = pesos(e.reduce((s, { id, cant }) => s + pieza(paso.clave, id).p * cant, 0));
      }
      const foto = Array.isArray(e) ? `<img class="resumen-arm__foto" src="${pieza(paso.clave, e[0].id).img}" alt="" width="400" height="400">` : '<span class="resumen-arm__foto resumen-arm__foto--vacia"></span>';
      const fila = `<li class="resumen-arm__fila${Array.isArray(e) ? ' resumen-arm__fila--elegida' : ''}${pausa[paso.clave] ? ' resumen-arm__fila--pausada' : ''}">
        <button class="resumen-arm__abrir" type="button" data-abrir="${paso.clave}">${foto}<span class="resumen-arm__textos"><span class="resumen-arm__paso">${paso.titulo}</span><span class="resumen-arm__dato">${texto}</span></span></button>
        <span class="resumen-arm__precio">${precio}</span>
        ${e !== null ? `<button class="boton-icono resumen-arm__quitar" type="button" data-quitar="${paso.clave}" aria-label="Quitar ${minus(paso.titulo)}">${icono('i-cerrar')}</button>` : '<span></span>'}
      </li>`;
      // La actualización de BIOS: se suma sola y no se quita (se va al cambiar el procesador o la motherboard)
      const bios = paso.clave === 'mother' && necesitaBios()
        ? `<li class="resumen-arm__fila resumen-arm__fila--elegida resumen-arm__fila--servicio">
        <button class="resumen-arm__abrir" type="button" data-abrir="mother"><span class="resumen-arm__foto resumen-arm__foto--icono">${icono('i-herramienta')}</span><span class="resumen-arm__textos"><span class="resumen-arm__paso">Actualización de BIOS</span><span class="resumen-arm__dato"><span class="resumen-arm__nombre">${BIOS.n}</span>${marcaEstado(['info', 'i-check', 'Se sumó solo: lo pide tu procesador'], 'resumen-arm__nota')}</span></span></button>
        <span class="resumen-arm__precio">${pesos(BIOS.p)}</span>
        <span></span>
      </li>`
        : '';
      return fila + bios;
    }).join('');

    $('[data-resumen-avisos]', resumen).innerHTML = avisos()
      .map(([tipo, texto, clave]) => `<li class="aviso-arm aviso-arm--${tipo}">${icono(tipo === 'alerta' ? 'i-alerta' : 'i-ayuda')}<span>${texto} <button class="boton-texto" type="button" data-abrir="${clave}">Ver</button></span></li>`)
      .join('');

    $('[data-progreso-texto]', resumen).textContent = `${hechos} de ${PRINCIPALES.length}`;
    $('[data-progreso]', resumen).style.setProperty('--progreso', `${(hechos / PRINCIPALES.length) * 100}%`);

    document.querySelectorAll('[data-total-arm]').forEach((n) => (n.textContent = pesos(total)));
    document.querySelectorAll('[data-cant-arm]').forEach((n) => (n.textContent = `${componentes} ${componentes === 1 ? 'componente' : 'componentes'}`));
    $('[data-cuotas-arm]', resumen).innerHTML = total ? `Pagalo en <strong>3 cuotas sin interés</strong> de <strong>${pesos(lista(total) / 3)}</strong>` : 'Elegí al menos un componente';
    $('[data-ver-cuotas]', resumen).hidden = !total;
    $('[data-lista-arm]', resumen).textContent = total ? `Precio de lista ${pesos(lista(total))}` : '';
    agregar.disabled = !total;
    agregarBarra.disabled = !total;
    if (!agregando) textosAgregar();
    barra.classList.toggle('barra-arm--visible', total > 0);

    // Cabecera de cada paso: la foto de lo elegido (con el número del paso), su nombre, su precio, "Cambiar" y la
    // marca fija del estado (pieza quitada, omitido, en pausa)
    for (const [i, paso] of PASOS.entries()) {
      const li = $(`[data-paso="${paso.clave}"]`);
      const e = elegido[paso.clave];
      const elegida = Array.isArray(e);
      const quitada = e === null && nota[paso.clave];
      li.classList.toggle('paso-arm--hecho', !pendiente(paso.clave));
      li.classList.toggle('paso-arm--con-foto', elegida);
      li.classList.toggle('paso-arm--salteado', salteado(paso.clave));
      li.classList.toggle('paso-arm--omitido', e === 'omitido');
      li.classList.toggle('paso-arm--quitado', Boolean(quitada));
      li.classList.toggle('paso-arm--pausado', Boolean(pausa[paso.clave]));
      const foto = $('.paso-arm__foto', li);
      foto.hidden = !elegida;
      if (elegida) foto.src = pieza(paso.clave, e[0].id).img;
      const mas = $('.paso-arm__mas', li);
      mas.hidden = !(elegida && e.length > 1);
      if (elegida) mas.textContent = `+${e.length - 1}`;
      $('.paso-arm__n', li).textContent = salteado(paso.clave) ? '–' : i + 1;
      // Quitada: el nombre de la que estaba, tachado
      $('[data-elegido-texto]', li).textContent =
        e === 'no' ? 'No incluido' : e === 'tengo' ? 'Ya tengo' : elegida ? e.map(({ id, cant }) => `${cant > 1 ? `${cant} × ` : ''}${pieza(paso.clave, id).n}`).join(' + ') : quitada?.nombre || 'Sin elegir';
      $('[data-elegido-precio]', li).textContent = elegida ? pesos(e.reduce((s, { id, cant }) => s + pieza(paso.clave, id).p * cant, 0)) : '';
      const estado = estadoPaso(paso.clave, pausa);
      const marca = $('[data-estado-paso]', li);
      marca.hidden = !estado;
      marca.className = `paso-arm__estado${estado ? ` paso-arm__estado--${estado[0]}` : ''}`;
      marca.innerHTML = estado ? `${icono(estado[1])}<span>${estado[2]}</span>` : '';
      $('[data-acciones]', li).hidden = e === null || abierto === paso.clave;
    }
  }

  // ---------- Abrir y avanzar ----------

  function abrir(clave, { desplazar = true } = {}) {
    abierto = clave;
    for (const paso of PASOS) {
      const li = $(`[data-paso="${paso.clave}"]`);
      const esta = paso.clave === clave;
      li.classList.toggle('paso-arm--abierto', esta);
      $('.paso-arm__abrir', li).setAttribute('aria-expanded', String(esta));
      $('.paso-arm__cuerpo', li).hidden = !esta;
      $('[data-acciones]', li).hidden = elegido[paso.clave] === null || esta;
    }
    if (clave) {
      pintarPiezas(clave);
      if (desplazar) {
        const li = $(`[data-paso="${clave}"]`);
        requestAnimationFrame(() => li.scrollIntoView({ behavior: sinMovimiento.matches ? 'auto' : 'smooth', block: 'start' }));
      }
    }
  }

  // El siguiente paso sin decidir (después del actual, y si no hay, desde el principio); los omitidos no se reabren
  function siguiente(clave) {
    const i = PASOS.findIndex((p) => p.clave === clave);
    const orden = [...PASOS.slice(i + 1), ...PASOS.slice(0, i)];
    return orden.find((p) => elegido[p.clave] === null)?.clave || null;
  }

  function cambio(clave, { avanzar = true } = {}) {
    // Con algo decidido en el paso, la marca de la pieza quitada se va
    if (elegido[clave] !== null) delete nota[clave];
    // De muestra: cambiar una de las piezas en conflicto vuelve a mostrar los compatibles
    if (demo.sinCompatibles && LIMITAN[demo.sinCompatibles].includes(clave)) demo.sinCompatibles = null;
    revisarCompatibilidad();
    pintarResumen();
    escribirUrl();
    if (avanzar) abrir(siguiente(clave));
    else if (abierto === clave) pintarPiezas(clave);
  }

  // Elegir o quitar una pieza (desde la grilla o desde la ficha)
  function elegir(clave, id) {
    const paso = porClave[clave];
    const actual = Array.isArray(elegido[clave]) ? elegido[clave] : [];
    const ya = actual.find((x) => x.id === id);
    const resto = actual.filter((x) => x.id !== id);
    if (paso.cantidad) {
      // Memoria: varios modelos a la vez, cada uno con sus módulos, hasta ocupar los slots; se queda abierta
      const libres = slots() - ocupados();
      if (ya) elegido[clave] = resto.length ? resto : null;
      else if (libres > 0) elegido[clave] = [...actual, { id, cant: actual.length ? 1 : Math.min(paso.cantidad.inicial, libres) }];
      else return avisar(`Ocupaste los ${slots()} slots de memoria`);
      cambio(clave, { avanzar: false });
    } else if ((paso.max || 1) > 1) {
      // Varios: se suman y se quitan; al llegar al máximo, sigue al próximo paso
      if (ya) elegido[clave] = resto.length ? resto : null;
      else if (actual.length < paso.max) elegido[clave] = [...actual, { id, cant: 1 }];
      else return avisar(`Podés elegir hasta ${paso.max}`);
      cambio(clave, { avanzar: !ya && elegido[clave].length === paso.max });
    } else if (ya) {
      elegido[clave] = null;
      cambio(clave, { avanzar: false });
    } else {
      elegido[clave] = [{ id, cant: 1 }];
      cambio(clave);
    }
  }

  // ---------- Ficha "+ info" ----------

  const ficha = document.querySelector('[data-ficha-arm]');
  let enFicha = null;

  function abrirFicha(clave, id) {
    const p = pieza(clave, id);
    const f = FICHAS[clave];
    enFicha = { clave, id };
    $('[data-ficha-img]', ficha).src = p.img;
    $('[data-ficha-paso]', ficha).textContent = porClave[clave].titulo;
    $('[data-ficha-nombre]', ficha).textContent = p.n;
    $('[data-ficha-precios]', ficha).innerHTML = `${p.a ? `<span class="ficha-arm__ahorro"><s>${pesos(p.a)}</s><span class="etiqueta etiqueta--secundaria">Ahorrá ${pesos(p.a - p.p)}</span></span>` : ''}
      <span class="ficha-arm__precio">${p.p ? pesos(p.p) : 'Sin cargo'}</span>
      ${p.p ? `<span class="ficha-arm__nota">Efectivo o transferencia · 3 × ${pesos(lista(p.p) / 3)} sin interés</span>` : ''}`;
    // Sin datos por secciones, la descripción del sistema tal cual llega (un bloque de HTML), en texto libre
    $('[data-ficha-cuerpo]', ficha).innerHTML = p.libre || !f
      ? `<section class="ficha-arm__bloque"><h3>Descripción</h3><div class="texto-libre">${p.libre || ''}</div></section>
      <p class="ficha-arm__muestra">${icono('i-alerta')}Ficha de muestra en texto libre: en el sitio real llega del sistema como un solo bloque.</p>`
      : `
      <section class="ficha-arm__bloque"><h3>${f.que}</h3><p>${f.texto(p)}</p></section>
      <section class="ficha-arm__bloque"><h3>Usos y rendimiento</h3><ul class="ficha-arm__usos">${f.usos.filter(([, d]) => d).map(([t, d]) => `<li><strong>${t}</strong>${d}</li>`).join('')}</ul></section>
      <section class="ficha-arm__bloque"><h3>Compatibilidad e instalación</h3><p>${f.compat(p)}</p></section>
      <section class="ficha-arm__bloque"><h3>Especificaciones</h3><dl class="ficha-arm__specs">${f.specs(p).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></section>
      <p class="ficha-arm__muestra">${icono('i-alerta')}Ficha de muestra: en el sitio real los datos vienen de cada producto.</p>`;
    const sel = Array.isArray(elegido[clave]) && elegido[clave].some((e) => e.id === id);
    const elegirBtn = $('[data-ficha-elegir]', ficha);
    elegirBtn.innerHTML = sel ? `${icono('i-cerrar')}Quitar de mi armado` : `${icono('i-check')}Elegir este producto`;
    elegirBtn.classList.toggle('boton--primario', !sel);
    elegirBtn.classList.toggle('boton--secundario', sel);
    $('[data-ficha-cuerpo]', ficha).scrollTop = 0;
    ficha.showModal();
  }

  ficha.addEventListener('click', (e) => {
    if (e.target === ficha || e.target.closest('[data-cerrar-dialogo]')) ficha.close();
    if (e.target.closest('[data-ficha-elegir]') && enFicha) {
      ficha.close();
      elegir(enFicha.clave, enFicha.id);
    }
  });

  // ---------- Cuotas y financiación ----------

  const dialogoCuotas = document.querySelector('[data-cuotas-dialogo]');

  function abrirCuotas() {
    const total = totalEfectivo();
    const precio = lista(total);
    $('[data-cuotas-lista]', dialogoCuotas).textContent = pesos(precio);
    $('[data-cuotas-mejor]', dialogoCuotas).textContent = `3 × ${pesos(precio / 3)}`;
    $('[data-cuotas-tabla]', dialogoCuotas).innerHTML = CUOTAS.map(([n, k]) => {
      const final = precio * k;
      return `<tr${n === 3 ? ' class="cuotas-arm__destacada"' : ''}><th scope="row">${n === 1 ? '1 pago' : `${n} cuotas`}${k === 1 && n > 1 ? ' <span class="etiqueta">Sin interés</span>' : ''}</th><td>${pesos(final / n)}</td><td>${pesos(final)}</td></tr>`;
    }).join('');
    $('[data-cuotas-efectivo]', dialogoCuotas).textContent = pesos(total);
    dialogoCuotas.showModal();
  }

  dialogoCuotas.addEventListener('click', (e) => {
    if (e.target === dialogoCuotas || e.target.closest('[data-cerrar-dialogo]')) dialogoCuotas.close();
  });

  // ---------- Agregar al carrito: agregando y no se pudo agregar ----------
  // De muestra: sale bien (aviso) salvo que se pida el error. En el sitio real, la respuesta del carrito

  const errorAgregar = $('[data-error-agregar]', resumen);

  function textosAgregar() {
    const componentes = cobrables().reduce((s, l) => s + l.cant, 0);
    $('[data-agregar-texto]', agregar).textContent = componentes ? `Agregar al carrito (${componentes} ${componentes === 1 ? 'producto' : 'productos'})` : 'Agregar al carrito';
    $('[data-agregar-texto]', agregarBarra).textContent = 'Agregar';
    for (const b of [agregar, agregarBarra]) {
      b.classList.remove('cargando', 'con-error');
      b.removeAttribute('aria-disabled');
      $('use', b).setAttribute('href', '#i-carrito');
    }
  }

  function estadoAgregar(clase, iconoId, textoResumen, textoBarra) {
    for (const b of [agregar, agregarBarra]) {
      b.classList.remove('cargando', 'con-error');
      b.classList.add(clase);
      // Agregando no se puede tocar; con error, sí ("Reintentar")
      if (clase === 'cargando') b.setAttribute('aria-disabled', 'true');
      else b.removeAttribute('aria-disabled');
      $('use', b).setAttribute('href', `#${iconoId}`);
    }
    $('[data-agregar-texto]', agregar).textContent = textoResumen;
    $('[data-agregar-texto]', agregarBarra).textContent = textoBarra;
  }

  let esperaAgregar;

  function cortarAgregar() {
    clearTimeout(esperaAgregar);
    agregando = false;
    textosAgregar();
  }

  // Mientras agrega no se puede volver a tocar. Con el error a la vista ya no está agregando: "Reintentar" (barra)
  // y "Volver a intentar" (alerta) cortan la espera del error y vuelven a agregar
  function agregarArmado({ fallar = false, espera = 900 } = {}) {
    if (agregando || !totalEfectivo()) return;
    clearTimeout(esperaAgregar);
    agregando = true;
    errorAgregar.hidden = true;
    estadoAgregar('cargando', 'i-recargar', 'Agregando…', 'Agregando…');
    esperaAgregar = setTimeout(() => {
      if (!fallar) {
        cortarAgregar();
        avisar(`Vista previa: se agregarían ${cobrables().reduce((s, l) => s + l.cant, 0)} productos al carrito`);
        return;
      }
      agregando = false;
      estadoAgregar('con-error', 'i-alerta', 'No se pudo agregar', 'Reintentar');
      errorAgregar.hidden = false;
      // En celular y tablet el resumen queda lejos: el aviso breve lo dice junto a la barra
      if (getComputedStyle(barra).display !== 'none') avisar('No pudimos agregar tu armado', { error: true });
      esperaAgregar = setTimeout(cortarAgregar, 2500);
    }, espera);
  }

  // ---------- Empezar de nuevo (con algo elegido, pide confirmación) ----------

  const dialogoReinicio = document.querySelector('[data-reinicio-dialogo]');

  function reiniciar({ desplazar = true } = {}) {
    PASOS.forEach((p) => {
      elegido[p.clave] = null;
      vista[p.clave] = { chip: null, orden: 'menor', texto: '' };
      delete nota[p.clave];
    });
    demo.sinCompatibles = null;
    demo.sinProductos = null;
    retomado.hidden = true;
    errorAgregar.hidden = true;
    cortarAgregar();
    $$('[data-buscar]').forEach((c) => (c.value = ''));
    $$('[data-orden]').forEach((c) => (c.value = 'menor'));
    cambio('micro', { avanzar: false });
    abrir('micro', { desplazar });
  }

  function pedirReinicio() {
    const decididos = PASOS.filter((p) => elegido[p.clave] !== null).length;
    if (!decididos) return reiniciar();
    const componentes = lineas().reduce((s, l) => s + l.cant, 0);
    $('[data-reinicio-cant]', dialogoReinicio).textContent = componentes ? `los ${componentes} ${componentes === 1 ? 'componente' : 'componentes'}` : 'lo que elegiste';
    dialogoReinicio.showModal();
  }

  dialogoReinicio.addEventListener('click', (e) => {
    if (e.target === dialogoReinicio || e.target.closest('[data-cerrar-dialogo]')) dialogoReinicio.close();
    if (e.target.closest('[data-confirmar-reinicio]')) {
      dialogoReinicio.close();
      reiniciar();
      avisar('Empezaste un armado nuevo');
    }
  });

  // ---------- Armado retomado o abierto desde un link (con piezas que ya no están) ----------

  const retomado = $('[data-retomado]');

  function mostrarRetomado(origen, faltan = []) {
    const n = faltan.length;
    retomado.hidden = false;
    retomado.classList.toggle('alerta--aviso', n > 0);
    $('[data-retomado-icono] use', retomado).setAttribute('href', n ? '#i-alerta' : origen === 'retomado' ? '#i-reloj' : '#i-compartir');
    $('[data-retomado-titulo]', retomado).textContent = n
      ? n === 1 ? 'Una pieza ya no está disponible' : 'Algunas piezas ya no están disponibles'
      : origen === 'retomado' ? 'Retomamos tu armado' : 'Armado abierto desde un link';
    $('[data-retomado-texto]', retomado).textContent = n
      ? `${origen === 'retomado' ? 'Retomamos tu armado, pero' : 'En este armado'} ${n === 1 ? 'una pieza se quedó sin stock o salió del catálogo: la quitamos de su paso. Elegí otra' : 'algunas piezas se quedaron sin stock o salieron del catálogo: las quitamos de sus pasos. Elegí otras'} para completarlo.`
      : origen === 'retomado' ? 'Está como lo dejaste la última vez: seguí desde donde quedaste o empezá uno nuevo.' : 'Podés cambiar lo que quieras: el link se actualiza con cada cambio.';
    $('[data-retomado-acciones]', retomado).innerHTML = n
      ? faltan.map((k) => `<button class="boton boton--secundario" type="button" data-abrir="${k}">Elegir ${minus(porClave[k].titulo)}</button>`).join('')
      : `<button class="boton-texto" type="button" data-reiniciar-arm>${icono('i-borrar')}Empezar de nuevo</button>`;
  }

  // ---------- Eventos ----------

  document.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !(raiz.contains(b) || resumen.contains(b) || barra.contains(b))) return;
    const li = b.closest('[data-paso]');
    const clave = li?.dataset.paso;

    if (b.dataset.abrir) {
      const destino = b.dataset.abrir;
      abrir(abierto === destino && b.classList.contains('paso-arm__abrir') ? null : destino);
    } else if (b.dataset.pieza) {
      elegir(clave, Number(b.dataset.pieza));
    } else if (b.dataset.info) {
      abrirFicha(clave, Number(b.dataset.info));
    } else if ('quitar' in b.dataset) {
      const destino = b.dataset.quitar || clave;
      elegido[destino] = null;
      delete nota[destino];
      cambio(destino, { avanzar: false });
      avisar(`Quitamos ${minus(porClave[destino].titulo)} de tu armado`);
    } else if (b.dataset.cant) {
      // Módulos de un modelo de memoria: hasta los slots libres
      const paso = porClave[clave];
      const sel = elegido[clave].find((x) => x.id === Number(b.dataset.id));
      const suma = Number(b.dataset.cant);
      if (suma > 0 && ocupados() >= slots()) return avisar(`Ocupaste los ${slots()} slots de tu motherboard`);
      sel.cant = Math.min(paso.cantidad.max, Math.max(paso.cantidad.min, sel.cant + suma));
      cambio(clave, { avanzar: false });
    } else if (b.dataset.saltar) {
      elegido[clave] = elegido[clave] === b.dataset.saltar ? null : b.dataset.saltar;
      cambio(clave, { avanzar: elegido[clave] !== null });
    } else if ('listo' in b.dataset) {
      abrir(siguiente(clave));
    } else if ('chip' in b.dataset) {
      vista[clave].chip = b.dataset.chip === '' ? null : Number(b.dataset.chip);
      pintarPiezas(clave);
    } else if ('masProductos' in b.dataset) {
      avisar('Vista previa: acá se cargan más productos');
    } else if ('agregarArm' in b.dataset || 'agregarBarra' in b.dataset || 'reintentarArm' in b.dataset) {
      agregarArmado();
    } else if ('verCuotas' in b.dataset) {
      abrirCuotas();
    } else if ('copiarArm' in b.dataset) {
      navigator.clipboard?.writeText(location.href).then(() => avisar('Link del armado copiado'), () => avisar('No se pudo copiar el link'));
    } else if ('reiniciarArm' in b.dataset) {
      pedirReinicio();
    } else if ('cerrarRetomado' in b.dataset) {
      retomado.hidden = true;
    } else if ('verArm' in b.dataset) {
      resumen.scrollIntoView({ behavior: sinMovimiento.matches ? 'auto' : 'smooth', block: 'start' });
    }
  });

  raiz.addEventListener('change', (e) => {
    if (!e.target.matches('[data-orden]')) return;
    const clave = e.target.closest('[data-paso]').dataset.paso;
    vista[clave].orden = e.target.value;
    pintarPiezas(clave);
  });

  raiz.addEventListener('input', (e) => {
    if (!e.target.matches('[data-buscar]')) return;
    const clave = e.target.closest('[data-paso]').dataset.paso;
    vista[clave].texto = e.target.value.trim();
    pintarPiezas(clave);
  });

  // ---------- URL: ?armado=micro-10684.ram-14025x2_20782.perif-1065_13942.video-no.mother-omitido ----------

  function escribirUrl() {
    const partes = PASOS.filter((p) => elegido[p.clave] !== null).map((p) => {
      const e = elegido[p.clave];
      return `${p.clave}-${Array.isArray(e) ? e.map(({ id, cant }) => (cant > 1 ? `${id}x${cant}` : id)).join('_') : e}`;
    });
    const url = new URL(location.href);
    if (partes.length) url.searchParams.set('armado', partes.join('.'));
    else url.searchParams.delete('armado');
    history.replaceState(null, '', url);
  }

  // Carga un armado escrito como en la URL; devuelve los pasos con piezas que ya no están en el catálogo
  function leerArmado(valor) {
    const faltan = [];
    for (const parte of valor.split('.')) {
      const [clave, resto] = parte.split('-');
      const paso = porClave[clave];
      if (!paso || !resto) continue;
      if (resto === 'no' || resto === 'tengo' || resto === 'omitido') {
        elegido[clave] = resto;
        continue;
      }
      const ids = resto.split('_').map((x) => {
        const [id, cant] = x.split('x').map(Number);
        return { id, cant: Math.min(paso.cantidad?.max || 1, Math.max(1, cant || 1)) };
      });
      const lista = ids.filter(({ id }) => pieza(clave, id)).slice(0, paso.max || 1);
      if (ids.some(({ id }) => !pieza(clave, id))) faltan.push(clave);
      if (lista.length) elegido[clave] = lista;
      else nota[clave] = { texto: 'Ya no está disponible' };
    }
    revisarCompatibilidad();
    return faltan;
  }

  function leerUrl() {
    const valor = new URLSearchParams(location.search).get('armado');
    if (valor) mostrarRetomado('link', leerArmado(valor));
  }

  // ---------- Degradado vivo de "Agregar al carrito" (luz.js, como el botón Productos del header) ----------

  if (!sinMovimiento.matches) iniciarLuz(agregar, { tramo: 0.06 });

  // ---------- Aviso breve ----------

  const aviso = document.querySelector('[data-aviso-arm]');
  let temporizador;
  function avisar(texto, { error = false } = {}) {
    aviso.textContent = texto;
    aviso.classList.toggle('aviso--error', error);
    aviso.classList.add('aviso--visible');
    clearTimeout(temporizador);
    temporizador = setTimeout(() => aviso.classList.remove('aviso--visible'), error ? 4000 : 2600);
  }

  // ---------- Estados de muestra (vista previa: data-demo) ----------
  // Cada botón arma un caso con productos de la muestra y lleva al paso (o al resumen) donde se ve

  const COMPLETA = 'micro-10684.cooler-no.mother-19997.ram-14025x2.video-99002.discos-99004.gabinete-20139.fuente-99005.armado-5653.so-10648';

  // ver: el paso al que se lleva la vista (null: el resumen; false: ninguno)
  function cargar(valor, abrirClave = null, ver = abrirClave) {
    document.querySelectorAll('.armador dialog[open]').forEach((d) => d.close());
    aviso.classList.remove('aviso--visible');
    reiniciar({ desplazar: false });
    const faltan = valor ? leerArmado(valor) : [];
    cambio('micro', { avanzar: false });
    abrir(abrirClave, { desplazar: false });
    const destino = ver ? $(`[data-paso="${ver}"]`) : resumen;
    if (ver !== false) requestAnimationFrame(() => destino.scrollIntoView({ behavior: sinMovimiento.matches ? 'auto' : 'smooth', block: 'start' }));
    return faltan;
  }

  const ESTADOS = {
    fuente: () => cargar('micro-10684.mother-19997.ram-14025x2.gabinete-16562', 'fuente'),
    wifi: () => cargar('micro-10684.mother-20840.ram-14025x2', 'wifi'),
    bios: () => cargar('micro-99010.mother-16434', 'mother'),
    slots: () => cargar('micro-10684.mother-19997.ram-14025_20782', 'ram'),
    quitada: () => {
      // Una motherboard DDR5 en lugar de la DDR4: la memoria DDR4 se quita y su paso queda marcado
      cargar('mother-19997.ram-14025x2', null, 'ram');
      elegido.mother = [{ id: 16434, cant: 1 }];
      cambio('mother', { avanzar: false });
    },
    corta: () => {
      // De muestra: el armador del sitio quita la fuente que quedó corta para la placa de video nueva
      cargar('micro-10684.mother-19997.ram-14025x2.video-99003', null, 'fuente');
      nota.fuente = { nombre: sinWatts(pieza('fuente', 20765).n), texto: 'Quedó corta para tu placa de video' };
      cambio('video', { avanzar: false });
    },
    omitido: () => cargar('micro-10684.cooler-no.mother-omitido', 'ram', 'mother'),
    'sin-compatibles': () => {
      cargar('micro-99010.gabinete-18460', 'cooler');
      demo.sinCompatibles = 'cooler';
      pintarPiezas('cooler');
    },
    'sin-productos': () => {
      cargar('micro-10684.mother-19997', 'wifi');
      demo.sinProductos = 'wifi';
      pintarPiezas('wifi');
    },
    'servicio-bios': () => cargar('micro-99010.cooler-19497.mother-16434.ram-99001x2', null, null),
    pausados: () => cargar('micro-10684.mother-19997.ram-14025x2.armado-5653.so-10648', 'armado'),
    memoria: () => cargar('micro-10684.mother-20840.ram-14025x2_20782', 'ram'),
    agregando: () => {
      cargar(COMPLETA, null, null);
      agregarArmado({ espera: 3000 });
    },
    'error-agregar': () => {
      cargar(COMPLETA, null, null);
      agregarArmado({ fallar: true, espera: 1200 });
    },
    reinicio: () => {
      cargar(COMPLETA, null, null);
      pedirReinicio();
    },
    retomado: () => {
      cargar('micro-10684.cooler-no.mother-19997.ram-14025x2.video-99002', 'discos', false);
      mostrarRetomado('retomado');
      retomado.scrollIntoView({ block: 'center' });
    },
    link: () => {
      cargar('micro-10684.cooler-no.mother-19997.ram-14025x2.video-99002', 'discos', false);
      mostrarRetomado('link');
      retomado.scrollIntoView({ block: 'center' });
    },
    faltantes: () => {
      // La placa de video y el gabinete del link ya no están en el catálogo (ids que no existen)
      const faltan = cargar('micro-10684.cooler-no.mother-19997.ram-14025x2.video-99990.gabinete-99991', 'discos', false);
      mostrarRetomado('link', faltan);
      retomado.scrollIntoView({ block: 'center' });
    },
    libre: () => abrirFicha('wifi', 6949),
  };

  document.querySelectorAll('[data-estado-arm]').forEach((boton) =>
    boton.addEventListener('click', () => {
      document.querySelectorAll('[data-estado-arm]').forEach((b) => b.setAttribute('aria-pressed', String(b === boton)));
      ESTADOS[boton.dataset.estadoArm]?.();
    })
  );

  // ---------- Arranque ----------

  leerUrl();
  pintarResumen();
  abrir(siguiente(PASOS[PASOS.length - 1].clave) || 'micro', { desplazar: false });
  raiz.classList.add('armador--js');
}
