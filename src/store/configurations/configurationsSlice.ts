import { createSlice } from '@reduxjs/toolkit';
import { ConfigurationType } from '../../types';

export interface configurationsState {
  configurations: ConfigurationType[];
  configuration: ConfigurationType | null;
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
