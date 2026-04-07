import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ResultsState {
  recintos: unknown[];
  recinto: unknown | null;
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

export interface ResultsFilters {
  department: string;
  province: string;
  municipality: string;
  electoralLocation: string;
  electoralSeat: string;
}

export interface ResultsFilterIds {
  departmentId: string;
  provinceId: string;
  municipalityId: string;
  electoralLocationId: string;
  electoralSeatId: string;
}

const emptyFilters = {
  department: '',
  province: '',
  municipality: '',
  electoralLocation: '',
  electoralSeat: '',
} satisfies ResultsFilters;

const emptyFilterIds = {
  departmentId: '',
  provinceId: '',
  municipalityId: '',
  electoralLocationId: '',
  electoralSeatId: '',
} satisfies ResultsFilterIds;

const initialState: ResultsState = {
  recintos: [],
  recinto: null,
  filters: emptyFilters,
  filterIds: emptyFilterIds,
  currentTable: null,
  currentBallot: null,
  queryParamsResults: '',
};

export const resultsSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ResultsFilters>>) => {
      state.filters = { ...emptyFilters, ...action.payload };
    },
    setFilterIds: (state, action: PayloadAction<Partial<ResultsFilterIds>>) => {
      state.filterIds = { ...emptyFilterIds, ...action.payload };
    },
    setCurrentTable: (state, action: PayloadAction<string | null>) => {
      state.currentTable = action.payload;
    },
    setCurrentBallot: (state, action: PayloadAction<string | null>) => {
      state.currentBallot = action.payload;
    },
    setQueryParamsResults: (state, action: PayloadAction<string>) => {
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
