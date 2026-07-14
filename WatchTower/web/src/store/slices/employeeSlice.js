import { createSlice } from '@reduxjs/toolkit';
import mockData from '../../data/mockData.json';

const initialState = {
  employees: mockData.screens.employees.list,
  selectedEmployee: null,
};

const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    addEmployee: (state, action) => {
      state.employees.push(action.payload);
    },
    updateEmployee: (state, action) => {
      const index = state.employees.findIndex(emp => emp.id === action.payload.id);
      if (index !== -1) {
        state.employees[index] = action.payload;
      }
    },
    selectEmployee: (state, action) => {
      state.selectedEmployee = action.payload;
    },
    clearSelectedEmployee: (state) => {
      state.selectedEmployee = null;
    }
  }
});

export const { addEmployee, updateEmployee, selectEmployee, clearSelectedEmployee } = employeeSlice.actions;
export default employeeSlice.reducer;
