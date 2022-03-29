FROM node:14.18.3-alpine3.14

WORKDIR /app

RUN apk add --update \
  git \
  openssh-client \
&& rm -rf /var/cache/apk/*

COPY ./package*.json ./
RUN yarn

RUN mkdir -p ./dist/node_modules
RUN mkdir -p ./src/public
RUN mkdir -p ./dist/contracts
COPY ./dist/ ./dist/
COPY ./node_modules/ .
COPY ./contracts/ ./dist/contracts/
COPY ./tsconfig.json ./tsconfig.json
COPY ./src/public/api.yaml ./src/public/api.yaml

CMD ["yarn", "start"]