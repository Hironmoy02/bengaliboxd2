import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Navbar from '@/components/Navbar';
import authReducer from '@/store/authSlice';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

jest.mock('next/link', () => {
  return React.forwardRef(function MockLink({ children, href, ...props }: any, ref: React.Ref<HTMLAnchorElement>) {
    return <a ref={ref} href={href as string} {...props}>{children}</a>;
  });
});

jest.mock('@/contexts/ThemeContext', () => ({
  useThemeMode: () => ({ mode: 'dark', toggleTheme: jest.fn() }),
}));

jest.mock('@/components/ui', () => ({
  StreakFlame: () => null,
}));

jest.mock('@/lib/axios', () => ({
  __esModule: true,
  default: { get: jest.fn().mockResolvedValue({ data: {} }), post: jest.fn().mockResolvedValue({}) },
}));

interface MockAuthState {
  auth: {
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
    } | null;
    loading: boolean;
  };
}

function renderWithStore(initialState: MockAuthState = { auth: { user: null, loading: false } }) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: initialState,
  } as any);
  return render(
    <Provider store={store}>
      <Navbar />
    </Provider>
  );
}

describe('Navbar', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the logo text', () => {
    renderWithStore();
    expect(screen.getByText(/Bengali/)).toBeInTheDocument();
    expect(screen.getByText(/boxd/)).toBeInTheDocument();
  });

  it('renders Sign In and Sign Up buttons when not authenticated', () => {
    renderWithStore();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('renders Stories nav link', () => {
    renderWithStore();
    expect(screen.getByText('Stories')).toBeInTheDocument();
  });

  it('renders Explore nav link', () => {
    renderWithStore();
    expect(screen.getByText('Explore')).toBeInTheDocument();
  });

  it('does not render Add Story link when not authenticated', () => {
    renderWithStore();
    expect(screen.queryByText('Add Story')).not.toBeInTheDocument();
  });

  it('does not render Admin link for non-admin users', () => {
    renderWithStore({
      auth: { user: { id: '1', username: 'testuser', email: 'test@test.com', role: 'user' }, loading: false },
    });
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });
});

describe('Navbar - authenticated user', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders username when authenticated', () => {
    renderWithStore({
      auth: { user: { id: '1', username: 'testuser', email: 'test@test.com', role: 'user' }, loading: false },
    });
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('renders Add Story link when authenticated', () => {
    renderWithStore({
      auth: { user: { id: '1', username: 'testuser', email: 'test@test.com', role: 'user' }, loading: false },
    });
    expect(screen.getByText('Add Story')).toBeInTheDocument();
  });

  it('renders Admin link for admin users', () => {
    renderWithStore({
      auth: { user: { id: '1', username: 'adminuser', email: 'admin@test.com', role: 'admin' }, loading: false },
    });
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });
});
