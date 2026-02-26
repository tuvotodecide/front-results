import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MunicipalitiesType } from '../../types';

export interface municipalitiesState {
  municipalities: MunicipalitiesType[];
  municipality: MunicipalitiesType | null;
}

const initialState: municipalitiesState = {
  municipalities: [],
  municipality: null,
};

export const municipalitiesSlice = createSlice({
  name: 'municipalities',
  initialState,
  reducers: {
    setMunicipalities: (state, action: PayloadAction<MunicipalitiesType[]>) => {
      state.municipalities = action.payload;
    },
  },
});

export const { setMunicipalities } = municipalitiesSlice.actions;
