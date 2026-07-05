// Guarda el score de un jugador y devuelve el percentil real.
// Input: POST { score, categoria, perfil, respuestas? }
// Output: { percentil: number | null, total: number }
// Si hay menos de 1000 registros, devuelve percentil: null (el frontend usa el simulado).
//
// País: se captura sin fricción de UI en el flujo solitario (sin grupo), vía el
// header de geolocalización de Vercel (x-vercel-ip-country). No se usa para
// mostrar un ranking público - solo para comparaciones futuras y contenido
// (ver FANATICO-CONTENIDO-DRAFT.md sección 9).
//
// Respuestas: string de 30 caracteres ("a"/"b"), una por pregunta en orden fijo
// (posición i = pregunta i+1). Permite queries tipo "% de A/B de la pregunta 2
// por país" contra esta misma tabla, cruzando con la columna pais. Columna
// opcional (puede venir null en filas viejas o si el cliente no la manda).

import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const { score, categoria, perfil, respuestas } = await request.json();

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
      INSERT INTO scores (score, categoria, perfil, pais, respuestas)
      VALUES (${score}, ${categoria}, ${perfil}, ${pais}, ${respuestas || null})
    `;

    const total = parseInt(existing.total);
    const percentil =
      total >= 1000
        ? Math.round((parseFloat(existing.below) / total) * 100)
        : null;

    return Response.json({ percentil, total });
  } catch (error) {
    console.error("Error saving score:", error);
    return Response.json({ error: "Error saving score" }, { status: 500 });
  }
}
