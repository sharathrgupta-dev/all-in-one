import { ImageResponse } from "next/og";

export const alt = "JWT Debugger — Decode, Encode & Verify Tokens | DevBench";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a14 0%, #13132b 60%, #0f0f23 100%)",
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-80px",
            width: "600px",
            height: "400px",
            background: "radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px" }}>
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
            <path d="M7 3.5 L4 6.5 L7 9.5" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12.25" y1="3" x2="10.75" y2="10" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
            <path d="M14.5 3.5 L17.5 6.5 L14.5 9.5" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="2" y="12" width="20" height="2.5" rx="1.25" fill="#6366f1" />
            <rect x="4.5" y="14.5" width="2" height="6.5" rx="1" fill="#6366f1" opacity="0.75" />
            <rect x="17.5" y="14.5" width="2" height="6.5" rx="1" fill="#6366f1" opacity="0.75" />
          </svg>
          <span style={{ fontSize: "72px", fontWeight: 800, color: "#ffffff", letterSpacing: "-2px" }}>
            DevBench
          </span>
        </div>
        <p
          style={{
            fontSize: "28px",
            color: "#a5b4fc",
            margin: "0 0 16px 0",
            fontWeight: 500,
            textAlign: "center",
            maxWidth: "1000px",
            padding: "0 40px",
          }}
        >
          JWT Debugger — Decode, Encode & Verify Tokens
        </p>
        <p style={{ position: "absolute", bottom: "32px", fontSize: "18px", color: "#4b5563" }}>
          devbench.co.in/jwt-debugger
        </p>
      </div>
    ),
    { ...size }
  );
}
