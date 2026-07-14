import { createSlice } from '@reduxjs/toolkit';
import mockData from '../../data/mockData.json';

const initialState = {
  clients: mockData.screens.clients.list,
  selectedClient: null,
};

const clientSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    setClients: (state, action) => {
      state.clients = action.payload;
    },
    addClient: (state, action) => {
      state.clients.push(action.payload);
    },
    updateClient: (state, action) => {
      const index = state.clients.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.clients[index] = action.payload;
      }
      if (state.selectedClient && state.selectedClient.id === action.payload.id) {
        state.selectedClient = action.payload;
      }
    },
    selectClient: (state, action) => {
      state.selectedClient = action.payload;
    },
    clearSelectedClient: (state) => {
      state.selectedClient = null;
    }
  },
});

export const { setClients, addClient, updateClient, selectClient, clearSelectedClient } = clientSlice.actions;
export default clientSlice.reducer;
