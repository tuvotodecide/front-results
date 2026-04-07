import { createSlice } from '@reduxjs/toolkit';
import type { RecintoElectoral } from '../../types';

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
    setRecintos: (state, action) => {
      state.recintos = action.payload;
    },
  },
});

export const { setRecintos } = recintosSlice.actions;
// export const selectAuth = (state: RootState) => state.auth;
