// Solo para las vistas previas: incrusta el sprite de íconos (recursos/iconos.svg) una vez en la página, y cada
// ícono lo usa con <use href="#id">. En el sitio real el sprite va pegado en el HTML de cada página, una vez: un
// archivo externo deja de funcionar cuando la página y el archivo se sirven desde dominios distintos (jsDelivr).
const texto = await (await fetch(new URL('../recursos/iconos.svg', import.meta.url), { cache: 'no-cache' })).text();
const caja = document.createElement('div');
caja.dataset.sprite = '';
caja.setAttribute('aria-hidden', 'true');
caja.style.cssText = 'position: absolute; width: 0; height: 0; overflow: hidden';
caja.innerHTML = texto;
document.body.prepend(caja);
