import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../utils/api';

const handleError = (err) => err.response?.data?.message || err.message;

export const searchInterviewers = createAsyncThunk(
  'booking/searchInterviewers',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await api.get('/student/search', { params: filters });
      return response.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const bookInterview = createAsyncThunk(
  'booking/bookInterview',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/student/bookings', payload);
      return response.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const fetchFeedback = createAsyncThunk('booking/fetchFeedback', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/student/feedback');
    return response.data;
  } catch (err) {
    return rejectWithValue(handleError(err));
  }
});

export const fetchCourses = createAsyncThunk('booking/fetchCourses', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/student/courses');
    return response.data.courses;
  } catch (err) {
    return rejectWithValue(handleError(err));
  }
});

export const fetchStudentBookings = createAsyncThunk(
  'booking/fetchStudentBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/student/bookings');
      return response.data.bookings || [];
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const enrollCourses = createAsyncThunk(
  'booking/enrollCourses',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/student/courses', payload);
      return response.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const fetchInternships = createAsyncThunk(
  'booking/fetchInternships',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/student/internships');
      return response.data.internships;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const registerInternship = createAsyncThunk(
  'booking/registerInternship',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/student/internships', payload);
      return response.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const fetchInterviewerBookings = createAsyncThunk(
  'booking/fetchInterviewerBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/interviewer/bookings');
      return response.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const startInterviewerBooking = createAsyncThunk(
  'booking/startInterviewerBooking',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/interviewer/bookings/${bookingId}/start`);
      return response.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const submitInterviewRating = createAsyncThunk(
  'booking/submitInterviewRating',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/interviewer/rate', payload);
      return response.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const verifyStripeSession = createAsyncThunk(
  'booking/verifyStripeSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await api.post('/student/sessions/verify', { sessionId });
      return response.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    availableInterviewers: [],
    searchStatus: 'idle',
    bookingStatus: 'idle',
    bookingSession: null,
    feedback: { student: null, interviews: [] },
    feedbackStatus: 'idle',
    sessionStatus: 'idle',
    courses: [],
    courseStatus: 'idle',
    interviewerBookings: [],
    interviewerStatus: 'idle',
    bookingActionLoading: false,
    error: null,
    interviewSubmissionStatus: 'idle',
    enrollStatus: 'idle',
    internships: [],
    internshipStatus: 'idle',
    internshipRegisterStatus: 'idle',
    studentBookings: [],
    studentBookingsStatus: 'idle'
  },
  reducers: {
    resetInternshipRegisterStatus(state) {
      state.internshipRegisterStatus = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchInterviewers.pending, (state) => {
        state.searchStatus = 'loading';
        state.error = null;
      })
      .addCase(searchInterviewers.fulfilled, (state, action) => {
        state.searchStatus = 'succeeded';
        state.availableInterviewers = action.payload;
      })
      .addCase(searchInterviewers.rejected, (state, action) => {
        state.searchStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(bookInterview.pending, (state) => {
        state.bookingStatus = 'loading';
        state.error = null;
      })
      .addCase(bookInterview.fulfilled, (state, action) => {
        state.bookingStatus = 'succeeded';
        state.bookingSession = action.payload.sessionId;
      })
      .addCase(bookInterview.rejected, (state, action) => {
        state.bookingStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchFeedback.pending, (state) => {
        state.feedbackStatus = 'loading';
      })
      .addCase(fetchFeedback.fulfilled, (state, action) => {
        state.feedbackStatus = 'succeeded';
        state.feedback = action.payload;
      })
      .addCase(fetchFeedback.rejected, (state, action) => {
        state.feedbackStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchCourses.pending, (state) => {
        state.courseStatus = 'loading';
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.courseStatus = 'succeeded';
        state.courses = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.courseStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(enrollCourses.pending, (state) => {
        state.enrollStatus = 'loading';
      })
      .addCase(enrollCourses.fulfilled, (state) => {
        state.enrollStatus = 'succeeded';
      })
      .addCase(enrollCourses.rejected, (state, action) => {
        state.enrollStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchInternships.pending, (state) => {
        state.internshipStatus = 'loading';
      })
      .addCase(fetchInternships.fulfilled, (state, action) => {
        state.internshipStatus = 'succeeded';
        state.internships = action.payload;
      })
      .addCase(fetchInternships.rejected, (state, action) => {
        state.internshipStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(registerInternship.pending, (state) => {
        state.internshipRegisterStatus = 'loading';
      })
      .addCase(registerInternship.fulfilled, (state) => {
        state.internshipRegisterStatus = 'succeeded';
      })
      .addCase(registerInternship.rejected, (state, action) => {
        state.internshipRegisterStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchStudentBookings.pending, (state) => {
        state.studentBookingsStatus = 'loading';
      })
      .addCase(fetchStudentBookings.fulfilled, (state, action) => {
        state.studentBookingsStatus = 'succeeded';
        state.studentBookings = action.payload;
      })
      .addCase(fetchStudentBookings.rejected, (state, action) => {
        state.studentBookingsStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchInterviewerBookings.pending, (state) => {
        state.interviewerStatus = 'loading';
      })
    .addCase(fetchInterviewerBookings.fulfilled, (state, action) => {
      state.interviewerStatus = 'succeeded';
      state.interviewerBookings = action.payload;
    })
    .addCase(fetchInterviewerBookings.rejected, (state, action) => {
      state.interviewerStatus = 'failed';
      state.error = action.payload;
    })
    .addCase(startInterviewerBooking.pending, (state) => {
      state.bookingActionLoading = true;
    })
    .addCase(startInterviewerBooking.fulfilled, (state) => {
      state.bookingActionLoading = false;
    })
    .addCase(startInterviewerBooking.rejected, (state, action) => {
      state.bookingActionLoading = false;
      state.error = action.payload;
    })
      .addCase(submitInterviewRating.pending, (state) => {
        state.interviewSubmissionStatus = 'loading';
      })
      .addCase(submitInterviewRating.fulfilled, (state) => {
        state.interviewSubmissionStatus = 'succeeded';
      })
      .addCase(submitInterviewRating.rejected, (state, action) => {
        state.interviewSubmissionStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(verifyStripeSession.pending, (state) => {
        state.sessionStatus = 'loading';
      })
      .addCase(verifyStripeSession.fulfilled, (state) => {
        state.sessionStatus = 'succeeded';
      })
      .addCase(verifyStripeSession.rejected, (state, action) => {
        state.sessionStatus = 'failed';
        state.error = action.payload;
      });
  }
});

export const { resetInternshipRegisterStatus } = bookingSlice.actions;

export default bookingSlice.reducer;
