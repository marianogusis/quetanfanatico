# quetanfanatico.com - Decisiones técnicas y estado del proyecto

Proyecto hermano de quetantermo.com.ar, pero **totalmente separado**: repo propio,
deploy propio en Vercel, base de datos Neon propia. Nada se comparte entre ambos.
Versión genérica en español neutro (tuteo, no voseo), sin referencias exclusivas
a Argentina, pensada para toda Latinoamérica, España y públicos hispanos en general.

## Stack

- Next.js 16.2.9 con App Router
- TypeScript
- Vercel (Hobby plan) - deploy automático en git push
- Neon serverless PostgreSQL (@neondatabase/serverless), instancia propia (no comparte con quetantermo)
- Google Analytics 4 - **pendiente crear la property**; `layout.tsx` tiene el gaId hardcodeado como placeholder `G-XXXXXXXXXX`
- @vercel/analytics activo

## Estructura de archivos relevantes

```
app/
  layout.tsx          - metadata, OG tags, GoogleAnalytics (gaId placeholder), Analytics
  page.tsx            - TODO el juego: Landing, Juego, Resultado. Un solo archivo grande.
  globals.css         - mínimo, casi sin uso
  api/
    scores/route.ts   - POST: guarda score (+ país por geo-IP), devuelve percentil real
    count/route.ts    - GET: COUNT(*) FROM scores, sin offset (proyecto nuevo)
    grupos/route.ts   - POST: crea grupo (id = slug del nombre si lo pusieron, o random), guarda score del creador
    grupos/[id]/route.ts - GET: leaderboard del grupo / POST: upsert score de jugador
  grupo/
    [id]/page.tsx     - Pantalla de entrada al grupo (self-contained, con sus propias fonts/CSS)
```

## Base de datos Neon

```sql
CREATE TABLE scores (
  id SERIAL PRIMARY KEY,
  score INTEGER NOT NULL,
  categoria VARCHAR(30) NOT NULL,
  perfil VARCHAR(50) NOT NULL,
  pais VARCHAR(2),
  respuestas VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE grupos (
  id VARCHAR(50) PRIMARY KEY,
  creator_name VARCHAR(50) NOT NULL,
  nombre_grupo VARCHAR(40),
  pais VARCHAR(60),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE grupo_scores (
  id SERIAL PRIMARY KEY,
  grupo_id VARCHAR(50) REFERENCES grupos(id),
  player_name VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  categoria VARCHAR(30) NOT NULL,
  perfil VARCHAR(50) NOT NULL,
  pais VARCHAR(60),
  created_at TIMESTAMP DEFAULT NOW()
);
```

Variable de entorno en Vercel: `DATABASE_URL` (connection string de la instancia Neon de este proyecto - no reusar la de quetantermo).

Diferencias de esquema vs. quetantermo:
- `scores.pais` (VARCHAR 2): código de país ISO capturado por header `x-vercel-ip-country` (geo-IP de Vercel), sin fricción de UI. Puede ser NULL.
- `scores.respuestas` (VARCHAR 30): una letra "a"/"b" por pregunta, en el orden fijo de `PREGUNTAS` (posición i = pregunta i+1). Permite queries analíticas del tipo "% de A vs B de la pregunta 2, por país" cruzando esta columna con `pais` en la misma tabla, sin joins. Ejemplo: `SELECT pais, substring(respuestas, 2, 1) AS q2, COUNT(*) FROM scores GROUP BY pais, q2;`. Costo de almacenamiento despreciable incluso a 1.000.000 de jugadores (~30 MB) - el análisis completo de esto está en el historial de diseño del proyecto. Puede ser NULL en filas donde el cliente no la mandó.
- `grupos.id` pasó de `VARCHAR(10)` a `VARCHAR(50)`: ahora puede ser un slug de texto (ej. `familia`, `amigos-del-trabajo-2`) en vez de únicamente 8 caracteres random.
- `grupos.nombre_grupo` y `grupo_scores.pais`/`grupos.pais`: soporte para nombrar el grupo al compartir y guardar país (nombre de país completo, no código, en el flujo de grupo - se pide junto al nombre del jugador).

## Eventos de GA4 (además del `page_view` automático)

