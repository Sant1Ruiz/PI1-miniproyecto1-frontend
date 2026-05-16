# Activivalles - Frontend

Frontend del MiniProyecto 1: planificador de estudio para actividades evaluativas.

Activivalles permite que un estudiante cree actividades, las divida en subtareas, organice su carga diaria, detecte conflictos por exceso de horas, registre avance real y visualice su progreso.

El frontend esta construido con React + Vite y se conecta a una API Django REST Framework mediante `VITE_API_URL`.

## Tabla de contenido

- [Tecnologias](#tecnologias)
- [Requisitos](#requisitos)
- [Instalacion](#instalacion)
- [Variables de entorno](#variables-de-entorno)
- [Comandos disponibles](#comandos-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Rutas principales](#rutas-principales)
- [Flujo funcional](#flujo-funcional)
- [Conexion con el backend](#conexion-con-el-backend)
- [Funcionalidades principales](#funcionalidades-principales)
- [Sprint 4: avance y progreso](#sprint-4-avance-y-progreso)
- [Sprint 5: calidad y evidencia](#sprint-5-calidad-y-evidencia)
- [Despliegue](#despliegue)
- [Pruebas manuales sugeridas](#pruebas-manuales-sugeridas)
- [Problemas comunes](#problemas-comunes)

## Tecnologias

- React 19
- Vite 7
- React Router DOM
- Bootstrap 5
- Bootstrap Icons
- SweetAlert2
- Recharts
- ESLint

## Requisitos

Antes de ejecutar el frontend se necesita:

- Node.js instalado.
- npm instalado.
- Backend Django ejecutandose localmente o desplegado.
- URL base del backend configurada en `VITE_API_URL`.

## Instalacion

Desde la carpeta del frontend:

```bash
cd PI1-miniproyecto1-frontend
npm install
```

Crear un archivo `.env` en la raiz del frontend:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Si el backend esta desplegado, usar la URL publica:

```env
VITE_API_URL=https://url-del-backend.com
```

Ejecutar el proyecto:

```bash
npm run dev
```

Por defecto Vite mostrara una URL similar a:

```text
http://localhost:5173
```

## Variables de entorno

| Variable | Obligatoria | Descripcion | Ejemplo |
|---|---:|---|---|
| `VITE_API_URL` | Si | URL base del backend. No debe incluir `/api` al final. | `http://127.0.0.1:8000` |

El frontend construye las rutas de API asi:

```text
VITE_API_URL + /api/auth/
VITE_API_URL + /api/activities/
```

Ejemplo:

```text
http://127.0.0.1:8000/api/activities/
```

## Comandos disponibles

```bash
npm run dev
```

Ejecuta el servidor de desarrollo.

```bash
npm run build
```

Genera la version de produccion en la carpeta `dist`.

```bash
npm run preview
```

Sirve localmente la version generada por `npm run build`.

```bash
npm run lint
```

Ejecuta ESLint sobre el proyecto.

## Estructura del proyecto

```text
src/
  api/
    activities.js
    auth.js
    client.js
  components/
    ActivityCard.jsx
    ActivityColumn.jsx
    ConflictResolutionModal.jsx
    LogoutButton.jsx
    ProtectedRoute.jsx
    RedirectPublic.jsx
    TaskCard.jsx
  context/
    ActivityStatsContext.jsx
    AuthContext.jsx
  hooks/
    useActivities.js
  pages/
    ActividadDetalle.jsx
    Actividades.jsx
    Conexion.jsx
    Crear.jsx
    Hoy.jsx
    Login.jsx
    NotFound.jsx
    Portada.jsx
    Profile.jsx
    Progreso.jsx
    Register.jsx
  utils/
    activityUtils.js
    dateUtils.js
    validators.js
  App.jsx
  main.jsx
  index.css
```

## Rutas principales

| Ruta | Pantalla | Descripcion |
|---|---|---|
| `/` | Portada | Pantalla inicial del producto. |
| `/login` | Login | Inicio de sesion con email y contrasena. |
| `/register` | Registro | Creacion de cuenta. |
| `/hoy` | Vista de Hoy | Tareas vencidas, tareas de hoy, proximas tareas, conflictos y actividades principales. |
| `/crear` | Crear actividad | Formulario para crear una actividad evaluativa principal. |
| `/actividad/:id` | Detalle | Detalle de actividad o subtarea, creacion de subtareas, edicion, avance, posposicion y reprogramacion. |
| `/progreso` | Progreso | Indicadores y graficas de avance. |
| `/actividades` | Actividades | Listado general de actividades. |
| `/perfil` | Perfil | Datos del usuario y limite maximo de horas por dia. |
| `/conexion` | Conexion | Diagnostico de conexion con el backend. |
| `*` | NotFound | Ruta no encontrada. |

Las rutas privadas estan protegidas por `ProtectedRoute`. Si no hay token, el usuario es redirigido a `/login`.

## Flujo funcional

El flujo principal funciona de punta a punta asi:

```text
Usuario
  -> Pantalla React
  -> Servicio API del frontend
  -> Endpoint Django REST Framework
  -> Base de datos
  -> Respuesta JSON
  -> Estado React actualizado
  -> Interfaz actualizada
```

Ejemplo al crear una actividad:

```text
Usuario completa /crear
  -> Crear.jsx valida el formulario
  -> createActivity() envia POST /api/activities/
  -> Django crea una Activity con parent = null
  -> La base de datos guarda la actividad
  -> La API responde con la actividad creada
  -> React redirige a /actividad/:id
```

Ejemplo al crear una subtarea:

```text
Usuario abre /actividad/:id
  -> ActividadDetalle.jsx abre modal de subtarea
  -> Se validan titulo, fecha y horas
  -> Se consulta /api/activities/totalhours?date=YYYY-MM-DD
  -> Si no hay conflicto, se envia POST /api/activities/ con parent = id
  -> La API guarda la subtarea
  -> React agrega la subtarea a la lista
```

Ejemplo al completar una subtarea:

```text
Usuario marca checkbox
  -> Hoy.jsx o ActividadDetalle.jsx llama toggleCompleteActivity()
  -> PATCH /api/activities/:id/ cambia status_id a 3
  -> La API devuelve la subtarea actualizada
  -> React actualiza el estado local
  -> La UI muestra la subtarea como completada
  -> El progreso se recalcula
```

## Conexion con el backend

Los servicios principales estan en:

| Archivo | Responsabilidad |
|---|---|
| `src/api/auth.js` | Login, registro, logout y actualizacion de perfil. |
| `src/api/activities.js` | CRUD de actividades, subtareas, completar, editar, borrar y consultar horas. |
| `src/api/client.js` | Cliente generico para peticiones HTTP. |

Endpoints consumidos por el frontend:

| Metodo | Endpoint | Uso |
|---|---|---|
| `POST` | `/api/auth/register/` | Crear cuenta. |
| `POST` | `/api/auth/login/` | Iniciar sesion. |
| `GET` | `/api/auth/me/` | Validar token y obtener usuario actual. |
| `PATCH` | `/api/auth/me/` | Actualizar perfil y limite diario. |
| `POST` | `/api/auth/logout/` | Cerrar sesion. |
| `GET` | `/api/activities/` | Listar actividades del usuario. |
| `POST` | `/api/activities/` | Crear actividad o subtarea. |
| `GET` | `/api/activities/:id/` | Obtener detalle de actividad. |
| `PATCH` | `/api/activities/:id/` | Editar, completar, posponer o reprogramar. |
| `DELETE` | `/api/activities/:id/` | Eliminar actividad o subtarea. |
| `GET` | `/api/activities/:id/subtasks/` | Obtener subtareas de una actividad. |
| `GET` | `/api/activities/totalhours?date=YYYY-MM-DD` | Consultar horas ocupadas en un dia. |

## Funcionalidades principales

### Autenticacion

- Registro de usuario.
- Inicio de sesion.
- Persistencia del token en `localStorage`.
- Validacion del token con `/api/auth/me/`.
- Cierre de sesion.
- Proteccion de rutas privadas.

Archivos relacionados:

- `src/pages/Login.jsx`
- `src/pages/Register.jsx`
- `src/context/AuthContext.jsx`
- `src/components/ProtectedRoute.jsx`
- `src/api/auth.js`

### Crear actividades

El usuario puede crear una actividad evaluativa principal con:

- Titulo.
- Descripcion opcional.
- Fecha limite.
- Prioridad.

Si la fecha limite es hoy, la prioridad se asigna automaticamente como alta.

Archivo principal:

- `src/pages/Crear.jsx`

### Crear subtareas

Desde el detalle de una actividad principal, el usuario puede agregar subtareas con:

- Titulo.
- Descripcion.
- Fecha de ejecucion.
- Horas estimadas.

La fecha de ejecucion no debe superar la fecha limite de la actividad principal.

Archivo principal:

- `src/pages/ActividadDetalle.jsx`

### Vista de Hoy

La vista `/hoy` clasifica subtareas en:

- Vencidas.
- Hoy.
- Proximas.

Tambien muestra actividades principales pendientes y su progreso.

Archivo principal:

- `src/pages/Hoy.jsx`

### Deteccion de conflictos

El sistema suma las horas estimadas de subtareas pendientes por dia y las compara con el limite diario del usuario (`max_horas_day`).

Si se supera el limite, muestra alertas y opciones como:

- Reducir horas de una tarea.
- Mover una tarea a otra fecha.
- Aumentar el limite diario.

Archivos relacionados:

- `src/pages/Hoy.jsx`
- `src/pages/ActividadDetalle.jsx`
- `src/pages/Profile.jsx`
- `src/components/ConflictResolutionModal.jsx`

### Perfil

En `/perfil`, el usuario puede:

- Ver su correo.
- Editar su nombre.
- Cambiar su limite maximo de horas por dia.

Si reduce el limite y eso genera conflictos, se abre un flujo de resolucion.

Archivo principal:

- `src/pages/Profile.jsx`

## Sprint 4: avance y progreso

Sprint 4 se enfoca en registrar la ejecucion real y visualizar avance.

### Marcar subtareas como hechas

La accion se realiza desde:

- `src/pages/Hoy.jsx`
- `src/pages/ActividadDetalle.jsx`
- `src/components/TaskCard.jsx`

El frontend llama:

```js
toggleCompleteActivity(activity)
```

Esta funcion esta en:

```text
src/api/activities.js
```

Internamente envia:

```http
PATCH /api/activities/:id/
```

Con:

```json
{
  "status_id": 3
}
```

El estado `3` significa `Completada`.

### Marcar subtareas como pospuestas

La accion se realiza desde:

- `src/pages/Hoy.jsx`
- `src/pages/ActividadDetalle.jsx`

El frontend envia:

```json
{
  "status_id": 5,
  "reason": "Motivo opcional"
}
```

El estado `5` significa `Pospuesta`.

La nota opcional se guarda en el backend como `ActivityNote`.

### Progreso de una actividad

En el detalle de una actividad principal, el progreso se calcula contando:

```text
subtareas completadas / total de subtareas
```

Ejemplo:

```text
3 subtareas completadas de 5 = 60%
```

Archivo:

- `src/pages/ActividadDetalle.jsx`

### Progreso general

La pantalla `/progreso` calcula:

- Total de actividades principales.
- Actividades completadas.
- Actividades pendientes.
- Actividades vencidas.
- Tareas para hoy.
- Tareas proximas.
- Tareas vencidas.
- Graficas por estado y prioridad.

Archivo:

- `src/pages/Progreso.jsx`

## Sprint 5: calidad y evidencia

Sprint 5 busca demostrar que el producto funciona de forma estable, usable y desplegable.

### Calidad end-to-end

El proyecto demuestra flujo completo:

```text
React -> API Django REST Framework -> Base de datos -> React
```

Flujos recomendados para evidencia:

1. Crear usuario.
2. Iniciar sesion.
3. Crear actividad.
4. Crear subtareas.
5. Ver tareas en `/hoy`.
6. Detectar conflicto de horas.
7. Posponer subtarea con nota.
8. Reprogramar subtarea.
9. Marcar subtarea como completada.
10. Ver progreso actualizado.

### Estados de interfaz

El frontend incluye:

- Estados de carga.
- Mensajes de error.
- Mensajes de exito.
- Alertas de conflicto.
- Estados vacios.
- Confirmaciones antes de eliminar.
- Toasts para acciones exitosas.

### Accesibilidad minima

El proyecto incluye varios elementos de accesibilidad:

- Labels en formularios.
- `aria-label` en acciones iconicas.
- `role="alert"` para mensajes importantes.
- `role="dialog"` y `aria-modal` en modales.
- Textos visibles para errores y validaciones.
- Navegacion por rutas protegidas.

Antes de entregar, se recomienda verificar manualmente:

- Navegacion con teclado.
- Foco visible en botones y enlaces.
- Contraste de botones, badges y alertas.
- Lectura clara de errores.
- Que los iconos importantes tengan texto, `title` o `aria-label`.

### Evidencia sugerida para Sprint 5

Para la sustentacion o entrega final se pueden mostrar:

- Captura del login.
- Captura de creacion de actividad.
- Captura de creacion de subtarea.
- Captura de conflicto por horas.
- Captura de subtarea pospuesta con nota.
- Captura de reprogramacion.
- Captura de subtarea completada.
- Captura de progreso actualizado.
- Captura de `/api/docs/` del backend.
- Captura de `/health/` del backend.
- Resultado de `npm run build`.
- Resultado de pruebas del backend.
- Evidencia de user testing.
- URLs de despliegue frontend y backend.

## Despliegue

### Frontend en Vercel

El proyecto incluye `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Esto permite que rutas como `/hoy`, `/crear` o `/actividad/:id` funcionen correctamente al recargar la pagina en produccion.

Pasos generales:

1. Subir el repositorio a GitHub.
2. Importar el frontend en Vercel.
3. Configurar la variable de entorno:

```env
VITE_API_URL=https://url-del-backend.com
```

4. Ejecutar build con:

```bash
npm run build
```

5. Publicar.

### Conexion con backend desplegado

Para que el frontend desplegado pueda consumir la API, el backend debe permitir el dominio del frontend en CORS.

En el backend se debe configurar:

```env
CORS_ALLOWED_ORIGINS=https://url-del-frontend.vercel.app
ALLOWED_HOSTS=url-del-backend.com
```

La URL exacta depende de la plataforma de despliegue usada para el backend.

## Pruebas manuales sugeridas

### Autenticacion

- Registrar usuario nuevo.
- Iniciar sesion.
- Cerrar sesion.
- Intentar entrar a `/hoy` sin token y confirmar redireccion a `/login`.

### Actividades

- Crear actividad con titulo y fecha.
- Ver redireccion al detalle.
- Editar actividad.
- Eliminar actividad.

### Subtareas

- Crear subtarea valida.
- Intentar crear subtarea sin titulo.
- Intentar crear subtarea sin fecha.
- Intentar crear subtarea con fecha posterior a la fecha limite.
- Crear subtarea con horas estimadas.

### Conflictos

- Crear varias subtareas en el mismo dia hasta superar el limite.
- Confirmar alerta de conflicto.
- Probar reducir horas.
- Probar mover fecha.
- Probar aumentar limite diario.

### Sprint 4

- Marcar subtarea como completada.
- Ver que cambia visualmente.
- Confirmar que el progreso se actualiza.
- Posponer subtarea con nota.
- Ver la nota en detalle.
- Reprogramar subtarea pospuesta.
- Confirmar que vuelve a pendiente.

### Sprint 5

- Ejecutar `npm run build`.
- Verificar que el frontend desplegado se conecta al backend.
- Verificar estados vacios.
- Verificar mensajes de error.
- Verificar navegacion con teclado.
- Revisar contraste y foco visible.

## Problemas comunes

### `VITE_API_URL no esta definida`

Crear el archivo `.env` en la raiz del frontend:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Luego reiniciar el servidor de Vite.

### Error de CORS

El backend no esta permitiendo el dominio del frontend.

Solucion:

- Revisar `CORS_ALLOWED_ORIGINS` en el backend.
- Confirmar que el dominio del frontend esta incluido.
- Confirmar que `VITE_API_URL` apunta al backend correcto.

### Error 401

El token no existe, expiro o fue invalidado.

Solucion:

- Cerrar sesion.
- Iniciar sesion nuevamente.
- Revisar que el frontend envie el header:

```http
Authorization: Token <token>
```

### Al recargar `/hoy` o `/actividad/:id` aparece 404 en produccion

El hosting no esta redirigiendo rutas internas de React a `index.html`.

En Vercel se soluciona con `vercel.json`, ya incluido en este proyecto.

### El frontend no se conecta al backend desplegado

Revisar:

- `VITE_API_URL` en Vercel.
- `CORS_ALLOWED_ORIGINS` en backend.
- `ALLOWED_HOSTS` en backend.
- Que el backend responda en `/health/`.

## Autores

Proyecto desarrollado como MiniProyecto 1 para la materia de Proyecto Integrador.

## Estado del proyecto

El frontend implementa el flujo principal:

```text
Login -> Crear actividad -> Crear subtareas -> Vista Hoy -> Conflictos -> Avance -> Progreso
```

Este flujo depende de que el backend Django REST Framework este activo y correctamente configurado.
