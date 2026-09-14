# Dispatch7 — Despliegue en servidor local (Docker)

Guía paso a paso para levantar Dispatch7 en un servidor propio (on-premise).

---

## 1. Requisitos

- Docker Engine 24+ y Docker Compose v2
- 2 GB de RAM libres (el build necesita algo más)
- Puerto `3000` libre (o cambia `APP_PORT`)

Comprueba:

```bash
docker --version
docker compose version
```

---

## 2. Variables de entorno

Copia la plantilla y edítala:

```bash
cp .env.example .env
nano .env
```

| Variable | Dónde se usa | Para qué sirve |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Build (navegador) | URL pública de la base de datos, tal como la ve el navegador del usuario |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Build (navegador) | Clave pública; es segura de exponer, las reglas de acceso protegen los datos |
| `VITE_SUPABASE_PROJECT_ID` | Build (navegador) | Identificador del proyecto |
| `SUPABASE_URL` | Contenedor | URL interna de la base de datos vista desde el servidor |
| `SUPABASE_PUBLISHABLE_KEY` | Contenedor | Clave pública usada en el servidor |
| `SUPABASE_SERVICE_ROLE_KEY` | Contenedor | Clave privilegiada. **Nunca** la pongas en variables `VITE_` |
| `APP_PORT` | Compose | Puerto publicado en el host |

> Importante: las variables `VITE_*` se incrustan en el momento del **build**. Si las cambias, hay que reconstruir la imagen (`docker compose build --no-cache`).

---

## 3. Base de datos local

La aplicación usa PostgreSQL a través de Supabase. Para on-premise tienes dos caminos:

### Opción A — Supabase self-hosted (recomendada)

```bash
git clone --depth 1 https://github.com/supabase/supabase
cp -r supabase/docker ~/supabase-local
cd ~/supabase-local
cp .env.example .env      # define POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY
docker compose up -d
```

Esto expone la API en `http://localhost:8000` y Postgres en `localhost:5432`.
Copia `ANON_KEY` y `SERVICE_ROLE_KEY` al `.env` de Dispatch7.

### Opción B — Supabase CLI (para pruebas rápidas)

```bash
npx supabase start
npx supabase status   # muestra URL y claves
```

### Inicializar el esquema

Las migraciones del proyecto están en `supabase/migrations/`. Aplícalas en orden:

```bash
# Con la CLI (usa el proyecto local ya iniciado)
npx supabase db reset

# O directamente con psql contra el Postgres del contenedor
for f in supabase/migrations/*.sql; do
  psql "postgresql://postgres:TU_PASSWORD@localhost:5432/postgres" -f "$f"
done
```

Esto crea: `profiles`, `user_roles`, `tickets_servicio`, `resenas`,
`admins_autorizados`, los tipos de estado, las funciones de permisos, los
disparadores y las reglas de acceso por fila.

### Habilitar tiempo real

El estado de los servicios se sincroniza en vivo. Verifica que las tablas estén
publicadas (las migraciones ya lo hacen):

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets_servicio;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
```

### Crear el primer administrador

Nadie puede asignarse el rol de administrador desde la aplicación. El correo
autorizado vive en la tabla `admins_autorizados`:

```sql
INSERT INTO public.admins_autorizados (email)
VALUES ('correo@tudominio.com')
ON CONFLICT (email) DO NOTHING;
```

La próxima vez que esa persona inicie sesión, recibe el rol de administrador
automáticamente.

---

## 4. Construir y levantar la aplicación

```bash
docker compose build
docker compose up -d
```

Abre `http://IP_DEL_SERVIDOR:3000`.

Comandos útiles:

```bash
docker compose logs -f dispatch7   # ver registros en vivo
docker compose restart dispatch7   # reiniciar
docker compose down                # detener y eliminar el contenedor
docker compose build --no-cache && docker compose up -d   # reconstruir tras cambios
```

Sin Compose:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=... \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=... \
  -t dispatch7:local .

docker run -d --name dispatch7 -p 3000:3000 --env-file .env dispatch7:local
```

---

## 5. Puesta en producción interna

- Coloca un proxy inverso (Nginx, Caddy o Traefik) delante del puerto 3000 y
  termina TLS ahí.
- Si Dispatch7 y Supabase corren en el mismo host, únelos en la misma red de
  Docker y usa nombres de servicio (`http://kong:8000`) en `SUPABASE_URL`.
- Realiza respaldos periódicos del volumen de Postgres.
- `docker compose` ya reinicia el contenedor automáticamente si falla.

---

## 6. Problemas frecuentes

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| Pantalla en blanco y errores de conexión | `VITE_SUPABASE_URL` apunta a una dirección que el navegador no alcanza | Usa la URL pública del servidor, no `localhost` interno; reconstruye |
| "permission denied" al leer datos | Migraciones incompletas | Vuelve a aplicar todas las migraciones en orden |
| Los estados no se actualizan solos | Tiempo real no publicado | Ejecuta los `ALTER PUBLICATION` de arriba |
| El build falla por memoria | Poca RAM | Construye la imagen en otra máquina y publícala en tu registro interno |
