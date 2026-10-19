// Marcas: tira de logos que se desliza sola.
// 1. Cada logo se incrusta en línea (el SVG usa currentColor para el nombre: en línea toma el color del texto
//    en ambos modos; como <img> quedaría negro). Sin JS queda la <img>.
// 2. La lista se duplica para que el bucle no tenga salto (ver marcas.css).
// 3. Los logos se encienden con sus colores cerca de una "luz": en cada logo se pone --cerca (0 a 1) según su
//    distancia horizontal a la luz, y marcas.css lo usa para fundir del tono único al color y elevar el logo.
//    Con puntero, la luz es el puntero sobre la tira. En táctil, la luz queda fija en el centro y, como la tira
//    se mueve, cada logo se enciende al pasar por ahí; solo mientras la tira está a la vista.

const tira = document.querySelector('.marcas');
const ALCANCE = 240; // px: desde esta distancia el logo empieza a tomar color

async function incrustar(enlace) {
  const img = enlace.querySelector('img');
  try {
    const texto = await (await fetch(img.getAttribute('src'))).text();
    const svg = new DOMParser().parseFromString(texto, 'image/svg+xml').querySelector('svg');
    if (!svg) return;
    svg.setAttribute('class', 'marca__color');
    svg.setAttribute('aria-hidden', 'true');
    svg.removeAttribute('id');
    enlace.setAttribute('aria-label', img.alt);
    img.replaceWith(svg);
  } catch {}
}

if (tira) {
  const pista = tira.querySelector('.marcas__pista');
  const originales = [...pista.children];
  await Promise.all(originales.map((li) => incrustar(li.querySelector('.marca'))));

  for (const item of originales) {
    const copia = item.cloneNode(true);
    copia.setAttribute('aria-hidden', 'true');
    copia.querySelector('a').tabIndex = -1;
    pista.append(copia);
  }

  const logos = [...tira.querySelectorAll('.marca')];

  // Enciende cada logo según su distancia a la luz (x en pantalla); sin luz, todos apagados
  const pintar = (luz) => {
    for (const logo of logos) {
      let cerca = 0;
      if (luz !== null) {
        const r = logo.getBoundingClientRect();
        const distancia = Math.abs(luz - (r.left + r.width / 2));
        const t = Math.max(0, 1 - distancia / ALCANCE);
        cerca = t * t * (3 - 2 * t); // suaviza el borde del alcance
      }
      logo.style.setProperty('--cerca', cerca.toFixed(3));
    }
  };

  if (matchMedia('(hover: hover)').matches) {
    let cuadro = 0;
    let puntero = null;
    const alCuadro = () => {
      cuadro = 0;
      pintar(puntero);
    };
    tira.addEventListener('pointermove', (e) => {
      puntero = e.clientX;
      if (!cuadro) cuadro = requestAnimationFrame(alCuadro);
    });
    tira.addEventListener('pointerleave', () => {
      puntero = null;
      if (!cuadro) cuadro = requestAnimationFrame(alCuadro);
    });
  } else {
    // El bucle corre solo mientras la tira está en pantalla (se revisa al desplazarse)
    let bucle = 0;
    const animar = () => {
      const r = tira.getBoundingClientRect();
      pintar(r.left + r.width / 2);
      bucle = requestAnimationFrame(animar);
    };
    const revisar = () => {
      const r = tira.getBoundingClientRect();
      const enPantalla = r.bottom > 0 && r.top < innerHeight;
      if (enPantalla && !bucle) bucle = requestAnimationFrame(animar);
      if (!enPantalla && bucle) {
        cancelAnimationFrame(bucle);
        bucle = 0;
        pintar(null);
      }
    };
    addEventListener('scroll', revisar, { passive: true });
    addEventListener('resize', revisar);
    revisar();
  }
}
