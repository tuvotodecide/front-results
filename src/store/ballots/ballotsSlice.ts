import { createSlice } from '@reduxjs/toolkit';

export interface ballotsState {
  ballots: any[];
  ballot: any | null;
}

const initialState: ballotsState = {
  ballots: [],
  ballot: null,
};

export const ballotsSlice = createSlice({
  name: 'ballots',
  initialState,
  reducers: {},
});
