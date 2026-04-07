import { createSlice } from '@reduxjs/toolkit';
import type { PoliticalPartiesType } from '../../types';

export interface PoliticalPartiesState {
  politicalParty: PoliticalPartiesType | null;
  politicalParties: PoliticalPartiesType[];
}

const initialState: PoliticalPartiesState = {
  politicalParty: null,
  politicalParties: [],
};

export const politicalPartiesSlice = createSlice({
  name: 'politicalParties',
  initialState,
  reducers: {
    setPoliticalParties: (state, action) => {
      state.politicalParties = action.payload;
    },
  },
});

export const { setPoliticalParties } = politicalPartiesSlice.actions;
// export const selectAuth = (state: RootState) => state.auth;
