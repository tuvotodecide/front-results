import { createSlice } from '@reduxjs/toolkit';

export interface electoralSeatsState {
  electoralSeats: any[];
  electoralSeat: any | null;
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
