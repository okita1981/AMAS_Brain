import { readFileSync } from 'node:fs';
import { setDoc, doc } from 'firebase/firestore';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';

export const PROJECT_ID = 'demo-amas-b1';
export const OWNER_UID = 'owner-1';
export const OTHER_UID = 'owner-2';
export const ADMIN_UID = 'admin-1';

export async function createTestEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
}

// Seeds users/{uid} docs (bypassing rules) so isAdmin()'s get() lookup and
// isOwner() checks have something real to read against, matching the shape
// isValidUser requires in the live app.
export async function seedUsers(testEnv: RulesTestEnvironment): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', ADMIN_UID), {
      uid: ADMIN_UID,
      email: 'admin@example.com',
      plan: 'Free',
      role: 'admin',
      createdAt: Date.now(),
      billingCycle: 'monthly',
    });
    await setDoc(doc(db, 'users', OWNER_UID), {
      uid: OWNER_UID,
      email: 'owner@example.com',
      plan: 'Free',
      role: 'user',
      createdAt: Date.now(),
      billingCycle: 'monthly',
    });
    await setDoc(doc(db, 'users', OTHER_UID), {
      uid: OTHER_UID,
      email: 'other@example.com',
      plan: 'Free',
      role: 'user',
      createdAt: Date.now(),
      billingCycle: 'monthly',
    });
  });
}

// Matches the zeroed shape both live creation paths (App.tsx createWallet(),
// Wallet.tsx's own init branch) write on first login.
export function validNewWallet() {
  return {
    balance_total: 0,
    balance_ad_budget: 0,
    tax_holding: 0,
    status: 'active' as const,
    autoChargeEnabled: false,
    autoChargeThreshold: 0,
    autoChargeAmount: 0,
    monthlyUsage: {
      monthlyDeposit: 0,
      monthlyCreatives: 0,
      monthlyCampaigns: 0,
      lastResetAt: 0,
    },
  };
}

export function validPendingTransaction(userUid: string) {
  return {
    id: 'tx-1',
    userUid,
    amount: 10000,
    type: 'credit_card' as const,
    status: 'pending' as const,
    timestamp: Date.now(),
  };
}
