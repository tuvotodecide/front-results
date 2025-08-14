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
  currentTable: string | null;
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
  currentTable: null,
};

export const resultsSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      console.log('setFilters action payload:', action.payload);
      state.filters = action.payload;
    },
    setCurrentTable: (state, action) => {
      state.currentTable = action.payload;
    },
  },
});

export const selectFilters = (state: { results: ResultsState }) =>
  state.results.filters;
export const selectCurrentTable = (state: { results: ResultsState }) =>
  state.results.currentTable;
export const { setFilters, setCurrentTable } = resultsSlice.actions;
// export const { setRecintos } = actasSlice.actions;
// export const selectAuth = (state: RootState) => state.auth;
