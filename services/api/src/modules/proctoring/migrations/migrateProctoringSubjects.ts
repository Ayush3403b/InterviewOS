import type { Collection } from "mongoose";

import { logger } from "../../../shared/logger/logger";

import { ProctoringSessionModel } from "../models/ProctoringSessionModel";
import { ProctoringEventModel } from "../models/ProctoringEventModel";
import { ProctoredSubjectType } from "../types/proctoring.types";

const LEGACY_INDEX = "interviewSessionId_1";

/**
 * Proctoring sessions used to belong only to interviews, keyed by a
 * unique `interviewSessionId`. They now point at a generic subject
 * (subjectType + subjectId) so MCQ attempts can be proctored too.
 *
 * Runs on every boot (see server.ts) and is a no-op once done:
 *  - backfills subjectType/subjectId on pre-existing session rows
 *  - drops the old `interviewSessionId` indexes. The unique one on
 *    sessions has to go - new rows have no interviewSessionId, so the
 *    second one would collide with the first on null.
 *
 * Old event rows keep their stray interviewSessionId field - nothing
 * reads it, and the 30-day TTL clears them out anyway.
 */
export async function migrateProctoringSubjects(): Promise<void> {
  const { modifiedCount } = await ProctoringSessionModel.collection.updateMany(
    {
      interviewSessionId: { $exists: true },
      subjectId: { $exists: false },
    },
    [
      {
        $set: {
          subjectId: "$interviewSessionId",
          subjectType: ProctoredSubjectType.INTERVIEW,
        },
      },
      { $unset: "interviewSessionId" },
    ]
  );

  if (modifiedCount > 0) {
    logger.info(
      `Migrated ${modifiedCount} proctoring session(s) to subject references.`
    );
  }

  await dropIndexIfPresent(ProctoringSessionModel.collection, LEGACY_INDEX);
  await dropIndexIfPresent(ProctoringEventModel.collection, LEGACY_INDEX);

  // After the backfill, so the unique subject index covers migrated rows.
  await ProctoringSessionModel.createIndexes();
}

async function dropIndexIfPresent(
  collection: Collection,
  name: string
): Promise<void> {
  // indexExists throws on a collection that doesn't exist yet (fresh DB).
  const exists = await collection.indexExists(name).catch(() => false);

  if (exists) {
    await collection.dropIndex(name);
    logger.info(`Dropped legacy index ${collection.collectionName}.${name}.`);
  }
}
