import { createSlice } from '@reduxjs/toolkit';
import type { ElectoralSeatsType } from '../../types';

export interface electoralSeatsState {
  electoralSeats: ElectoralSeatsType[];
  electoralSeat: ElectoralSeatsType | null;
}

const initialState: electoralSeatsState = {
  electoralSeats: [],
  electoralSeat: null,
};

export const electoralSeatsSlice = createSlice({
  name: 'electoralSeats',
  initialState,
  reducers: {
    setElectoralSeats: (state, action) => {
      state.electoralSeats = action.payload;
    },
  },
});

export const { setElectoralSeats } = electoralSeatsSlice.actions;
