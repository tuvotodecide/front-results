import { createSlice } from '@reduxjs/toolkit';
import type { ProvincesType } from '../../types';

export interface provincesState {
  provinces: ProvincesType[];
  province: ProvincesType | null;
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
