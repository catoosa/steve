import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Skawk — AI Voice Agents That Return JSON";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #0D1117 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            top: "80px",
            left: "200px",
            width: "400px",
            height: "400px",
            background: "rgba(232, 93, 4, 0.15)",
            borderRadius: "50%",
            filter: "blur(100px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            right: "200px",
            width: "300px",
            height: "300px",
            background: "rgba(0, 212, 255, 0.1)",
            borderRadius: "50%",
            filter: "blur(80px)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#e85d04",
              letterSpacing: "4px",
              textTransform: "uppercase" as const,
              marginBottom: "24px",
            }}
          >
            SKAWK
          </div>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 900,
              color: "#ffffff",
              textAlign: "center",
              lineHeight: 1.1,
              maxWidth: "900px",
              marginBottom: "20px",
            }}
          >
            One API call.
            <br />
            One phone call.
            <br />
            <span style={{ color: "#e85d04" }}>Structured data back.</span>
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "rgba(255,255,255,0.5)",
              textAlign: "center",
              maxWidth: "700px",
            }}
          >
            Agentic voice orchestration for developers.
            10 to 10,000 simultaneous calls.
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: "48px",
              marginTop: "40px",
            }}
          >
            {[
              { value: "< 300ms", label: "Latency" },
              { value: "10K+", label: "Concurrent" },
              { value: "40+", label: "Languages" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "32px", fontWeight: 900, color: "#00D4FF" }}>
                  {s.value}
                </span>
                <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.35)" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "rgba(255,255,255,0.3)",
            fontSize: "16px",
          }}
        >
          skawk.io
        </div>
      </div>
    ),
    { ...size }
  );
}
