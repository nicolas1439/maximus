// Reseñas, de muestra: el estado de "Escribir una reseña" (sin sesión, no compró, escribir, en revisión, rechazada,
// la propia), el formulario (calificación, título y texto; al publicar pasa a "en revisión"), los errores al enviar
// y las reacciones "útil / no útil" de cada reseña. En el sitio real el estado y los errores los da el sistema.

const caja = document.querySelector('[data-resenas-escribir]');

function ver(estado) {
  caja.querySelectorAll('[data-resena-estado]').forEach((el) => (el.hidden = el.dataset.resenaEstado !== estado));
  document.querySelectorAll('[data-ver-resena]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.verResena === estado));
  const propia = document.querySelector('.resenas__lista .resena');
  propia?.classList.toggle('resena--propia', estado === 'propia');
  if (propia) propia.id = estado === 'propia' ? 'resena-propia' : '';
}

const ERRORES = {
  ya: 'Ya dejaste una reseña de este producto.',
  'no-compro': 'Solo pueden opinar quienes compraron este producto.',
  general: 'No pudimos publicar tu reseña. Probá de nuevo en unos minutos.',
};

if (caja) {
  let sesion = false;
  try { sesion = Boolean(localStorage.getItem('sesion')); } catch {}
  ver(sesion ? 'escribir' : 'sin-sesion');

  const form = caja.querySelector('[data-resena-form]');
  const error = form.querySelector('[data-resena-error]');
  const mostrarError = (texto) => {
    error.textContent = texto;
    error.hidden = !texto;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.elements.puntaje.value) return mostrarError('Elegí una calificación de 1 a 5 estrellas.');
    if (form.elements.texto.value.trim().length < 20) return mostrarError('Contanos un poco más: al menos 20 caracteres.');
    mostrarError('');
    ver('revision');
  });
  caja.querySelector('[data-resena-otra]')?.addEventListener('click', () => ver('escribir'));

  document.querySelectorAll('[data-ver-resena]').forEach((b) => b.addEventListener('click', () => ver(b.dataset.verResena)));
  document.querySelectorAll('[data-error-resena]').forEach((b) =>
    b.addEventListener('click', () => {
      ver('escribir');
      mostrarError(ERRORES[b.dataset.errorResena]);
    })
  );
}

// Reacciones: una por reseña (marcar "Sí" desmarca "No"); suman o restan a su contador
document.querySelectorAll('.resena__pie').forEach((pie) => {
  const botones = [...pie.querySelectorAll('[data-reaccion]')];
  botones.forEach((boton) =>
    boton.addEventListener('click', () => {
      botones.forEach((b) => {
        const marcado = b === boton ? b.getAttribute('aria-pressed') !== 'true' : false;
        const antes = b.getAttribute('aria-pressed') === 'true';
        if (antes !== marcado) {
          const cuenta = b.querySelector('[data-cuenta]');
          cuenta.textContent = Number(cuenta.textContent) + (marcado ? 1 : -1);
        }
        b.setAttribute('aria-pressed', String(marcado));
        b.classList.toggle('marcado', marcado);
      });
    })
  );
});
