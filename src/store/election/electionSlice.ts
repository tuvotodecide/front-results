import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  readStorage,
  removeStorage,
  writeStorage,
} from '../../shared/system/browserStorage';

export interface ElectionsState {
  selectedElectionId: string | null;
  selectedElectionName: string | null;
}

const initialState: ElectionsState = {
  selectedElectionId: null,
  selectedElectionName: null,
};

export const electionsSlice = createSlice({
  name: 'election',
  initialState,
  reducers: {
    setSelectedElection: (
      state,
      action: PayloadAction<{ id: string | null; name: string | null }>
    ) => {
      state.selectedElectionId = action.payload.id;
      state.selectedElectionName = action.payload.name;
      if (action.payload.id) {
        writeStorage('selectedElectionId', action.payload.id);
        writeStorage('selectedElectionName', action.payload.name ?? '');
      } else {
        removeStorage('selectedElectionId');
        removeStorage('selectedElectionName');
      }
    },
    hydrateElectionFromStorage: (state) => {
      const id = readStorage('selectedElectionId');
      const name = readStorage('selectedElectionName');
      state.selectedElectionId = id || null;
      state.selectedElectionName = name || null;
    },
    clearSelectedElection: (state) => {
      state.selectedElectionId = null;
      state.selectedElectionName = null;
      removeStorage('selectedElectionId');
      removeStorage('selectedElectionName');
    },
  },
});

export const {
  setSelectedElection,
  hydrateElectionFromStorage,
  clearSelectedElection,
} = electionsSlice.actions;

export default electionsSlice.reducer;
