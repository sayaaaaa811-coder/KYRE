import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const size = { width: 64, height: 64 };
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
          background: "#171717",
          color: "#F4F0E9",
          fontSize: 40,
          fontFamily: "serif",
        }}
      >
        {siteConfig.brand.name.charAt(0)}
      </div>
    ),
    size,
  );
}
