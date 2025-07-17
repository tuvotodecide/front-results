import { createSlice } from '@reduxjs/toolkit';

export interface electoralLocationsState {
  electoralLocations: any[];
  electoralLocation: any | null;
}

const initialState: electoralLocationsState = {
  electoralLocations: [],
  electoralLocation: null,
};

export const electoralLocationsSlice = createSlice({
  name: 'electoralLocations',
  initialState,
  reducers: {
    setElectoralLocations: (state, action) => {
      state.electoralLocations = action.payload;
    },
  },
});

export const { setElectoralLocations } = electoralLocationsSlice.actions;
