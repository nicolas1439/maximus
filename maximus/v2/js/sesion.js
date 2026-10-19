// Contenido según la sesión (de muestra: la sesión la guarda acceso.js en el navegador; en el sitio real lo resuelve
// el servidor). Lo marcado con data-con-sesion se muestra solo con la sesión iniciada, y no aparece si su lista quedó
// vacía; lo marcado con data-sin-sesion, solo sin sesión. Uso: iniciarSesion(contenedor).

export function iniciarSesion(raiz = document) {
  let sesion = false;
  try { sesion = Boolean(localStorage.getItem('sesion')); } catch {}
  raiz.querySelectorAll('[data-con-sesion]').forEach((el) => {
    const lista = el.querySelector('ul, ol');
    el.hidden = !sesion || (lista && !lista.children.length);
  });
  raiz.querySelectorAll('[data-sin-sesion]').forEach((el) => (el.hidden = sesion));
}
