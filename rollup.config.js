import babel from 'rollup-plugin-babel';
import { uglify } from 'rollup-plugin-uglify';

const isDev = process.env.BUILD !== 'production';
const plugins = [
    babel({
        exclude: 'node_modules/**'
    })
];

if(!isDev) {
    plugins.push(uglify());
}

export default {
    input: 'src/index.js',
    output: {
        file: 'build/bundle.js',
        format: 'umd',
        name: 'myModule',
        sourcemap: isDev ? true : false
    },
    plugins
};