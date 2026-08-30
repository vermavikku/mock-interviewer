import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchBackendSessions } from '../store/slices/interviewSlice';
import { useInterview as useReduxInterview } from '../store/hooks';

export function InterviewProvider({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchBackendSessions());
  }, [dispatch]);

  return <>{children}</>;
}

export function useInterview() {
  return useReduxInterview();
}

