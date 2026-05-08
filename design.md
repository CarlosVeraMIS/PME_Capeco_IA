# Design Document: SalesVoice — Plataforma de Registro de Conversaciones para Fuerzas de Venta

---

## 1. Visión General

**SalesVoice** es un ecosistema de dos plataformas:

1. **App Móvil (Field App):** Usada por vendedores en campo para registrar consentimiento, grabar sesiones con clientes, y consultar su avance de visitas. Funciona offline-first.
2. **Plataforma Web (Admin Panel):** Usada por administradores para gestionar vendedores, clientes, planes de visita, roles, y ver dashboards de cumplimiento y conversión.

### Principio de Diseño: "The Field Commander"

Heredado de *The Digital Chancellor*, adaptado al contexto de ventas en campo. La UI debe transmitir:
- **Autoridad institucional** → el vendedor representa a una marca seria.
- **Claridad bajo presión** → en una reunión presencial, cada tap debe ser evidente.
- **Confianza del cliente** → la pantalla de consentimiento debe sentirse transparente y respetuosa.

---

## 2. Sistema de Diseño

### 2.1 Paleta de Colores

Hereda la base del Academic Precision Framework con ajustes para el contexto comercial.

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#000a1e` | Midnight Navy — fondos de impacto, texto principal dark |
| `primary_container` | `#002147` | Gradientes hero, headers web |
| `secondary` | `#705d00` | Gold oscuro — texto sobre gold |
| `secondary_container` | `#fcd400` | Academic Gold — CTA principal, indicador de grabación |
| `on_secondary_fixed` | `#1a1600` | Texto sobre gold |
| `tertiary` | `#1b6b3a` | Verde confianza — estado "grabando con consentimiento", éxito |
| `tertiary_container` | `#d6f5e3` | Fondo de badge de consentimiento aprobado |
| `error` | `#ba1a1a` | Errores críticos, rechazo de consentimiento |
| `error_container` | `#ffdad6` | Fondo suave de error |
| `surface` | `#f8f9fa` | Base de pantalla |
| `surface_container_low` | `#f3f4f5` | Secciones, cards de lista |
| `surface_container` | `#edeef0` | Cards elevadas |
| `surface_container_high` | `#e7e8ea` | Fondos de input |
| `surface_container_highest` | `#e1e3e4` | Separadores tonales |
| `on_surface` | `#191c1d` | Texto body principal |
| `on_surface_variant` | `#41484d` | Texto secundario, labels |
| `outline_variant` | `#c1c7cd` | Ghost borders (15% opacidad máx) |

**Regla de oro:** El gold (`#fcd400`) es el "laser pointer" del sistema. Úsalo únicamente para:
- Botón principal de grabación
- Indicador de sesión activa
- Métricas clave en dashboard
- Badge de notificación de visitas pendientes

### 2.2 Tipografía

- **Display / Headlines:** `Manrope` — geométrico, preciso, moderno
- **Body / Labels / Datos:** `Public Sans` — legible, institucional

| Escala | Tamaño | Peso | Uso |
|---|---|---|---|
| `display-lg` | 3.5rem | 700 | Stats hero en dashboard |
| `headline-lg` | 2rem | 700 | Título de pantalla principal |
| `headline-sm` | 1.25rem | 600 | Encabezados de sección |
| `body-lg` | 1rem | 400 | Descripción de cliente, notas |
| `body-md` | 0.875rem | 400 | Datos de lista, campos |
| `label-lg` | 0.875rem | 600 | Uppercase subtítulos, badges |
| `label-md` | 0.75rem | 500 | Metadata, timestamps |

### 2.3 Elevación y Profundidad

Igual que el sistema base: sin sombras de poder, solo de foco.

