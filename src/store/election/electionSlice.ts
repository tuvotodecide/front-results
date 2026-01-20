import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
        localStorage.setItem('selectedElectionId', action.payload.id);
        localStorage.setItem('selectedElectionName', action.payload.name ?? '');
      } else {
        localStorage.removeItem('selectedElectionId');
        localStorage.removeItem('selectedElectionName');
      }
    },
    hydrateElectionFromStorage: (state) => {
      const id = localStorage.getItem('selectedElectionId');
      const name = localStorage.getItem('selectedElectionName');
      state.selectedElectionId = id || null;
      state.selectedElectionName = name || null;
    },
    clearSelectedElection: (state) => {
      state.selectedElectionId = null;
      state.selectedElectionName = null;
      localStorage.removeItem('selectedElectionId');
      localStorage.removeItem('selectedElectionName');
    },
  },
});

export const {
  setSelectedElection,
  hydrateElectionFromStorage,
  clearSelectedElection,
} = electionsSlice.actions;

export default electionsSlice.reducer;
