"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { track } from "@vercel/analytics";
import { sendGAEvent } from "@next/third-parties/google";

// ─── DATASET ───────────────────────────────────────────────────────────────
// 30 preguntas - versión genérica (Latino-Ibero-Americana), separada del dataset
// argentino de quetantermo. Ver FANATICO-CONTENIDO-DRAFT.md (sección 4) para el
// detalle de por qué se adaptó cada una.

const PREGUNTAS = [
  { id: 1, a: { texto: "Club", dims: { Pasión: 2, Fanatismo: 2, Nostalgia: 1, AntiSistema: 1 } }, b: { texto: "Selección", dims: { Modernidad: 2, Romanticismo: 2, Racionalidad: 1, Resultadismo: 1 } } },
  { id: 2, a: { texto: "Ganar 1-0 jugando horrible", dims: { Fanatismo: 2, Pasión: 1, Resultadismo: 2, AntiSistema: 1 } }, b: { texto: "Empatar 4-4 jugando espectacular", dims: { Romanticismo: 3, Nostalgia: 2, Pasión: 1 } } },
  { id: 3, a: { texto: "VAR sí", dims: { Racionalidad: 3, Modernidad: 3 } }, b: { texto: "VAR no", dims: { AntiSistema: 3, Fanatismo: 2, Pasión: 1 } } },
  { id: 4, a: { texto: "Guardiola", dims: { Romanticismo: 2, Modernidad: 2, Racionalidad: 2 } }, b: { texto: "Mourinho", dims: { Fanatismo: 1, Resultadismo: 3, Modernidad: 1, AntiSistema: 1 } } },
  { id: 5, a: { texto: "Talento", dims: { Romanticismo: 3, Pasión: 1, Nostalgia: 1, Modernidad: 1 } }, b: { texto: "Corazón", dims: { Fanatismo: 2, Pasión: 2, Resultadismo: 2 } } },
  { id: 6, a: { texto: "Fútbol de antes", dims: { Nostalgia: 3, AntiSistema: 2, Fanatismo: 1 } }, b: { texto: "Fútbol moderno", dims: { Modernidad: 3, Racionalidad: 3 } } },
  { id: 7, a: { texto: "Ronaldo Nazario", dims: { Pasión: 1, Romanticismo: 2, Resultadismo: 1, Nostalgia: 1, Modernidad: 1 } }, b: { texto: "Ronaldinho", dims: { Pasión: 1, Romanticismo: 3, Nostalgia: 1, AntiSistema: 1 } } },
  { id: 8, a: { texto: "Real Madrid", dims: { Resultadismo: 2, Modernidad: 2, Fanatismo: 1, Pasión: 1 } }, b: { texto: "Barcelona", dims: { Romanticismo: 2, Fanatismo: 1, Pasión: 1, Nostalgia: 1, Modernidad: 1 } } },
  { id: 9, a: { texto: "Champions League", dims: { Romanticismo: 1, Resultadismo: 1, Modernidad: 2, Racionalidad: 2 } }, b: { texto: "Mundial", dims: { Fanatismo: 1, Pasión: 2, Romanticismo: 2, Nostalgia: 1 } } },
  { id: 10, a: { texto: "Ganar con un penal polémico", dims: { Resultadismo: 3, AntiSistema: 1, Fanatismo: 2 } }, b: { texto: "Empatar siendo superior", dims: { Romanticismo: 3, Racionalidad: 2, Nostalgia: 1 } } },
  { id: 11, a: { texto: "Un crack indisciplinado", dims: { Romanticismo: 2, AntiSistema: 2, Pasión: 1, Fanatismo: 1 } }, b: { texto: "Un jugador promedio ejemplar", dims: { Racionalidad: 3, Modernidad: 2, Resultadismo: 1 } } },
  { id: 12, a: { texto: "Tener al mejor jugador del mundo", dims: { Romanticismo: 3, Pasión: 2, Fanatismo: 1 } }, b: { texto: "Tener el mejor equipo del mundo", dims: { Resultadismo: 2, Modernidad: 2, Racionalidad: 2 } } },
  { id: 13, a: { texto: "El regate", dims: { Romanticismo: 3, Pasión: 2, AntiSistema: 1 } }, b: { texto: "El pase perfecto", dims: { Racionalidad: 3, Modernidad: 2, Resultadismo: 1 } } },
  { id: 14, a: { texto: "Un creativo", dims: { Romanticismo: 3, Nostalgia: 2, AntiSistema: 1 } }, b: { texto: "Un mediocampista todoterreno", dims: { Modernidad: 2, Racionalidad: 2, Resultadismo: 2 } } },
  { id: 15, a: { texto: "Ver campeón a tu club", dims: { Pasión: 2, Fanatismo: 2, Nostalgia: 1, AntiSistema: 1 } }, b: { texto: "Ver campeón a tu selección", dims: { Pasión: 2, Romanticismo: 2, Modernidad: 1, Resultadismo: 1 } } },
  { id: 16, a: { texto: "Presión alta", dims: { Resultadismo: 1, Modernidad: 3, Racionalidad: 2 } }, b: { texto: "Esperar y contraatacar", dims: { Fanatismo: 1, Resultadismo: 3, Modernidad: 1, AntiSistema: 1 } } },
  { id: 17, a: { texto: "Maradona 1986", dims: { Fanatismo: 1, Pasión: 1, Romanticismo: 1, Resultadismo: 1, AntiSistema: 1, Nostalgia: 1 } }, b: { texto: "Pelé 1970", dims: { Romanticismo: 3, Nostalgia: 2, Pasión: 1 } } },
  { id: 18, a: { texto: "Ver el partido en el estadio", dims: { Pasión: 3, Fanatismo: 2, Nostalgia: 1 } }, b: { texto: "Verlo por TV", dims: { Racionalidad: 3, Modernidad: 3 } } },
  { id: 19, a: { texto: "Festejar un gol agónico", dims: { Fanatismo: 2, Pasión: 3, Resultadismo: 1 } }, b: { texto: "Ver jugar perfecto a tu equipo", dims: { Romanticismo: 2, Modernidad: 2, Racionalidad: 2 } } },
  { id: 20, a: { texto: "Un jugador que ama la camiseta", dims: { Fanatismo: 2, Pasión: 2, Romanticismo: 1, Nostalgia: 1 } }, b: { texto: "Un jugador que siempre rinde", dims: { Resultadismo: 3, Racionalidad: 2, Modernidad: 1 } } },
  { id: 21, a: { texto: "Ver el mejor gol de la historia", dims: { Fanatismo: 1, Pasión: 1, Romanticismo: 2, Nostalgia: 2 } }, b: { texto: "Ver a tu equipo campeón una vez más", dims: { Pasión: 1, Resultadismo: 1, Nostalgia: 1, Modernidad: 1, Racionalidad: 2 } } },
  { id: 22, a: { texto: "España 2010", dims: { Racionalidad: 2, Romanticismo: 3, Modernidad: 1 } }, b: { texto: "Alemania 2014", dims: { Resultadismo: 2, Modernidad: 2, Racionalidad: 2 } } },
  { id: 23, a: { texto: "Un ídolo que nunca salió campeón", dims: { Fanatismo: 1, Pasión: 1, Romanticismo: 2, Nostalgia: 2 } }, b: { texto: "Un campeón que nunca fue ídolo", dims: { Resultadismo: 4, Racionalidad: 2 } } },
  { id: 24, a: { texto: "Ganar 6 a 0", dims: { Romanticismo: 2, Resultadismo: 1, Modernidad: 1, Racionalidad: 2 } }, b: { texto: "Ganar en la última jugada", dims: { Fanatismo: 2, Pasión: 2, Resultadismo: 2 } } },
  { id: 25, a: { texto: "Que tu equipo tenga una gran figura", dims: { Romanticismo: 3, Pasión: 2, Fanatismo: 1 } }, b: { texto: "Que tenga once guerreros", dims: { Resultadismo: 2, Fanatismo: 2, Pasión: 1, AntiSistema: 1 } } },
  { id: 26, a: { texto: "Ser recordado por jugar bien", dims: { Romanticismo: 4, Nostalgia: 1, Pasión: 1 } }, b: { texto: "Ser recordado por ganar", dims: { Resultadismo: 4, Racionalidad: 1, Modernidad: 1 } } },
  { id: 27, a: { texto: "Casillas", dims: { Romanticismo: 1, Nostalgia: 1, Racionalidad: 2, Modernidad: 2 } }, b: { texto: "Dibu Martínez", dims: { Fanatismo: 2, Pasión: 2, Resultadismo: 1, AntiSistema: 1 } } },
  { id: 28, a: { texto: "Que tu clásico descienda", dims: { Fanatismo: 3, Pasión: 2, AntiSistema: 1 } }, b: { texto: "Salir campeón", dims: { Pasión: 1, Romanticismo: 1, Modernidad: 1, Racionalidad: 3 } } },
  { id: 29, a: { texto: "Messi", dims: { Romanticismo: 2, Racionalidad: 1, Resultadismo: 1, Pasión: 1, Nostalgia: 1 } }, b: { texto: "Cristiano Ronaldo", dims: { Resultadismo: 2, Modernidad: 2, Pasión: 1, Fanatismo: 1 } } },
  { id: 30, a: { texto: "Un mundial para tu selección", dims: { Pasión: 1, Racionalidad: 2, Nostalgia: 1, Romanticismo: 1, Modernidad: 1 } }, b: { texto: "Un título continental para tu equipo", dims: { Fanatismo: 2, AntiSistema: 2, Pasión: 1, Nostalgia: 1 } } },
];

