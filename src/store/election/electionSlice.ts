import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { readStorageItem, writeStorageItem } from '@/shared/auth/storage';

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
        writeStorageItem('selectedElectionId', action.payload.id);
        writeStorageItem('selectedElectionName', action.payload.name ?? '');
      } else {
        writeStorageItem('selectedElectionId', null);
        writeStorageItem('selectedElectionName', null);
      }
    },
    hydrateElectionFromStorage: (state) => {
      const id = readStorageItem('selectedElectionId');
      const name = readStorageItem('selectedElectionName');
      state.selectedElectionId = id || null;
      state.selectedElectionName = name || null;
    },
    clearSelectedElection: (state) => {
      state.selectedElectionId = null;
      state.selectedElectionName = null;
      writeStorageItem('selectedElectionId', null);
      writeStorageItem('selectedElectionName', null);
    },
  },
});

export const {
  setSelectedElection,
  hydrateElectionFromStorage,
  clearSelectedElection,
} = electionsSlice.actions;

export default electionsSlice.reducer;
