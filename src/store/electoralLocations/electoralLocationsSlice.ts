import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ElectoralLocationsType } from '../../types';

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
    setElectoralLocations: (state, action: PayloadAction<ElectoralLocationsType[]>) => {
      state.electoralLocations = action.payload;
    },
  },
});

export const { setElectoralLocations } = electoralLocationsSlice.actions;
