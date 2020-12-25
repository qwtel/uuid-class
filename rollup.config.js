import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default [
  {
    input: 'index.js',
    output: {
      file: `module/index.js`,
      format: 'es',
      sourcemap: true
    },
    plugins: [resolve(), terser()],
  }
];
