import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import visualizer from 'rollup-plugin-visualizer';

// used file extensions
const extensions = ['.js', '.ts'];

export default {
    input: 'src/index.ts',

    output: {
        file: 'dist/bundle.min.js',
        name: 'RxjsQueuePrototype',
        format: 'iife',
        sourcemap: true,
    },

    // do not clear the console when watching for changes
    watch: { clearScreen: false },

    plugins: [
        visualizer({ filename: 'dist/stats.html' }),
        nodeResolve({ extensions }),
        typescript(),
        commonjs({ extensions }),
    ],
};
