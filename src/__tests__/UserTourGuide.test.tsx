import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import UserTourGuide from '@/components/ui/UserTourGuide';

describe('UserTourGuide', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders welcome modal when new user signs up', () => {
    sessionStorage.setItem('bengaliboxd_just_signed_up', 'true');
    render(<UserTourGuide />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/Welcome to BengaliBoxd!/i)).toBeInTheDocument();
    expect(screen.getByText(/Take Interactive Tour/i)).toBeInTheDocument();
    expect(screen.getByText(/Skip for Now/i)).toBeInTheDocument();
  });

  it('does NOT render welcome modal on standard page load or existing user login', () => {
    render(<UserTourGuide />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByText(/Welcome to BengaliBoxd!/i)).not.toBeInTheDocument();
  });

  it('hides welcome modal and sets skipped status in localStorage on skip', () => {
    sessionStorage.setItem('bengaliboxd_just_signed_up', 'true');
    render(<UserTourGuide />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const skipButton = screen.getByText(/Skip for Now/i);
    fireEvent.click(skipButton);

    expect(screen.queryByText(/Welcome to BengaliBoxd!/i)).not.toBeInTheDocument();
    expect(localStorage.getItem('bengaliboxd_tour_status')).toBe('skipped');
  });

  it('starts tour when clicking Take Interactive Tour button', () => {
    sessionStorage.setItem('bengaliboxd_just_signed_up', 'true');
    render(<UserTourGuide />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const startButton = screen.getByText(/Take Interactive Tour/i);
    fireEvent.click(startButton);

    expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Search Audio Stories/i)).toBeInTheDocument();
  });

  it('navigates through steps using Next button', () => {
    sessionStorage.setItem('bengaliboxd_just_signed_up', 'true');
    render(<UserTourGuide />);

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
    render(<UserTourGuide />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByText(/Welcome to BengaliBoxd!/i)).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent('startUserTour'));
    });

    expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Search Audio Stories/i)).toBeInTheDocument();
  });
});
