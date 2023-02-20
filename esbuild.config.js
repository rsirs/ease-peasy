const isProduction = process.env.NODE_ENV === 'production';
const isNode = process.env.PLATFORM === 'node';

export default {
  entryPoints: ['src/index.js'],
  outfile: 'dist/index.js',
  bundle: true,
  minify: isProduction,
  sourcemap: !isProduction,
  watch: !isProduction,
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  platform: isNode ? 'node': 'browser',
  target: 'es2015',
}
