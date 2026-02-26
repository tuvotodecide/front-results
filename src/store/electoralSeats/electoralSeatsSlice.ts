import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ElectoralSeatsType } from '../../types';

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
    setElectoralSeats: (state, action: PayloadAction<ElectoralSeatsType[]>) => {
      state.electoralSeats = action.payload;
    },
  },
});

export const { setElectoralSeats } = electoralSeatsSlice.actions;
