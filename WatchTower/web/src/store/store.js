import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import clientReducer from './slices/clientSlice';
import overviewReducer from './slices/overviewSlice';
import employeeReducer from './slices/employeeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clients: clientReducer,
    overview: overviewReducer,
    employees: employeeReducer,
  },
});
