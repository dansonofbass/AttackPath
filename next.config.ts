import type { NextConfig } from "next";

const config: NextConfig = {
  async headers() {
    return [
      {
        source: "/logo.png",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default config;