// ─── PERFILES ────────────────────────────────────────────────────────────────
// El perfil se asigna por 'rasgo más marcado' (ver PERFIL_FIRMA y calcularResultado).

const PERFILES = [
  {
    id: "fanatico-nuclear", nombre: "EL FANÁTICO NUCLEAR", emoji: "🌋",
    descripcion: "Eres una fuerza de la naturaleza. Discutes cualquier cosa con cualquiera en cualquier momento.",
    resumen: "Si el fútbol fuera una religión, tú serías el Papa.",
  },
  {
    id: "resultadista", nombre: "EL RESULTADISTA", emoji: "🔒",
    descripcion: "Ganas o no juegas. Campeón es campeón, lo demás son cuentos.",
    resumen: "Lo importante es el resultado. Y el resultado.",
  },
  {
    id: "artista", nombre: "EL ARTISTA", emoji: "🎨",
    descripcion: "El fútbol es arte y emoción. Primero la belleza, después el resultado.",
    resumen: "Para ti el fútbol es poesía. Para los demás es un deporte donde hay que meter goles.",
  },
  {
    id: "nostalgico", nombre: "EL NOSTÁLGICO", emoji: "📼",
    descripcion: "Antes sí se jugaba. Antes había jugadores de verdad.",
    resumen: "Vives mentalmente en otra década.",
  },
  {
    id: "anti-sistema", nombre: "EL ANTI-SISTEMA", emoji: "✊",
    descripcion: "El fútbol te lo arruinó el dinero, la FIFA, los dirigentes y el VAR.",
    resumen: "El fútbol es corrupción, dinero y robo. Pero igual vas a ver los 90 minutos.",
  },
  {
    id: "analista", nombre: "EL ANALISTA", emoji: "📊",
    descripcion: "Presión alta, porcentaje de posesión, transiciones. Tu vocabulario no es para todos.",
    resumen: "Para ti el fútbol es una ciencia. Y cada partido es un experimento que confirma lo que ya sabías.",
  },
  {
    id: "moderno", nombre: "EL MODERNO", emoji: "📱",
    descripcion: "Sigues el fútbol con datos, apps y análisis táctico. El pasado no te interesa.",
    resumen: "El fútbol de antes te aburre. Lo tuyo es el presente y el futuro.",
  },
  {
    id: "tribunero", nombre: "EL TRIBUNERO", emoji: "📣",
    descripcion: "Lo tuyo es alentar hasta el final, cueste lo que cueste.",
    resumen: "Para ti el fútbol se juega también desde la tribuna. El resultado importa, pero acompañar importa más.",
  },
  {
    id: "fanatico-360", nombre: "EL FANÁTICO 360", emoji: "🔥",
    descripcion: "El fútbol no es parte de tu vida. Es tu vida.",
    resumen: "Médico, vendedor, electricista. Nada de eso importa. Lo que importa es el fútbol.",
  },
  {
    id: "futbolero-de-bar", nombre: "EL FUTBOLERO DE BAR", emoji: "🍺",
    descripcion: "Sabes de todo un poco. Lo tuyo es la discusión.",
    resumen: "Eres el corazón de cualquier debate futbolero. Tienes una teoría para todo. Algunas hasta tienen sentido.",
  },
];

// ─── ROASTS POR PERFIL ───────────────────────────────────────────────────────

const ROASTS_POR_PERFIL = {
  "fanatico-nuclear": ["Hablas de fútbol en situaciones que no tienen nada que ver con el fútbol.", "Recuerdas exactamente dónde estabas en cada gol histórico de tu vida.", "Tu pareja ya sabe que en día de clásico no existes.", "Insultar al árbitro es tu cardio diario.", "Que tu equipo pierda un partido te arruina el día.", "El día que tu equipo salió campeón fue el momento más feliz de tu vida adulta. Y no te avergüenza.", "Tu psicólogo ya desistió de explicarte que es solo un deporte."],
  "resultadista": ["Para ti un empate 0-0 es un resultado válido y defendible.", "Para ti la ética en el fútbol es un lujo de los que no ganan.", "Nunca festejaste un gol tan lindo como un triunfo 1-0 en el último minuto.", "Ganar feo te genera más satisfacción que perder jugando bien.", "Para ti subcampeón es el primero de los perdedores.", "Tu respuesta ante cualquier crítica es '¿y cuántos títulos tienes?'."],
  "artista": ["Analizas el juego de un equipo que acaba de perder y encuentras cosas para destacar.", "Preferirías empatar un partido importante jugando bien que ganarlo con un penal dudoso.", "En cualquier debate de fútbol, tú eres 'el de la estética'.", "Aplaudiste un gol que no fue de tu equipo porque fue hermoso.", "Defendiste a un jugador porque 'tenía muy buena técnica' aunque errara mucho.", "Alguna vez dijiste 'prefiero que no salgan campeones si van a jugar así'."],
  "nostalgico": ["Todavía no superas la era de Maradona. Nunca la vas a superar.", "Tienes álbumes de figuritas de varios mundiales atesorados entre tus recuerdos.", "Ver fútbol moderno te genera una mezcla de nostalgia y decepción.", "Tu once ideal tiene al menos siete jugadores retirados.", "Defiendes jugadores de los 90 en discusiones con gente que no los vio jugar.", "Crees que el fútbol murió en algún punto entre 1995 y 2005."],
  "anti-sistema": ["Para ti el VAR arruinó la civilización occidental.", "Tienes una teoría conspirativa para cada resultado que no te gustó.", "El árbitro siempre cobra en contra de tu equipo. Siempre. Sin excepción.", "Cuando tu equipo gana, fue mérito. Cuando pierde, fue robo.", "Crees que la FIFA, tu federación local y el VAR son parte del mismo complot.", "Para ti cada derrota tiene un culpable. Y nunca es tu equipo."],
  "analista": ["Analizaste un partido de pretemporada como si fuera una final.", "Ves los partidos con el teléfono para seguir las estadísticas en tiempo real.", "Tus predicciones tienen sustento teórico y fallaron igual.", "Usas términos tácticos en conversaciones que no lo requieren.", "Predices el resultado antes del partido basándote en datos. Y a veces hasta aciertas.", "Después de cada partido mandas un análisis que nadie pidió."],
  "moderno": ["Para ti Maradona es 'el mejor de su época'.", "Usas datos para defender posiciones en cualquier junta de amigos.", "Sigues la Premier, la Bundesliga y la Serie A más que la liga de tu país.", "Crees que el VAR mejoró el juego y lo dices sin vergüenza.", "Citas fuentes en discusiones de fútbol. Fuentes de verdad.", "El fútbol de antes te parece lento y sin estructura."],
  "tribunero": ["Sabes de memoria cada canción de tu club.", "Para ti el mejor técnico es el que arma un equipo que deja todo.", "Pides offside aunque estás segurísimo que no fue.", "Cantas en el partido aunque tu equipo vaya perdiendo 3-0.", "Tu voz tarda tres días en volver después de cada clásico.", "Nunca saliste del estadio antes del pitazo final, ni en las peores noches."],
  "fanatico-360": ["Tu agenda social depende del calendario de partidos.", "Conoces jugadores de las divisiones juveniles de tu club.", "Perdiste una cena por un partido que terminó 0-0 y no te arrepentiste.", "Tienes más camisetas de fútbol que ropa de trabajo.", "Ajustas tu fin de semana entero al horario de las ligas que sigues.", "El fútbol no es parte de tu vida. Es el centro de tu vida."],
  "futbolero-de-bar": ["Nunca te quedaste sin argumento. Aunque el argumento no cerrara.", "Cambias de posición según el resultado del partido.", "Tienes una opinión formada sobre todo, incluso sobre lo que no viste.", "Defendiste y atacaste al mismo técnico en el mismo mes.", "Sabes un poco de todo y mucho de nada, pero lo dices con convicción.", "Tus predicciones son 50/50 y las recuerdas solo cuando aciertan."],
};

