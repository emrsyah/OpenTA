import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "Open TA Telyu";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image() {
  // In Edge Runtime, fetch the logo and convert to base64 data URI
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  let logoSrc: string | null = null;
  try {
    const logoResponse = await fetch(
      new URL("/favicon/android-chrome-512x512.png", baseUrl).toString(),
    );
    const logoBuffer = await logoResponse.arrayBuffer();
    const logoBase64 = Buffer.from(logoBuffer).toString("base64");
    logoSrc = `data:image/png;base64,${logoBase64}`;
  } catch (error) {
    // Fallback: no logo if fetch fails
    console.error("Failed to fetch logo:", error);
  }
  return new ImageResponse(
    // ImageResponse JSX element
    <div
      style={{
        fontSize: 128,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        position: "relative",
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
          backgroundImage:
            "radial-gradient(circle at 25% 25%, white 2px, transparent 2px), radial-gradient(circle at 75% 75%, white 2px, transparent 2px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: logoSrc ? "32px" : "48px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo - only show if we successfully loaded it */}
        {logoSrc && (
          /* biome-ignore lint/performance/noImgElement: ImageResponse requires standard img tag */
          <img
            src={logoSrc}
            alt="Open TA Logo"
            width={180}
            height={180}
            style={{
              borderRadius: "48px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              background: "white",
              padding: "20px",
            }}
          />
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "white",
              textShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
              textAlign: "center",
            }}
          >
            Open TA Telyu
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: "rgba(255, 255, 255, 0.95)",
              textShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
              textAlign: "center",
              letterSpacing: "0.02em",
            }}
          >
            Telkom University Alumni Research Repository
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "8px",
          background:
            "linear-gradient(90deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
        }}
      />
    </div>,
    // ImageResponse options
    {
      // For convenience, we can re-use the exported opengraph-image
      // size config to also set the ImageResponse's width and height.
      ...size,
    },
  );
}
