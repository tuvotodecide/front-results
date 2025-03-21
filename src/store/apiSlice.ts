import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (builder) => ({
    getExample: builder.query<{ data: string }, void>({
      query: () => "/example",
    }),
  }),
});

export const { useGetExampleQuery } = apiSlice;
