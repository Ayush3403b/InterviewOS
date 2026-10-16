import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SessionStateScreen } from '../components/SessionStateScreen';
import * as dashboardApi from '../../dashboard/api';

// ---------------------------------------------------------------------------
// SessionStateScreen tests
// ---------------------------------------------------------------------------

vi.mock('../../dashboard/api');

function renderComponent(
  status: 'PAUSED' | 'EXPIRED' | 'CANCELLED',
  onAction?: () => void
) {
  return render(
    <MemoryRouter>
      <SessionStateScreen
        sessionId="session-xyz"
        status={status}
        onAction={onAction}
      />
    </MemoryRouter>
  );
}

describe('SessionStateScreen — PAUSED', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the paused heading and both action buttons', () => {
    renderComponent('PAUSED');
    expect(screen.getByText('Interview paused')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resume interview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel interview/i })).toBeInTheDocument();
  });

  it('does NOT render the "Back to dashboard" link for PAUSED', () => {
    renderComponent('PAUSED');
    expect(screen.queryByRole('button', { name: /back to dashboard/i })).not.toBeInTheDocument();
  });

  it('calls resumeSession and onAction when Resume is clicked', async () => {
    vi.mocked(dashboardApi.resumeSession).mockResolvedValue({} as never);
    const onAction = vi.fn();
    renderComponent('PAUSED', onAction);

    fireEvent.click(screen.getByRole('button', { name: /resume interview/i }));

    await waitFor(() => {
      expect(dashboardApi.resumeSession).toHaveBeenCalledWith('session-xyz');
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });

  it('calls cancelSession and onAction when Cancel is clicked', async () => {
    vi.mocked(dashboardApi.cancelSession).mockResolvedValue({} as never);
    const onAction = vi.fn();
    renderComponent('PAUSED', onAction);

    fireEvent.click(screen.getByRole('button', { name: /cancel interview/i }));

    await waitFor(() => {
      expect(dashboardApi.cancelSession).toHaveBeenCalledWith('session-xyz');
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });

  it('shows an error message when resumeSession rejects', async () => {
    vi.mocked(dashboardApi.resumeSession).mockRejectedValue(
      new Error('Server error')
    );
    renderComponent('PAUSED');

    fireEvent.click(screen.getByRole('button', { name: /resume interview/i }));

    await waitFor(() => {
      // getApiErrorMessage returns a fallback for non-Axios errors
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('disables both buttons while resuming', async () => {
    // Never resolve so we can inspect the loading state
    vi.mocked(dashboardApi.resumeSession).mockReturnValue(new Promise(() => {}));
    renderComponent('PAUSED');

    fireEvent.click(screen.getByRole('button', { name: /resume interview/i }));

    expect(screen.getByRole('button', { name: /resuming/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel interview/i })).toBeDisabled();
  });
});

describe('SessionStateScreen — EXPIRED', () => {
  it('renders the expired heading and back button, no action buttons', () => {
    renderComponent('EXPIRED');
    expect(screen.getByText('Interview expired')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /resume/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });
});

describe('SessionStateScreen — CANCELLED', () => {
  it('renders the cancelled heading and back button, no action buttons', () => {
    renderComponent('CANCELLED');
    expect(screen.getByText('Interview cancelled')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /resume/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });
});
