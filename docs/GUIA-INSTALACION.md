# Guía de instalación paso a paso

Para dejar la tienda funcionando en internet. No hace falta saber programar: son unos 25 minutos de clics.
Necesitas tu cuenta de GitHub (donde está este repositorio).

> Las pantallas de Supabase y Vercel cambian de vez en cuando: si un botón tiene un nombre un poco
> distinto, busca el más parecido.

---

## Parte 1 · Base de datos en Supabase (≈ 15 min)

### 1. Crear la cuenta y el proyecto
1. Entra a **supabase.com** → **Start your project** → inicia sesión con **GitHub**.
2. **New project**:
   - **Name:** `tienda`
   - **Database Password:** toca **Generate a password** y **guárdala** en un lugar seguro (gestor de contraseñas).
   - **Region:** **East US (North Virginia)** — queda cerca de los servidores de Vercel, así la tienda carga más rápido.
   - **Plan:** Free.
3. **Create new project** y espera 1–2 minutos a que termine.

### 2. Crear las tablas y los datos de prueba
1. En el menú de la izquierda: **SQL Editor** → **New query**.
2. Abre en otra pestaña el archivo
   [`supabase/instalar.sql`](../supabase/instalar.sql) en GitHub, toca el botón **Copy raw file** (ícono de copiar).
3. Pégalo completo en el SQL Editor y toca **Run**.
4. Debe decir **Success**. Si sale un error en rojo, cópialo y envíamelo tal cual.

### 3. Comprobar que la seguridad quedó bien
1. **SQL Editor** → **New query**.
2. Copia y pega [`supabase/tests/01_rls_anonimo.sql`](../supabase/tests/01_rls_anonimo.sql) → **Run**.
3. Si termina **sin error en rojo**, todo está bien: un visitante puede ver los productos, pero no los costos ni los pedidos.
   (No deja rastro; solo usa un número de pedido.)
4. Opcional: en **Table Editor → productos** deberías ver 12 productos de prueba.

### 4. Crear las cuentas de los 2 administradores
1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. Escribe el correo y una contraseña, marca **Auto Confirm User** y crea. Repite para el segundo admin.
3. **SQL Editor** → **New query** → pega [`supabase/crear-admin.sql`](../supabase/crear-admin.sql),
   cambia el correo y el nombre, y **Run**. Debe mostrar una fila. Repite con el otro correo.

### 5. Cerrar el registro público
**Authentication** → **Sign In / Providers** (o **Settings**) → desactiva **Allow new users to sign up** → **Save**.
Así nadie más puede crearse una cuenta. (Aunque lo lograra, no tendría permisos: solo cuentan los de la tabla de administradores.)

### 6. Copiar las llaves
**Project Settings** → **API Keys** (o **Data API**). Vas a necesitar tres datos:

| Dato en Supabase | Variable en Vercel | ¿Secreto? |
|---|---|---|
| **Project URL** (`https://xxxx.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` | No |
| **anon public** o **Publishable key** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No (es pública; la protege la seguridad de la base) |
| **service_role** o **Secret key** | `SUPABASE_SERVICE_ROLE_KEY` | **Sí. Nunca la compartas ni la pegues en un chat.** |

---

## Parte 2 · Publicar la página en Vercel (≈ 10 min)

1. Entra a **vercel.com** → **Sign Up** → **Continue with GitHub** → plan **Hobby** (gratis).
2. **Add New…** → **Project** → busca **Productos-Tecnologicos** → **Import**.
   (Si no aparece, toca **Adjust GitHub App Permissions** y dale acceso a ese repositorio.)
3. **Framework Preset:** Next.js (se detecta solo). No cambies nada más.
4. Abre **Environment Variables** y agrega las tres variables de la tabla de arriba (nombre exacto + valor).
5. **Deploy**. Tarda 1–3 minutos.
6. Abre el enlace que te da (algo como `productos-tecnologicos.vercel.app`). Debes ver el catálogo con los 12 productos de prueba.

> **Rama:** Vercel publica la rama principal del repositorio. Si la página no muestra el catálogo,
> revisa en Vercel → Settings → Git cuál rama está publicando y avísame.

---

## Parte 3 · Mantenerla despierta (opcional, recomendado)

El plan gratis de Supabase pausa los proyectos que pasan varios días sin uso. En el Bloque 6 dejaremos una
dirección `/api/health` y un monitor gratuito que la visita cada pocos minutos para evitarlo.

---

## Cuando haya cambios en la base de datos

Cada bloque nuevo que toque la base traerá un archivo en `supabase/migrations/`. Te diré cuál es y se pega
igual que en el paso 2 (SQL Editor → New query → pegar → Run). **No vuelvas a pegar `instalar.sql`** en un
proyecto que ya lo tiene.

**El orden importa:** primero pega la migración en Supabase y después se sube el código. Vercel publica solo
cada cambio y, al hacerlo, consulta tu base; si la base todavía no tiene lo nuevo, el despliegue falla (la página
sigue en la versión anterior). Si eso pasa: aplica la migración y en Vercel → Deployments → ⋯ → **Redeploy**.
