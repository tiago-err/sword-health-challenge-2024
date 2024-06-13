FROM node:20.10.0 as base

WORKDIR /app

COPY package.json yarn.lock ./

RUN rm -rf node_modules && yarn install --frozen-lockfile && yarn cache clean

COPY . .
RUN npx prisma generate
RUN yarn build

EXPOSE 3000

CMD [ "yarn", "start" ]