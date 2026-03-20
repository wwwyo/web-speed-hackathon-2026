# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.14.0
ARG PNPM_VERSION=10.32.1

FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

ENV PNPM_HOME=/pnpm

WORKDIR /app
RUN --mount=type=cache,target=/root/.npm npm install -g pnpm@${PNPM_VERSION}

FROM base AS build

COPY ./application/package.json ./application/pnpm-lock.yaml ./application/pnpm-workspace.yaml ./
COPY ./application/client/package.json ./client/package.json
COPY ./application/server/package.json ./server/package.json
RUN --mount=type=cache,target=/pnpm/store pnpm install --frozen-lockfile

COPY ./application .

RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm build

# negaposi-analyzer-ja の辞書を保全（postinstall でダウンロード済み、prod install で消える可能性あり）
RUN cp -f node_modules/.pnpm/negaposi-analyzer-ja@*/node_modules/negaposi-analyzer-ja/dict/pn_ja.dic.json /tmp/pn_ja.dic.json 2>/dev/null || true

RUN --mount=type=cache,target=/pnpm/store CI=true pnpm install --frozen-lockfile --prod --filter @web-speed-hackathon-2026/server

# 辞書が消えていたら復元
RUN DICT_DIR=$(find node_modules/.pnpm -path '*/negaposi-analyzer-ja/dict' -type d 2>/dev/null | head -1) && \
    if [ -n "$DICT_DIR" ] && [ -f /tmp/pn_ja.dic.json ] && [ ! -f "$DICT_DIR/pn_ja.dic.json" ]; then \
      cp /tmp/pn_ja.dic.json "$DICT_DIR/pn_ja.dic.json"; \
    fi

FROM base

COPY --from=build /app /app

EXPOSE 8080
CMD [ "pnpm", "start" ]