- **Capas físicas:** `surface` → `surface_container_low` → `surface_container_lowest` (#fff)
- **Modal flotante (ej. grabación activa):** blur `12px`, sombra `0px 0px 24px rgba(25,28,29,0.06)`
- **Ghost border de accesibilidad:** `outline_variant` al 15% de opacidad

### 2.4 Espaciado

Sistema de 4px base:

| Token | px | rem | Uso |
|---|---|---|---|
| `spacing-2` | 8px | 0.5rem | Gaps internos de badge |
| `spacing-4` | 16px | 1rem | Padding de card |
| `spacing-6` | 24px | 1.5rem | Separación entre elementos |
| `spacing-8` | 32px | 2rem | Sección breathing room |
| `spacing-10` | 40px | 2.5rem | Margen izquierdo editorial |
| `spacing-12` | 48px | 3rem | Touch target mínimo |
| `spacing-16` | 64px | 4rem | Separación entre secciones |

### 2.5 Bordes y Formas

- **Botón primario:** `border-radius: 6px` (0.375rem) — `md`
- **Cards:** `border-radius: 12px` — `lg`
- **Modales / Bottom Sheets:** `border-radius: 20px 20px 0 0` (top)
- **Badges / Pills:** `border-radius: 999px` — fully rounded
- **Regla:** Cero bordes de 1px sólidos. Separación solo por color de fondo.

---

## 3. Arquitectura de la Aplicación

```
salesvoice/
├── mobile/                    # React Native (Expo)
│   ├── app/
│   │   ├── (auth)/            # Login, recuperar contraseña
│   │   ├── (home)/            # Dashboard del vendedor
│   │   ├── visits/            # Lista y detalle de visitas asignadas
│   │   ├── consent/           # Pantalla de consentimiento + IA
│   │   ├── recording/         # Grabación activa, pausa, fin
│   │   └── sync/              # Estado de sincronización offline
│   ├── components/
│   ├── services/
│   │   ├── audio/             # Grabación y compresión de audio
│   │   ├── ai/                # Reconocimiento de consentimiento
│   │   ├── sync/              # Cola offline → subida
│   │   └── api/               # Cliente HTTP
│   └── store/                 # Estado local (Zustand / MMKV)
│
├── web/                       # Next.js App Router
│   ├── app/
│   │   ├── (auth)/
│   │   ├── dashboard/         # KPIs y cumplimiento
│   │   ├── users/             # Gestión de vendedores
│   │   ├── clients/           # Gestión de empresas clientes
│   │   ├── contacts/          # Usuarios de cliente a visitar
│   │   ├── visits/            # Plan de visitas
│   │   ├── groups/            # Grupos de vendedores
│   │   ├── recordings/        # Biblioteca de grabaciones
│   │   ├── funnel/            # Embudo de conversión
│   │   └── settings/          # Roles, integraciones, cuenta
│   └── components/
│
└── backend/                   # Node.js / Fastify o NestJS
    ├── api/
    │   ├── auth/
    │   ├── users/
    │   ├── clients/
    │   ├── visits/
    │   ├── recordings/
    │   ├── consent/
    │   └── integrations/      # CRM (HubSpot futuro)
    ├── services/
    │   ├── storage/           # S3 / GCS para grabaciones
    │   ├── ai/                # Whisper + LLM para consentimiento
    │   └── notifications/
    └── db/                    # PostgreSQL + Prisma
```

---

## 4. Modelos de Datos

### Users (Usuarios del sistema)
```
User {
  id, email, name, phone,
  role: ADMIN | MANAGER | SELLER,
  groupId?,
  isActive,
  createdAt, updatedAt
}
```

### Groups (Grupos de vendedores)
```
Group {
  id, name, managerId,
  members: User[],
  createdAt
}
```

### Clients (Empresas clientes a visitar)
```
Client {
  id, companyName, industry,
  address, city,
  assignedSellerId,
  status: PROSPECT | ACTIVE | INACTIVE,
  crmExternalId?,          // Para integración HubSpot futura
  createdAt
}
```

### Contacts (Usuarios del cliente — personas a visitar)
```
Contact {
  id, clientId,
  name, role, email, phone,
  isDecisionMaker,
  createdAt
}
```

### Visits (Plan de visitas)
```
Visit {
  id, sellerId, clientId, contactId,
  scheduledAt, completedAt?,
  status: PENDING | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW,
  notes?,
  recordingId?
}
```

### Recordings (Grabaciones)
```
Recording {
  id, visitId, sellerId,
  consentGranted: boolean,
  consentMethod: AI_VOICE | MANUAL,
  consentConfidence?: float,    // Score del modelo de IA
  consentAudioUrl?,
  audioUrl,                     // URL en storage
  durationSeconds,
  fileSize,
  status: PENDING_UPLOAD | UPLOADED | PROCESSING | READY | FAILED,
  transcriptUrl?,
  createdAt, uploadedAt?
}
```

### ConversionFunnelStages
```
FunnelStage {
  id, name, order, color,
  isDefault: boolean
}

VisitFunnelStatus {
  visitId, stageId, movedAt, movedBy
}
```

---

## 5. App Móvil — Pantallas y Flujos

### 5.1 Autenticación

**Login Screen**
- Hero con gradiente `primary` → `primary_container` (135°)
- Logo centrado, tipografía `display-lg` con nombre del producto
- Inputs con accent left-border `primary` al foco
- Botón "Ingresar" — `secondary_container` (gold) + texto `on_secondary_fixed`
- Link "¿Olvidaste tu contraseña?" — `tertiary` text button

### 5.2 Home del Vendedor

**Layout:** Bottom navigation con 4 tabs: Inicio | Visitas | Grabaciones | Perfil

**Tab Inicio**
- Header: `headline-lg` "Buenos días, [Nombre]"
- Subtítulo `label-lg` uppercase gold: "HOY — [fecha]"
- Cards de resumen:
  - Visitas asignadas hoy
  - Visitas completadas
  - Grabaciones pendientes de sync
- Sección "Próxima visita" — card destacada con cliente, dirección, hora

**Tab Visitas**
- Lista de visitas asignadas (todos los días)
- Filtros: HOY | SEMANA | TODAS
- Cada item: nombre del cliente, contacto, hora, badge de estado
- Badge estados:
  - `PENDING` → gold pill "Pendiente"
  - `IN_PROGRESS` → primary dark "En curso"
  - `COMPLETED` → green `tertiary` "Completada"
  - `NO_SHOW` → error soft "No se presentó"

**Tab Grabaciones**
- Lista de grabaciones propias
- Badge de sync: ☁️ Subida / 📱 Local (pendiente de sync)
- Duración, cliente, fecha

### 5.3 Flujo de Visita → Consentimiento → Grabación

Este es el flujo crítico de la app.

---

**PASO 1: Iniciar Visita**

Al tocar una visita → pantalla de detalle con:
- Card de cliente: nombre empresa, contacto, cargo
- Dirección con link a Maps
- Botón principal gold "Iniciar Visita"
- Al tocar → el status de la visita cambia a `IN_PROGRESS`

---

**PASO 2: Pantalla de Consentimiento**

Esta pantalla se muestra al cliente en el teléfono del vendedor.

**Diseño:**
- Fondo: `surface` blanco limpio
- Header subtle: logo pequeño + nombre empresa vendedora
- Headline `headline-lg` centrado:
  > "¿Nos permites grabar esta conversación?"
- Body `body-lg` explicativo (máx 3 líneas, lenguaje claro):
  > "Esta grabación es únicamente para mejorar la calidad de nuestro servicio. No será compartida con terceros. Puedes solicitar su eliminación en cualquier momento."
- Dos botones grandes (`spacing-12` alto mínimo):
  - ✅ "Sí, acepto" → `secondary_container` gold
  - ❌ "No, prefiero no grabar" → outlined, `error` text

**Método de consentimiento: reconocimiento de voz con IA**
- Debajo de los botones: micrófono pulsante con instrucción:
  > "O di en voz alta: 'Sí, acepto' para confirmar"
- El sistema graba 3–5 segundos de audio
- Envía al servicio de IA (Whisper + clasificador)
- Si confianza ≥ 0.85 → consentimiento aprobado
- Si confianza < 0.85 → pide que toque el botón manualmente
- Si el cliente dice "No" o variante negativa → registra rechazo

**Estados post-consentimiento:**
- ✅ Aprobado: pantalla `tertiary_container` verde suave + checkmark + "Consentimiento registrado"
- ❌ Rechazado: pantalla `error_container` + "Visita registrada sin grabación"

---

**PASO 3: Grabación Activa**

Si consentimiento aprobado → pantalla de grabación:

**Diseño:**
- Fondo `primary` navy oscuro (inmersivo, difícil de accionar accidentalmente)
- Centro: ícono de onda de audio animado
- Pill indicador gold pulsante: `●  REC 00:00`
- Datos del cliente arriba: nombre + empresa en `on_primary` (blanco)
- Botones:
  - "Pausar" → circular, `surface_container` gris
  - "Finalizar" → rectangular `secondary_container` gold "Terminar sesión"
- Tiempo transcurrido en `display-lg`

**Comportamiento offline:**
- Si no hay conectividad → la grabación se guarda en almacenamiento local encriptado
- Badge visible: 📵 "Sin señal — guardando localmente"
- Al recuperar conectividad → sincronización automática en background
- El usuario ve en Tab Grabaciones: estado "Pendiente de subida"

---

**PASO 4: Resumen de Visita**

Al finalizar grabación → Bottom sheet de resumen:
- Duración de la grabación
- Cliente y contacto visitado
- Toggle: ¿Se logró el objetivo? Sí / No
- Campo de notas de texto libre (opcional)
- Selector de etapa del funnel (ej: "Interesado", "Cotización enviada", etc.)
- Botón "Guardar y cerrar visita"

---

### 5.4 Sincronización Offline

**Estrategia:**
1. Audio grabado → comprimido (AAC, ~64kbps) → guardado en MMKV/FileSystem local
2. Metadata de la visita guardada en SQLite local (WatermelonDB o expo-sqlite)
3. Al detectar conectividad (wifi o datos) → worker en background sube en orden de cola
4. Uploads con multipart + retry exponencial (3 intentos)
5. Al confirmar subida → limpia archivo local

**Indicador global de sync:**
- Ícono en header: nube con número de pendientes
- Pantalla dedicada: `/sync` con lista de grabaciones y estado de cada una

---

## 6. Plataforma Web — Pantallas y Módulos

### 6.1 Layout General

- **Sidebar izquierdo:** navegación principal, logo, avatar del admin
- **Topbar:** breadcrumb + buscador global + notificaciones
- **Área de contenido:** márgenes asimétricos (`spacing-10` izquierdo) para look editorial
- **Colores:** fondo `surface`, sidebar `primary` navy con texto `on_primary`

### 6.2 Dashboard Principal

**Métricas Hero (grid 4 columnas):**
- Total visitas planificadas (mes)
- Visitas completadas — con % de cumplimiento
- Grabaciones realizadas
- Tasa de consentimiento

**Cada card métrica:**
- Número en `display-lg` gold
- Label en `label-lg` uppercase navy
- Variación vs mes anterior en `body-md`

**Gráficos:**
- Cumplimiento por vendedor: bar chart horizontal
- Tendencia de visitas por semana: line chart
- Distribución de estados de visita: donut chart

### 6.3 Gestión de Usuarios (Vendedores)

**Listado:**
- Tabla con: nombre, email, grupo, visitas asignadas, visitas completadas, % cumplimiento
- Acciones: Editar | Desactivar | Ver grabaciones
- Filtros: por grupo, por estado activo/inactivo
- Botón "Nuevo vendedor" → modal con form

**Detalle de vendedor:**
- Header con nombre, email, grupo asignado
- Timeline de visitas recientes
- Stats personales: cumplimiento del mes, grabaciones, consentimientos obtenidos
- Lista de grabaciones con player de audio inline

### 6.4 Grupos

- Crear grupo → nombre + asignar manager + agregar miembros
- Vista de grupo: lista de miembros, stats agregadas del grupo
- Comparativa entre grupos en dashboard

### 6.5 Gestión de Clientes (Empresas)

**Listado:**
- Nombre empresa, industria, ciudad, vendedor asignado, estado (Prospecto / Activo / Inactivo)
- Búsqueda + filtros por industria, ciudad, estado
- Botón "Nuevo cliente"

**Detalle de cliente:**
- Info general: empresa, dirección, industria
- Lista de contactos (personas a visitar) con CRUD
- Historial de visitas realizadas
- Etapa actual en el funnel
- Botón futuro: "Sincronizar con HubSpot"

### 6.6 Plan de Visitas

**Vista de calendario semanal:**
- Cada vendedor tiene una fila
- Columnas = días de la semana
- Bloques de visita arrastrables (drag & drop)
- Click en bloque → asignar cliente + contacto

**Vista de tabla:**
- Filtros: vendedor, semana, estado
- Exportar a CSV

**Asignación masiva:**
- Seleccionar rango de fechas
- Seleccionar grupo de vendedores
- Asignar lista de clientes → el sistema distribuye equitativamente

### 6.7 Embudo de Conversión (Funnel)

**Vista Kanban:**
- Columnas configurables (etapas del funnel)
- Etapas default: Contacto Inicial → Presentado → Interesado → Cotización → Cerrado / Perdido
- Cada card: nombre cliente, contacto, vendedor asignado, días en etapa
- Drag & drop para mover entre etapas

**Vista de métricas del funnel:**
- Embudo visual con % de conversión entre etapas
- Filtros: por período, por vendedor, por grupo

### 6.8 Dashboard de Cumplimiento

**Tabla de cumplimiento:**
- Filas: vendedores
- Columnas: Asignadas | Completadas | Canceladas | No Show | % Cumplimiento
- Highlight: rojo si < 70%, amarillo si 70–89%, verde si ≥ 90%

**Filtros:** semana actual, mes, rango personalizado, por grupo

**Exportar:** PDF / Excel

### 6.9 Biblioteca de Grabaciones

- Listado con: vendedor, cliente, contacto, fecha, duración, estado de consentimiento
- Reproductor de audio inline (no descarga directa por defecto)
- Badges: ✅ Con consentimiento | ⚠️ Manual | — Sin grabación
- Buscar por vendedor, cliente, fecha
- Transcripción disponible (si se procesó) → expandible debajo del player

### 6.10 Roles y Permisos

| Permiso | Admin | Manager | Seller |
|---|---|---|---|
| Ver dashboard general | ✅ | ✅ (solo su grupo) | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |
| Crear/editar clientes | ✅ | ✅ | ❌ |
| Ver grabaciones propias | ✅ | ✅ | ✅ |
| Ver grabaciones de equipo | ✅ | ✅ (su grupo) | ❌ |
| Asignar visitas | ✅ | ✅ (su grupo) | ❌ |
| Configurar funnel | ✅ | ❌ | ❌ |
| Configurar integraciones | ✅ | ❌ | ❌ |

### 6.11 Configuración e Integraciones

**Cuenta:**
- Logo de la empresa
- Nombre de la organización
- Zona horaria

**Integraciones (sección preparada para futuro):**
- HubSpot CRM
  - Estado: "Próximamente"
  - Al conectar: mapeo de etapas funnel → HubSpot pipeline stages
  - Sync de clientes / contactos bidireccional
  - Push de grabaciones como actividad en HubSpot deal

---

## 7. Servicio de IA — Consentimiento por Voz

### 7.1 Pipeline

```
Audio (3–5s) → Whisper API (transcripción) → Clasificador LLM
                                                    ↓
                                     Afirmativo / Negativo / Incierto
                                                    ↓
                              Score de confianza (0.0 – 1.0)
```

### 7.2 Prompt del clasificador

```
Eres un asistente legal de compliance. Se te da una transcripción de audio
corta en la que una persona responde a la pregunta:
"¿Nos permites grabar esta conversación?".

Clasifica la respuesta como:
- AFFIRMATIVE: si la persona claramente da su consentimiento
- NEGATIVE: si la persona claramente rechaza
- UNCERTAIN: si no es posible determinar con certeza

Responde con JSON: { "classification": "...", "confidence": 0.0–1.0, "reasoning": "..." }

Transcripción: "[TRANSCRIPCION]"
```

### 7.3 Reglas de negocio

- Confianza ≥ 0.85 + AFFIRMATIVE → grabación habilitada automáticamente
- Confianza < 0.85 o UNCERTAIN → se solicita confirmación por botón
- NEGATIVE → no habilita grabación, registra rechazo
- Todo intento de consentimiento queda logueado (audio + resultado IA)

---

## 8. Estrategia Offline-First (App Móvil)

### Datos que persisten localmente
- Lista de visitas asignadas (sincronizada al abrir app con conexión)
- Datos de clientes y contactos de las visitas propias
- Cola de grabaciones pendientes de subida
- Estado de cada grabación

### Sincronización
- **Al iniciar app con conexión:** pull de visitas, clientes, contactos actualizados
- **Al subir grabación:** multipart upload con reintentos exponenciales
- **Al terminar visita sin conexión:** datos de la visita (estado, notas, etapa del funnel) guardados localmente y subidos al recuperar señal

### Almacenamiento local
- Audio: FileSystem encriptado (expo-file-system + expo-crypto)
- Metadata: SQLite (expo-sqlite o WatermelonDB)
- Estado de sync: Zustand persistido con MMKV

---

## 9. Componentes UI Clave

### Recording Pill (App Móvil)
```
[● REC  00:47]
└─ gold bg, navy text, punto pulsante 2s ease-in-out
```

### Consent Badge
```
[✓ Consentimiento grabado] → tertiary_container bg, tertiary text
[✗ Sin consentimiento]     → error_container bg, error text
```

### Sync Status Badge
```
[☁ Subida]          → surface_container_highest + tertiary dot
[📱 Pendiente]       → surface_container_highest + gold dot
[↑ Subiendo...]     → surface_container_highest + animated dot
[✕ Error]           → error_container + error dot
```

### Visit Status Badge (Pills)
```
PENDING      → secondary_container (gold)
IN_PROGRESS  → primary (navy)
COMPLETED    → tertiary_container (green)
CANCELLED    → surface_container_highest (grey)
NO_SHOW      → error_container (red soft)
```

### Funnel Stage Tag
```
Color configurado por admin, texto siempre on-surface-variant
Shape: border-radius 999px, padding spacing-2 horizontal
```

---

## 10. Stack Tecnológico Recomendado

### App Móvil
- **Framework:** React Native con Expo SDK 51+
- **Navegación:** Expo Router (file-based)
- **Estado:** Zustand + MMKV (persistencia rápida)
- **DB Local:** expo-sqlite
- **Audio:** expo-av
- **UI:** componentes propios sobre el design system (no UI library externa)
- **HTTP:** Axios con interceptores de auth + retry

### Plataforma Web
- **Framework:** Next.js 14+ (App Router)
- **UI:** Tailwind CSS + componentes propios
- **Tablas:** TanStack Table
- **Gráficos:** Recharts
- **Kanban:** @dnd-kit/core
- **Estado servidor:** TanStack Query
- **Auth:** NextAuth.js o Clerk

### Backend
- **Runtime:** Node.js 20+
- **Framework:** NestJS (escalable, modular) o Fastify
- **ORM:** Prisma
- **DB:** PostgreSQL (Supabase o Railway)
- **Storage:** AWS S3 o Cloudflare R2
- **Queue:** BullMQ (para procesamiento de audio)
- **IA:** OpenAI Whisper API + GPT-4o mini (clasificador)
- **Auth:** JWT + refresh tokens

### Infraestructura
- **Web frontend:** Vercel
- **Backend:** Railway, Render, o AWS ECS
- **DB:** Supabase (PostgreSQL managed)
- **Storage:** Cloudflare R2 (costo-efectivo para audio)
- **CDN:** Cloudflare

---

## 11. Seguridad y Compliance

- Grabaciones encriptadas en tránsito (HTTPS/TLS 1.3) y en reposo (AES-256)
- Consentimiento y su evidencia (audio + score IA) guardados e inmutables
- Acceso a grabaciones restringido por rol
- Logs de auditoría: quién accedió a qué grabación y cuándo
- Política de retención configurable (ej: eliminar grabaciones > 12 meses)
- Cumplimiento con legislación local de grabaciones (avisar al usuario de las leyes aplicables en configuración)

---

## 12. Flujo de Datos End-to-End

```
[Vendedor abre app]
        ↓
[Selecciona visita del plan]
        ↓
[Inicia visita → status: IN_PROGRESS]
        ↓
[Pantalla de consentimiento mostrada al cliente]
        ↓
[Cliente: voz o botón]
        ↓ (voz)
[Audio 3–5s → Whisper → Clasificador]
        ↓
    ┌──────────────┐
    │ AFFIRMATIVE  │──→ [Habilita grabación] ──→ [Grabación activa]
    │ ≥ 0.85       │                                      ↓
    └──────────────┘                          [Finaliza → Resumen]
    │ UNCERTAIN    │──→ [Pide confirmación por botón]      ↓
    │ NEGATIVE     │──→ [Registra rechazo, sin grabación]  ↓
    └──────────────┘                              [¿Hay señal?]
                                                /           \
                                             SÍ              NO
                                              ↓               ↓
                                    [Sube a S3]    [Guarda local encriptado]
                                              ↓               ↓
                                    [status: READY]  [Cola de sync]
                                                         ↓ (al recuperar señal)
                                                    [Sube a S3 → READY]
                                                         ↓
                                                [Backend procesa: transcript opcional]
                                                         ↓
                                                [Admin Panel: grabación disponible]
```

---

## 13. Fases de Desarrollo

### Fase 1 — MVP
- Auth (login, roles básicos)
- App móvil: home, lista de visitas, consentimiento (botón manual), grabación, sync offline básico
- Web: gestión de usuarios, clientes, contactos, asignación de visitas
- Dashboard simple: visitas asignadas vs completadas

### Fase 2 — IA y Funnel
- Consentimiento por voz con IA
- Funnel de conversión (Kanban)
- Dashboard de cumplimiento completo
- Grupos de vendedores

### Fase 3 — Analytics y CRM
- Transcripción automática de grabaciones
- Resumen IA de conversación
- Integración HubSpot
- Exportación de reportes (PDF/Excel)
- Notificaciones push (visitas próximas, sync completado)