// ─── SCORING ENGINE (DISTANCIA A ARQUETIPO) ──────────────────────────────────
// Misma lógica y fórmula que quetantermo, recalibrada por simulación de 30.000
// jugadores para las 30 preguntas de esta versión. Ver FANATICO-CONTENIDO-DRAFT.md
// sección 10 y calibracion-fanatico.py para el detalle completo y reproducible.

const DIMS_LIST = ["Fanatismo", "Pasión", "Romanticismo", "Resultadismo", "Nostalgia", "Modernidad", "Racionalidad", "AntiSistema"];

// Media y desvío de cada dimensión en jugadores típicos (calibrado por simulación).
const BASELINE_MEAN = { Fanatismo: 52.6, Pasión: 65.4, Romanticismo: 53.2, Resultadismo: 53.2, Nostalgia: 57.5, Modernidad: 54.5, Racionalidad: 52.1, AntiSistema: 50.0 };
const BASELINE_STD = { Fanatismo: 22.8, Pasión: 18.6, Romanticismo: 21.2, Resultadismo: 22.3, Nostalgia: 20.0, Modernidad: 22.4, Racionalidad: 24.6, AntiSistema: 24.6 };

// Cada perfil es dueño de una dimensión-firma, con un peso calibrado para que
// Fanático Nuclear, Tribunero, Anti-sistema y Resultadista no sean escasos
// (parejos ~14% cada uno), el resto de dueños de dimensión un escalón abajo
// (~9-10%, sin ser raros), y los dos perfiles especiales chicos a propósito.
const PERFIL_FIRMA = {
  "fanatico-nuclear": { dim: "Fanatismo", peso: 0.140 },
  "tribunero": { dim: "Pasión", peso: 0.130 },
  "artista": { dim: "Romanticismo", peso: 0.062 },
  "resultadista": { dim: "Resultadismo", peso: 0.068 },
  "nostalgico": { dim: "Nostalgia", peso: 0.078 },
  "moderno": { dim: "Modernidad", peso: 0.054 },
  "analista": { dim: "Racionalidad", peso: 0.053 },
  "anti-sistema": { dim: "AntiSistema", peso: 0.137 },
};

function calcularResultado(respuestas: any[]) {
  // 1. Acumular dims crudas
  const dims: any = {};
  DIMS_LIST.forEach(d => dims[d] = 0);
  respuestas.forEach(({ pregunta, opcion }: any) => {
    Object.entries((pregunta as any)[opcion].dims).forEach(([k, v]: any) => { dims[k] = (dims[k] || 0) + v; });
  });

  // 2. Normalizar a 0-100 (mismo criterio que el original).
  const maxPorDim: any = {};
  DIMS_LIST.forEach(d => maxPorDim[d] = 0);
  PREGUNTAS.forEach(p => {
    DIMS_LIST.forEach(d => {
      maxPorDim[d] += Math.max((p.a.dims as any)[d] || 0, (p.b.dims as any)[d] || 0);
    });
  });
  const normalized: any = {};
  DIMS_LIST.forEach(d => {
    normalized[d] = maxPorDim[d] > 0 ? Math.min(100, Math.round((dims[d] / maxPorDim[d]) * 100)) : 0;
  });

  // 3. Score de Fanatismo: misma fórmula exacta que quetantermo, sin tocar constantes.
  const caliente = normalized.Fanatismo * 0.38 + normalized.Pasión * 0.30 + normalized.AntiSistema * 0.22 + normalized.Resultadismo * 0.10;
  const penal = Math.max(0, (normalized.Racionalidad - 50) * 0.16 + (normalized.Modernidad - 50) * 0.10);
  const fanatismoScore = Math.min(96, Math.max(18, Math.round((caliente - penal) * 0.62 + 33)));

  // 4. Perfil = tu rasgo más marcado (z-score sobre la media de jugadores).
  //    Fanático 360 = alto en 4+ dimensiones a la vez sin un pico dominante.
  //    Futbolero de Bar = no sobresalís en nada (fallback).
  const z: any = {};
  DIMS_LIST.forEach(d => {
    z[d] = (normalized[d] - (BASELINE_MEAN as any)[d]) / (BASELINE_STD as any)[d];
  });

  let mejorId: string | null = null;
  let mejorVal = -Infinity;
  Object.entries(PERFIL_FIRMA).forEach(([pid, firma]: any) => {
    const val = z[firma.dim] * firma.peso;
    if (val > mejorVal) { mejorVal = val; mejorId = pid; }
  });

  const dimsAltas = DIMS_LIST.filter(d => z[d] > 0.6).length;
  if (dimsAltas >= 4 && mejorVal < 0.156) {
    mejorId = "fanatico-360";
  } else if (mejorVal < 0.028) {
    mejorId = "futbolero-de-bar";
  }

  const mejorPerfil = PERFILES.find(p => p.id === mejorId) || PERFILES.find(p => p.id === "futbolero-de-bar");

  // 5. Roasts del perfil
  const pool = (ROASTS_POR_PERFIL as any)[mejorPerfil!.id] || ROASTS_POR_PERFIL["futbolero-de-bar"];
  return { fanatismoScore, dims, normalized, perfil: mejorPerfil!, pool };
}

function getCategoria(score: number) {
  if (score <= 40) return { label: "Curioso", emoji: "🥶", color: "#64748b" };
  if (score <= 56) return { label: "Simpatizante", emoji: "👀", color: "#22d3ee" };
  if (score <= 68) return { label: "Futbolero", emoji: "⚽", color: "#4ade80" };
  if (score <= 81) return { label: "Fanático", emoji: "🔥", color: "#f97316" };
  return { label: "Fanático Total", emoji: "🌋", color: "#ef4444" };
}

// ─── PERCENTIL SIMULADO ───────────────────────────────────────────────────────
// Distribución calibrada con simulación de 30.000 jugadores (ver calibracion-fanatico.py).

function calcularPercentil(score: number): number {
  const buckets = [
    { min: 0, max: 40, cumStart: 0, pct: 2.1 },
    { min: 41, max: 56, cumStart: 2.1, pct: 26.4 },
    { min: 57, max: 68, cumStart: 28.5, pct: 25.7 },
    { min: 69, max: 81, cumStart: 54.2, pct: 31.2 },
    { min: 82, max: 96, cumStart: 85.4, pct: 14.6 },
  ];
  for (const b of buckets) {
    if (score >= b.min && score <= b.max) {
      const pos = (score - b.min) / (b.max - b.min + 1);
      return Math.round(b.cumStart + b.pct * pos);
    }
  }
  return 50;
}

function formatearPercentil(p: number): { texto: string; emoji: string } {
  if (p >= 50) {
    return { texto: `Eres más fanático que el ${p}% de los jugadores`, emoji: "🔥" };
  } else {
    return { texto: `Eres menos fanático que el ${100 - p}% de los jugadores`, emoji: "⚽" };
  }
}

function getTextoPercentil(score: number): { texto: string; emoji: string } {
  return formatearPercentil(calcularPercentil(score));
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

const GrainOverlay = () => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.035,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  }} />
);

