import { createSlice } from '@reduxjs/toolkit';
import type { Partido } from '../../types';

export interface PartidosState {
  partidos: Partido[];
  partido: Partido | null;
}

const initialState: PartidosState = {
  partidos: [],
  partido: null,
};

export const partidosSlice = createSlice({
  name: 'partidos',
  initialState,
  reducers: {
    setPartidos: (state, action) => {
      state.partidos = action.payload;
    },
  },
});

export const { setPartidos } = partidosSlice.actions;
// export const selectAuth = (state: RootState) => state.auth;
