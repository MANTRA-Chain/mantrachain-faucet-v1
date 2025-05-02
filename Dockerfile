FROM node:23-alpine AS builder

RUN apk add --no-cache --update --upgrade dumb-init

# Use the node user from the image (instead of the root user)
USER node

# Create app directory
WORKDIR /app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY --chown=node:node package.json .
COPY --chown=node:node yarn.lock .

# Install app dependencies using the `npm ci` command instead of `npm install`
RUN yarn --frozen-lockfile

# Bundle app source
COPY --chown=node:node . .

FROM node:23-alpine

# Use the node user from the image (instead of the root user)
USER node

# Set the NODE_ENV environment variable to production
ENV NODE_ENV=production
# Set the PATH environment variable to include the local node_modules/.bin directory
ENV PATH=/app/node_modules/.bin:$PATH
# Set the LANG environment variable to the desired locale
ENV LANG=en_UK.UTF-8
# Set the LC_ALL environment variable to the desired locale
ENV LC_ALL=en_UK.UTF-8
# Set the LANGUAGE environment variable to the desired locale
ENV LANGUAGE=en_UK.UTF-8

# Create app directory
WORKDIR /app

# Copy the bundled code from the build stage to the production image
COPY --from=builder /usr/bin/dumb-init /usr/bin/dumb-init
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
COPY --from=builder /app/src .

USER node

# Start the server using the production build
ENTRYPOINT [ "dumb-init", "node", "--experimental-modules", "--es-module-specifier-resolution=node", "index.js" ]