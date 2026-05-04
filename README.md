# OF Downloader (Rebuilt from scratch)

Extensión de Chrome (MV3) reconstruida desde cero para descargar imágenes y videos visibles en la pestaña activa.

## Características

Escaneo de medios visibles en la página activa.
Descarga individual.
Descarga masiva de todos los medios detectados.
Dedupe básico por URL.
UI simple en popup.

## Estructura

`manifest.json`: configuración MV3.
`src/background.js`: worker de fondo y descargas.
`src/content.js`: detección de medios en la página.
`src/popup.html`: interfaz.
`src/popup.js`: lógica del popup.
`src/styles.css`: estilos.

## Instalación

1. Ve a `chrome://extensions`.
2. Activa **Modo desarrollador**.
3. Clic en **Cargar descomprimida**.
4. Selecciona la carpeta raíz del repo (donde está `manifest.json`).

## Uso

1. Abre una página con imágenes/videos.
2. Abre el popup de la extensión.
3. Pulsa **Escanear pestaña activa**.
4. Descarga individual o **Descargar todo**.

## Notas

Esta versión no incluye integración de pagos ni licencias.
Solo opera sobre medios que la pestaña ya puede visualizar.
