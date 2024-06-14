# Sword Health - API Developer Practical Exercise

This is my submission for the exercise, where I used Node.js, Express and Prisma to create a simple API for a software to account for maintenance tasks performed during a working day.

## Tech Stack
### API
- TypeScript
- Node.js
- Express
- Prisma
- AMQP
### Testing
- Jest
- Supertest
### Database
- MySQL
### Message Broker
- RabbitMQ

## Deployment
There are 3 different docker-compose files in this repository, one for the database, one for RabbitMQ and another one that starts all three, including the API, which uses a Dockerfile to build on run.

### Deploy just MySQL
```
docker-compose -f db.docker-compose.yml up -d
```

### Deploy just RabbitMQ
```
docker-compose -f mq.docker-compose.yml up -d
```

### Deploy all of the needed services for development
```
docker-compose -f dev.docker-compose.yml up -d
```
