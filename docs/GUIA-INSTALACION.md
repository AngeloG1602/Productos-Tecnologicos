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

## Parte 3 · Mantenerla despierta y vigilada (≈ 5 min)

El plan gratis de Supabase **pausa el proyecto si pasa 7 días sin actividad**, y con la base pausada la tienda
no carga. Hay dos protecciones:

1. **Automática (ya incluida):** Vercel visita `/api/health` una vez al día (archivo `vercel.json`). Esa
   dirección consulta la base, así que nunca pasan 7 días sin actividad. No tienes que hacer nada.
2. **Monitor con aviso (recomendado):** si la tienda se cae por cualquier motivo, te llega un correo.
   1. Crea una cuenta gratis en **uptimerobot.com**.
   2. **New monitor** → tipo **HTTP(s)**.
   3. URL: `https://productos-tecnologicos.vercel.app/api/health` (o tu dominio, si ya tienes uno).
   4. Intervalo: **5 minutos**. En alertas deja tu correo → **Create monitor**.

Para comprobarlo tú mismo abre esa dirección en el navegador: debe decir `"estado":"ok"`.

---

## Parte 4 · Datos legales de la tienda (≈ 5 min)

La ley colombiana exige mostrar quién vende y cómo contactarlo (Ley 1480 de 2011, art. 50) y quién es el
responsable de los datos personales (Decreto 1377 de 2013, art. 13).

En el panel: **Configuración → Datos legales de la tienda** y completa nombre o razón social, cédula o NIT,
dirección, ciudad, correo, garantía, medios de pago y tiempo de entrega. Se ven al instante en
**Términos y condiciones** y en la **Política de datos** (enlaces en el pie de la tienda). Mientras falte algo,
el Inicio del panel te lo recuerda.

> Los textos de esas dos páginas son una base hecha con lo que dicen las leyes; lo ideal es que un abogado
> les dé una revisada antes de invertir fuerte en anuncios.

---

## Parte 5 · Copia de seguridad semanal (1 min)

El plan gratis de Supabase **no guarda copias**. Una vez por semana:

**Panel → Configuración → Descargar copia de seguridad.** Se descarga un archivo `respaldo-tienda-FECHA.json`
con productos, costos, pedidos, socios y configuración. Guárdalo en Google Drive o en tu computador.
Las fotos no van en el archivo (siguen guardadas en Supabase). Si algún día hay que restaurar, ese archivo
lo necesita quien te ayude con la parte técnica.

---

## Parte 6 · Dominio propio (opcional, ≈ 20 min + espera)

Un dominio como `mitienda.com` se ve más confiable que `productos-tecnologicos.vercel.app`.

1. Cómpralo en un registrador (por ejemplo Namecheap, GoDaddy o uno colombiano como mi.com.co). Como
   referencia, en 2026 un `.com` cuesta entre $40.000 y $60.000 al año y un `.co` o `.com.co` entre
   $75.000 y $150.000 (revisa el precio de **renovación**, no solo el del primer año).
2. En Vercel: tu proyecto → **Settings → Domains → Add** → escribe el dominio (agrega también la versión con `www`).
3. Vercel te muestra qué registros poner (normalmente un registro **A** para `mitienda.com` y un **CNAME**
   para `www`). Cópialos en la sección **DNS** de donde compraste el dominio.
4. Espera a que Vercel muestre **Valid Configuration** (minutos, a veces hasta 48 horas). El candado (HTTPS) es automático.
5. Actualiza el monitor de UptimeRobot con el dominio nuevo. Los enlaces de productos en WhatsApp y los de
   anuncios usan solos el dominio con el que entra el cliente.

---

## Parte 7 · Antes de anunciar

- [ ] Datos legales completos (Parte 4).
- [ ] Productos de prueba desactivados o eliminados y productos reales con fotos.
- [ ] Tu socio creado como administrador (paso 4 de la Parte 1) y con acceso probado.
- [ ] Monitor de UptimeRobot creado (Parte 3).
- [ ] Una primera copia de seguridad descargada (Parte 5).
- [ ] Un pedido de prueba de punta a punta desde otro celular.
- [ ] **Plan de Vercel:** las condiciones de Vercel dicen que el plan gratis (Hobby) es para uso personal, no
      comercial; para una tienda piden el plan Pro (desde US$20 al mes por persona que publica). Decide con tu socio si pasan a Pro o si
      prefieren mover la página a un servicio gratuito que sí permita uso comercial.

---

## Cuando haya cambios en la base de datos

Cada bloque nuevo que toque la base traerá un archivo en `supabase/migrations/`. Te diré cuál es y se pega
igual que en el paso 2 (SQL Editor → New query → pegar → Run). **No vuelvas a pegar `instalar.sql`** en un
proyecto que ya lo tiene.

**El orden importa:** primero pega la migración en Supabase y después se sube el código. Vercel publica solo
cada cambio y, al hacerlo, consulta tu base; si la base todavía no tiene lo nuevo, el despliegue falla (la página
sigue en la versión anterior). Si eso pasa: aplica la migración y en Vercel → Deployments → ⋯ → **Redeploy**.
