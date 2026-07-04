"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
  :root {
    --font-display: 'Bebas Neue', 'Arial Black', sans-serif;
    --font-body: 'DM Sans', -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', 'Courier New', monospace;
    --bg: #090c10;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { background: var(--bg); color: #e2e8f0; min-height: 100vh; font-family: var(--font-body); -webkit-font-smoothing: antialiased; }
  button { outline: none; }
  input { outline: none; }
  select { outline: none; }
`;

const PAISES = [
  "Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Cuba", "Ecuador", "El Salvador",
  "España", "Estados Unidos", "Guatemala", "Honduras", "México", "Nicaragua", "Panamá",
  "Paraguay", "Perú", "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela", "Otro",
];

const FLAGS: Record<string, string> = {
  Argentina: "🇦🇷", Bolivia: "🇧🇴", Chile: "🇨🇱", Colombia: "🇨🇴", "Costa Rica": "🇨🇷",
  Cuba: "🇨🇺", Ecuador: "🇪🇨", "El Salvador": "🇸🇻", España: "🇪🇸", "Estados Unidos": "🇺🇸",
  Guatemala: "🇬🇹", Honduras: "🇭🇳", México: "🇲🇽", Nicaragua: "🇳🇮", Panamá: "🇵🇦",
  Paraguay: "🇵🇾", Perú: "🇵🇪", "Puerto Rico": "🇵🇷", "República Dominicana": "🇩🇴",
  Uruguay: "🇺🇾", Venezuela: "🇻🇪",
};

function getCategoriaColor(score: number): string {
  if (score <= 40) return "#64748b";
  if (score <= 56) return "#22d3ee";
  if (score <= 68) return "#4ade80";
  if (score <= 81) return "#f97316";
  return "#ef4444";
}

function getCategoriaEmoji(score: number): string {
  if (score <= 40) return "🥶";
  if (score <= 56) return "👀";
  if (score <= 68) return "⚽";
  if (score <= 81) return "🔥";
  return "🌋";
}

export default function GrupoPage() {
  const params = useParams();
  const router = useRouter();
  const grupoId = params.id as string;

  const [nombre, setNombre] = useState("");
  const [pais, setPais] = useState("");
  const [grupo, setGrupo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/grupos/${grupoId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setNotFound(true);
        else setGrupo(data);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [grupoId]);

  const jugar = () => {
    const n = nombre.trim();
    if (!n) return;
    const q = new URLSearchParams({ grupo: grupoId, jugador: n });
    if (pais) q.set("pais", pais);
    router.push(`/?${q.toString()}`);
  };

  return (
    <>
      <style>{FONTS}</style>
      <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>

        {/* Background glow */}
        <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: 400, height: 400, background: "radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 440, width: "100%", position: "relative", zIndex: 1 }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 10vw, 56px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #ffffff 0%, #f97316 50%, #ef4444 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 8 }}>
              ¿QUÉ TAN<br />FANÁTICO ERES?
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              RANKING DE GRUPO
            </div>
          </div>

          {loading && (
            <p style={{ textAlign: "center", fontFamily: "var(--font-body)", color: "#475569" }}>Cargando...</p>
          )}

          {notFound && (
            <div style={{ textAlign: "center", padding: 24, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 16 }}>
              <p style={{ fontFamily: "var(--font-body)", color: "#f87171", marginBottom: 12 }}>Este grupo no existe o el link es incorrecto.</p>
              <a href="/" style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#f97316" }}>Jugar igual →</a>
            </div>
          )}

          {grupo && (
            <>
              {/* Desafío */}
              <div style={{ textAlign: "center", padding: "20px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, marginBottom: 20 }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.01em", marginBottom: 6 }}>
                  {grupo.creator_name} te desafió{grupo.nombre_grupo ? ` en "${grupo.nombre_grupo}"` : ""}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#64748b" }}>
                  ¿Quién es el más fanático del grupo?
                </p>
              </div>

              {/* Leaderboard actual */}
              {grupo.scores.length > 0 && (
                <div style={{ padding: "20px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, marginBottom: 20 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#94a3b8", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>
                    RANKING DE FANATISMO — {grupo.scores.length} jugador{grupo.scores.length !== 1 ? "es" : ""}
                  </div>
                  {grupo.scores.map((s: any, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < grupo.scores.length - 1 ? 10 : 0 }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: i === 0 ? "#f97316" : "#475569", width: 20, textAlign: "center", flexShrink: 0 }}>
                        {i === 0 ? "🥇" : `#${i + 1}`}
                      </div>
                      <div style={{ flex: 1, fontFamily: "var(--font-body)", fontSize: 14, color: "#e2e8f0" }}>
                        {s.pais && FLAGS[s.pais] ? `${FLAGS[s.pais]} ` : ""}{s.player_name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, width: 60, flexShrink: 0 }}>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: getCategoriaColor(s.score) }}>{s.score}</span>
                        <span style={{ fontSize: 14 }}>{getCategoriaEmoji(s.score)}</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#94a3b8", textAlign: "right", flexShrink: 0, width: 110, whiteSpace: "nowrap" }}>
                        {s.perfil.replace(/-/g, " ").toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Nombre + país + jugar */}
              <div style={{ padding: "20px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20 }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#94a3b8", marginBottom: 12, textAlign: "center" }}>
                  ¿Cómo te llamas?
                </p>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && jugar()}
                  placeholder="Tu nombre"
                  maxLength={30}
                  style={{
                    width: "100%", padding: "14px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                    fontFamily: "var(--font-body)", fontSize: 16, color: "#f1f5f9",
                    marginBottom: 10,
                  }}
                />
                <select
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                  style={{
                    width: "100%", padding: "14px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                    fontFamily: "var(--font-body)", fontSize: 16, color: pais ? "#f1f5f9" : "#64748b",
                    marginBottom: 12,
                  }}
                >
                  <option value="">Tu país (opcional)</option>
                  {PAISES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <button
                  onClick={jugar}
                  disabled={!nombre.trim()}
                  style={{
                    width: "100%", padding: "16px", borderRadius: 12, border: "none", cursor: nombre.trim() ? "pointer" : "not-allowed",
                    background: nombre.trim() ? "linear-gradient(135deg, #f97316 0%, #ef4444 100%)" : "rgba(255,255,255,0.05)",
                    fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: nombre.trim() ? "#fff" : "#475569",
                    letterSpacing: "0.04em", transition: "all 0.15s ease",
                  }}
                >
                  JUGAR
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
