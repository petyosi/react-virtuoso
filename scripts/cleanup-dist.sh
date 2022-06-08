#!/usr/bin/env sh

# below should be run after the bundling from api-extractor to remove bogus types
find dist \( \( -name '*.d.ts*' ! -name 'index.d.ts' \) -or \( -type d -empty \) \) -delete;
