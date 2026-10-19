# Maximus

E-commerce de hardware: el diseño nuevo de maximus.com.ar. Cada versión del diseño es una carpeta completa y autónoma, con su propio `CLAUDE.md` (contenido, reglas, estructura, estilos y pendientes de esa versión). Este archivo es solo el índice.

## Versiones
| Carpeta | Qué es | Estado | Publicada en |
|---|---|---|---|
| `v2/` | Versión 2: la revisión final (tandas 1 a 3c hechas, sigue la 3d) | **Se trabaja acá** | https://nicolas1439.github.io/maximus/maximus/v2/ |
| `v1/` | Versión 1: el diseño tal como quedó el 17/10/2026, antes de la revisión final | Congelada: no se toca | https://nicolas1439.github.io/maximus/maximus/v1/ |

- `index.html` (esta carpeta) y el de la raíz redirigen a `v2/`: el link https://nicolas1439.github.io/maximus/ abre la v2 (decisión del usuario, 19/10/2026).
- Para comparar, la misma página en las dos versiones: `v1/<página>.html` y `v2/<página>.html`. Algunas páginas cambiaron de nombre en la v2 (la campaña pasó de `mes-de-la-primavera.html` a `primavera-maximus.html`); las nuevas de la v2 no existen en la v1.
- Las dos versiones comparten el dominio, así que comparten el localStorage del navegador: la sesión de muestra (`sesion`) vale para las dos. El tema no: la v1 lo guarda en `tema` y la v2 en `darkmode` (la clave del sitio real), así que cada una puede quedar en un modo distinto.
- Una versión nueva se crea copiando la carpeta de la última (`v2/` → `v3/`), se suma a esta tabla y la anterior queda congelada.

## Historia
- Hasta el 18/10/2026 la v1 era la rama `new-design` (en la raíz de `maximus/`) y la v2 se trabajaba en una rama aparte, `new-design-v2`, publicada en `/v2/` con un workflow de GitHub Actions. El 19/10/2026 se unificaron en esta rama, cada una en su carpeta, con el historial de las dos (decisión del usuario: todo en el mismo proyecto y a la vista). La rama `new-design-v2` y el workflow ya no existen.
- Tag `diseno-v1`: el último commit de la v1 antes de la revisión final (equivale a `v1/`).
- Tags `v2`, `v2.1` … `v5.6.23` del repo: son las versiones de los recursos del sitio en producción, no del diseño. No se crean ni se mueven tags con esos nombres.
