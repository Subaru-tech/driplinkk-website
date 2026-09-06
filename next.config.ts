import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Suppress the "X-Powered-By: Next.js" header — no reason to advertise the
     framework to scanners. */
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          /* Clickjacking protection — prevent the site from being embedded in
             iframes on other domains. */
          { key: "X-Frame-Options", value: "DENY" },
          /* Stops browsers from MIME-sniffing a response away from the declared
             Content-Type, which can prevent drive-by downloads. */
          { key: "X-Content-Type-Options", value: "nosniff" },
          /* Send the full URL as the Referer only for same-origin requests;
             only the origin for cross-origin. */
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          /* Disable browser features the app never uses. */
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
