// Confeti de marca (verde, lima y violetas) que sale desde un elemento: lo usan la cuenta creada (acceso.js) y la
// compra confirmada (confirmada.js). Se dibuja en un lienzo .confeti (base.css) sobre toda la pantalla, sin
// capturar clics. Con "reducir movimiento" no aparece.

export function confeti(origen, lienzo = document.querySelector('[data-confeti]')) {
  if (!origen || !lienzo || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const estilos = getComputedStyle(document.documentElement);
  const colores = ['--color-marca', '--color-lima', '--color-secundario', '--color-secundario-sobre-barra', '--color-esmeralda']
    .map((v) => estilos.getPropertyValue(v).trim());
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const ctx = lienzo.getContext('2d');
  lienzo.hidden = false;
  lienzo.width = innerWidth * dpr;
  lienzo.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const r = origen.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const piezas = Array.from({ length: 140 }, () => {
    const angulo = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const velocidad = 6 + Math.random() * 9;
    return {
      x: cx,
      y: cy,
      vx: Math.cos(angulo) * velocidad,
      vy: Math.sin(angulo) * velocidad,
      giro: Math.random() * Math.PI,
      vgiro: (Math.random() - 0.5) * 0.3,
      ancho: 5 + Math.random() * 5,
      alto: 8 + Math.random() * 6,
      color: colores[Math.floor(Math.random() * colores.length)],
      redondo: Math.random() < 0.25,
    };
  });

  const inicio = performance.now();
  const dura = 3200;

  function cuadro(t) {
    const pasado = t - inicio;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, pasado - dura + 800) / 800);
    for (const p of piezas) {
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 0.28;
      p.x += p.vx;
      p.y += p.vy;
      p.giro += p.vgiro;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.giro);
      ctx.fillStyle = p.color;
      if (p.redondo) {
        ctx.beginPath();
        ctx.arc(0, 0, p.ancho / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Se achica en un eje para que parezca girar en el aire
        ctx.fillRect(-p.ancho / 2, (-p.alto / 2) * Math.cos(p.giro * 2), p.ancho, p.alto * Math.cos(p.giro * 2));
      }
      ctx.restore();
    }
    if (pasado < dura) requestAnimationFrame(cuadro);
    else lienzo.hidden = true;
  }
  requestAnimationFrame(cuadro);
}
