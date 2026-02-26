import { createSlice } from '@reduxjs/toolkit';
import { BallotType } from '../../types';

export interface ballotsState {
  ballots: BallotType[];
  ballot: BallotType | null;
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
