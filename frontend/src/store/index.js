import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import bookingReducer from './bookingSlice';
import resumeReducer from './resumeSlice';
import quizReducer from './quizSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    booking: bookingReducer,
    resume: resumeReducer
    ,
    quiz: quizReducer
  }
});
