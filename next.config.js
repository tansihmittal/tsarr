/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    // Enables the styled-components SWC transform
    styledComponents: true,
  },
  webpack: (config, { isServer }) => {
    // Handle WASM files for ONNX Runtime
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Fallback for node modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };

      // Ignore onnxruntime-node (server-only)
      config.resolve.alias = {
        ...config.resolve.alias,
        "onnxruntime-node": false,
        "sharp": false,
      };
    }

    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    return config;
  },
  // Headers for WASM and cross-origin resources
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
