import { createSlice } from '@reduxjs/toolkit';
import type { DepartmentType } from '../../types';

export interface departmentsState {
  departments: DepartmentType[];
  department: DepartmentType | null;
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
