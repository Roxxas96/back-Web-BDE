CREATE TABLE IF NOT EXISTS "Users" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) DEFAULT '',
    surname VARCHAR(50) DEFAULT '',
    pseudo VARCHAR(50) DEFAULT 'Anonym user',
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL CHECK (char_length(password) > 7),
    privilege INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "Sessions" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    jwt VARCHAR(255) NOT NULL UNIQUE,
    CONSTRAINT "userSession" FOREIGN KEY ("userId") REFERENCES "Users" ("id")
);

CREATE TABLE IF NOT EXISTS "Challenges" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) DEFAULT 'Unnamed challenge',
    description TEXT DEFAULT '',
    reward INTEGER DEFAULT 0 CHECK (reward >= 0),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "creatorId" INTEGER NOT NULL,
    CONSTRAINT "challengeCreator" FOREIGN KEY ("creatorId") REFERENCES "Users" ("id")
)

CREATE TABLE If NOT EXISTS "Accomplishments" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "challengeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    proof TEXT DEFAULT '',
    validation INTEGER CHECK (validation = 1 OR validation = -1),
    CONSTRAINT "accomplishmentCreator" FOREIGN KEY ("userId") REFERENCES "Users" ("id"),
    CONSTRAINT "accomplishmentChallenge" FOREIGN KEY ("challengeId") REFERENCES "Challenges" ("id")
)