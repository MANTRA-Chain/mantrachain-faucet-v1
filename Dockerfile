# --------------> The build image__
FROM node:20.13.1-bullseye AS build
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init
WORKDIR /usr/src/app
COPY package*.json /usr/src/app/
#RUN --mount=type=secret,mode=0644,id=npmrc,target=/usr/src/app/.npmrc npm ci --only=production
RUN npm ci --only=production --omit=dev
RUN npm i @cosmjs/crypto

# --------------> The production image__
FROM node:20.13.1-bullseye

ENV NODE_ENV production
COPY --from=build /usr/bin/dumb-init /usr/bin/dumb-init
USER node
WORKDIR /usr/src/app
COPY --chown=node:node --from=build /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node --from=build /usr/src/app/package.json /usr/src/app/
COPY --chown=node:node ./src /usr/src/app
ENTRYPOINT [ "dumb-init", "node", "--experimental-modules", "--es-module-specifier-resolution=node", "index.js" ]
