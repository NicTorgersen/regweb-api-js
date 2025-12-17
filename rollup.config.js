import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default [
    // ES Module build
    {
        input: 'src/index.ts',
        external: ['axios'],
        output: {
            file: pkg.module,
            format: 'es',
            sourcemap: true,
        },
        plugins: [
            resolve(),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.json',
                declaration: true,
                declarationDir: 'dist',
                rootDir: 'src',
            }),
        ],
    },
    // CommonJS build
    {
        input: 'src/index.ts',
        external: ['axios'],
        output: {
            file: pkg.main,
            format: 'cjs',
            sourcemap: true,
            exports: 'named',
        },
        plugins: [
            resolve(),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.json',
                declaration: false,
            }),
        ],
    },
];
