import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

function versionManifestPlugin(buildId: string): Plugin {
  const payload = JSON.stringify({ buildId });
  return {
    name: 'version-manifest',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: payload });
    },
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(payload);
      });
    },
  };
}

const buildId = process.env.GITHUB_SHA?.slice(0, 12) ?? String(Date.now());

export default defineConfig({
  base: './',
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [react(), versionManifestPlugin(buildId)],
});
