FROM node:14.18.3-alpine3.14

WORKDIR /app

RUN apk add --update \
  git \
  openssh-client \
&& rm -rf /var/cache/apk/*

COPY ./package*.json ./
RUN yarn

COPY . .
RUN mkdir climate-nft-common 
COPY ./climate-nft-common/* ./climate-nft-common/.

CMD ["yarn", "start"]