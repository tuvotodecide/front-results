import { createSlice } from '@reduxjs/toolkit';

export interface electoralTablesState {
  electoralTables: any[];
  electoralTable: any | null;
}

const initialState: electoralTablesState = {
  electoralTables: [],
  electoralTable: null,
};

export const electoralTablesSlice = createSlice({
  name: 'electoralTables',
  initialState,
  reducers: {
    setElectoralTables: (state, action) => {
      state.electoralTables = action.payload;
    },
  },
});

export const { setElectoralTables } = electoralTablesSlice.actions;
