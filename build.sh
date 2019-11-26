#!/usr/bin/env bash

rm dist/*
cp -u *.{js,json,html} dist/
echo 'Compiling and minifying JS'
npx babel index.js | \
    npx browserify - | \
    npx terser -c -m --toplevel --comments /Copyright/ \
    > dist/index.js
