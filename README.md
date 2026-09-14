# Support Connect Hub

Actúa como un Arquitecto de Software Full-Stack Senior y experto en Seguridad Informática. Diseña y construye una aplicación web altamente escalable utilizando React (Vite), Tailwind CSS, TypeScript y la integración nativa de Supabase (PostgreSQL). La aplicación debe estar optimizada estructuralmente para ser contenerizada en Docker y desplegada posteriormente en un servidor local (On-Premise).

Aplica las siguientes especificaciones técnicas y lógicas de negocio:

1. CONTROL DE ACCESO Y SEGURIDAD (RBAC):

Implementa un sistema estricto de Control de Acceso Basado en Roles (RBAC). Configura la lógica para tres interfaces (Dashboards) totalmente independientes y protegidas por rutas autenticadas:

- ROL USUARIO: Interfaz limpia y móvil-first. Flujo: Registro/Login -> Pantalla principal con historial de servicios -> Botón flotante para "Solicitar Soporte Técnico" (Formulario con título, descripción del problema, categoría y urgencia) -> Vista de seguimiento en tiempo real del técnico (estados: Pendiente, Asignado, En Camino, En Proceso, Finalizado) -> Pantalla de feedback (Calificación por estrellas y comentarios).

- ROL TÉCNICO: Interfaz operativa optimizada para celulares. Flujo: Login -> Tablero de "Solicitudes Disponibles" (filtro por zona geográfica o categoría) -> Botón para "Aceptar Servicio" -> Vista del servicio activo con datos de contacto del usuario y mapa simulado -> Botones de cambio de estado con validación -> Sección para ingresar "Notas técnicas del cierre" y adjuntar evidencias.

- ROL ADMINISTRADOR: Panel de control analítico (Dashboard Web). Flujo: Login -> Métricas clave en tarjetas (Total servicios, Técnicos activos, Calificación promedio) -> Tabla de gestión de usuarios y técnicos (con acciones para Aprobar, Rechazar o Suspender técnicos) -> Vista global de monitoreo de servicios en tiempo real.

2. ARQUITECTURA DE LA BASE DE DATOS (Relacional - PostgreSQL):

Estructura las tablas en Supabase asegurando la integridad referencial y escalabilidad (índices en llaves foráneas):

- Tabla 'profiles': id (uuid, FK de auth.users), nombre_completo, telefono, rol (enum: 'usuario', 'tecnico', 'admin'), estado (enum: 'activo', 'pendiente_aprobacion', 'suspendido'), creado_en.

- Tabla 'tickets_servicio': id (uuid), usuario_id (FK profiles), tecnico_id (FK profiles, nullable), titulo, descripcion, categoria, urgencia, estado (enum del flujo), creado_en, actualizado_en.

- Tabla 'resenas': id (uuid), ticket_id (FK tickets_servicio), puntuacion (int), comentario, creado_en.

3. REQUISITOS DE ESCALABILIDAD Y CÓDIGO LIMPIO:

- Código modular: Separa estrictamente los componentes visuales de la lógica de peticiones a la base de datos (custom hooks de React).

- Estados globales eficientes: Usa un sistema de manejo de estados optimizado para evitar re-renders innecesarios cuando haya alta concurrencia de datos.

- Sincronización en tiempo real: Configura Supabase Realtime para que los cambios de estado que realice el Técnico se reflejen instantáneamente en la pantalla del Usuario y del Administrador sin necesidad de recargar la página.

Comienza generando la navegación principal, las pantallas de autenticación diferenciadas y la estructura visual de los tres dashboards conectados lógicamente entre sí.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://support-flow-06.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/77598dcb-bf4c-44cd-99a4-da5a66241c7e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
