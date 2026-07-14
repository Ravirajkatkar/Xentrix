import { createSlice } from '@reduxjs/toolkit';
import mockData from '../../data/mockData.json';

const initialState = {
  data: mockData.screens.overview,
};

const overviewSlice = createSlice({
  name: 'overview',
  initialState,
  reducers: {
    setOverviewData: (state, action) => {
      state.data = action.payload;
    },
  },
});

export const { setOverviewData } = overviewSlice.actions;
export default overviewSlice.reducer;
