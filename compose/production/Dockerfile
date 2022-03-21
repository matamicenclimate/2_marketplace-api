FROM node:14.18.3-alpine3.14

WORKDIR /app

RUN apk add --update \
  git \
  openssh-client \
&& rm -rf /var/cache/apk/*
RUN git submodule add -f git@github.com:Dekalabs/climate-nft-common.git

COPY ./package*.json ./
RUN yarn

COPY . .

CMD ["yarn", "start"]