import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layout & Protection
import { AppShell } from '../shared/components/layout/AppShell';
import { ProtectedRoute, PublicOnlyRoute } from '../shared/components/layout/ProtectedRoute';
import { RouteErrorBoundary } from '../shared/components/feedback/RouteErrorBoundary';

// Auth Pages
import { LoginPage } from '../modules/auth/pages/LoginPage';
import { RegisterPage } from '../modules/auth/pages/RegisterPage';
import { ForgotUsernamePage } from '../modules/auth/pages/ForgotUsernamePage';
import { ForgotPasswordPage } from '../modules/auth/pages/ForgotPasswordPage';

// Dashboard Page
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage';

// New Interview Page
import { NewInterviewPage } from '../modules/new-interview/pages/NewInterviewPage';

// Interview Room Page (Fullscreen)
import { InterviewRoomPage } from '../modules/interview-room/pages/InterviewRoomPage';

// History & Result Pages
import { HistoryListPage } from '../modules/interview-history/pages/HistoryListPage';
import { InterviewDetailsPage } from '../modules/interview-history/pages/InterviewDetailsPage';
import { InterviewResultPage } from '../modules/interview-history/pages/InterviewResultPage';

// Resumes Vault Page
import { ResumesPage } from '../modules/resumes/pages/ResumesPage';

// Profile Page
import { ProfilePage } from '../modules/profile/pages/ProfilePage';

export const router = createBrowserRouter([
  // Public Auth Routes (Accessible only when logged out; redirects to /dashboard if already logged in)
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/register',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/forgot-username',
    element: (
      <PublicOnlyRoute>
        <ForgotUsernamePage />
      </PublicOnlyRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/forgot-password',
    element: (
      <PublicOnlyRoute>
        <ForgotPasswordPage />
      </PublicOnlyRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },

  // Dedicated Full-screen Interview Room (Protected)
  {
    path: '/interview-room',
    element: (
      <ProtectedRoute>
        <InterviewRoomPage />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },

  // Main App Shell with Sidebar & Header (Protected)
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'interviews/new',
        element: <NewInterviewPage />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'interviews/history',
        element: <HistoryListPage />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'interviews/result',
        element: <InterviewResultPage />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'interviews/result/:id',
        element: <InterviewResultPage />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'interviews/:id',
        element: <InterviewDetailsPage />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'resumes',
        element: <ResumesPage />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
        errorElement: <RouteErrorBoundary />,
      },
    ],
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
