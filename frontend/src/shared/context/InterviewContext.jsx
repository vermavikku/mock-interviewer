import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBackendSessions, resetInterviewState } from '../store/slices/interviewSlice';
import { useInterview as useReduxInterview } from '../store/hooks';

export function InterviewProvider({ children }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      dispatch(fetchBackendSessions());
    } else {
      dispatch(resetInterviewState());
    }
  }, [dispatch, userId]);

  return <>{children}</>;
}

export function useInterview() {
  return useReduxInterview();
}
