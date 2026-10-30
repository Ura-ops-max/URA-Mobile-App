import API from '@/lib/axios-client';
import type { BankOption, HeldOrder, WalletActivityPage, WalletBalance } from '@/types';

/**
 * Wallet calls go to URA's backend only (/wallet/*). The backend talks to
 * Payluk with the signed-in user's own customer id; the app never sends it.
 */

/** Create the user's Payluk customer profile (unlocks the wallet and checkout). */
export async function setupPaymentProfile(input: { phone: string; firstName?: string; lastName?: string }) {
  const { data } = await API.post('/onboarding/setup-payment-profile', input);
  return data as { success: boolean; paylukCustomerId?: string; message?: string };
}

/** GET /wallet — an empty wallet (hasProfile false) when there is no payment profile yet. */
export async function getWallet(): Promise<WalletBalance> {
  const { data } = await API.get('/wallet');
  return {
    hasProfile: !!data.hasProfile,
    mainBalance: Number(data.mainBalance) || 0,
    escrowBalance: Number(data.escrowBalance) || 0,
    currency: data.currency || 'NGN',
  };
}

/** GET /wallet/activity?page&limit — the user's own money rows. */
export async function getWalletActivity(page = 1, limit = 20): Promise<WalletActivityPage> {
  const { data } = await API.get('/wallet/activity', { params: { page, limit } });
  return { pagination: data.pagination ?? null, data: data.data ?? [] };
}

/** GET /wallet/held — orders whose money Buyer-Protected is holding. */
export async function getHeldOrders(): Promise<HeldOrder[]> {
  const { data } = await API.get('/wallet/held');
  return data.orders ?? [];
}

export async function getBankList(): Promise<BankOption[]> {
  const { data } = await API.get('/wallet/banks');
  return data.banks ?? [];
}

export async function verifyAccount(
  bankCode: string,
  accountNumber: string,
): Promise<{ accountName: string | null; accountNumber: string; bankCode: string }> {
  const { data } = await API.post('/wallet/verify-account', { accountNumber, bankCode });
  return { accountName: data.accountName ?? null, accountNumber: data.accountNumber, bankCode: data.bankCode };
}

export interface WithdrawInput {
  amount: number;
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  narration?: string;
}

/** Step 1: POST /wallet/withdraw → { reference, amount, fee, status }. */
export async function startWithdrawal(input: WithdrawInput): Promise<{
  reference: string;
  amount: number;
  fee: number;
  status: string;
}> {
  const { data } = await API.post('/wallet/withdraw', input);
  return data;
}

/** Step 2: POST /wallet/withdraw/confirm { reference, otp? }. */
export async function confirmWithdrawal(reference: string, otp?: string): Promise<{
  reference: string;
  status: string;
  amount: number;
  fee: number;
}> {
  const { data } = await API.post('/wallet/withdraw/confirm', otp ? { reference, otp } : { reference });
  return data;
}
