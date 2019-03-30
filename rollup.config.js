import babel from 'rollup-plugin-babel';
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from 'rollup-plugin-commonjs';
import { uglify } from 'rollup-plugin-uglify';

const isDev = process.env.BUILD !== 'production';
const plugins = [
    nodeResolve(),
    commonjs({
      include: "node_modules/**"
    }),
    babel({
        exclude: 'node_modules/**',
        runtimeHelpers: true
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