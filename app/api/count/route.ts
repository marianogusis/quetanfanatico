// Devuelve el total de partidas jugadas.
// Input: ninguno
// Output: { count: number }
// A diferencia de quetantermo, NO suma un offset histórico (proyecto nuevo, sin
// datos previos). El frontend solo muestra el contador a partir de 10.000 jugadores.

import { neon } from "@neondatabase/serverless";

export const revalidate = 60;

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const [row] = await sql`SELECT COUNT(*)::int AS total FROM scores`;
    return Response.json({ count: row.total });
  } catch (error) {
    console.error("Error fetching count:", error);
    return Response.json({ count: null }, { status: 500 });
  }
}
