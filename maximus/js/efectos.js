// Solo para las vistas previas: inicia los efectos sobre el contenido de la página (.mx). En el sitio real, cada
// página importa los que usa y los inicia sobre su contenedor, por ejemplo:
//   import { iniciarCarruseles } from './carrusel.js';
//   iniciarCarruseles(document.querySelector('.mx'));
// Cada efecto se inicia una sola vez por elemento, así se puede volver a llamar después de sumar contenido.
import { iniciarCarruseles } from './carrusel.js';
import { iniciarMarcas } from './marcas.js';
import { iniciarVisible } from './visible.js';
import { iniciarFuego } from './fuego.js';
import { iniciarPausa } from './pausa.js';
import { iniciarFlotantes } from './flotantes.js';
import { iniciarTarjetas } from './tarjeta.js';
import { iniciarSesion } from './sesion.js';

// En las páginas que arma incluir.js, primero espera a que cada parte esté en su lugar
if (document.querySelector('[data-incluir]')) await (await import('./incluir.js')).listo;

const raiz = document.querySelector('.mx') || document;
iniciarSesion(raiz);
iniciarCarruseles(raiz);
iniciarVisible(raiz);
iniciarFuego(raiz);
iniciarPausa(raiz);
iniciarFlotantes(raiz);
iniciarTarjetas(raiz);
iniciarMarcas(raiz);
