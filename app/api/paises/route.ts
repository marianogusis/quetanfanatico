// Ranking de fanatismo promedio por país.
// Input: ninguno (GET)
// Output: { paises: [{ pais, promedio, cantidad }], total: { promedio, cantidad } }
//
// - `paises`: solo países con al menos 10 resultados (MIN_MUESTRA), para evitar
//   promedios poco confiables con muestras chicas (ej. 2 jugadores de un país).
//   Ordenado de mayor a menor fanatismo promedio.
// - `total`: promedio y cantidad sobre TODOS los jugadores que completaron el
//   quiz, sin importar país ni el piso de 10 - es el promedio global real,
//   no el promedio de los promedios por país.
// - `pais` es el código ISO de 2 letras capturado por geo-IP de Vercel
//   (columna scores.pais), no el nombre completo.

import { neon } from "@neondatabase/serverless";

export const revalidate = 300; // cache 5 min en el edge de Vercel

const MIN_MUESTRA = 10;

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const paises = await sql`
      SELECT pais, AVG(score)::float AS promedio, COUNT(*)::int AS cantidad
      FROM scores
      WHERE pais IS NOT NULL
      GROUP BY pais
      HAVING COUNT(*) >= ${MIN_MUESTRA}
      ORDER BY AVG(score) DESC
    `;

    const [total] = await sql`
      SELECT AVG(score)::float AS promedio, COUNT(*)::int AS cantidad
      FROM scores
    `;

    return Response.json({
      paises,
      total: { promedio: total?.promedio ?? 0, cantidad: total?.cantidad ?? 0 },
      minMuestra: MIN_MUESTRA,
    });
  } catch (error) {
    console.error("Error fetching paises:", error);
    return Response.json({ error: "Error fetching paises" }, { status: 500 });
  }
}
