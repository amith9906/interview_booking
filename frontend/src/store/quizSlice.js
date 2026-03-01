import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../utils/api';

export const fetchTodayAssignment = createAsyncThunk('quiz/fetchTodayAssignment', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/quizzes/assignment/today');
    return response.data.assignment;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchStreaks = createAsyncThunk('quiz/fetchStreaks', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/quizzes/streaks');
    return response.data.streaks;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const submitQuizAttempt = createAsyncThunk('quiz/submitAttempt', async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post('/quizzes/attempt', payload);
    return response.data.attempt;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const initialState = {
  assignment: null,
  streaks: [],
  status: 'idle',
  streakStatus: 'idle',
  submissionStatus: 'idle',
  error: null,
  streakError: null,
  submissionError: null
};

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    resetQuizState(state) {
      state.assignment = null;
      state.streaks = [];
      state.status = 'idle';
      state.streakStatus = 'idle';
      state.submissionStatus = 'idle';
      state.error = null;
      state.streakError = null;
      state.submissionError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodayAssignment.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTodayAssignment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.assignment = action.payload;
      })
      .addCase(fetchTodayAssignment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchStreaks.pending, (state) => {
        state.streakStatus = 'loading';
        state.streakError = null;
      })
      .addCase(fetchStreaks.fulfilled, (state, action) => {
        state.streakStatus = 'succeeded';
        state.streaks = action.payload;
      })
      .addCase(fetchStreaks.rejected, (state, action) => {
        state.streakStatus = 'failed';
        state.streakError = action.payload;
      })
      .addCase(submitQuizAttempt.pending, (state) => {
        state.submissionStatus = 'loading';
        state.submissionError = null;
      })
      .addCase(submitQuizAttempt.fulfilled, (state, action) => {
        state.submissionStatus = 'succeeded';
        state.assignment = { ...state.assignment, Attempts: [...(state.assignment?.Attempts || []), action.payload] };
      })
      .addCase(submitQuizAttempt.rejected, (state, action) => {
        state.submissionStatus = 'failed';
        state.submissionError = action.payload;
      });
  }
});

export const { resetQuizState } = quizSlice.actions;
export default quizSlice.reducer;
