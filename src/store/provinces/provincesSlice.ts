import { createSlice } from '@reduxjs/toolkit';

export interface provincesState {
  provinces: any[];
  province: any | null;
}

const initialState: provincesState = {
  provinces: [],
  province: null,
};

export const provincesSlice = createSlice({
  name: 'provinces',
  initialState,
  reducers: {
    setProvinces: (state, action) => {
      state.provinces = action.payload;
    },
  },
});

export const { setProvinces } = provincesSlice.actions;
