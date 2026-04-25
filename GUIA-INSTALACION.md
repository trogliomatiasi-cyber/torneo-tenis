# 🎾 Guía de instalación del Torneo de Tenis

Seguí estos pasos en orden. No necesitás saber nada de programación.
Tiempo estimado: 20-30 minutos.

---

## PASO 1 — Crear la base de datos (Supabase)

1. Entrá a **https://supabase.com** y creá una cuenta gratis (podés usar Google).
2. Hacé click en **"New project"**.
3. Poné un nombre (ej: `torneo-tenis`), elegí una contraseña para la base de datos (guardala), y seleccioná la región más cercana (South America).
4. Esperá ~2 minutos a que se cree el proyecto.
5. En el menú de la izquierda, click en **"SQL Editor"**.
6. Copiá todo el contenido del archivo `supabase-schema.sql` y pegalo en el editor.
7. Click en **"Run"** (botón verde). Deberías ver "Success".

### Obtener las claves de Supabase

8. En el menú izquierdo, click en **"Project Settings"** → **"API"**.
9. Anotá estos dos valores:
   - **Project URL**: algo como `https://abcdefgh.supabase.co`
   - **anon public key**: una cadena larga que empieza con `eyJ...`

---

## PASO 2 — Subir el código a GitHub

1. Entrá a **https://github.com** y creá una cuenta gratis.
2. Click en **"New repository"** (botón verde).
3. Nombre: `torneo-tenis`, dejalo en "Public", click **"Create repository"**.
4. En la página que aparece, vas a ver instrucciones. Necesitás subir los archivos.

### Si nunca usaste GitHub (opción más fácil):
5. En la página del repositorio vacío, click en **"uploading an existing file"**.
6. Arrastrá **todos los archivos y carpetas** de la carpeta `tennis-torneo` a esa página.
7. Click en **"Commit changes"**.

### Si tenés Git instalado (más rápido):
```bash
cd tennis-torneo
git init
git add .
git commit -m "Torneo de tenis inicial"
git remote add origin https://github.com/TU-USUARIO/torneo-tenis.git
git push -u origin main
```

---

## PASO 3 — Publicar en Vercel (hosting gratis)

1. Entrá a **https://vercel.com** y creá una cuenta con tu cuenta de GitHub.
2. Click en **"Add New Project"**.
3. Buscá tu repositorio `torneo-tenis` y click en **"Import"**.
4. **Antes de hacer deploy**, tenés que agregar las variables de entorno. Click en **"Environment Variables"** y agregá estas tres:

| Nombre | Valor |
|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | La URL de tu proyecto Supabase (paso 1.9) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La anon key de Supabase (paso 1.9) |
| `ADMIN_PASSWORD` | La clave que vos elijas (ej: `river2024`) |

5. Click en **"Deploy"**.
6. Esperá ~2 minutos. Cuando termine, te da un link tipo `torneo-tenis.vercel.app`. ¡Ese es tu link!

---

## PASO 4 — Usar la página

### Ver el torneo (todos los jugadores)
Simplemente entrá al link que te dio Vercel. No se necesita clave.

### Administrar el torneo (solo vos)
1. Entrá a `tu-link.vercel.app/admin`
2. Ingresá la clave que pusiste en `ADMIN_PASSWORD`.

### Flujo del torneo:
1. **Configurar Torneo**: Ingresá los 12 nombres y hacé click en "Realizar Sorteo". Se generan los 4 grupos aleatoriamente.
2. **Cargar resultados**: En la pestaña "Resultados", vas a ver todos los partidos. Para cada partido jugado, click en "Cargar resultado" e ingresá los sets.
3. **Cuartos de final**: Cuando terminan todos los partidos de grupos, aparece un botón para generar los cruces de cuartos automáticamente.
4. **Semis y final**: Cuando cargás el resultado de un cuarto, el ganador avanza automáticamente al bracket.

---

## Cómo compartir el link

Simplemente mandales el link de Vercel a tus amigos. Por ejemplo:
`https://torneo-tenis-xyz.vercel.app`

La página se actualiza sola cada 30 segundos.

---

## Problemas frecuentes

**No carga nada / error en la página:**
- Verificá que las variables de entorno en Vercel estén bien escritas.
- En Vercel → Settings → Environment Variables podés revisarlas.

**Error al hacer el sorteo:**
- Verificá que el SQL se haya ejecutado correctamente en Supabase.

**Olvidé la clave de admin:**
- Entrá a Vercel → Settings → Environment Variables → cambiá `ADMIN_PASSWORD`.

---

¡Listo! Cualquier duda, revisá esta guía desde el principio.
