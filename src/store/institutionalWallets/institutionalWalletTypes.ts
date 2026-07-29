export type ResolveInstitutionalWalletByDniRequest = {
  dni: string;
};

export type ResolveInstitutionalWalletByDniResponse = {
  registered: boolean;
  accountAddress: string | null;
  reason?: "PERSON_NOT_REGISTERED" | "WALLET_NOT_FOUND";
  message?: string;
};
