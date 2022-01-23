# back-Web-BDE

Back-end rest API made for student council (BDE in french).

### Features

- Secure authentication & administration system with student email
- Handling of challenge creation & accomplishment for integration purpuse
- Online market to buy goodies with fake money earned by doing challenges

This project was bootstrapped with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli).

## Requirements

- node
- docker & docker-compose

## Install

### Available Scripts

In the project directory, you can run:

#### `npm run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

#### `npm start`

For production mode

#### `npm run prisma`

To build the ORM types needed in the project

### Environment

You need to setup few environment variables to setup your project :

- DATABASE_URI: URI to connect to DB, hint postgresql URI are formated like this : "postgresql://[user]:[password]@[host]/[database]"
- JWT_TOKEN: JWT secret key to cipher user id, if none provided the key will be "secrettoken"
- JWT_EXPIRATION: Expiration time for a user session, see [JWT doc](https://www.npmjs.com/package/jsonwebtoken) for formats, if none provided it will be "30d"
- EMAIL_REGEX: Regex that matches your particular student email, for example : "^[\w\-\.]+@([\w\-]+.)*umontpellier\.fr$" matches emails with umontpellier.fr domain, if none provided regex will match a classic email

### Postgresql database

### `docker-compose up -d`

In the /database directory will start the database accessible from "postgresql://webbde:webbde@localhost:5432/webbde?schema=public" by default

## Usage

### Structure of the database

The database is divided into 4 main tables (+ 2 relational tables)

- User : Made for user storage
- Session: Made to store connection sessions of all users
- Goodies : Made to store all registered goodies in the shop
- Challenge : Made to store all registered challenges

### Structure of routes

There are 6 routes in this API :

- /user : User related tasks
- /session : Connection session related tasks
- /challenge : Challenge related tasks
- /accomplishment : Related to accomplishment of challenge made by users
- /goodies : Goodies related tasks
- /purchase : Related to purchase of some goodies made by users

### Swagger documentation

To test routes and learn about all methods used by all routes, please visit the swagger documentation at /doc

## Learn More

To learn Fastify, check out the [Fastify documentation](https://www.fastify.io/docs/latest/).
