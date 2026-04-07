import { createSlice } from '@reduxjs/toolkit';
import type { ElectoralLocationsType } from '../../types';

export interface electoralLocationsState {
  electoralLocations: ElectoralLocationsType[];
  electoralLocation: ElectoralLocationsType | null;
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
