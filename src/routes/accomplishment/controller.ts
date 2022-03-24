import { Accomplishment, Validation } from "@prisma/client";
import { FastifyInstance } from "fastify";
import internal = require("stream");
import { ChallengeInfoMinimal } from "../../models/ChallengeInfo";
import { UserInfoMinimal } from "../../models/UserInfo";
import { generateRandomKey } from "../../utils/crypto";

//Get an accomplishment by Id
export async function getAccomplishment(
  fastify: FastifyInstance,
  accomplishmentId: number
) {
  //Check for accomplishmentId
  if (!accomplishmentId) {
    throw fastify.httpErrors.badRequest("Invalid accomplishment id");
  }

  const accomplishment = await fastify.prisma.accomplishment.getAccomplishment(
    accomplishmentId
  );

  const user = accomplishment.userId
    ? await fastify.prisma.user.getUser(accomplishment.userId)
    : undefined;

  const challenge = accomplishment.challengeId
    ? await fastify.prisma.challenge.getChallenge(accomplishment.challengeId)
    : undefined;

  return {
    ...accomplishment,
    user: user
      ? ({ id: user.id, pseudo: user.pseudo } as UserInfoMinimal)
      : undefined,
    challenge: challenge
      ? ({
          id: challenge.id,
          name: challenge.name,
          reward: challenge.reward,
        } as ChallengeInfoMinimal)
      : undefined,
    userId: user ? undefined : accomplishment.userId,
    challengeId: challenge ? undefined : accomplishment.challengeId,
  };
}

//Get accomplishments, if admin (ie. no userId provided) return all accomplishments in DB, if basic user (ie. userId provided) only return the related ones
export async function getManyAccomplishment(
  fastify: FastifyInstance,
  userId?: number,
  challengeId?: number,
  validation?: Validation,
  limit?: number,
  offset?: number
) {
  const accomplishments =
    await fastify.prisma.accomplishment.getManyAccomplishment(
      limit || 20,
      offset,
      userId,
      validation,
      challengeId
    );

  return await Promise.all(
    accomplishments.map(async (accomplishment) => {
      const user = accomplishment.userId
        ? await fastify.prisma.user.getUser(accomplishment.userId)
        : undefined;

      const challenge = accomplishment.challengeId
        ? await fastify.prisma.challenge.getChallenge(
            accomplishment.challengeId
          )
        : undefined;

      return {
        ...accomplishment,
        user: user
          ? ({ id: user.id, pseudo: user.pseudo } as UserInfoMinimal)
          : undefined,
        challenge: challenge
          ? ({
              id: challenge.id,
              name: challenge.name,
              reward: challenge.reward,
            } as ChallengeInfoMinimal)
          : undefined,
        userId: user ? undefined : accomplishment.userId,
        challengeId: challenge ? undefined : accomplishment.challengeId,
      };
    })
  );
}

//Create an accomplishment for the current user
export async function createAccomplishment(
  fastify: FastifyInstance,
  userId: number,
  challengeId: number,
  comment?: string
) {
  //Check for userId
  if (!userId) {
    throw fastify.httpErrors.badRequest("Invalid user id");
  }

  //Check for challengeId
  if (!challengeId) {
    throw fastify.httpErrors.badRequest("Invalid challenge id");
  }

  const challenge = await fastify.prisma.challenge.getChallenge(challengeId);

  if (!challenge) {
    throw fastify.httpErrors.badRequest("Referenced challenge not found");
  }

  const user = await fastify.prisma.user.getUser(userId);

  if (!user) {
    throw fastify.httpErrors.badRequest("Referenced user not found");
  }

  const ownedAccomplishments =
    await fastify.prisma.accomplishment.getManyAccomplishment(
      undefined,
      undefined,
      user.id,
      undefined,
      challenge.id
    );

  if (
    ownedAccomplishments.filter((accomplishment) => {
      return accomplishment.validation !== "REFUSED";
    }).length
  ) {
    throw fastify.httpErrors.badRequest(
      "You already have a Pending or an Accepted accomplishment"
    );
  }

  const tries = ownedAccomplishments.filter((accomplishment) => {
    return accomplishment.validation === "REFUSED";
  }).length;

  if (tries >= challenge.maxAtempts) {
    throw fastify.httpErrors.badRequest(
      "You have failed to many times to accomplish this challenge"
    );
  }

  return await fastify.prisma.accomplishment.createAccomplishment(
    user.id,
    challenge.id,
    comment
  );
}

