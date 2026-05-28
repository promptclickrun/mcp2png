import { build } from 'esbuild';

await build({
  entryPoints: ['proof-chat-demo/demo-entry.js'],
  bundle: true,
  format: 'esm',
  outfile: 'proof-chat-demo/demo-bundle.js',
  platform: 'browser',
  sourcemap: true,
});
