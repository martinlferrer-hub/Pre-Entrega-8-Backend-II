# EventHub API

API REST para una Plataforma de Eventos e Inscripciones.

## Pre-entrega 8 — Arquitectura DAO + Repository + Service + DTO

Esta etapa refactoriza la API existente sin modificar el contrato externo de sus endpoints. El objetivo es separar formalmente el acceso a datos, la lógica de dominio y la representación de las respuestas.

### Arquitectura

```text
HTTP Request
    ↓
Route
    ↓
Passport / Auth / Authorization
    ↓
Controller
    ↓
Service  ← lógica de negocio
    ↓
Repository  ← operaciones orientadas al dominio
    ↓
DAO  ← único acceso a Mongoose
    ↓
Model / MongoDB

Service
    ↓
DTO
    ↓
HTTP Response
```

### Responsabilidad de cada capa

| Capa | Responsabilidad | Acceso a Mongoose |
|---|---|---|
| Routes | Define endpoints y middlewares | No |
| Passport/Auth | Autenticación JWT, registro y login | No |
| Controllers | Extraen datos HTTP, llaman al service y responden | No |
| Services | Reglas de negocio, validaciones, permisos, cupos y notificaciones | No |
| Repository | API orientada al dominio sobre el acceso a datos | No |
| DAO | Consultas y operaciones de persistencia | **Sí, único lugar** |
| Model | Esquemas Mongoose | Sí, pero solo es importado por su DAO |
| DTO | Define qué información sale de la API | No |

## DAO

Existe un DAO por entidad principal:

- `src/dao/users.dao.js`
- `src/dao/events.dao.js`
- `src/dao/tickets.dao.js`

Son los únicos archivos de la aplicación que importan `UserModel`, `EventModel` y `TicketModel`.

## Repository

Existe un repository por entidad:

- `users.repository.js`
- `events.repository.js`
- `tickets.repository.js`

Los repositories no importan modelos. Exponen operaciones orientadas al dominio como:

- `findByEmail`
- `findPublishedEvents`
- `findEvents`
- `countEvents`
- `findActiveTicket`
- `countActiveTickets`
- `findUserTickets`
- `findEventTickets`
- `cancelTicket`

## Services

Los services consumen exclusivamente repositories y concentran la lógica de negocio.

### Sessions

`src/services/sessions.service.js`

- valida registro
- normaliza email
- impide manipulación pública del rol
- hashea password
- detecta duplicados
- valida credenciales
- construye la representación segura del usuario autenticado

### Events

`src/services/events.service.js`

- valida fechas
- valida capacidad y precio
- valida estados
- aplica filtros/paginación/ordenamiento
- verifica propiedad del evento
- permite a `admin` modificar recursos ajenos

### Tickets

`src/services/tickets.service.js`

- valida evento y estado
- valida cantidad
- verifica inscripción duplicada
- calcula cupos ocupados
- verifica disponibilidad
- crea la reserva
- aplica permisos de cancelación
- envía la confirmación por email

Los controllers no calculan cupos ni resuelven reglas de negocio.

## DTO

Los DTO están en `src/dto/`:

- `user.dto.js`
- `event.dto.js`
- `ticket.dto.js`

Toda respuesta sensible pasa por DTO antes de llegar al cliente.

### Seguridad de usuarios

`password` nunca forma parte de un DTO. Esto se mantiene incluso si internamente existe una contraseña hasheada en el documento de usuario.

### Ticket con populate

Cuando un ticket incluye un usuario mediante `populate`, el DAO solicita únicamente:

```text
first_name last_name email role
```

Nunca se solicita `password`.

Cuando incluye un evento, solo se exponen:

```text
title date location
```

El DTO vuelve a filtrar la representación antes de enviarla al cliente.

## Manejo centralizado de errores

`src/middlewares/error.middleware.js` normaliza los errores de la API.

| HTTP | Uso |
|---:|---|
| `400` | Datos inválidos o regla de entrada inválida |
| `401` | No autenticado / credenciales inválidas |
| `403` | Usuario autenticado sin permisos |
| `404` | Recurso inexistente |
| `409` | Conflicto: duplicados o cupos insuficientes |
| `500` | Error interno inesperado |

Ejemplo:

```json
{
  "status": "error",
  "message": "No hay cupos suficientes. Disponibles: 2"
}
```

## Autenticación

La autenticación continúa utilizando Passport y JWT.

El JWT se genera en el login y se almacena en la cookie `currentUser`.

La estrategia `passport-jwt` utiliza un extractor que obtiene el token desde esa cookie.

