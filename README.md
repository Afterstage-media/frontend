# afterstage — frontend

Aplicación web pública y panel de redacción construidos con React y Vite.

## Desarrollo

```bash
npm ci
npm run dev
```

La API se configura con `VITE_API_BASE_URL`. La arquitectura y decisiones del
producto están en [afterstage/docs](https://github.com/afterstage/docs).

## Fotos en R2

`VITE_R2_MEDIA_UPLOADS=true` activa la carga directa de fotos desde el navegador
al gateway de Cloudflare R2. El navegador nunca recibe el token de servicio:
primero solicita una reserva/grant al backend, sube la foto con la URL temporal
y luego confirma la carga. El flujo acepta únicamente JPG, PNG y WEBP de hasta
5 MiB. Si la variable queda en `false` —valor predeterminado— se conserva el
flujo local legado mientras se terminan de configurar Cloudflare y el dominio de
medios.
