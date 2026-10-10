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
          background: "#17332A",
        }}
      >
        <svg width="360" height="360" viewBox="0 0 48 48">
          <path
            d="M17 7c0 2.2-2 2.2-2 4.4s2 2.2 2 4.4"
            fill="none"
            stroke="#EFD7C6"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <path
            d="M24 6c0 2.2-2 2.2-2 4.4s2 2.2 2 4.4"
            fill="none"
            stroke="#EFD7C6"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <path
            d="M31 7c0 2.2-2 2.2-2 4.4s2 2.2 2 4.4"
            fill="none"
            stroke="#EFD7C6"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <rect x="4.5" y="21.5" width="9" height="6" rx="3" fill="#C7861A" />
          <rect x="34.5" y="21.5" width="9" height="6" rx="3" fill="#C7861A" />
          <path
            d="M9 20.5h30l-2.4 17.7A4.2 4.2 0 0 1 32.4 42H15.6a4.2 4.2 0 0 1-4.2-3.8L9 20.5z"
            fill="#F2B23E"
          />
          <rect x="6" y="15" width="36" height="6" rx="3" fill="#F7C96B" />
          <rect x="21" y="10.5" width="6" height="5.5" rx="2.75" fill="#F7C96B" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