const ProgressBar = ({ current, total }: any) => {
  const pct = (current / total) * 100;
  return (
    <div style={{ width: "100%", padding: "0 20px", marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#94a3b8", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
        <span>PREGUNTA {current} DE {total}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #f97316, #ef4444)", borderRadius: 99, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
};

const DimBar = ({ label, value, color }: any) => (
  <div style={{ marginBottom: 9 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 12, color: "#e2e8f0", fontFamily: "var(--font-mono)" }}>
      <span style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      <span style={{ color: "#e2e8f0" }}>{value}%</span>
    </div>
    <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 99, transition: "width 1s ease" }} />
    </div>
  </div>
);

// Helpers para el modal de "Ranking de países" (distintos de PAIS_CODE/BanderaPais
// de más abajo: acá el país viene como código ISO de 2 letras de scores.pais
// vía geo-IP, no como nombre completo elegido en un desplegable).
function nombrePaisISO(codigo: string): string {
  try {
    const nombres = new Intl.DisplayNames(["es"], { type: "region" });
    return nombres.of(codigo.toUpperCase()) || codigo;
  } catch {
    return codigo;
  }
}

function colorFanatismoPromedio(promedio: number): string {
  if (promedio <= 40) return "#64748b";
  if (promedio <= 56) return "#22d3ee";
  if (promedio <= 68) return "#4ade80";
  if (promedio <= 81) return "#f97316";
  return "#ef4444";
}

const BanderaPorCodigoISO = ({ codigo }: { codigo: string }) => (
  <img
    src={`https://flagcdn.com/24x18/${codigo.toLowerCase()}.png`}
    alt={codigo}
    width={20}
    height={15}
    style={{ borderRadius: 2, marginRight: 10, flexShrink: 0, verticalAlign: "middle" }}
  />
);

const LinkedInIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#0A66C2" style={{ flexShrink: 0 }}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <defs>
      <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDD55" />
        <stop offset="30%" stopColor="#FF543E" />
        <stop offset="60%" stopColor="#C837AB" />
        <stop offset="100%" stopColor="#5E5EE8" />
      </linearGradient>
    </defs>
    <path fill="url(#ig-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

// Lista corta de países para el selector (flujo de grupo). "Prefiero no decirlo" al final.
const PAISES = [
  "Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador", "El Salvador",
  "España", "Estados Unidos", "Guatemala", "Honduras", "México", "Nicaragua", "Panamá",
  "Paraguay", "Perú", "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela", "Otro",
];

// ─── SCREENS ─────────────────────────────────────────────────────────────────

function Landing({ onStart }: any) {
  const [visible, setVisible] = useState(false);
  const [totalJugadores, setTotalJugadores] = useState<number | null>(null);
  useEffect(() => { if (!visible) setTimeout(() => setVisible(true), 50); }, []);
  useEffect(() => {
    fetch("/api/count")
      .then((r) => r.json())
      .then((data) => { if (data.count && data.count >= 10000) setTotalJugadores(data.count); })
      .catch(() => {});
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "32px 20px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 400, height: 400, background: "radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "-10%", width: 300, height: 300, background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 440, width: "100%", textAlign: "center", transition: "opacity 0.6s ease, transform 0.6s ease", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 99, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", marginBottom: 20, fontSize: 11, color: "#f87171", fontFamily: "var(--font-mono)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          ⚽ TEST FUTBOLERO 🏆
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(42px, 12vw, 72px)", fontWeight: 900, lineHeight: 1, margin: "0 0 8px", letterSpacing: "-0.02em", background: "linear-gradient(135deg, #ffffff 0%, #f97316 50%, #ef4444 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          ¿QUÉ TAN<br />FANÁTICO ERES?
        </h1>

        <p style={{ fontFamily: "var(--font-body)", fontSize: 17, color: "#94a3b8", lineHeight: 1.5, margin: "20px 0 32px", maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
          30 decisiones futboleras.<br />
          Sin respuestas correctas.<br />
          <span style={{ color: "#e2e8f0" }}>Descubre tu nivel de fanatismo y tu perfil futbolero.</span>
        </p>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 24px", marginBottom: 36, textAlign: "left" }}>
          {[
            "¿Tu familia ya sabe que en día de clásico no existes?",
            "¿Tu agenda social depende del calendario de partidos?",
            "¿Te sabes de memoria una alineación de tu equipo de hace 10 años?",
          ].map((t: string, i: number) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < 2 ? 12 : 0, alignItems: "flex-start" }}>
              <span style={{ color: "#ef4444", marginTop: 1, flexShrink: 0 }}>▶</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#cbd5e1", lineHeight: 1.4 }}>{t}</span>
            </div>
          ))}
        </div>

        <button onClick={onStart} style={{
          width: "100%", padding: "18px 24px", borderRadius: 14, border: "none", cursor: "pointer",
          background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
          fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "0.04em",
          boxShadow: "0 0 40px rgba(239,68,68,0.3), 0 4px 20px rgba(0,0,0,0.4)",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
          onMouseEnter={(e: any) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 0 60px rgba(239,68,68,0.4), 0 8px 30px rgba(0,0,0,0.5)"; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(239,68,68,0.3), 0 4px 20px rgba(0,0,0,0.4)"; }}
        >
          EMPEZAR
        </button>

        {totalJugadores && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#94a3b8", marginTop: 12 }}>
            🔥 {totalJugadores.toLocaleString("es")} fanáticos ya lo jugaron
          </p>
        )}
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#94a3b8", marginTop: 6 }}>⏱ Menos de 3 minutos · Gratis</p>
      </div>
    </div>
  );
}

function Juego({ onFinalizar }: any) {
  const [idx, setIdx] = useState(0);
  const [respuestas, setRespuestas] = useState<any[]>([]);
  const [animando, setAnimando] = useState(false);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [fadeIn, setFadeIn] = useState(true);

  const pregunta = PREGUNTAS[idx];

  const elegir = (opcion: string) => {
    if (animando) return;
    setSeleccionado(opcion);
    setAnimando(true);
    const nuevas = [...respuestas, { pregunta, opcion }];
    if (idx < PREGUNTAS.length - 1) {
      setFadeIn(false);
      setTimeout(() => {
        setIdx(idx + 1);
        setSeleccionado(null);
        setAnimando(false);
        setFadeIn(true);
        setRespuestas(nuevas);
      }, 220);
    } else {
      setRespuestas(nuevas);
      setTimeout(() => onFinalizar(nuevas), 220);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "20px 0" }}>
      <div style={{ padding: "10px 0 0" }}>
        <ProgressBar current={idx + 1} total={PREGUNTAS.length} />
      </div>

      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "20px", transition: "opacity 0.22s ease-in-out", opacity: fadeIn ? 1 : 0,
      }}>
        <div style={{ maxWidth: 440, width: "100%" }}>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#cbd5e1", letterSpacing: "0.2em", textTransform: "uppercase" }}>ELIGE UNO</span>
          </div>

          <OpcionCard
            texto={pregunta.a.texto}
            lado="A"
            seleccionado={seleccionado === "a"}
            rechazado={seleccionado === "b"}
            onClick={() => elegir("a")}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, color: "#ef4444", letterSpacing: "0.05em" }}>VS</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          </div>

          <OpcionCard
            texto={pregunta.b.texto}
            lado="B"
            seleccionado={seleccionado === "b"}
            rechazado={seleccionado === "a"}
            onClick={() => elegir("b")}
          />

          <p style={{ textAlign: "center", marginTop: 20, fontFamily: "var(--font-body)", fontSize: 12, color: "#94a3b8" }}>Toca para elegir · Sin vuelta atrás</p>
        </div>
      </div>
    </div>
  );
}

