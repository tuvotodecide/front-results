import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RecintoElectoral } from '../../types';

export interface RecintosState {
  recintos: RecintoElectoral[];
  recinto: RecintoElectoral | null;
}

const initialState: RecintosState = {
  recintos: [],
  recinto: null,
};

export const recintosSlice = createSlice({
  name: 'recintos',
  initialState,
  reducers: {
    setRecintos: (state, action: PayloadAction<RecintoElectoral[]>) => {
      state.recintos = action.payload;
    },
    setRecinto: (state, action: PayloadAction<RecintoElectoral | null>) => {
      state.recinto = action.payload;
    },
  },
});

export const { setRecintos } = recintosSlice.actions;
// export const selectAuth = (state: RootState) => state.auth;
