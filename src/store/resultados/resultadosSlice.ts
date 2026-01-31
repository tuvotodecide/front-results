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
  filterIds: {
    departmentId: string;
    provinceId: string;
    municipalityId: string;
    electoralLocationId: string;
    electoralSeatId: string;
  };
  currentTable: string | null;
  currentBallot: string | null;
  queryParamsResults: string;
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
  filterIds: {
    departmentId: '',
    provinceId: '',
    municipalityId: '',
    electoralLocationId: '',
    electoralSeatId: '',
  },
  currentTable: null,
  currentBallot: null,
  queryParamsResults: '',
};

export const resultsSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      // console.log('setFilters action payload:', action.payload);
      state.filters = action.payload;
    },
    setFilterIds: (state, action) => {
      state.filterIds = action.payload;
    },
    setCurrentTable: (state, action) => {
      state.currentTable = action.payload;
    },
    setCurrentBallot: (state, action) => {
      state.currentBallot = action.payload;
    },
    setQueryParamsResults: (state, action) => {
      state.queryParamsResults = action.payload;
    },
    resetResults: () => initialState,
  },
});

export const selectFilters = (state: { results: ResultsState }) =>
  state.results.filters;
export const selectFilterIds = (state: { results: ResultsState }) =>
  state.results.filterIds;
export const selectCurrentTable = (state: { results: ResultsState }) =>
  state.results.currentTable;
export const selectCurrentBallot = (state: { results: ResultsState }) =>
  state.results.currentBallot;
export const selectQueryParamsResults = (state: { results: ResultsState }) =>
  state.results.queryParamsResults;
export const {
  setFilters,
  setFilterIds,
  setCurrentTable,
  setCurrentBallot,
  setQueryParamsResults,
  resetResults,
} = resultsSlice.actions;
// export const { setRecintos } = actasSlice.actions;
// export const selectAuth = (state: RootState) => state.auth;