function OpcionCard({ texto, lado, seleccionado, rechazado, onClick }: any) {
  const [hovered, setHovered] = useState(false);

  const getBg = () => {
    if (seleccionado) return "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(249,115,22,0.2))";
    if (rechazado) return "rgba(255,255,255,0.01)";
    if (hovered) return "rgba(255,255,255,0.06)";
    return "rgba(255,255,255,0.03)";
  };

  const getBorder = () => {
    if (seleccionado) return "1px solid rgba(239,68,68,0.6)";
    if (rechazado) return "1px solid rgba(255,255,255,0.04)";
    if (hovered) return "1px solid rgba(255,255,255,0.15)";
    return "1px solid rgba(255,255,255,0.07)";
  };

  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", padding: "28px 24px", borderRadius: 18,
        background: getBg(), border: getBorder(), cursor: "pointer",
        transition: "background 0.15s ease, border 0.15s ease, opacity 0.15s ease",
        textAlign: "center",
        opacity: rechazado ? 0.35 : 1,
      }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: seleccionado ? "#f87171" : "#cbd5e1", letterSpacing: "0.2em", marginBottom: 8 }}>
        OPCIÓN {lado}
      </div>
      <div style={{
        fontFamily: "var(--font-display)", fontSize: "clamp(22px, 6vw, 30px)", fontWeight: 800,
        color: seleccionado ? "#ffffff" : "#e2e8f0", lineHeight: 1.1, letterSpacing: "-0.01em",
      }}>
        {texto}
      </div>
      <div style={{ marginTop: 10, fontSize: 20, visibility: seleccionado ? "visible" : "hidden" }}>✓</div>
    </button>
  );
}

