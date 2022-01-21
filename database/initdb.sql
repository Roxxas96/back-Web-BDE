CREATE TABLE IF NOT EXISTS "Users" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) DEFAULT '',
    surname VARCHAR(50) DEFAULT '',
    pseudo VARCHAR(50) DEFAULT 'Anonym user',
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL CHECK (char_length(password) > 7),
    privilege INTEGER DEFAULT 0 CHECK (privilege = 0 OR privilege = 1 OR privilege = 2),
    wallet INTEGER DEFAULT 0
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
);

CREATE TABLE If NOT EXISTS "Accomplishments" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "challengeId" INTEGER NOT NULL,
    proof TEXT DEFAULT '',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validation INTEGER CHECK (validation = 1 OR validation = -1),
    CONSTRAINT "accomplishmentCreator" FOREIGN KEY ("userId") REFERENCES "Users" ("id"),
    CONSTRAINT "accomplishmentChallenge" FOREIGN KEY ("challengeId") REFERENCES "Challenges" ("id")
);

CREATE TABLE IF NOT EXISTS "Goodies" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) DEFAULT 'Unnamed goodies',
    description TEXT DEFAULT '',
    image TEXT DEFAULT '',
    price INTEGER DEFAULT 0 CHECK (price >= 0),
    "buyLimit" INTEGER DEFAULT 1 CHECK ("buyLimit" >= 0),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "creatorId" INTEGER NOT NULL,
    CONSTRAINT "goodiesCreator" FOREIGN KEY ("creatorId") REFERENCES "Users" ("id")
);

CREATE TABLE IF NOT EXISTS "Purchases" (
    id SERIAL PRIMARY KEY,
    "goodiesId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "Users" (pseudo, email, password, privilege) VALUES (
    'Admin user',
    'admin@umontpellier.fr',
    '$2b$10$HtOLm9x.vZEPe672Kan3pueDmH5LaBpPV2kOiEWtE4xdA3pRfNP/e',
    2
);

CREATE OR REPLACE FUNCTION on_validation_update()
  RETURNS TRIGGER 
  LANGUAGE PLPGSQL
  AS
$$
DECLARE
	gain INTEGER;
BEGIN
    IF OLD.validation = 1 OR OLD.validation = -1 THEN
        RAISE EXCEPTION 'Accomplishment has allready a validation state';
    END IF;
	IF NEW.validation = 1 THEN
        SELECT reward INTO gain FROM "Challenges" WHERE id = NEW."challengeId";

		UPDATE "Users" SET wallet = wallet + gain WHERE id = NEW."userId";
	END IF;

	RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER increase_wallet
    BEFORE UPDATE
    ON "Accomplishments"
    FOR EACH ROW
    EXECUTE PROCEDURE on_validation_update();

CREATE OR REPLACE FUNCTION on_purchase()
  RETURNS TRIGGER 
  LANGUAGE PLPGSQL
  AS
$$
DECLARE
	cost INTEGER;
    bank INTEGER;
    bought_count INTEGER;
    bought_limit INTEGER;
BEGIN
    SELECT price, "buyLimit" INTO cost, bought_limit FROM "Goodies" WHERE id = NEW."goodiesId";
    SELECT wallet INTO bank FROM "Users" WHERE id = NEW."userId";
    SELECT count(id) INTO bought_count FROM "Purchases" WHERE "userId" = NEW."userId";

    IF bought_count >= bought_limit THEN
        RAISE EXCEPTION 'Limit reached';
    END IF;

    IF cost > bank THEN
        RAISE EXCEPTION 'Not enought money in wallet';
    END IF;

    UPDATE "Users" SET wallet = wallet - cost WHERE id = NEW."userId";

	RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER increase_wallet
    BEFORE INSERT
    ON "Purchases"
    FOR EACH ROW
    EXECUTE PROCEDURE on_purchase();