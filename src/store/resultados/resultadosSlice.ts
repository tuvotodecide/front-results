import { createSlice } from '@reduxjs/toolkit';

export interface ResultsState {
  recintos: any[];
  recinto: any | null;
  filters: {
    department: string;
    province: string;
    municipality: string;
    electoralLocation: string;
    electoralSeat: string;
  };
}

const initialState: ResultsState = {
  recintos: [],
  recinto: null,
  filters: {
    department: '',
    province: '',
    municipality: '',
    electoralLocation: '',
    electoralSeat: '',
  },
};

export const resultsSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      console.log('setFilters action payload:', action.payload);
      state.filters = action.payload;
    },
  },
});

export const selectFilters = (state: { results: ResultsState }) =>
  state.results.filters;
export const { setFilters } = resultsSlice.actions;
// export const { setRecintos } = actasSlice.actions;
// export const selectAuth = (state: RootState) => state.auth;
