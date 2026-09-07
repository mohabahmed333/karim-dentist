export const BYTES_PER_MB = 1024 ** 2;
export const BYTES_PER_GB = 1024 ** 3;

export type FreePlanQuotas = {
  storageBytes: number;
  databaseBytes: number;
  egressBytes: number;
  authMau: number;
  kapsoMessages: number;
};

export function freePlanQuotas(): FreePlanQuotas {
  return {
    storageBytes: 1 * BYTES_PER_GB,
    databaseBytes: 500 * BYTES_PER_MB,
    egressBytes: 5 * BYTES_PER_GB,
    authMau: 50_000,
    kapsoMessages: 2_000,
  };
}
