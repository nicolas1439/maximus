// Sugerencias del buscador (solo para la demostración: en el sitio real las trae el sistema). Desde 2 letras muestra
// hasta 5 productos con foto, nombre y precio y las categorías y subcategorías del menú que coinciden; sin
// coincidencias, el aviso. Busca por todas las palabras, sin tildes. Flechas para moverse, Esc para cerrar.

const PRODUCTOS = [
  ['Placa de Video MSI GeForce RTX 5070 Ti Ventus 3X 16GB OC GDDR7', '$2.401.920', 'rtx-5070-ti-ventus'],
  ['Placa de Video MSI GeForce RTX 5060 Shadow 2X 8GB OC GDDR7', '$1.004.850', 'msi-rtx-5060-shadow'],
  ['Micro AMD Ryzen 7 9800X3D 5.2 Ghz AM5', '$739.999', 'ryzen-7-9800x3d'],
  ['Memoria RAM Kingston Fury Beast 16GB RGB 6000 Mhz DDR5', '$139.999', 'kingston-fury-beast-ddr5'],
  ['Disco SSD Kingston NV3 1TB M.2 NVMe', '$109.999', 'kingston-nv3-1tb'],
  ['Motherboard MSI A520M A Pro AM4', '$94.999', 'msi-a520m-a-pro'],
  ['Fuente MSI MAG A650GN II 80 PLUS Gold', '$134.999', 'msi-mag-a650gn'],
  ['Monitor Gamer IPS MSI 24" G242L E14 144Hz', '$249.999', 'msi-g242l'],
  ['Monitor LED IPS 27" Arkham Gaming QHD 210Hz', '$399.999', 'arkham-27-qhd'],
  ['Mouse Logitech G203 Lightsync Black', '$59.999', 'logitech-g203'],
  ['Notebook Lenovo LOQ 15 AMD Ryzen 5 16GB 512GB RTX 5050', '$1.899.999', 'lenovo-loq-15'],
  ['Notebook HP Victus 15 RTX 5060', '$2.199.999', 'hp-victus-15-rtx5060'],
  ['Silla Gamer Coolermaster Caliber X2 Gray', '$329.999', 'coolermaster-caliber-x2'],
  ['Silla Gamer Asus ROG Chariot Core Black', '$699.999', 'asus-rog-chariot-core'],
];

const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const escapar = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const icono = (id) => `<svg class="icono icono--s" aria-hidden="true"><use href="#${id}"/></svg>`;

// Marca en negrita las palabras buscadas
function resaltar(texto, palabras) {
  let html = escapar(texto);
  for (const p of palabras) {
    const plano = normalizar(html);
    const i = plano.indexOf(p);
    if (i >= 0 && !plano.slice(0, i).includes('<mark')) html = `${html.slice(0, i)}<mark>${html.slice(i, i + p.length)}</mark>${html.slice(i + p.length)}`;
  }
  return html;
}

const campo = document.querySelector('[data-sugerir]');
const panel = document.querySelector('[data-sugerencias]');

if (campo && panel) {
  const listaProductos = panel.querySelector('[data-sugerencias-productos]');
  const listaCategorias = panel.querySelector('[data-sugerencias-categorias]');
  const vacio = panel.querySelector('[data-sugerencias-vacio]');
  const todo = panel.querySelector('[data-sugerencias-todo]');
  const titulos = panel.querySelectorAll('.sugerencias__titulo');

  // Categorías y subcategorías: las del mega menú
  const categorias = [];
  document.querySelectorAll('.catalogo__cats > li').forEach((li) => {
    const cat = li.querySelector('.catalogo__cat')?.textContent.trim();
    if (!cat) return;
    categorias.push({ cat, sub: '', href: li.querySelector('a.catalogo__cat, .catalogo__ver-todo')?.getAttribute('href') || 'placas-de-video.html' });
    li.querySelectorAll('.catalogo__grupo-titulo, .catalogo__grupo li a').forEach((a) => categorias.push({ cat, sub: a.textContent.trim(), href: a.getAttribute('href') }));
  });

  const cerrar = () => {
    panel.hidden = true;
    campo.setAttribute('aria-expanded', 'false');
  };

  function mostrar() {
    const texto = campo.value.trim();
    const palabras = normalizar(texto).split(/\s+/).filter((p) => p.length > 1);
    if (normalizar(texto).replace(/\s/g, '').length < 2 || !palabras.length) return cerrar();
    const coincide = (t) => palabras.every((p) => normalizar(t).includes(p));

    const productos = PRODUCTOS.filter(([nombre]) => coincide(nombre)).slice(0, 5);
    const cats = categorias.filter(({ cat, sub }) => coincide(`${cat} ${sub}`)).slice(0, 4);

    listaProductos.innerHTML = productos.map(([nombre, precio, img]) => `<li><a class="sugerencia" href="rtx-5070-ti-ventus.html"><img class="sugerencia__img" src="recursos/productos/${img}.jpg" alt="" width="600" height="600"><span class="sugerencia__nombre">${resaltar(nombre, palabras)}</span><span class="sugerencia__precio">${precio}</span></a></li>`).join('');
    listaCategorias.innerHTML = cats.map(({ cat, sub, href }) => `<li><a class="sugerencia-cat" href="${href}">${sub ? `${escapar(cat)}${icono('i-derecha')}<strong>${resaltar(sub, palabras)}</strong>` : `<strong>${resaltar(cat, palabras)}</strong>`}</a></li>`).join('');
    titulos[0].hidden = !productos.length;
    titulos[1].hidden = !cats.length;
    vacio.hidden = Boolean(productos.length || cats.length);
    todo.hidden = !vacio.hidden;
    todo.href = `buscar.html?q=${encodeURIComponent(texto)}`;
    todo.firstChild.textContent = `Ver todos los resultados para “${texto}”`;
    panel.hidden = false;
    campo.setAttribute('aria-expanded', 'true');
  }

  campo.addEventListener('input', mostrar);
  campo.addEventListener('focus', mostrar);
  campo.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return cerrar();
    if (e.key === 'ArrowDown' && !panel.hidden) {
      e.preventDefault();
      panel.querySelector('a')?.focus();
    }
  });
  panel.addEventListener('keydown', (e) => {
    const enlaces = [...panel.querySelectorAll('a:not([hidden])')];
    const i = enlaces.indexOf(document.activeElement);
    if (e.key === 'Escape') { cerrar(); campo.focus(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); enlaces[Math.min(i + 1, enlaces.length - 1)]?.focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); (i <= 0 ? campo : enlaces[i - 1]).focus(); }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.buscador')) cerrar();
  });
}
