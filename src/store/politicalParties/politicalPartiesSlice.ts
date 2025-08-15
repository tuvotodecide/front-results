import { createSlice } from '@reduxjs/toolkit';

export interface PoliticalPartiesState {
  politicalParty: any | null;
  politicalParties: any[];
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
