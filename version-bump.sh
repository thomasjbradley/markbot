#!/usr/bin/env sh

sed -i '' "s/\"version\": \"[0-9]*.[0-9]*.[0-9]*\"/\"version\": \"$1\"/g" package.json
sed -i '' "s/--app-version=[0-9]*.[0-9]*.[0-9]*/--app-version=$1/g" package.json
