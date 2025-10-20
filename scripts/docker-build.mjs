import { build as viteBuild } from 'vite';
import esbuild from 'esbuild';

async function run() {
  console.log('[build] Running Vite build (client)...');
  await viteBuild();

  console.log('[build] Bundling server with esbuild...');
  await esbuild.build({
    entryPoints: ['server/index.ts'],
    platform: 'node',
    packages: 'external',
    bundle: true,
    format: 'esm',
    outdir: 'dist',
  });

  console.log('[build] Build completed successfully.');
}

run().catch((err) => {
  console.error('[build] Build failed:', err);
  process.exit(1);
});





