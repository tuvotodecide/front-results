import { createSlice } from '@reduxjs/toolkit';

export interface configurationsState {
  configurations: any[];
  configuration: any | null;
}

const initialState: configurationsState = {
  configurations: [],
  configuration: null,
};

export const configurationsSlice = createSlice({
  name: 'configurations',
  initialState,
  reducers: {},
});
