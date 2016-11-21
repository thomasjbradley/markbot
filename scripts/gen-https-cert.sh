#!/usr/bin/env sh

openssl req -x509 -newkey rsa:4096 -nodes -keyout ./app/https-key.pem -out ./app/https-cert.pem -days 1460 -subj "/C=CA/ST=Ontario/L=Ottawa/O=Markbot/OU=Markbot/CN=localhost"
