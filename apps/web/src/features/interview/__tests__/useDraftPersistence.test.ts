import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDraftPersistence } from '../useDraftPersistence';

// ---------------------------------------------------------------------------
// useDraftPersistence unit tests
// ---------------------------------------------------------------------------
// These tests focus on the contract, not the debounce timer. To make
// localStorage writes synchronous for testing, we flush the fake timer
// after each saveDraft call.
// ---------------------------------------------------------------------------

describe('useDraftPersistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const SESSION_ID = 'session-abc';
  const TURN_ID = 'turn-001';

  function renderPersistence(turnId: string | undefined = TURN_ID) {
    return renderHook(() => useDraftPersistence(SESSION_ID, turnId));
  }

  it('readDraft returns empty string when nothing is stored', () => {
    const { result } = renderPersistence();
    expect(result.current.readDraft()).toBe('');
  });

  it('saveDraft + readDraft round-trips the text', async () => {
    const { result } = renderPersistence();

    act(() => {
      result.current.saveDraft('Hello world');
      vi.runAllTimers(); // flush debounce
    });

    expect(result.current.readDraft()).toBe('Hello world');
  });

  it('clearDraft removes the stored value', () => {
    const { result } = renderPersistence();

    act(() => {
      result.current.saveDraft('partial answer');
      vi.runAllTimers();
    });

    act(() => {
      result.current.clearDraft();
    });

    expect(result.current.readDraft()).toBe('');
  });

  it('drafts are isolated per turn — old turn draft does not bleed in', () => {
    // Save a draft for turn-001
    const { result: hook1 } = renderHook(() =>
      useDraftPersistence(SESSION_ID, 'turn-001')
    );
    act(() => {
      hook1.current.saveDraft('answer for turn 1');
      vi.runAllTimers();
    });

    // A fresh hook for turn-002 should see nothing
    const { result: hook2 } = renderHook(() =>
      useDraftPersistence(SESSION_ID, 'turn-002')
    );
    expect(hook2.current.readDraft()).toBe('');
  });

  it('returns empty string when turnId is undefined (turn not yet loaded)', () => {
    const { result } = renderPersistence(undefined);
    expect(result.current.readDraft()).toBe('');
    // saveDraft / clearDraft should not throw either
    expect(() => {
      act(() => result.current.saveDraft('x'));
      act(() => result.current.clearDraft());
    }).not.toThrow();
  });

  it('discards drafts older than 24 hours', () => {
    const { result } = renderPersistence();

    act(() => {
      result.current.saveDraft('stale answer');
      vi.runAllTimers();
    });

    // Fast-forward 25 hours in wall-clock time via Date.now mock
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now + 25 * 60 * 60 * 1000);

    expect(result.current.readDraft()).toBe('');

    vi.restoreAllMocks();
  });
});
