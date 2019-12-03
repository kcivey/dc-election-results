#!/usr/bin/env bash

rm dist/*
cp -u *.{js,json,html} dist/
echo 'Compiling and minifying JS'
npx browserify -t babelify index.js | \
    npx terser -c -m --toplevel --comments /Copyright/ \
    > dist/index.js
