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
    logoSrc ? (
      /* biome-ignore lint/performance/noImgElement: ImageResponse requires standard img tag */
      <img
        src={logoSrc}
        alt="Open TA Logo"
        width={size.width}
        height={size.height}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    ) : (
      // Fallback if logo fails to load
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
          fontWeight: 700,
          color: "#1a1a1a",
        }}
      >
        Open TA
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported opengraph-image
      // size config to also set the ImageResponse's width and height.
      ...size,
    },
  );
}
