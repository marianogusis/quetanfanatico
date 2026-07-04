// Crea un grupo nuevo y guarda el score del creador.
// Input: POST { creator_name, score, categoria, perfil, nombre_grupo?, pais? }
// Output: { grupo_id }
//
// Si el creador puso un nombre de referencia (ej. "Familia", "Amigos del
// trabajo"), el id del grupo es el slug de ese nombre, y si ya existe se le
// agrega un número (familia-2, familia-3...) en vez de caracteres random.
// Trade-off aceptado: el id queda adivinable/enumerable, pero esto es de baja
// sensibilidad (un ranking de amigos, no datos privados).
//
// Sin nombre de referencia, se usa "grupo1", "grupo2", "grupo3"... (mismo
// esquema de incremento, para no generar links feos tipo /grupo/x7k2m9qp).

import { neon } from "@neondatabase/serverless";

const COMBINING_MARKS = new RegExp("[̀-ͯ]", "g");

function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function POST(request: Request) {
  try {
    const { creator_name, score, categoria, perfil, nombre_grupo, pais } = await request.json();

    if (!creator_name || typeof score !== "number") {
      return Response.json({ error: "Faltan datos obligatorios (creator_name, score)" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    const slug = nombre_grupo ? slugify(nombre_grupo) : "";
    const base = slug || "grupo";
    let grupo_id = slug || "grupo1";
    let n = slug ? 2 : 2;
    let intentos = 0;

    // Incrementa el sufijo numérico hasta encontrar un id libre (con tope de
    // seguridad para no loopear infinito ante un error de conexión repetido).
    while (intentos < 500) {
      const [existing] = await sql`SELECT id FROM grupos WHERE id = ${grupo_id}`;
      if (!existing) break;
      grupo_id = slug ? `${base}-${n}` : `grupo${n}`;
      n++;
      intentos++;
    }

    await sql`
      INSERT INTO grupos (id, creator_name, nombre_grupo, pais)
      VALUES (${grupo_id}, ${creator_name}, ${nombre_grupo || null}, ${pais || null})
    `;
    await sql`
      INSERT INTO grupo_scores (grupo_id, player_name, score, categoria, perfil, pais)
      VALUES (${grupo_id}, ${creator_name}, ${score}, ${categoria}, ${perfil}, ${pais || null})
    `;

    return Response.json({ grupo_id });
  } catch (error) {
    console.error("Error creating group:", error);
    return Response.json({ error: "Error creating group" }, { status: 500 });
  }
}
