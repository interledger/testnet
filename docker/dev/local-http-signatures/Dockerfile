FROM node:lts-slim as builder

WORKDIR /workspace

RUN apt update
RUN apt install -y curl xz-utils python3 build-essential

# version in curl is not the version used. Dependent on the last command
RUN corepack enable
RUN corepack prepare pnpm@8.7.1 --activate

# pnpm fetch does require only lockfile
COPY pnpm-lock.yaml ./
RUN pnpm fetch

ADD . ./
RUN pnpm install -r --offline

CMD ["node", "./docker/dev/local-http-signatures/app.js"]
