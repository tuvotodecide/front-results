export type ResolveInstitutionalWalletByDniRequest = {
  dni: string;
};

export type ResolveInstitutionalWalletByDniResponse = {
  registered: boolean;
  accountAddress: string | null;
  message?: string;
};
