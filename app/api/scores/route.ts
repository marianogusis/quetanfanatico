// Guarda el score de un jugador y devuelve el percentil real.
// Input: POST { score, categoria, perfil }
// Output: { percentil: number | null, total: number }
// Si hay menos de 100 registros, devuelve percentil: null (el frontend usa el simulado).
//
// País: se captura sin fricción de UI en el flujo solitario (sin grupo), vía el
// header de geolocalización de Vercel (x-vercel-ip-country). No se usa para
// mostrar un ranking público — solo para comparaciones futuras y contenido
// (ver FANATICO-CONTENIDO-DRAFT.md sección 9).

import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const { score, categoria, perfil } = await request.json();

    const sql = neon(process.env.DATABASE_URL!);
    const pais = request.headers.get("x-vercel-ip-country") || null;

    // Calcular percentil ANTES de insertar (sobre jugadores anteriores)
    const [existing] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE score < ${score})::float AS below,
        COUNT(*) AS total
      FROM scores
    `;

    // Guardar el score
    await sql`
      INSERT INTO scores (score, categoria, perfil, pais)
      VALUES (${score}, ${categoria}, ${perfil}, ${pais})
    `;

    const total = parseInt(existing.total);
    const percentil =
      total >= 100
        ? Math.round((parseFloat(existing.below) / total) * 100)
        : null;

    return Response.json({ percentil, total });
  } catch (error) {
    console.error("Error saving score:", error);
    return Response.json({ error: "Error saving score" }, { status: 500 });
  }
}
