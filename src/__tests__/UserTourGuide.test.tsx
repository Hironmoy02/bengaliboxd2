import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/authSlice';
import UserTourGuide from '@/components/ui/UserTourGuide';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

jest.mock('next/link', () => {
  return React.forwardRef(function MockLink({ children, href, ...props }: any, ref: React.Ref<HTMLAnchorElement>) {
    return <a ref={ref} href={href as string} {...props}>{children}</a>;
  });
});

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

function renderWithStore(
  initialState: MockAuthState = { auth: { user: { id: '1', username: 'testuser', email: 'test@test.com', role: 'user' }, loading: false } }
) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: initialState,
  } as any);
  return render(
    <Provider store={store}>
      <UserTourGuide />
    </Provider>
  );
}

describe('UserTourGuide', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders welcome modal when unauthenticated guest visits first time', () => {
    renderWithStore({ auth: { user: null, loading: false } });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/Welcome to BengaliBoxd! 🎧/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign In to Your Account/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Free Account/i)).toBeInTheDocument();
    expect(screen.getByText(/Skip for Now \/ Explore as Guest/i)).toBeInTheDocument();
  });

  it('renders welcome modal when new user signs up', () => {
    sessionStorage.setItem('bengaliboxd_just_signed_up', 'true');
    renderWithStore();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/Welcome to BengaliBoxd!/i)).toBeInTheDocument();
    expect(screen.getByText(/Take Interactive Tour/i)).toBeInTheDocument();
    expect(screen.getByText(/Skip for Now/i)).toBeInTheDocument();
  });

  it('does NOT render welcome modal on standard page load for existing logged-in user if tour completed/skipped', () => {
    localStorage.setItem('bengaliboxd_tour_status', 'completed');
    renderWithStore({ auth: { user: { id: '1', username: 'testuser', email: 'test@test.com', role: 'user' }, loading: false } });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByText(/Welcome to BengaliBoxd!/i)).not.toBeInTheDocument();
  });

  it('hides welcome modal and sets skipped status in localStorage when guest skips', () => {
    renderWithStore({ auth: { user: null, loading: false } });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const skipButton = screen.getByText(/Skip for Now \/ Explore as Guest/i);
    fireEvent.click(skipButton);

    expect(screen.queryByText(/Welcome to BengaliBoxd!/i)).not.toBeInTheDocument();
    expect(localStorage.getItem('bengaliboxd_tour_status')).toBe('skipped');
  });

  it('starts tour when clicking Take Tour as Guest button', () => {
    renderWithStore({ auth: { user: null, loading: false } });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const guestTourButton = screen.getByText(/Take Tour as Guest/i);
    fireEvent.click(guestTourButton);

    expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Search Audio Stories/i)).toBeInTheDocument();
  });

  it('navigates through steps using Next button', () => {
    sessionStorage.setItem('bengaliboxd_just_signed_up', 'true');
    renderWithStore();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    fireEvent.click(screen.getByText(/Take Interactive Tour/i));

    expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Next/i));

    expect(screen.getByText(/Step 2 of 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Explore Genres & Themes/i)).toBeInTheDocument();
  });

  it('starts tour on custom window startUserTour event', () => {
    localStorage.setItem('bengaliboxd_tour_status', 'completed');
    renderWithStore();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByText(/Welcome to BengaliBoxd!/i)).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent('startUserTour'));
    });

    expect(screen.getByText(/Welcome to BengaliBoxd!/i)).toBeInTheDocument();
  });
});
