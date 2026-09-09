import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1E2A1F",
          color: "#F7F3EC",
          fontSize: 300,
          fontWeight: 700,
        }}
      >
        R
      </div>
    ),
    { ...size },
  );
}
