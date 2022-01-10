CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    surname VARCHAR(50),
    pseudo VARCHAR(50),
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    isadmin BOOLEAN NOT NULL DEFAULT false
)

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL,
    jwt VARCHAR(255) NOT NULL,
    CONSTRAINT usersession FOREIGN KEY ("userid") REFERENCES users ("id")
)