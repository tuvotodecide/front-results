import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ElectoralTablesType } from '../../types';

export interface electoralTablesState {
  electoralTables: ElectoralTablesType[];
  electoralTable: ElectoralTablesType | null;
}

const initialState: electoralTablesState = {
  electoralTables: [],
  electoralTable: null,
};

export const electoralTablesSlice = createSlice({
  name: 'electoralTables',
  initialState,
  reducers: {
    setElectoralTables: (state, action: PayloadAction<ElectoralTablesType[]>) => {
      state.electoralTables = action.payload;
    },
  },
});

export const { setElectoralTables } = electoralTablesSlice.actions;
