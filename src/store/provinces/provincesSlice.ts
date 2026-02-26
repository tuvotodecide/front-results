import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProvincesType } from '../../types';

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
    setProvinces: (state, action: PayloadAction<ProvincesType[]>) => {
      state.provinces = action.payload;
    },
  },
});

export const { setProvinces } = provincesSlice.actions;
