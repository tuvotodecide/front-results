import { apiSlice } from '../apiSlice';
import { Partido } from '../../types';

export const partidosApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPartidos: builder.query<Partido[], void>({
      query: () => '/admin/parties',
      keepUnusedDataFor: 60,
      providesTags: () => [{ type: 'Partidos' as const, id: 'LIST' }],
    }),
    getPartido: builder.query<Partido, string>({
      query: (id) => `/admin/parties/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: 'Partidos' as const, id },
      ],
    }),
    createPartido: builder.mutation<Partido, Omit<Partido, '_id'>>({
      query: (recinto) => ({
        url: '/admin/parties',
        method: 'POST',
        body: recinto,
      }),
      invalidatesTags: [{ type: 'Partidos' as const, id: 'LIST' }],
    }),
    updatePartido: builder.mutation<
      Partido,
      { id: string; partido: Partial<Partido> }
    >({
      query: ({ id, partido }) => ({
        url: `/admin/parties/${id}`,
        method: 'PUT',
        body: partido,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Partidos' as const, id: 'LIST' },
        { type: 'Partidos' as const, id },
      ],
    }),
    deletePartido: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/parties/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Partidos' as const, id: 'LIST' },
        { type: 'Partidos' as const, id },
      ],
    }),
  }),
});

export const {
  useGetPartidosQuery,
  useGetPartidoQuery,
  useCreatePartidoMutation,
  useUpdatePartidoMutation,
  useDeletePartidoMutation,
} = partidosApiSlice;
