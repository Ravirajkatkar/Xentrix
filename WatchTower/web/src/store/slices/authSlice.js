import { createSlice } from '@reduxjs/toolkit';
import mockData from '../../data/mockData.json';

const persistedAuth = sessionStorage.getItem('watchtower_auth');
const initialAuthState = persistedAuth ? JSON.parse(persistedAuth) : {
  isAuthenticated: false,
  user: null,
};

const initialState = {
  ...initialAuthState,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginRequest: (state, action) => {
      const { email, password } = action.payload;
      const user = mockData.screens.login.users.find(u => u.email === email && u.password === password);
      
      if (user) {
        state.isAuthenticated = true;
        state.user = user;
        state.error = null;
        sessionStorage.setItem('watchtower_auth', JSON.stringify({ isAuthenticated: true, user }));
      } else {
        state.isAuthenticated = false;
        state.user = null;
        state.error = 'Invalid email or password';
        sessionStorage.removeItem('watchtower_auth');
      }
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      sessionStorage.removeItem('watchtower_auth');
    },
    clearError: (state) => {
      state.error = null;
    }
  },
});

export const { loginRequest, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
