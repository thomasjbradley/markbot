#!/usr/bin/env sh

openssl req -config ./scripts/localhost.conf -new -x509 -sha256 -newkey rsa:2048 -nodes -keyout ./app/https-key.pem -days 1460 -subj "/C=CA/ST=Ontario/L=Ottawa/O=Markbot/OU=Markbot/CN=Markbot" -out ./app/https-cert.pem
