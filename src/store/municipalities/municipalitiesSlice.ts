import { createSlice } from '@reduxjs/toolkit';

export interface municipalitiesState {
  municipalities: any[];
  municipality: any | null;
}

const initialState: municipalitiesState = {
  municipalities: [],
  municipality: null,
};

export const municipalitiesSlice = createSlice({
  name: 'municipalities',
  initialState,
  reducers: {
    setMunicipalities: (state, action) => {
      state.municipalities = action.payload;
    },
  },
});

export const { setMunicipalities } = municipalitiesSlice.actions;
