FROM node:14.18.3-alpine3.14

WORKDIR /app

RUN apk add --update \
  git \
  openssh-client \
&& rm -rf /var/cache/apk/*

COPY ./package*.json ./
RUN yarn
RUN mkdir -p ./node_modules
RUN mkdir -p ./src/public
RUN mkdir -p ./contracts
RUN mkdir -p ./databases
COPY ./dist/ ./dist/
COPY ./node_modules/ ./node_modules/
COPY ./contracts/ ./contracts/
COPY ./tsconfig.json ./tsconfig.json
COPY ./src/public/api.yaml ./src/public/api.yaml

CMD ["yarn", "start"]