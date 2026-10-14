// Arma una página con partes de otros archivos. Cada elemento con data-incluir="archivo.html" se reemplaza
// por el cuerpo de ese archivo (sin lo marcado con data-demo) y se suman sus CSS y JS sin repetirlos.
// Lo usan index.html (página completa) y ajustes-hover.html. `listo` se resuelve cuando todo está en su lugar.

export const listo = (async () => {
  // 1. Trae cada parte y descarta lo marcado como demostración (data-demo)
  const partes = await Promise.all(
    [...document.querySelectorAll('[data-incluir]')].map(async (lugar) => {
      const texto = await (await fetch(lugar.dataset.incluir)).text();
      const doc = new DOMParser().parseFromString(texto, 'text/html');
      doc.querySelectorAll('[data-demo]').forEach((n) => n.remove());
      return { lugar, doc };
    })
  );

  const yaEsta = (selector) => document.head.querySelector(selector);

  // 2. Estilos de todas las partes, sin repetir, y espera a que carguen
  const cargas = [];
  for (const { doc } of partes) {
    for (const link of doc.head.querySelectorAll('link[rel="stylesheet"]')) {
      const href = link.getAttribute('href');
      if (yaEsta(`link[href="${href}"]`)) continue;
      const nuevo = document.createElement('link');
      nuevo.rel = 'stylesheet';
      nuevo.href = href;
      cargas.push(new Promise((listo) => (nuevo.onload = nuevo.onerror = listo)));
      document.head.append(nuevo);
    }
  }
  await Promise.all(cargas);

  // 3. Contenido, en el orden de la página
  for (const { lugar, doc } of partes) {
    lugar.replaceWith(...[...doc.body.childNodes].map((n) => document.importNode(n, true)));
  }

  // 4. Scripts de todas las partes, sin repetir
  for (const { doc } of partes) {
    for (const script of doc.head.querySelectorAll('script[src]')) {
      const src = script.getAttribute('src');
      if (yaEsta(`script[src="${src}"]`)) continue;
      const nuevo = document.createElement('script');
      nuevo.type = script.type || 'text/javascript';
      nuevo.src = src;
      document.head.append(nuevo);
    }
  }
})();
