// Crea un grupo nuevo y guarda el score del creador.
// Input: POST { creator_name, score, categoria, perfil, nombre_grupo?, pais? }
// Output: { grupo_id }
//
// A diferencia de quetantermo (id 100% aleatorio), si el creador puso un nombre
// de referencia (ej. "Familia", "Amigos del trabajo"), el id del grupo es el
// slug de ese nombre, y si ya existe se le agrega un número (familia-2, familia-3...)
// en vez de caracteres random. Trade-off aceptado: el id queda adivinable/enumerable,
// pero esto es de baja sensibilidad (un ranking de amigos, no datos privados).
// Sin nombre de referencia, se usa el id aleatorio de 8 caracteres de siempre.

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

function generarIdAleatorio(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function POST(request: Request) {
  try {
    const { creator_name, score, categoria, perfil, nombre_grupo, pais } = await request.json();
    const sql = neon(process.env.DATABASE_URL!);

    const base = nombre_grupo ? slugify(nombre_grupo) : "";
    let grupo_id: string;

    if (base) {
      grupo_id = base;
      let n = 2;
      // Incrementa el sufijo numérico hasta encontrar un id libre.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const [existing] = await sql`SELECT id FROM grupos WHERE id = ${grupo_id}`;
        if (!existing) break;
        grupo_id = `${base}-${n}`;
        n++;
      }
    } else {
      grupo_id = generarIdAleatorio();
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
