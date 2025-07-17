import { createSlice } from '@reduxjs/toolkit';

export interface departmentsState {
  departments: any[];
  department: any | null;
}

const initialState: departmentsState = {
  departments: [],
  department: null,
};

export const departmentsSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    setDepartments: (state, action) => {
      state.departments = action.payload;
    },
  },
});

export const { setDepartments } = departmentsSlice.actions;
export const selectDepartments = (state: { departments: departmentsState }) =>
  state.departments.departments;
