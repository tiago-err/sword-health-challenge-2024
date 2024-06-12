FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./

RUN yarn install --frozen-lockfile

COPY schema.prisma ./

RUN npx prisma generate
RUN yarn build

FROM node:18-alpine

WORKDIR /app
COPY --from=builder . .
EXPOSE 3000

CMD [ "yarn", "start" ]