- `quiz_iniciado`: al tocar "Empezar" en la landing.
- `quiz_completado`: al llegar a la pantalla de resultado (perfil, score, categoría).
- `compartido`: en cada acción de compartir (whatsapp, whatsapp_grupo, x, copiar_link, guardar_imagen, compartir_nativo), con el canal como parámetro.
- `grupo_visto`: al cargar exitosamente `/grupo/[id]` (independientemente de si esa persona después juega o no). Sirve para distinguir en GA4 "entró a ver el ranking" de "terminó de jugar" (`quiz_completado`), sin depender solo del `page_view` automático por ruta.

## Compartir con imagen (share nativo)

- X (`twitter.com/intent/tweet`) no permite adjuntar imagen vía URL en ninguna plataforma - límite de X, no del código. Se mantiene texto + link ahí.
- Detección combinada: capacidad (`navigator.canShare({ files })`) **y** user-agent de teléfono. Windows (Chrome/Edge) también soporta compartir archivos porque tiene su propio panel de share nativo, así que la capacidad sola no alcanza para distinguir mobile de desktop - se agregó chequeo de UA (`Android|iPhone|iPad|iPod`) para que el botón único "Compartir" (con imagen adjunta) solo aparezca en celular.
- En celular con soporte: el botón "Compartir" genera la imagen del resultado (misma captura que "Guardar imagen") y abre el share nativo del sistema con el archivo adjunto - ahí el usuario elige X, Instagram, WhatsApp, etc. El texto que viaja con el share incluye el link a la web (`textoConLink`), porque algunos navegadores ignoran el parámetro `url` aparte cuando hay `files`.
- Donde no hay soporte, o es desktop: se mantiene el flujo anterior, botón de X (solo texto) + botón separado de "Guardar imagen".

## Mecánica del juego

- 30 preguntas de opción A/B (adaptadas de quetantermo: mismo formato y peso por dimensión, contenido de-argentinizado - ver historial de diseño para el detalle pregunta por pregunta)
- 8 dimensiones: Fanatismo, Pasión, Romanticismo, Resultadismo, Nostalgia, Modernidad, Racionalidad, AntiSistema
- Fórmula de scoring: idéntica estructura a quetantermo (normalización 0-100 por dimensión, score ponderado, penalización por racionalidad/modernidad alta)
- Perfil asignado por z-score vs. medias/desvíos calibrados por dimensión, con peso por perfil (`PERFIL_FIRMA`)
- 10 perfiles: fanatico-nuclear, tribunero, anti-sistema, resultadista, nostalgico, moderno, analista, artista, fanatico-360, futbolero-de-bar
- 5 categorías por score: Curioso (18-40), Simpatizante (41-56), Futbolero (57-68), Fanático (69-81), Fanático Total (82-96)

## Calibración (ex ante, por simulación - sin datos reales todavía)

A diferencia de quetantermo (calibrado con datos reales de ~103.000 jugadores),
este proyecto se calibró **antes del lanzamiento** con una simulación Monte Carlo
de 30.000 jugadores virtuales (`calibracion-fanatico.py`, en el repo de quetantermo
- no se copió a este repo por ser una herramienta de diseño, no parte del producto).
Decisión explícita del usuario: **no se recalibra con datos reales después del
lanzamiento**. Lo que salga, sale.

Distribución de tramos esperada (simulada):

| Tramo           | Rango | % esperado |
|-----------------|-------|------------|
| Curioso         | 18-40 | 2.1%       |
| Simpatizante    | 41-56 | 26.4%      |
| Futbolero       | 57-68 | 25.7%      |
| Fanático        | 69-81 | 31.2%      |
| Fanático Total  | 82-96 | 14.6%      |

Distribución de perfiles esperada (simulada):

| Perfil            | % esperado |
|-------------------|------------|
| Resultadista      | 14.5%      |
| Fanático Nuclear  | 14.3%      |
| Tribunero         | 13.6%      |
| Anti-sistema      | 13.5%      |
| Analista          | 10.4%      |
| Moderno           | 10.3%      |
| Artista           | 10.0%      |
| Nostálgico        | 8.6%       |
| Fanático 360      | 3.8%       |
| Futbolero de bar  | 1.0%       |

## Percentil