function Resultado({ respuestas, onReiniciar }: any) {
  const resultado = calcularResultado(respuestas);
  const { fanatismoScore, normalized, perfil, pool } = resultado;
  const roasts = useMemo(() => [...(pool as string[])].sort(() => Math.random() - 0.5).slice(0, 3), [perfil.id]);
  const categoria = getCategoria(fanatismoScore);
  const [percentilData, setPercentilData] = useState(getTextoPercentil(fanatismoScore));
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const creandoGrupoRef = useRef(false);

  useEffect(() => {
    if (!visible) setTimeout(() => setVisible(true), 100);
    track("quiz_completado", { perfil: perfil.id, score: fanatismoScore, categoria: categoria.label });
    sendGAEvent("event", "quiz_completado", { perfil: perfil.id, score: fanatismoScore, categoria: categoria.label });

    // "respuestas" en Resultado ya viene en el orden fijo de PREGUNTAS (Juego
    // recorre PREGUNTAS[0..29] secuencialmente, sin shuffle), así que la
    // posición i de este string siempre corresponde a la pregunta i+1. Permite
    // queries tipo "% de A/B de la pregunta 2 por país" contra la tabla scores.
    const respuestasCompactas = respuestas.map((r: any) => r.opcion).join("");

    fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: fanatismoScore, categoria: categoria.label, perfil: perfil.id, respuestas: respuestasCompactas }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.percentil === "number") {
          setPercentilData(formatearPercentil(data.percentil));
        }
      })
      .catch(() => {});

    const urlParams = new URLSearchParams(window.location.search);
    const gId = urlParams.get("grupo");
    const gJugador = urlParams.get("jugador");
    const gPais = urlParams.get("pais");
    if (gId) setGrupoId(gId);
    if (gJugador) setJugadorNombre(gJugador);
    if (gId && gJugador) {
      fetch(`/api/grupos/${gId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_name: gJugador, score: fanatismoScore, categoria: categoria.label, perfil: perfil.id, pais: gPais || null }),
      })
        .then(() => fetch(`/api/grupos/${gId}`))
        .then((r) => r.json())
        .then((data) => { if (data.scores) setGrupoScores(data.scores); })
        .catch(() => {});
    }
  }, []);

  const dimColors = {
    Pasión: "#ef4444", Nostalgia: "#8b5cf6", Romanticismo: "#ec4899",
    Resultadismo: "#f97316", AntiSistema: "#ef4444", Modernidad: "#0ea5e9",
    Racionalidad: "#10b981", Fanatismo: "#f97316",
  };

  const dimsParaMostrar = ["Pasión", "Nostalgia", "Romanticismo", "Resultadismo", "Modernidad", "Racionalidad"]
    .map(k => ({ label: k, value: normalized[k] || 0, color: (dimColors as any)[k] }));

  // Códigos ISO para banderas vía flagcdn.com - usamos imágenes en vez de emoji
  // porque los emoji de bandera no se renderizan como bandera en Windows (se ven
  // como las dos letras del código, ej. "NI"). Con imagen se ve igual en todos lados.
  const PAIS_CODE: Record<string, string> = {
    Argentina: "ar", Bolivia: "bo", Chile: "cl", Colombia: "co", "Costa Rica": "cr",
    Cuba: "cu", Ecuador: "ec", "El Salvador": "sv", España: "es", "Estados Unidos": "us",
    Guatemala: "gt", Honduras: "hn", México: "mx", Nicaragua: "ni", Panamá: "pa",
    Paraguay: "py", Perú: "pe", "Puerto Rico": "pr", "República Dominicana": "do",
    Uruguay: "uy", Venezuela: "ve",
  };
  const BanderaPais = ({ pais }: { pais?: string }) => {
    const code = pais ? PAIS_CODE[pais] : null;
    if (!code) return null;
    return (
      <img
        src={`https://flagcdn.com/24x18/${code}.png`}
        alt={pais}
        width={18}
        height={14}
        style={{ borderRadius: 2, marginRight: 8, flexShrink: 0, verticalAlign: "middle" }}
      />
    );
  };

  const SITE_URL = "https://quetanfanatico.com";
  const textoCompartir = `Saqué ${fanatismoScore}/100 en "¿Qué tan fanático eres?" 🔥\nPerfil: ${perfil.nombre}\n\n¿Tú qué tan fanático eres? 🔥\n¡Juégalo y desafía a tu grupo!`;
  const textoConLink = `${textoCompartir}\n${SITE_URL}`;
  const [descargando, setDescargando] = useState(false);
  const [creandoGrupo, setCreandoGrupo] = useState(false);
  const [nombreCreador, setNombreCreador] = useState("");
  const [nombreGrupo, setNombreGrupo] = useState("");
  const [paisCreador, setPaisCreador] = useState("");
  const [creandoGrupoLoading, setCreandoGrupoLoading] = useState(false);
  const [grupoScores, setGrupoScores] = useState<any[]>([]);
  const [grupoId, setGrupoId] = useState<string | null>(null);
  const [jugadorNombre, setJugadorNombre] = useState<string | null>(null);
  const [ultimoGrupoCreado, setUltimoGrupoCreado] = useState<string | null>(null);
  const [grupoCreado, setGrupoCreado] = useState(false);

  // Ranking de países: modal en vez de navegar a /paises, para no sacar a la
  // persona de esta pantalla (donde está el botón real de difusión, crear
  // grupo). Cerrar el modal la devuelve exactamente a su resultado, intacto.
  const [mostrarPaises, setMostrarPaises] = useState(false);
  const [datosPaises, setDatosPaises] = useState<any>(null);
  const [cargandoPaises, setCargandoPaises] = useState(false);
  const [errorPaises, setErrorPaises] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mostrarPaises ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mostrarPaises]);

  const abrirRankingPaises = async () => {
    setMostrarPaises(true);
    if (datosPaises) return; // ya está cargado, no repetimos el fetch
    setCargandoPaises(true);
    setErrorPaises(false);
    const espera = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    for (let intento = 0; intento < 3; intento++) {
      if (intento > 0) await espera(500);
      try {
        const r = await fetch("/api/paises");
        const data = await r.json();
        if (r.ok && !data.error) {
          setDatosPaises(data);
          setCargandoPaises(false);
          return;
        }
      } catch {
        // seguimos al próximo intento
      }
    }
    setErrorPaises(true);
    setCargandoPaises(false);
  };
  // Al descargar la imagen para compartir, subimos el contraste de los labels
  // chicos (mayúsculas, letras espaciadas) porque en la imagen rasterizada se
  // ven más opacos que en pantalla - se comparte suelta, sin el resto de la web
  // alrededor, así que necesita más contraste que la vista normal.
  const [modoDescarga, setModoDescarga] = useState(false);

  const [errorGrupo, setErrorGrupo] = useState<string | null>(null);

  // El botón único "Compartir" (con imagen adjunta vía share nativo) es solo
  // para celular. Windows (Chrome/Edge) también soporta navigator.canShare
  // con archivos porque Windows tiene su propio panel de share nativo, así
  // que la detección por capacidad sola no alcanza: hay que combinarla con
  // un chequeo de que sea un teléfono. En desktop (aunque el navegador
  // soporte compartir archivos) se mantiene el flujo anterior (botón de X
  // solo texto + botón de descargar imagen aparte).
  const [esMobil, setEsMobil] = useState(false);
  const [puedeCompartirImagen, setPuedeCompartirImagen] = useState(false);
  useEffect(() => {
    setEsMobil(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    try {
      const archivoPrueba = new File([""], "test.png", { type: "image/png" });
      setPuedeCompartirImagen(
        typeof navigator !== "undefined" &&
        typeof (navigator as any).canShare === "function" &&
        (navigator as any).canShare({ files: [archivoPrueba] })
      );
    } catch {
      setPuedeCompartirImagen(false);
    }
  }, []);

  const espera = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const intentarCrearGrupo = async (nombre: string) => {
    const res = await fetch("/api/grupos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creator_name: nombre, score: fanatismoScore, categoria: categoria.label, perfil: perfil.id,
        nombre_grupo: nombreGrupo.trim() || null, pais: paisCreador || null,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.grupo_id) {
      throw new Error("Respuesta inválida del servidor al crear el grupo");
    }
    return data.grupo_id as string;
  };

  const crearGrupo = async () => {
    // Lock sincrónico (además del disabled del botón) para blindar contra doble
    // click/doble disparo del evento, que causaba una carrera de dos POST casi
    // simultáneos y un flash de error seguido del éxito del segundo pedido.
    if (creandoGrupoRef.current) return;
    const nombre = nombreCreador.trim();
    if (!nombre) return;
    creandoGrupoRef.current = true;
    setCreandoGrupoLoading(true);
    setErrorGrupo(null);
    try {
      // Reintentamos en silencio antes de mostrar cualquier error al usuario:
      // la mayoría de las fallas son hiccups transitorios de conexión con Neon,
      // no fallas reales. Solo mostramos error si los 3 intentos fallan.
      let grupoId: string | null = null;
      let ultimoError: any = null;
      for (let intento = 0; intento < 3 && !grupoId; intento++) {
        if (intento > 0) await espera(500);
        try {
          grupoId = await intentarCrearGrupo(nombre);
        } catch (e) {
          ultimoError = e;
        }
      }

      if (!grupoId) {
        console.error("Error creando grupo tras reintentos:", ultimoError);
        setErrorGrupo("No se pudo crear el grupo. Intenta de nuevo en un momento.");
        return;
      }

      const grupoUrl = `https://quetanfanatico.com/grupo/${grupoId}`;
      const nombreGrupoLimpio = nombreGrupo.trim();
      const nombreGrupoCap = nombreGrupoLimpio
        ? nombreGrupoLimpio.charAt(0).toUpperCase() + nombreGrupoLimpio.slice(1)
        : "";
      const referenciaRanking = nombreGrupoCap ? `el ranking de "${nombreGrupoCap}"` : "el ranking del grupo";
      const texto = `Saqué ${fanatismoScore}/100 en "¿Qué tan fanático eres?" 🔥\nPerfil: ${perfil.nombre}\n\n¿Puedes superarme? Entra a ${referenciaRanking}:\n${grupoUrl}\n\nEl link queda abierto - cualquiera que lo tenga puede entrar cuando quiera y ver el ranking completo de todos los que ya jugaron.`;
      track("compartido", { canal: "whatsapp_grupo", perfil: perfil.id, score: fanatismoScore });
      sendGAEvent("event", "compartido", { canal: "whatsapp_grupo", perfil: perfil.id, score: fanatismoScore });
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
      setUltimoGrupoCreado(nombreGrupoCap || null);
      setGrupoCreado(true);
      setNombreGrupo("");
    } catch (e) {
      console.error(e);
      setErrorGrupo("No se pudo crear el grupo. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setCreandoGrupoLoading(false);
      creandoGrupoRef.current = false;
    }
  };

  const crearOtroGrupo = () => {
    setUltimoGrupoCreado(null);
    setGrupoCreado(false);
    setCreandoGrupo(true);
  };

  const desafiar = () => {
    track("compartido", { canal: "whatsapp", perfil: perfil.id, score: fanatismoScore });
    sendGAEvent("event", "compartido", { canal: "whatsapp", perfil: perfil.id, score: fanatismoScore });
    const url = `https://wa.me/?text=${encodeURIComponent(textoConLink)}`;
    window.open(url, "_blank");
  };

  const compartirX = () => {
    track("compartido", { canal: "x", perfil: perfil.id, score: fanatismoScore });
    sendGAEvent("event", "compartido", { canal: "x", perfil: perfil.id, score: fanatismoScore });
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(textoCompartir)}&url=${encodeURIComponent(SITE_URL)}`, "_blank");
  };

  const [linkCopiado, setLinkCopiado] = useState(false);

  const copiarLink = async () => {
    try {
      track("compartido", { canal: "copiar_link", perfil: perfil.id, score: fanatismoScore });
      sendGAEvent("event", "compartido", { canal: "copiar_link", perfil: perfil.id, score: fanatismoScore });
      await navigator.clipboard.writeText(SITE_URL);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2500);
    } catch { }
  };

  const esperarFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const descargarImagen = async () => {
    if (!cardRef.current) return;
    track("compartido", { canal: "guardar_imagen", perfil: perfil.id, score: fanatismoScore });
    sendGAEvent("event", "compartido", { canal: "guardar_imagen", perfil: perfil.id, score: fanatismoScore });
    setDescargando(true);
    setModoDescarga(true);
    try {
      // Esperamos a que React re-pinte con los colores de alto contraste antes de capturar.
      await esperarFrame();
      const domtoimage = (await import("dom-to-image-more" as any)).default;
      const dataUrl = await domtoimage.toPng(cardRef.current, { quality: 1, scale: 2, bgcolor: "#090c10" });
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        const img = new Image();
        img.src = dataUrl;
        const w = window.open("");
        if (w) { w.document.write(img.outerHTML); w.document.close(); }
      } else {
        const link = document.createElement("a");
        link.download = "que-tan-fanatico-eres.png";
        link.href = dataUrl;
        link.click();
      }
    } catch (e) {
      console.error("Error al generar imagen:", e);
    } finally {
      setModoDescarga(false);
      setDescargando(false);
    }
  };

  const compartirConImagen = async () => {
    if (!cardRef.current) return;
    track("compartido", { canal: "compartir_nativo", perfil: perfil.id, score: fanatismoScore });
    sendGAEvent("event", "compartido", { canal: "compartir_nativo", perfil: perfil.id, score: fanatismoScore });
    setDescargando(true);
    setModoDescarga(true);
    try {
      await esperarFrame();
      const domtoimage = (await import("dom-to-image-more" as any)).default;
      const dataUrl = await domtoimage.toPng(cardRef.current, { quality: 1, scale: 2, bgcolor: "#090c10" });
      const blob = await (await fetch(dataUrl)).blob();
      const archivo = new File([blob], "que-tan-fanatico-eres.png", { type: "image/png" });
      if ((navigator as any).canShare && (navigator as any).canShare({ files: [archivo] })) {
        // Con "files" presente, algunos navegadores ignoran el campo "url" aparte,
        // así que el link va incluido directo en el texto (textoConLink) para
        // que no se pierda pase lo que pase.
        await navigator.share({ files: [archivo], text: textoConLink } as any);
      } else {
        // Fallback por si cambió de idea el navegador entre el chequeo inicial y el click.
        await descargarImagen();
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") console.error("Error al compartir imagen:", e);
    } finally {
      setModoDescarga(false);
      setDescargando(false);
    }
  };

  const compartir = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "¿Qué tan fanático eres?", text: textoCompartir, url: SITE_URL });
      } else {
        await navigator.clipboard.writeText(textoConLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch { }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "24px 20px 60px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ maxWidth: 440, width: "100%", transition: "opacity 0.6s ease, transform 0.6s ease", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)" }}>

        <div ref={cardRef} style={{ background: "#090c10", padding: "4px 0 4px", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ textAlign: "center", marginBottom: 8, padding: "22px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 300, height: 300, background: `radial-gradient(circle, ${categoria.color}20 0%, transparent 70%)`, pointerEvents: "none" }} />

          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: modoDescarga ? "#f1f5f9" : "#cbd5e1", letterSpacing: "0.15em", marginBottom: 8, textTransform: "uppercase" }}>
            NIVEL DE FANATISMO
          </div>

          {/* Sin flexbox acá a propósito: el "gap" y el align-items de flex no
              se serializan de forma confiable en dom-to-image-more al generar
              la imagen (se ve bien en pantalla, mal en la descarga). Con
              texto inline + margin normal, la separación es estable en
              cualquier motor de renderizado. */}
          <div style={{ textAlign: "center" }}>
            <span style={
              modoDescarga
                // El truco de degradado con background-clip:text lo corta mal
                // dom-to-image-more al rasterizar (se ve bien en pantalla, mal
                // en la imagen descargada). Al descargar usamos color sólido.
                ? { fontFamily: "var(--font-display)", fontSize: 68, fontWeight: 900, lineHeight: 1, color: categoria.color, verticalAlign: "baseline" }
                : { fontFamily: "var(--font-display)", fontSize: 68, fontWeight: 900, lineHeight: 1, background: `linear-gradient(135deg, #fff 0%, ${categoria.color} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", verticalAlign: "baseline" }
            }>
              {fanatismoScore}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: modoDescarga ? "#f1f5f9" : "#cbd5e1", marginLeft: 10, verticalAlign: "baseline" }}>/100</span>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, padding: "8px 20px", borderRadius: 99, fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, color: categoria.color, letterSpacing: "0.03em", textTransform: "uppercase" }}>
            <span style={{ fontSize: 13, lineHeight: 1 }}>{categoria.emoji}</span>
            <span>{categoria.label}</span>
          </div>

          <div style={{ marginTop: 6, padding: "7px 18px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", display: "inline-block" }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#cbd5e1" }}>
              {percentilData.emoji} {percentilData.texto}
            </span>
          </div>
        </div>

        <div style={{ padding: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, marginBottom: 8 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: modoDescarga ? "#f1f5f9" : "#cbd5e1", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>TU PERFIL</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, color: "#f1f5f9", marginBottom: 4, letterSpacing: "-0.01em" }}>
            {perfil.emoji} {perfil.nombre}
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#94a3b8", lineHeight: 1.4, margin: 0 }}>{perfil.descripcion}</p>

          <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 12, borderLeft: "3px solid #f97316" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#cbd5e1", lineHeight: 1.4, margin: 0, fontStyle: "italic" }}>
              "{perfil.resumen}"
            </p>
          </div>
        </div>

        <div style={{ padding: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, marginBottom: 0 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: modoDescarga ? "#f1f5f9" : "#cbd5e1", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>TU ADN FUTBOLERO</div>
          {dimsParaMostrar.map(d => <DimBar key={d.label} {...d} />)}
        </div>

        </div>

        <div style={{ padding: "24px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 20, marginBottom: 24 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#f87171", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>🎯 TE DESCRIBE</div>
          {roasts.map((r: string, i: number) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < roasts.length - 1 ? 12 : 0 }}>
              <span style={{ color: "#ef4444", flexShrink: 0 }}>•</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#e2e8f0", lineHeight: 1.4 }}>{r}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, marginBottom: 24, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginBottom: 8, letterSpacing: "-0.01em" }}>
            ¿TUS AMIGOS SON MÁS FANÁTICOS QUE TÚ?
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>
            Crea un ranking grupal, mándales el link y que lo demuestren.
          </p>
          {grupoCreado ? (
            <div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#4ade80", marginBottom: 12 }}>
                {ultimoGrupoCreado ? `✓ Grupo "${ultimoGrupoCreado}" creado y compartido` : "✓ Grupo creado y compartido"}
              </p>
              <button onClick={crearOtroGrupo} style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer",
                background: "rgba(255,255,255,0.05)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "#e2e8f0",
              }}>
                + Crear otro grupo
              </button>
            </div>
          ) : !creandoGrupo ? (
            <button onClick={() => setCreandoGrupo(true)} style={{
              width: "100%", padding: "16px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #f97316, #ef4444)",
              fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "0.04em",
            }}>
              🏆 CREAR RANKING Y DESAFIARLOS
            </button>
          ) : (
            <div>
              <input
                value={nombreCreador}
                onChange={(e: any) => setNombreCreador(e.target.value)}
                placeholder="Tu nombre"
                maxLength={30}
                autoFocus
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
                  fontFamily: "var(--font-body)", fontSize: 16, color: "#f1f5f9", marginBottom: 10,
                }}
              />
              <select
                value={paisCreador}
                onChange={(e: any) => setPaisCreador(e.target.value)}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
                  fontFamily: "var(--font-body)", fontSize: 16, color: paisCreador ? "#f1f5f9" : "#64748b", marginBottom: 10,
                }}
              >
                <option value="" style={{ color: "#111827" }}>Tu país (opcional)</option>
                {PAISES.map((p) => <option key={p} value={p} style={{ color: "#111827" }}>{p}</option>)}
              </select>
              <input
                value={nombreGrupo}
                onChange={(e: any) => setNombreGrupo(e.target.value)}
                onKeyDown={(e: any) => e.key === "Enter" && crearGrupo()}
                placeholder="Familia, Amigos del trabajo... (opcional)"
                maxLength={30}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
                  fontFamily: "var(--font-body)", fontSize: 16, color: "#f1f5f9", marginBottom: 6,
                }}
              />
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#94a3b8", marginBottom: 6, textAlign: "left" }}>
                Puedes crear más de un grupo - repite este paso las veces que quieras (familia, amigos, trabajo, etc.)
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#94a3b8", marginBottom: 10, textAlign: "left" }}>
                El link queda abierto - cualquiera que lo tenga puede entrar cuando quiera y ver el ranking completo de todos los que ya jugaron.
              </p>
              {errorGrupo && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#f87171", marginBottom: 10, textAlign: "left" }}>
                  {errorGrupo}
                </p>
              )}
              <button onClick={crearGrupo} disabled={!nombreCreador.trim() || creandoGrupoLoading} style={{
                width: "100%", padding: "16px", borderRadius: 12, border: "none",
                cursor: nombreCreador.trim() && !creandoGrupoLoading ? "pointer" : "not-allowed",
                background: nombreCreador.trim() ? "linear-gradient(135deg, #f97316, #ef4444)" : "rgba(255,255,255,0.05)",
                fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800,
                color: nombreCreador.trim() ? "#fff" : "#475569", letterSpacing: "0.04em",
              }}>
                {creandoGrupoLoading ? "CREANDO..." : "🏆 CREAR Y COMPARTIR POR WHATSAPP"}
              </button>
            </div>
          )}
        </div>

        {puedeCompartirImagen && esMobil ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={compartirConImagen} disabled={descargando} style={{
                padding: "14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer",
                background: "rgba(255,255,255,0.05)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "#e2e8f0",
              }}>
                {descargando ? "⏳ Generando..." : "📤 Compartir"}
              </button>
              <button onClick={onReiniciar} style={{
                padding: "14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                background: "rgba(255,255,255,0.05)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "#e2e8f0",
              }}>
                🔄 Jugar de nuevo
              </button>
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#94a3b8", textAlign: "center", lineHeight: 1.4 }}>
              Se genera la imagen y elegís dónde mandarla: X, Instagram, WhatsApp, donde quieras
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, justifyContent: "space-between" }}>
              <button onClick={compartirX} style={{
                padding: "14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer",
                background: "rgba(255,255,255,0.05)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "#e2e8f0",
              }}>
                𝕏  Compartir resultado
              </button>
              <div style={{ flex: 1 }} />
              <button onClick={onReiniciar} style={{
                padding: "14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                background: "rgba(255,255,255,0.05)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "#e2e8f0",
              }}>
                🔄 Jugar de nuevo
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button onClick={descargarImagen} disabled={descargando} style={{
                padding: "14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                background: "rgba(255,255,255,0.05)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "#e2e8f0",
              }}>
                {descargando ? "⏳ Generando..." : "📸 Guardar imagen"}
              </button>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#94a3b8", textAlign: "center", lineHeight: 1.4 }}>
                Guarda la imagen y compártela en Instagram, TikTok o Facebook Stories 📲
              </p>
              <button onClick={copiarLink} style={{
                padding: "14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                background: "rgba(255,255,255,0.05)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "#e2e8f0",
              }}>
                {linkCopiado ? "✓ Link copiado" : "🔗 Copiar link"}
              </button>
            </div>
          </div>
        )}

        {grupoId && grupoScores.length > 0 && (
          <div style={{ padding: "24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, marginBottom: 24 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#cbd5e1", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>
              🏆 RANKING DE FANATISMO DEL GRUPO - {grupoScores.length} jugador{grupoScores.length !== 1 ? "es" : ""}
            </div>
            {grupoScores.map((s: any, i: number) => {
              const cat = getCategoria(s.score);
              const esYo = s.player_name === jugadorNombre;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < grupoScores.length - 1 ? 10 : 0 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: i === 0 ? "#f97316" : "#94a3b8", width: 24, textAlign: "center", flexShrink: 0 }}>
                    {i === 0 ? "🥇" : `#${i + 1}`}
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", fontFamily: "var(--font-body)", fontSize: 14, color: esYo ? "#f97316" : "#e2e8f0", fontWeight: esYo ? 600 : 400 }}>
                    <BanderaPais pais={s.pais} />
                    {s.player_name}{esYo ? " (tú)" : ""}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, width: 60, flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: cat.color }}>{s.score}</span>
                    <span style={{ fontSize: 14 }}>{cat.emoji}</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#94a3b8", textAlign: "right", flexShrink: 0, width: 110, whiteSpace: "nowrap" }}>
                    {s.perfil.replace(/-/g, " ").toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p style={{ textAlign: "center", marginTop: 14, fontFamily: "var(--font-body)", fontSize: 13, color: "#94a3b8", lineHeight: 1.4 }}>
          Puedes tocar todos los botones que quieras. ¡Compártelo donde quieras! 🚀
        </p>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button onClick={abrirRankingPaises} style={{
            padding: "14px 24px", borderRadius: 12, cursor: "pointer",
            border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)",
            fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "#e2e8f0",
          }}>
            🌎 Mira el ranking de fanatismo por país
          </button>
        </div>

        {mostrarPaises && (
          <div
            onClick={() => setMostrarPaises(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50,
              display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#090c10", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20,
                maxWidth: 480, width: "100%", maxHeight: "85vh", overflowY: "auto", padding: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
                  🌎 RANKING DE PAÍSES
                </div>
                <button onClick={() => setMostrarPaises(false)} style={{
                  background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, cursor: "pointer",
                  color: "#e2e8f0", fontSize: 16, width: 32, height: 32, lineHeight: 1,
                }}>✕</button>
              </div>

              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#94a3b8", marginBottom: 18, lineHeight: 1.5 }}>
                Datos agregados y anónimos de todos los jugadores. Nadie ve resultados individuales acá, solo promedios por país.
              </p>

              {cargandoPaises && (
                <p style={{ textAlign: "center", fontFamily: "var(--font-body)", color: "#94a3b8", padding: "20px 0" }}>Cargando...</p>
              )}

              {errorPaises && (
                <p style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: 13, color: "#f87171", padding: "20px 0" }}>
                  No se pudo cargar el ranking. Intenta de nuevo en un momento.
                </p>
              )}

              {datosPaises && (
                <>
                  <div style={{ display: "flex", alignItems: "center", fontFamily: "var(--font-mono)", fontSize: 10, color: "#cbd5e1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ flex: 1 }}>PAÍS</div>
                    <div style={{ width: 70, textAlign: "center" }}>FANATISMO</div>
                    <div style={{ width: 60, textAlign: "right" }}>JUGADORES</div>
                  </div>

                  {datosPaises.paises.length === 0 ? (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "10px 0" }}>
                      Todavía ningún país llegó a los {datosPaises.minMuestra} jugadores. ¡Compártelo para que tu país aparezca primero!
                    </p>
                  ) : (
                    datosPaises.paises.map((p: any, i: number) => (
                      <div key={p.pais} style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ flex: 1, display: "flex", alignItems: "center", fontFamily: "var(--font-body)", fontSize: 14, color: "#e2e8f0" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#64748b", width: 20, flexShrink: 0 }}>{i + 1}</span>
                          <BanderaPorCodigoISO codigo={p.pais} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombrePaisISO(p.pais)}</span>
                        </div>
                        <div style={{ width: 70, textAlign: "center", fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: colorFanatismoPromedio(p.promedio) }}>
                          {Math.round(p.promedio)}
                        </div>
                        <div style={{ width: 60, textAlign: "right", fontFamily: "var(--font-body)", fontSize: 12, color: "#94a3b8" }}>
                          {p.cantidad.toLocaleString("es")}
                        </div>
                      </div>
                    ))
                  )}

                  <div style={{ display: "flex", alignItems: "center", marginTop: 4, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ flex: 1, fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, color: "#f1f5f9", letterSpacing: "0.02em" }}>
                      TOTAL
                    </div>
                    <div style={{ width: 70, textAlign: "center", fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>
                      {Math.round(datosPaises.total.promedio)}
                    </div>
                    <div style={{ width: 60, textAlign: "right", fontFamily: "var(--font-body)", fontSize: 12, color: "#94a3b8" }}>
                      {datosPaises.total.cantidad.toLocaleString("es")}
                    </div>
                  </div>

                  <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#64748b", marginTop: 16, marginBottom: 20, lineHeight: 1.5 }}>
                    Solo se muestran países con al menos {datosPaises.minMuestra} resultados, para que el promedio sea confiable. El total incluye a todos los jugadores, de cualquier país.
                  </p>
                </>
              )}

              <button onClick={() => setMostrarPaises(false)} style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)",
                cursor: "pointer", background: "rgba(255,255,255,0.05)",
                fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "#e2e8f0",
              }}>
                ← Volver a tu resultado
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>
            Hecho por Mariano Gusis
          </p>
          <a href="https://www.linkedin.com/in/mariano-gusis" target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#94a3b8", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
            onMouseEnter={(e: any) => e.currentTarget.style.color = "#e2e8f0"}
            onMouseLeave={(e: any) => e.currentTarget.style.color = "#94a3b8"}
          >
            <LinkedInIcon /> linkedin.com/in/mariano-gusis
          </a>
          <br />
          <a href="https://www.instagram.com/marianogusis/" target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#94a3b8", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6 }}
            onMouseEnter={(e: any) => e.currentTarget.style.color = "#e2e8f0"}
            onMouseLeave={(e: any) => e.currentTarget.style.color = "#94a3b8"}
          >
            <InstagramIcon /> instagram.com/marianogusis
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ────────────────────────────────────────────────────────────────

export default function App() {
  const [pantalla, setPantalla] = useState(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("grupo") && p.get("jugador")) return "juego";
    }
    return "landing";
  });
  const [respuestas, setRespuestas] = useState<any[]>([]);

  const handleStart = () => {
    track("quiz_iniciado", {});
    sendGAEvent("event", "quiz_iniciado", {});
    setPantalla("juego");
  };
  const handleFinalizar = (r: any) => { setRespuestas(r); setPantalla("resultado"); };
  const handleReiniciar = () => { setRespuestas([]); setPantalla("landing"); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --font-display: 'Bebas Neue', 'Arial Black', sans-serif;
          --font-body: 'DM Sans', -apple-system, sans-serif;
          --font-mono: 'JetBrains Mono', 'Courier New', monospace;
          --bg: #090c10;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

        body {
          background: var(--bg);
          color: #e2e8f0;
          min-height: 100vh;
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
        }

        button { outline: none; }

        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <GrainOverlay />
        <div style={{ position: "relative", zIndex: 1 }}>
          {pantalla === "landing" && <Landing onStart={handleStart} />}
          {pantalla === "juego" && <Juego onFinalizar={handleFinalizar} />}
          {pantalla === "resultado" && <Resultado respuestas={respuestas} onReiniciar={handleReiniciar} />}
        </div>
      </div>
    </>
  );
}
