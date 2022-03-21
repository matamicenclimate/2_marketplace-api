FROM node:14.18.3-alpine3.14

WORKDIR /app

RUN apk add --update \
  git \
  openssh-client \
&& rm -rf /var/cache/apk/*

COPY ./package*.json ./
RUN yarn

COPY . .
RUN git submodule add -f git@github.com:Dekalabs/climate-nft-common.git
COPY ./climate-nft-common /app/climate-nft-common

CMD ["yarn", "start"]