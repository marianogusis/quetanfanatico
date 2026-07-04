// GET: leaderboard del grupo (incluye nombre_grupo y país de cada jugador)
// POST: guarda o actualiza el score de un jugador (último resultado gana)

import { neon } from "@neondatabase/serverless";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sql = neon(process.env.DATABASE_URL!);

    const [grupo] = await sql`SELECT creator_name, nombre_grupo FROM grupos WHERE id = ${id}`;
    if (!grupo) return Response.json({ error: "Grupo no encontrado" }, { status: 404 });

    const scores = await sql`
      SELECT player_name, score, categoria, perfil, pais
      FROM grupo_scores
      WHERE grupo_id = ${id}
      ORDER BY score DESC
    `;

    return Response.json({ creator_name: grupo.creator_name, nombre_grupo: grupo.nombre_grupo, scores });
  } catch (error) {
    console.error("Error fetching group:", error);
    return Response.json({ error: "Error fetching group" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { player_name, score, categoria, perfil, pais } = await request.json();
    const sql = neon(process.env.DATABASE_URL!);

    const [grupo] = await sql`SELECT id FROM grupos WHERE id = ${id}`;
    if (!grupo) return Response.json({ error: "Grupo no encontrado" }, { status: 404 });

    const [existing] = await sql`
      SELECT id FROM grupo_scores
      WHERE grupo_id = ${id} AND player_name = ${player_name}
    `;

    if (existing) {
      await sql`
        UPDATE grupo_scores
        SET score = ${score}, categoria = ${categoria}, perfil = ${perfil}, pais = COALESCE(${pais || null}, pais), created_at = NOW()
        WHERE grupo_id = ${id} AND player_name = ${player_name}
      `;
    } else {
      await sql`
        INSERT INTO grupo_scores (grupo_id, player_name, score, categoria, perfil, pais)
        VALUES (${id}, ${player_name}, ${score}, ${categoria}, ${perfil}, ${pais || null})
      `;
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error saving group score:", error);
    return Response.json({ error: "Error saving score" }, { status: 500 });
  }
}
