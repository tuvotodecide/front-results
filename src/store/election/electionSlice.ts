import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { storageService } from '../../services/storage.service';

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
        storageService.setItem('selectedElectionId', action.payload.id);
        storageService.setItem('selectedElectionName', action.payload.name ?? '');
      } else {
        storageService.removeItem('selectedElectionId');
        storageService.removeItem('selectedElectionName');
      }
    },
    hydrateElectionFromStorage: (state) => {
      const id = storageService.getItem('selectedElectionId');
      const name = storageService.getItem('selectedElectionName');
      state.selectedElectionId = id || null;
      state.selectedElectionName = name || null;
    },
    clearSelectedElection: (state) => {
      state.selectedElectionId = null;
      state.selectedElectionName = null;
      storageService.removeItem('selectedElectionId');
      storageService.removeItem('selectedElectionName');
    },
  },
});

export const {
  setSelectedElection,
  hydrateElectionFromStorage,
  clearSelectedElection,
} = electionsSlice.actions;

export default electionsSlice.reducer;
