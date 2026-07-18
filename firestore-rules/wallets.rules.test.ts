import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { ADMIN_UID, OTHER_UID, OWNER_UID, createTestEnv, seedUsers, validNewWallet } from './testEnv';

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

describe('wallets create', () => {
  it('1. owner creates with valid zeroed initial values -> allowed', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(setDoc(doc(db, 'wallets', OWNER_UID), validNewWallet()));
  });

  it('2. owner sets initial balance_total > 0 -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(setDoc(doc(db, 'wallets', OWNER_UID), { ...validNewWallet(), balance_total: 1 }));
  });

  it('3. owner sets initial balance_ad_budget > 0 -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(setDoc(doc(db, 'wallets', OWNER_UID), { ...validNewWallet(), balance_ad_budget: 1 }));
  });

  it('4. owner sets initial tax_holding > 0 -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(setDoc(doc(db, 'wallets', OWNER_UID), { ...validNewWallet(), tax_holding: 1 }));
  });

  it("5. owner creates another user's wallet -> denied", async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(setDoc(doc(db, 'wallets', OTHER_UID), validNewWallet()));
  });

  it('6. unauthenticated create -> denied', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, 'wallets', OWNER_UID), validNewWallet()));
  });

  it('bonus. owner creating with status=paused -> denied (not a valid initial state)', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(setDoc(doc(db, 'wallets', OWNER_UID), { ...validNewWallet(), status: 'paused' }));
  });
});

describe('wallets update', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'wallets', OWNER_UID), validNewWallet());
    });
  });

  it('7. owner changes balance_total -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'wallets', OWNER_UID), { balance_total: 100 }));
  });

  it('8. owner changes balance_ad_budget -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'wallets', OWNER_UID), { balance_ad_budget: 100 }));
  });

  it('9. owner changes tax_holding -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'wallets', OWNER_UID), { tax_holding: 100 }));
  });

  it('10. owner changes transactions -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'wallets', OWNER_UID), { transactions: [{ id: 'x' }] }));
  });

  it('11. owner changes status -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'wallets', OWNER_UID), { status: 'paused' }));
  });

  it('12. owner changes autoCharge settings -> allowed', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'wallets', OWNER_UID), {
        autoChargeEnabled: true,
        autoChargeThreshold: 5000,
        autoChargeAmount: 10000,
      })
    );
  });

  it('13. owner increases monthlyCampaigns -> allowed', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(updateDoc(doc(db, 'wallets', OWNER_UID), { 'monthlyUsage.monthlyCampaigns': 1 }));
  });

  it('14. owner increases monthlyCreatives -> allowed', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(updateDoc(doc(db, 'wallets', OWNER_UID), { 'monthlyUsage.monthlyCreatives': 1 }));
  });

  it('15. owner decreases monthlyCampaigns -> denied', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'wallets', OWNER_UID), { 'monthlyUsage.monthlyCampaigns': 3 });
    });
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'wallets', OWNER_UID), { 'monthlyUsage.monthlyCampaigns': 2 }));
  });

  it('16. owner decreases monthlyCreatives -> denied', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'wallets', OWNER_UID), { 'monthlyUsage.monthlyCreatives': 3 });
    });
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'wallets', OWNER_UID), { 'monthlyUsage.monthlyCreatives': 2 }));
  });

  it('17. owner changes monthlyDeposit -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'wallets', OWNER_UID), { 'monthlyUsage.monthlyDeposit': 500 }));
  });

  it('18. owner changes lastResetAt -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'wallets', OWNER_UID), { 'monthlyUsage.lastResetAt': Date.now() }));
  });

  it('19. owner changes adjustment values -> denied', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'wallets', OWNER_UID), { 'monthlyUsage.adjustmentCreatives': 5 }));
    await assertFails(updateDoc(doc(db, 'wallets', OWNER_UID), { 'monthlyUsage.adjustmentCampaigns': 5 }));
  });

  it('20. admin performs a regular balance update -> allowed', async () => {
    const db = testEnv.authenticatedContext(ADMIN_UID).firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'wallets', OWNER_UID), {
        balance_total: 10000,
        balance_ad_budget: 9091,
        tax_holding: 909,
        'monthlyUsage.monthlyDeposit': 10000,
      })
    );
  });

  it('21. admin performs monthly reset -> allowed', async () => {
    const db = testEnv.authenticatedContext(ADMIN_UID).firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'wallets', OWNER_UID), {
        monthlyUsage: { monthlyDeposit: 0, monthlyCreatives: 0, monthlyCampaigns: 0, lastResetAt: Date.now() },
      })
    );
  });

  it('bonus. owner update outside their own wallet document -> denied', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'wallets', OTHER_UID), validNewWallet());
    });
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(updateDoc(doc(db, 'wallets', OTHER_UID), { autoChargeEnabled: true }));
  });
});