- Etapa 1 (< 1000 registros en Neon): percentil simulado con distribución hardcodeada en `calcularPercentil()` (tabla de arriba)
- Etapa 2 (≥ 1000 registros): percentil real desde Neon, misma frase al usuario
- Sin offset (a diferencia de quetantermo, que sumaba +1000 por jugadores pre-Neon)
- Framing positivo: score alto → "Eres más fanático que el X%"; score bajo → "Eres menos fanático que el X%"

## Ranking grupal

- Flujo: usuario crea grupo → opcionalmente le pone nombre de referencia ("Familia", "Amigos del trabajo") → recibe URL única → la comparte → amigos entran a `/grupo/[id]` → ponen nombre (y opcionalmente país) → juegan → quedan en ranking
- URL de juego con grupo: `/?grupo=<id>&jugador=<nombre>&pais=<pais>`
- La pantalla de resultado detecta params y guarda el score en `grupo_scores` vía POST
- Upsert: si el mismo `player_name` juega de nuevo en el mismo grupo, sobreescribe (queda el último resultado)
- **ID de grupo**: si el creador puso nombre de referencia, el id es el slug de ese nombre (`familia`, `amigos-del-trabajo`); si ya existe, se le agrega un número (`familia-2`, `familia-3`...) en vez de agregar caracteres random. Sin nombre de referencia, id aleatorio de 8 caracteres (como en quetantermo). Trade-off aceptado: el id queda adivinable/enumerable - se acepta por ser de baja sensibilidad (ranking entre conocidos, no datos privados)
- El usuario puede crear varios grupos independientes repitiendo la acción "Crear ranking" las veces que quiera (ej. uno para la familia, otro para el trabajo) - la UI lo aclara con un botón "+ Crear otro grupo" tras la primera creación
- Leaderboard visible en pantalla de resultado y en `/grupo/[id]`, con bandera de país junto al nombre cuando está disponible

## Dato de país (sin ranking público)

- Flujo solitario (sin grupo): se captura sin fricción de UI vía geo-IP (header `x-vercel-ip-country` de Vercel) al guardar en `/api/scores`
- Flujo de grupo: se pregunta junto al nombre (ya hay un campo de texto en pantalla, no agrega fricción extra)
- **No hay ranking público por país.** El dato se guarda para (1) mostrar la bandera junto al nombre en el ranking de grupo, y (2) generar contenido futuro (comparaciones entre países, posts tipo "distribución real de perfiles" como los que se hacían para quetantermo)

## Decisiones de arquitectura relevantes

**No usar `useSearchParams` de Next.js**: causa error de Suspense. Solución: `new URLSearchParams(window.location.search)` directamente en `useEffect` y en el inicializador de `useState`.

**`/grupo/[id]/page.tsx` es self-contained**: tiene sus propias fonts y CSS vars inlineadas. No hereda de `layout.tsx` para evitar conflictos de hidratación.

**Params en Next.js 16**: usar `params: Promise<{ id: string }>` y `await params` en las API routes (no desestructurar directo).

**`/api/count` con `revalidate = 60`**: cachea el count 60 segundos en el edge de Vercel para no martillar Neon con cada visita a la landing.

**Fonts en `page.tsx`**: las Google Fonts están en un `<style>` tag inline dentro del componente, no en `layout.tsx`. Igual que en quetantermo, intencional.

## Problemas conocidos (heredados de quetantermo, no volver a caer)

- **npm install en sandbox**: el entorno de Claude no tiene acceso a npm. Siempre correr `npm install` localmente.
- **Neon SQL Editor**: si hay múltiples queries en el editor, las corre todas. Para consultar una tabla que ya existe, borrar el CREATE TABLE y dejar solo el SELECT.
- **WhatsApp Web**: algunos emojis se ven distinto en WhatsApp Web (desktop) que en la app móvil. Es limitación de WhatsApp Web, no del código.

## Pendiente antes de lanzar (nada de esto lo puede hacer Claude directamente)

- [ ] `npm install` local
- [ ] Crear repo en GitHub
- [ ] Crear proyecto en Vercel y conectar el repo
- [ ] Crear base de datos Neon nueva y correr el schema de arriba
- [ ] Crear property de Google Analytics 4 y reemplazar el placeholder `G-XXXXXXXXXX` en `app/layout.tsx`
- [ ] Configurar DNS / dominio quetanfanatico.com en Vercel
- [ ] Crear `og-image.png` (referenciado en `layout.tsx` pero no existe todavía)
