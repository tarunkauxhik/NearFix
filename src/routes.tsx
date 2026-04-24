import { Navigate, RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import React from 'react';
import HomePage from './pages/index';
import Spinner from './components/Spinner';
import RequireRole from './components/auth/RequireRole';
import RequireOnboarding from './components/auth/RequireOnboarding';


const NotFoundPage = lazy(() => import('./pages/_404'));

const ProviderProfilePage = lazy(() => import('./pages/provider/[id]'));
const ServicesPage = lazy(() => import('./pages/services'));
const HowItWorksPage = lazy(() => import('./pages/how-it-works'));
const NotificationsPage = lazy(() => import('./pages/notifications'));
const OnboardingPage = lazy(() => import('./pages/onboarding'));
const BookingPage = lazy(() => import('./pages/booking'));
const BookingConfirmationPage = lazy(() => import('./pages/booking/confirmation'));
const PostAuthPage = lazy(() => import('./pages/auth/post-auth'));
const SignInPage = lazy(() => import('./pages/auth/sign-in'));
const SignUpPage = lazy(() => import('./pages/auth/sign-up'));
const CustomerDashboardPage = lazy(() => import('./pages/dashboard/resident'));
const ProviderDashboardPage = lazy(() => import('./pages/dashboard/provider'));
const ProviderRegistrationPage = lazy(() => import('./pages/provider/register'));
const AdminHomePage = lazy(() => import('./pages/admin/index'));
const AdminUsersPage = lazy(() => import('./pages/admin/users'));

const Fallback = () => (
  <div className="flex justify-center py-20 items-center">
    <Spinner />
  </div>
);

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<Fallback />}>{element}</Suspense>;
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/provider/:id',
    element: withSuspense(<ProviderProfilePage />),
  },
  {
    path: '/services',
    element: withSuspense(<ServicesPage />),
  },
  {
    path: '/how-it-works',
    element: withSuspense(<HowItWorksPage />),
  },
  {
    path: '/notifications',
    element: withSuspense(<NotificationsPage />),
  },
  {
    path: '/onboarding',
    element: withSuspense(
      <RequireOnboarding>
        <OnboardingPage />
      </RequireOnboarding>
    ),
  },
  {
    path: '/booking',
    element: withSuspense(<BookingPage />),
  },
  {
    path: '/booking/confirmation',
    element: withSuspense(<BookingConfirmationPage />),
  },
  {
    path: '/auth/sign-in/*',
    element: withSuspense(<SignInPage />),
  },
  {
    path: '/auth/sign-up/*',
    element: withSuspense(<SignUpPage />),
  },
  {
    path: '/auth/post-auth',
    element: withSuspense(<PostAuthPage />),
  },
  {
    path: '/provider/register',
    element: withSuspense(
      <RequireRole roles={['provider']}>
        <ProviderRegistrationPage />
      </RequireRole>
    ),
  },
  {
    path: '/dashboard/customer',
    element: withSuspense(
      <RequireRole roles={['customer']}>
        <CustomerDashboardPage />
      </RequireRole>
    ),
  },
  {
    path: '/dashboard/resident',
    element: <Navigate to="/dashboard/customer" replace />,
  },
  {
    path: '/dashboard/provider',
    element: withSuspense(
      <RequireRole roles={['provider']}>
        <ProviderDashboardPage />
      </RequireRole>
    ),
  },
  {
    path: '/admin',
    element: withSuspense(
      <RequireRole adminOnly>
        <AdminHomePage />
      </RequireRole>
    ),
  },
  {
    path: '/admin/users',
    element: withSuspense(
      <RequireRole adminOnly>
        <AdminUsersPage />
      </RequireRole>
    ),
  },
  {
    path: '*',
    element: withSuspense(<NotFoundPage />),
  },
];

// Types for type-safe navigation
export type Path =
  | '/'
  | '/services'
  | '/how-it-works'
  | '/notifications'
  | '/onboarding'
  | '/provider/:id'
  | '/provider/register'
  | '/booking'
  | '/booking/confirmation'
  | '/auth/sign-in'
  | '/auth/sign-up'
  | '/auth/post-auth'
  | '/dashboard/customer'
  | '/dashboard/provider'
  | '/admin'
  | '/admin/users';

export type Params = Record<string, string | undefined>;
