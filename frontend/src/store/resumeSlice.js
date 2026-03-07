import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../utils/api';

const handleError = (err) => err.response?.data?.message || err.message;

const buildResumeParams = (filters = {}) => {
  const params = {};
  if (filters.name) params.name = filters.name.trim();
  if (filters.skills?.length) params.skills = filters.skills.join(',');
  if (filters.location) params.location = filters.location.trim();
  const parseNumber = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };
  const addNumber = (field, key) => {
    const parsed = parseNumber(filters[field]);
    if (parsed !== null) {
      params[key] = parsed;
    }
  };
  addNumber('minRating', 'min_rating');
  addNumber('maxRating', 'max_rating');
  addNumber('minExperience', 'min_experience');
  addNumber('maxExperience', 'max_experience');
  return params;
};

export const fetchResumes = createAsyncThunk(
  'resume/fetchResumes',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = buildResumeParams(filters);
      const response = await api.get('/hr/resumes', { params });
      return response.data.preview;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const downloadResume = createAsyncThunk('resume/downloadResume', async (id, { rejectWithValue }) => {
  try {
    const response = await api.post(`/hr/resumes/${id}/download`);
    return response.data;
  } catch (err) {
    return rejectWithValue(handleError(err));
  }
});

export const bulkDownloadResumes = createAsyncThunk(
  'resume/bulkDownload',
  async (studentIds, { rejectWithValue }) => {
    try {
      const response = await api.post('/hr/resumes/bulk-download', { studentIds }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'resumes.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      return { success: true };
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const subscribeHR = createAsyncThunk(
  'resume/subscribeHR',
  async ({ priceId }, { rejectWithValue }) => {
    try {
      const response = await api.post('/hr/subscribe', { priceId });
      return response.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

const resumeSlice = createSlice({
  name: 'resume',
  initialState: {
    list: [],
    status: 'idle',
    downloadStatus: 'idle',
    subscribeStatus: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchResumes.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchResumes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchResumes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(downloadResume.pending, (state) => {
        state.downloadStatus = 'loading';
      })
      .addCase(downloadResume.fulfilled, (state) => {
        state.downloadStatus = 'succeeded';
      })
      .addCase(downloadResume.rejected, (state, action) => {
        state.downloadStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(subscribeHR.pending, (state) => {
        state.subscribeStatus = 'loading';
      })
      .addCase(subscribeHR.fulfilled, (state, action) => {
        state.subscribeStatus = 'succeeded';
        state.error = null;
        state.session = action.payload;
      })
      .addCase(subscribeHR.rejected, (state, action) => {
        state.subscribeStatus = 'failed';
        state.error = action.payload;
      });
  }
});

export default resumeSlice.reducer;
