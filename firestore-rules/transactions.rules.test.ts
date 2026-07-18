import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { ADMIN_UID, OTHER_UID, OWNER_UID, createTestEnv, seedUsers, validPendingTransaction } from './testEnv';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await createTestEnv();
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedUsers(testEnv);
});

describe('transactions create', () => {
  it('22. owner creates own pending transaction -> allowed', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(setDoc(doc(db, 'transactions', 'tx-1'), validPendingTransaction(OWNER_UID)));
  });

  it('23. owner creates completed transaction -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'transactions', 'tx-1'), { ...validPendingTransaction(OWNER_UID), status: 'completed' })
    );
  });

  it('24. owner creates failed transaction -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'transactions', 'tx-1'), { ...validPendingTransaction(OWNER_UID), status: 'failed' })
    );
  });

  it("25. owner creates with another user's userUid -> denied", async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'transactions', 'tx-1'), { ...validPendingTransaction(OWNER_UID), userUid: OTHER_UID })
    );
  });

  it('26a. owner creates with 0 amount -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(setDoc(doc(db, 'transactions', 'tx-1'), { ...validPendingTransaction(OWNER_UID), amount: 0 }));
  });

  it('26b. owner creates with negative amount -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'transactions', 'tx-1'), { ...validPendingTransaction(OWNER_UID), amount: -100 })
    );
  });

  it('26c. owner creates with decimal amount -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'transactions', 'tx-1'), { ...validPendingTransaction(OWNER_UID), amount: 100.5 })
    );
  });

  it('27. owner creates with an invalid type -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'transactions', 'tx-1'), { ...validPendingTransaction(OWNER_UID), type: 'bogus' })
    );
  });

  it('28a. owner injects approvedAt -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'transactions', 'tx-1'), { ...validPendingTransaction(OWNER_UID), approvedAt: Date.now() })
    );
  });

  it('28b. owner injects approvedBy -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(
      setDoc(doc(db, 'transactions', 'tx-1'), { ...validPendingTransaction(OWNER_UID), approvedBy: OWNER_UID })
    );
  });

  it('32. unauthenticated create -> denied', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, 'transactions', 'tx-1'), validPendingTransaction(OWNER_UID)));
  });
});

describe('transactions update/delete', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'transactions', 'tx-1'), validPendingTransaction(OWNER_UID));
    });
  });

  it('29. owner updates their own transaction -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'transactions', 'tx-1'), { status: 'completed' }));
  });

  it('30. owner deletes their own transaction -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(deleteDoc(doc(db, 'transactions', 'tx-1')));
  });

  it('31. admin approves a pending transaction -> allowed', async () => {
    const db = testEnv.authenticatedContext(ADMIN_UID).firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'transactions', 'tx-1'), {
        status: 'completed',
        approvedAt: Date.now(),
        approvedBy: ADMIN_UID,
      })
    );
  });

  it('bonus. admin rejects a pending transaction -> allowed', async () => {
    const db = testEnv.authenticatedContext(ADMIN_UID).firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'transactions', 'tx-1'), {
        status: 'failed',
        approvedAt: Date.now(),
        approvedBy: ADMIN_UID,
      })
    );
  });

  it('bonus. admin deletes a transaction -> denied (no delete rule granted to anyone)', async () => {
    const db = testEnv.authenticatedContext(ADMIN_UID).firestore();
    await assertFails(deleteDoc(doc(db, 'transactions', 'tx-1')));
  });
});