```text
POST /api/sessions/login
        ↓
Passport LocalStrategy
        ↓
Session Service
        ↓
JWT
        ↓
Cookie currentUser
        ↓
passport-jwt
        ↓
req.user
```

## Roles

| Acción | user | organizer | admin |
|---|:---:|:---:|:---:|
| Ver eventos publicados | ✅ | ✅ | ✅ |
| Crear evento | ❌ | ✅ | ✅ |
| Modificar evento propio | ❌ | ✅ | ✅ |
| Modificar evento ajeno | ❌ | ❌ | ✅ |
| Inscribirse | ✅ | ✅ | ✅ |
| Ver mis tickets | ✅ | ✅ | ✅ |
| Ver tickets de evento propio | ❌ | ✅ | ✅ |
| Cancelar ticket propio | ✅ | ✅ | ✅ |
| Cancelar ticket ajeno | ❌ | ❌ | ✅ |
| Administrar usuarios | ❌ | ❌ | ✅ |

## Endpoints

### Sessions

- `POST /api/sessions/register`
- `POST /api/sessions/login`
- `GET /api/sessions/current`
- `POST /api/sessions/logout`

### Events

- `GET /api/events`
- `GET /api/events/:id`
- `POST /api/events`
- `PUT /api/events/:id`
- `PATCH /api/events/:id/status`

### Tickets

- `POST /api/events/:eid/tickets`
- `GET /api/tickets/my-tickets`
- `GET /api/events/:eid/tickets`
- `PATCH /api/tickets/:tid/cancel`

### Users

- `GET /api/users` — solo `admin`

### Health

- `GET /api/health`

## Flujo completo a probar antes de entregar

1. Registrar usuario.
2. Confirmar que la respuesta no contiene `password`.
3. Iniciar sesión.
4. Consultar `GET /api/sessions/current`.
5. Confirmar que `/current` no contiene `password`.
6. Crear un evento con usuario `organizer`.
7. Consultar el evento publicado.
8. Inscribirse al evento.
9. Consultar `GET /api/tickets/my-tickets`.
10. Confirmar que el ticket funciona con `populate` sin exponer password del usuario.
11. Consultar tickets del evento como organizador propietario.
12. Cancelar la inscripción.
13. Intentar una operación protegida sin cookie → `401`.
14. Intentar modificar/consultar un recurso ajeno con usuario autenticado sin permisos → `403`.
15. Intentar duplicar una inscripción → `409`.
16. Intentar superar la capacidad → `409`.
17. Enviar datos inválidos → `400`.
18. Consultar un ID inexistente → `404`.

## Variables de entorno

Crear `.env` a partir de `.env.example`.

```env
PORT=8080
NODE_ENV=development
MONGO_URL=mongodb://localhost:27017/eventhub
JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=1h

MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your_email@example.com
MAIL_PASS=your_email_password
MAIL_FROM="EventHub <your_email@example.com>"
```

Nunca subir `.env`, credenciales ni `node_modules`.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Tests

```bash
npm test
```

Los tests unitarios no requieren conexión real a MongoDB cuando utilizan mocks/stubs de repositories.

## Estructura

```text
src/
├── app.js
├── server.js
├── config/
│   ├── database.js
│   ├── env.js
│   ├── mailer.js
│   └── passport.config.js
├── models/
│   ├── User.js
│   ├── Event.js
│   └── Ticket.js
├── dao/
│   ├── users.dao.js
│   ├── events.dao.js
│   └── tickets.dao.js
├── repositories/
│   ├── users.repository.js
│   ├── events.repository.js
│   └── tickets.repository.js
├── services/
│   ├── sessions.service.js
│   ├── users.service.js
│   ├── events.service.js
│   └── tickets.service.js
├── dto/
│   ├── user.dto.js
│   ├── event.dto.js
│   └── ticket.dto.js
├── controllers/
├── routes/
├── middlewares/
└── utils/
```

## Git recomendado para la entrega

No realizar un único commit gigante. La refactorización de P8 debe quedar documentada con commits progresivos y descriptivos, por ejemplo:

```text
refactor: formalize dao layer
refactor: orient repositories to domain operations
feat: add user event and ticket dtos
refactor: move session business rules to service
refactor: move ticket responses to dto
refactor: centralize api error handling
auth: use passport jwt cookie strategy
test: add dto and service unit tests
docs: document p8 layered architecture
```

La P8 continúa utilizando el mismo repositorio de GitHub del proyecto. No es necesario crear un repositorio nuevo.
