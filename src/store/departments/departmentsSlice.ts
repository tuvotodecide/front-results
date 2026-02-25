import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DepartmentType } from '../../types';

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
    setDepartments: (state, action: PayloadAction<DepartmentType[]>) => {
      state.departments = action.payload;
    },
    setDepartment: (state, action: PayloadAction<DepartmentType | null>) => {
      state.department = action.payload;
    },
  },
});

export const { setDepartments } = departmentsSlice.actions;
export const selectDepartments = (state: { departments: departmentsState }) =>
  state.departments.departments;
