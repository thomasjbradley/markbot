#!/usr/bin/env sh

sed -i '' "s/\"version\": \"[0-9]*.[0-9]*.[0-9]*\"/\"version\": \"$1\"/g" package.json builder.json
sed -i '' "s/--app-version=[0-9]*.[0-9]*.[0-9]*/--app-version=$1/g" package.json
sed -i '' "s/--build-version=[0-9]*.[0-9]*.[0-9]*/--build-version=$1/g" package.json

git add package.json
git add builder.json
git commit -m "Bump version to $1"
git tag -f "v$1"
