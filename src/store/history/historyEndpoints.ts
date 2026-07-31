import { apiSlice } from "../apiSlice";

export interface HistoryOperationItem {
  id: string;
  txHash: string | null;
  operationName: string;
  type: string;
  registerDate: string | null;
  relatedAmount?: string | null;
}

export interface HistoryOperationsResponse {
  items: HistoryOperationItem[];
  totalitems: number;
  limit: number;
  page: number;
  totalPages: number;
}

const unwrapHistoryResponse = (response: any): HistoryOperationsResponse => {
  const source = response?.data ?? response ?? {};
  const items = Array.isArray(source.items) ? source.items : [];
  return {
    items: items.map((item: any) => ({
      id: String(item?._id ?? item?.id ?? item?.txHash ?? ""),
      txHash: item?.txHash ? String(item.txHash) : null,
      operationName: String(item?.operationName ?? ""),
      type: String(item?.type ?? ""),
      registerDate: item?.registerDate ? String(item.registerDate) : null,
      relatedAmount:
        item?.relatedAmount === null || item?.relatedAmount === undefined
          ? null
          : String(item.relatedAmount),
    })),
    totalitems: Number(source.totalitems ?? source.total ?? items.length),
    limit: Number(source.limit ?? items.length),
    page: Number(source.page ?? 1),
    totalPages: Number(source.totalPages ?? 1),
  };
};

export const historyEndpoints = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listHistoryOperations: builder.query<
      HistoryOperationsResponse,
      { electionId: string; page?: number; limit?: number }
    >({
      query: ({ electionId, page = 1, limit = 10 }) => ({
        url: "/history",
        method: "GET",
        params: { electionId, page, limit },
      }),
      transformResponse: unwrapHistoryResponse,
    }),
  }),
});

export const { useListHistoryOperationsQuery } = historyEndpoints;
