#!/usr/bin/env node

import esbuild from 'esbuild';

Promise.all([
    esbuild.build({
        entryPoints: ['source/Legacy.ts'],
        bundle: true,
        target: 'es6',
        format: 'iife',
        outfile: 'dist/squire-raw.js',
    }),
    esbuild.build({
        entryPoints: ['source/Legacy.ts'],
        bundle: true,
        minify: true,
        sourcemap: 'linked',
        target: 'es6',
        format: 'iife',
        outfile: 'dist/squire.js',
    }),
    esbuild.build({
        entryPoints: ['source/Squire.ts'],
        bundle: true,
        target: 'esnext',
        format: 'esm',
        outfile: 'dist/squire-raw.mjs',
    }),
    esbuild.build({
        entryPoints: ['source/Squire.ts'],
        bundle: true,
        minify: true,
        sourcemap: 'linked',
        target: 'esnext',
        format: 'esm',
        outfile: 'dist/squire.mjs',
    }),
]).catch(() => process.exit(1));
