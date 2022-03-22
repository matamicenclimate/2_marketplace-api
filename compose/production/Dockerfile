FROM node:14.18.3-alpine3.14

WORKDIR /app

RUN apk add --update \
  git \
  openssh-client \
&& rm -rf /var/cache/apk/*

COPY ./package*.json ./
RUN yarn

COPY . .
RUN rm -rf climate-nft-common
RUN mkdir climate-nft-common
COPY ./climate-nft-common/* ./climate-nft-common/
RUN ls -la
RUN ls -la /app
RUN ls -la ./climate-nft-common

CMD ["yarn", "start"]