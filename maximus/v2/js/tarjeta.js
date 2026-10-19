// Tarjeta de producto, comportamiento de muestra (en el sitio real lo resuelve el carrito y la cuenta):
// - "Agregar al carrito": Agregando… (deshabilitado) → Agregado; con Alt + clic, "No se pudo agregar" (para ver el
//   error). A los 2,5 s vuelve a "Agregar al carrito".
// - Favorito: con sesión se marca o se desmarca; sin sesión abre "Guardá tus favoritos" (Ingresar o Crear cuenta)
//   y, al volver con la sesión iniciada, el producto queda marcado.
// - "Obtené tu juego GRATIS": abre la explicación.
// Los diálogos van una vez por página (footer.html). Uso: iniciarTarjetas(contenedor).

const PENDIENTE = 'favorito-pendiente';
const DURACION = 2500;

const conSesion = () => {
  try { return Boolean(localStorage.getItem('sesion')); } catch { return false; }
};

const icono = (id) => `<svg class="icono icono--s" aria-hidden="true"><use href="#${id}"/></svg>`;

function abrir(dialogo) {
  if (!dialogo) return false;
  if (!dialogo.dataset.listo) {
    dialogo.dataset.listo = '';
    dialogo.querySelectorAll('[data-cerrar-dialogo]').forEach((b) => b.addEventListener('click', () => dialogo.close()));
    dialogo.addEventListener('click', (e) => { if (e.target === dialogo) dialogo.close(); });
  }
  dialogo.showModal();
  return true;
}

// Sin sesión: pide ingresar o crear la cuenta y recuerda qué producto se quería guardar
export function pedirIngresoFavorito(nombre) {
  const dialogo = document.querySelector('[data-dialogo-favorito]');
  const volver = (location.pathname.split('/').pop() || 'index.html') + location.hash;
  try { sessionStorage.setItem(PENDIENTE, nombre); } catch {}
  if (!dialogo) return (location.href = `ingresar.html?volver=${encodeURIComponent(volver)}`);
  dialogo.querySelector('[data-favorito-ingresar]').href = `ingresar.html?volver=${encodeURIComponent(volver)}`;
  dialogo.querySelector('[data-favorito-registro]').href = `crear-cuenta.html?volver=${encodeURIComponent(volver)}`;
  abrir(dialogo);
}

function marcar(boton, valor) {
  boton.setAttribute('aria-pressed', String(valor));
  boton.classList.toggle('marcado', valor);
}

function agregar(boton, fallar) {
  const original = boton.innerHTML;
  boton.disabled = true;
  boton.classList.add('cargando');
  boton.innerHTML = `${icono('i-recargar')}<span>Agregando…</span>`;
  setTimeout(() => {
    boton.classList.remove('cargando');
    boton.classList.add(fallar ? 'con-error' : 'agregado');
    boton.innerHTML = fallar ? `${icono('i-alerta')}<span>No se pudo agregar</span>` : `${icono('i-check')}<span>Agregado</span>`;
    setTimeout(() => {
      boton.classList.remove('agregado', 'con-error');
      boton.disabled = false;
      boton.innerHTML = original;
    }, DURACION);
  }, 700);
}

export function iniciarTarjetas(raiz = document) {
  if (raiz.dataset?.tarjetasListas !== undefined) return;
  if (raiz.dataset) raiz.dataset.tarjetasListas = '';

  // Al volver de ingresar: el producto que se quería guardar queda marcado
  try {
    const pendiente = sessionStorage.getItem(PENDIENTE);
    if (pendiente && conSesion()) {
      sessionStorage.removeItem(PENDIENTE);
      raiz.querySelectorAll('.producto').forEach((t) => {
        if (t.querySelector('.producto__enlace')?.textContent.trim() === pendiente) marcar(t.querySelector('.producto__favorito'), true);
      });
    }
  } catch {}

  raiz.addEventListener('click', (e) => {
    const boton = e.target.closest('.producto__agregar, .producto__favorito, [data-regalo]');
    if (!boton || !raiz.contains(boton)) return;
    if (boton.matches('.producto__agregar')) {
      if (boton.disabled || boton.closest('.producto--cargando')) return;
      return agregar(boton, e.altKey);
    }
    if (boton.matches('.producto__favorito')) {
      if (!conSesion()) return pedirIngresoFavorito(boton.closest('.producto')?.querySelector('.producto__enlace')?.textContent.trim() || '');
      return marcar(boton, boton.getAttribute('aria-pressed') !== 'true');
    }
    if (boton.matches('[data-regalo]')) abrir(document.querySelector('[data-dialogo-regalo]'));
  });
}
