# Plantillas y componentes web

Herramienta para diseñar componentes y plantillas web profesionales. Cada carpeta de la raíz es un subproyecto (principalmente componentes y algunas plantillas).

## Portabilidad y publicación
La carpeta se usa desde distintos dispositivos y vive en GitHub: rama `new-design` del repo `nicolas1439/maximus` (el repo de archivos de Maximus; la rama es independiente de `main`, que sigue con los archivos del sitio actual).
- Usar siempre rutas relativas. Nunca rutas absolutas ni nada atado a un equipo en particular.
- Todo el contexto se registra en estos `.md`, no en la memoria local de Claude (esa no viaja entre dispositivos).
- La carpeta `.claude/` viaja con el proyecto: `launch.json` tiene la configuración de la vista previa. `settings.local.json` es propio de cada equipo y está en `.gitignore`.
- Configurar un dispositivo nuevo (una sola vez):
  1. Instalar Git, Node y GitHub CLI (`gh`).
  2. Autenticar GitHub con la cuenta nicolas1439: `gh auth login` (GitHub.com, HTTPS, con el navegador) y después `gh auth setup-git`, así `git push` usa esa cuenta.
  3. Clonar: `git clone -b new-design --single-branch https://github.com/nicolas1439/maximus.git "new design"`.
  4. Dentro de la carpeta, la identidad de los commits (es propia de cada clon, no viaja con el repo; no usar la global del equipo si es otra cuenta): `git config user.name "Nicolas Orellana"` y `git config user.email "112594581+nicolas1439@users.noreply.github.com"` (el correo privado de GitHub de la cuenta).
  5. Abrir la carpeta en Claude Code. La vista previa (`vista-previa`) ya viene configurada en `.claude/launch.json`.
- En cada sesión: al empezar, `git pull` para traer lo último; al cerrar, notas al día y commit y push con la confirmación del usuario. Antes de subir, revisar que no haya datos personales reales en los archivos.
- Publicación: GitHub Pages sirve la rama en https://nicolas1439.github.io/maximus/ (la raíz redirige a `maximus/`). Páginas completas: `maximus/index.html` (home), `maximus/placas-de-video.html` (listado), `maximus/rtx-5070-ti-ventus.html` (ficha de producto) y `maximus/mi-cuenta.html` (Mi cuenta). Cada push la actualiza en un minuto aproximadamente. Claude hace commit y push cuando el usuario lo confirma; no sube nada sin esa confirmación (decisión del usuario, 14/10/2026).
- Archivos de soporte en la raíz: `index.html` (redirección a `maximus/`), `.nojekyll` (Pages sirve los archivos tal cual) y `.gitignore`.

## Registro en .md
- Este archivo: solo lo general del proyecto. Nada específico de un subproyecto.
- Cada subproyecto tiene su propio `CLAUDE.md` en su carpeta, solo si hace falta registrar algo.
- Registrar solo lo necesario y lo que el usuario indique.
- Claude decide qué amerita registro, pero solo anota lo que ya está totalmente definido.

## Dinámica de trabajo
- Directo al hueso: el usuario da indicaciones y referencias; Claude actúa como experto en diseño y lo concreta con criterio profesional.
- No pedir contexto del sitio ni de qué se trata. El usuario lo da a medida que avanza; Claude anota solo si hace falta.
- Mostrar cómo va quedando el diseño (vista previa) para que el usuario decida. Servidor `vista-previa` en `.claude/launch.json` (Node, sin dependencias): sirve la raíz en `http://127.0.0.1:5500/<subproyecto>/`.
- Criterio propio aplicado de entrada: lo que tiene una práctica establecida (medidas, proporciones, jerarquía, accesibilidad, convenciones de e-commerce) se implementa directo con ese criterio, sin consultar; el usuario corrige si lo quiere distinto. Si al revisar algo ya hecho aparece una mejora de ese tipo, se aplica y se cuenta.
- Opciones visuales concretas solo cuando la decisión es de gusto o de marca y no hay una respuesta claramente mejor. Las opciones no se guardan como archivos; solo se implementa la elegida.
- Datos de muestra: lo que el sitio real no tiene (reseñas, campañas, pedidos de un cliente) se completa con datos de muestra creíbles para ver el diseño completo, y se anota que son de muestra (decisión del usuario, 14/10/2026). Nunca se copian datos personales reales del usuario (de su cuenta en el sitio, por ejemplo) a los archivos: el sitio publicado es público.
- Para ver secciones que piden iniciar sesión, el usuario se loguea él mismo en el navegador integrado; Claude solo lee la estructura.
- Al cerrar una sesión ("vamos cerrando"): las notas quedan al día y se suben con commit y push, así se puede seguir desde otro dispositivo.
- Claude observa la dinámica y anota acá lo necesario para mantenerla igual en todos los dispositivos.

## Criterios
- Orden y simplicidad: solo los archivos mínimos e indispensables.
- Componentes óptimos y funcionales, sin complicaciones.
- Por defecto: HTML, CSS y JS puro, sin build ni dependencias.
- Mobile es la prioridad (decisión del usuario, 14/10/2026): cada plantilla y componente se diseña y se revisa primero en celular (375px, de arriba abajo, en claro y oscuro, sin desbordes ni contenido pegado a los bordes) y recién después en tablet y escritorio. Antes de mostrar un avance, la versión mobile tiene que estar bien.