/*Update the provided accomplishment, the reason why we need to fetch the accomplishment before updating
  is beacause we need to check if the accomplishment has a validation state. We do not allow admin to modify validated accomplishments*/
export async function updateAccomplishment(
  fastify: FastifyInstance,
  accomplishment: Accomplishment,
  comment?: string,
  validation?: Validation,
  refusedComment?: string
) {
  //Check for accomplishmendId
  if (!accomplishment.id) {
    throw fastify.httpErrors.badRequest("Invalid accomplishment id");
  }

  if (validation && comment) {
    throw fastify.httpErrors.badRequest(
      "Can't modify both info and validation state at the same time"
    );
  }

  //Check if accomplishment has a validation state
  if (accomplishment.validation !== "PENDING") {
    throw fastify.httpErrors.badRequest(
      "Can't modify a validated accomplishment"
    );
  }
  //For validation update we need to check for wallet update
  //If accomplishment is referencing existing user & challenge then increase user wallet by reward
  if (
    validation === "ACCEPTED" &&
    accomplishment.userId &&
    accomplishment.challengeId
  ) {
    const user = await fastify.prisma.user.getUser(accomplishment.userId);
    const challenge = await fastify.prisma.challenge.getChallenge(
      accomplishment.challengeId
    );

    //Increase user wallet
    if (user && challenge) {
      await fastify.prisma.user.updateUser(user.id, {
        wallet: user.wallet + challenge.reward,
        totalEarnedPoints: user.totalEarnedPoints + challenge.reward,
      });
    }
  }

  return await fastify.prisma.accomplishment.updateAccomplishment(
    accomplishment.id,
    comment,
    validation,
    refusedComment
  );
}

//Delete the provided accomplishment, if it has no validation state
export async function deleteAccomplishment(
  fastify: FastifyInstance,
  accomplishmentId: number,
  accomplishmentValidation: Validation
) {
  //Chack for accomplishmentId
  if (!accomplishmentId) {
    throw fastify.httpErrors.badRequest("Invalid accomplishment id");
  }

  //Check if it has a validation state
  if (accomplishmentValidation !== "PENDING") {
    throw fastify.httpErrors.badRequest(
      "Can't modify a validated accomplishment"
    );
  }

  return await fastify.prisma.accomplishment.deleteAccomplishment(
    accomplishmentId
  );
}

export async function updateProof(
  fastify: FastifyInstance,
  proof: internal.Readable,
  accomplishmentId: number,
  accomplishmentProofId: string
) {
  if (!accomplishmentId) {
    throw fastify.httpErrors.badRequest("Invalid accomplishment");
  }

  if (!proof) {
    throw fastify.httpErrors.badRequest("Invalid proof");
  }

  const proofId =
    accomplishmentProofId !== ""
      ? accomplishmentProofId
      : await generateRandomKey(48);

  if (proofId !== accomplishmentProofId) {
    await fastify.prisma.accomplishment.updateAccomplishment(
      accomplishmentId,
      undefined,
      undefined,
      undefined,
      proofId
    );
  }

  await fastify.minio.proof.putProof(proof, proofId);

  return proofId;
}

export async function getProof(fastify: FastifyInstance, proofId: string) {
  if (!proofId) {
    throw fastify.httpErrors.badRequest("Invalid accomplishment");
  }

  return await fastify.minio.proof.getProof(proofId);
}

export async function deleteProof(
  fastify: FastifyInstance,
  accomplishmentId: number
) {
  if (!accomplishmentId) {
    throw fastify.httpErrors.badRequest("Invalid accomplishment");
  }

  const accomplishment = await fastify.prisma.accomplishment.getAccomplishment(
    accomplishmentId
  );

  await fastify.minio.proof.getProof(accomplishment.proofId);

  return await fastify.minio.proof.deleteProof(accomplishment.proofId);
}
