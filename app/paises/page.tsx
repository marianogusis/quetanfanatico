"use client";
import { useState, useEffect } from "react";

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
`;

// Nombre completo del país en español a partir del código ISO de 2 letras
// (columna scores.pais, geo-IP de Vercel). Intl.DisplayNames cubre cualquier
// país del mundo sin necesitar una lista hardcodeada como en /grupo.
function nombrePais(codigo: string): string {
  try {
    const nombres = new Intl.DisplayNames(["es"], { type: "region" });
    return nombres.of(codigo.toUpperCase()) || codigo;
  } catch {
    return codigo;
  }
}

function BanderaPais({ codigo }: { codigo: string }) {
  return (
    <img
      src={`https://flagcdn.com/24x18/${codigo.toLowerCase()}.png`}
      alt={codigo}
      width={20}
      height={15}
      style={{ borderRadius: 2, marginRight: 10, flexShrink: 0, verticalAlign: "middle" }}
    />
  );
}

function colorFanatismo(promedio: number): string {
  if (promedio <= 40) return "#64748b";
  if (promedio <= 56) return "#22d3ee";
  if (promedio <= 68) return "#4ade80";
  if (promedio <= 81) return "#f97316";
  return "#ef4444";
}

export default function PaisesPage() {
  const [datos, setDatos] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const espera = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const cargar = async () => {
      for (let intento = 0; intento < 3; intento++) {
        if (cancelado) return;
        if (intento > 0) await espera(500);
        try {
          const r = await fetch("/api/paises");
          const data = await r.json();
          if (cancelado) return;
          if (r.ok && !data.error) {
            setDatos(data);
            setLoading(false);
            return;
          }
        } catch {
          // seguimos al próximo intento
        }
      }
      if (!cancelado) {
        setError(true);
        setLoading(false);
      }
    };

    cargar();
    return () => { cancelado = true; };
  }, []);

  return (
    <>
      <style>{FONTS}</style>
      <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px 60px" }}>

        <div style={{ position: "fixed", top: "10%", left: "50%", transform: "translateX(-50%)", width: 400, height: 400, background: "radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 480, width: "100%", position: "relative", zIndex: 1 }}>

          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 9vw, 48px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #ffffff 0%, #f97316 50%, #ef4444 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 8 }}>
              RANKING DE PAÍSES
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#cbd5e1", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              FANATISMO PROMEDIO
            </div>
          </div>

          <p style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: 13, color: "#94a3b8", marginBottom: 24, lineHeight: 1.5 }}>
            Datos agregados y anónimos de todos los jugadores. Nadie ve resultados individuales acá, solo promedios por país.
          </p>

          {loading && (
            <p style={{ textAlign: "center", fontFamily: "var(--font-body)", color: "#94a3b8" }}>Cargando...</p>
          )}

          {error && (
            <div style={{ textAlign: "center", padding: 24, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 16 }}>
              <p style={{ fontFamily: "var(--font-body)", color: "#f87171", marginBottom: 12 }}>No se pudo cargar el ranking. Intenta de nuevo en un momento.</p>
              <a href="/" style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#f97316" }}>Volver al inicio →</a>
            </div>
          )}

          {datos && (
            <div style={{ padding: "20px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, marginBottom: 16 }}>

              <div style={{ display: "flex", alignItems: "center", fontFamily: "var(--font-mono)", fontSize: 10, color: "#cbd5e1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ flex: 1 }}>PAÍS</div>
                <div style={{ width: 70, textAlign: "center" }}>FANATISMO</div>
                <div style={{ width: 60, textAlign: "right" }}>JUGADORES</div>
              </div>

              {datos.paises.length === 0 ? (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "10px 0" }}>
                  Todavía ningún país llegó a los {datos.minMuestra} jugadores. ¡Compártelo para que tu país aparezca primero!
                </p>
              ) : (
                datos.paises.map((p: any, i: number) => (
                  <div key={p.pais} style={{ display: "flex", alignItems: "center", marginBottom: i < datos.paises.length - 1 ? 12 : 12 }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", fontFamily: "var(--font-body)", fontSize: 14, color: "#e2e8f0" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#64748b", width: 20, flexShrink: 0 }}>{i + 1}</span>
                      <BanderaPais codigo={p.pais} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombrePais(p.pais)}</span>
                    </div>
                    <div style={{ width: 70, textAlign: "center", fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: colorFanatismo(p.promedio) }}>
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
                  {Math.round(datos.total.promedio)}
                </div>
                <div style={{ width: 60, textAlign: "right", fontFamily: "var(--font-body)", fontSize: 12, color: "#94a3b8" }}>
                  {datos.total.cantidad.toLocaleString("es")}
                </div>
              </div>

              <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#64748b", marginTop: 16, lineHeight: 1.5 }}>
                Solo se muestran países con al menos {datos.minMuestra} resultados, para que el promedio sea confiable. El total incluye a todos los jugadores, de cualquier país.
              </p>
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <a href="/" style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#f97316" }}>← Jugar de nuevo</a>
          </div>
        </div>
      </div>
    </>
  );
}
