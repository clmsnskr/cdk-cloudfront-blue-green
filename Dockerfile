FROM node:16-buster as build

# these shouldn't really be needed, not sure why they are...
RUN npm i -g aws-cdk
RUN npm i -g ts-node
RUN npm i -g typescript
RUN npm i -g zx

WORKDIR /src/

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

ENV AWS_ACCESS_KEY_ID=
ENV AWS_SECRET_ACCESS_KEY=
ENV AWS_ACCOUNT=
ENV AWS_REGION=us-east-1

COPY . .

RUN npm run build

RUN npm run test

CMD zx deploy.mjs
#CMD zx destroy.mjs
