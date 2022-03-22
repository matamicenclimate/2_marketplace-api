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
RUN mkdir -p climate-nft-common/src
COPY ./climate-nft-common/* ./climate-nft-common/
RUN rm ./climate-nft-common/services
COPY ./climate-nft-common/src/* ./climate-nft-common/src
RUN ls -la ./climate-nft-common

CMD ["yarn", "start"]