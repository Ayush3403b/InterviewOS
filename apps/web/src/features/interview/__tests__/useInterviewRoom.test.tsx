import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useInterviewRoom } from '../useInterviewRoom';
import * as interviewApi from '../api';

// ---------------------------------------------------------------------------
// useInterviewRoom integration tests
// ---------------------------------------------------------------------------
// These tests verify the full question-loop state machine without real
// network calls. All API functions are vi.mocked to return controlled
// responses.
// ---------------------------------------------------------------------------

vi.mock('../api');

const mockSession = {
  id: 'session-123',
  title: 'Test Interview',
  type: 'TECHNICAL' as const,
  level: 'INTERMEDIATE' as const,
  status: 'IN_PROGRESS' as const,
  score: 0,
  duration: 0,
  createdAt: new Date().toISOString(),
  turnCount: 0,
  maxQuestions: 5,
  feedback: '',
  startedAt: null,
  completedAt: null,
  updatedAt: new Date().toISOString(),
};

const mockTurn = {
  id: 'turn-001',
  turnNumber: 1,
  question: 'Explain closures in JavaScript.',
  difficulty: 'INTERMEDIATE' as const,
  isFollowUp: false,
  topic: 'JavaScript',
};

describe('useInterviewRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('starts in loading-question phase and moves to answering after getNextQuestion resolves', async () => {
    vi.mocked(interviewApi.getNextQuestion).mockResolvedValue({
      done: false,
      turn: mockTurn,
    });

    const { result } = renderHook(() => useInterviewRoom(mockSession));

    expect(result.current.phase).toBe('loading-question');

    await waitFor(() => {
      expect(result.current.phase).toBe('answering');
    });

    expect(result.current.currentTurn).toEqual(mockTurn);
  });

  it('transitions to generating-evaluation when getNextQuestion returns done=true', async () => {
    vi.mocked(interviewApi.getNextQuestion).mockResolvedValue({ done: true });
    vi.mocked(interviewApi.finishInterview).mockResolvedValue({
      id: 'eval-1',
      interviewSessionId: 'session-123',
      candidateId: 'user-1',
      status: 'COMPLETED',
      overallScore: 75,
      skillScores: { technical: 80, communication: 70, problemSolving: 75, confidence: 75, leadership: 70, criticalThinking: 75 },
      strengths: ['Good fundamentals'],
      weaknesses: [],
      recommendations: [],
      overallSummary: 'Good performance.',
      hiringRecommendation: 'HIRE',
      questionEvaluations: [],
    });

    const { result } = renderHook(() => useInterviewRoom(mockSession));

    await waitFor(() => {
      expect(result.current.phase).toBe('completed');
    });

    expect(result.current.evaluation).not.toBeNull();
    expect(result.current.evaluation?.overallScore).toBe(75);
  });

  it('transitions to error phase when getNextQuestion throws', async () => {
    vi.mocked(interviewApi.getNextQuestion).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useInterviewRoom(mockSession));

    await waitFor(() => {
      expect(result.current.phase).toBe('error');
    });

    expect(result.current.error).toBeTruthy();
  });

  it('restores draft from localStorage when a turn is loaded', async () => {
    // Pre-populate a draft for this turn
    localStorage.setItem(
      'interview-draft-session-123-turn-001',
      JSON.stringify({ text: 'My saved answer', savedAt: Date.now() })
    );

    vi.mocked(interviewApi.getNextQuestion).mockResolvedValue({
      done: false,
      turn: mockTurn,
    });

    const { result } = renderHook(() => useInterviewRoom(mockSession));

    await waitFor(() => {
      expect(result.current.phase).toBe('answering');
    });

    expect(result.current.answer).toBe('My saved answer');
  });

  it('clears the draft from localStorage after a successful submit', async () => {
    localStorage.setItem(
      'interview-draft-session-123-turn-001',
      JSON.stringify({ text: 'Draft to be cleared', savedAt: Date.now() })
    );

    vi.mocked(interviewApi.getNextQuestion).mockResolvedValue({
      done: false,
      turn: mockTurn,
    });
    vi.mocked(interviewApi.submitOrchestratorAnswer).mockResolvedValue({
      turnId: 'turn-001',
      topicsCovered: ['JavaScript'],
      transcriptSummary: 'Good answer.',
    });
    // Second call to getNextQuestion after submit — done this time
    vi.mocked(interviewApi.getNextQuestion)
      .mockResolvedValueOnce({ done: false, turn: mockTurn })
      .mockResolvedValue({ done: true });
    vi.mocked(interviewApi.finishInterview).mockResolvedValue({
      id: 'eval-1',
      interviewSessionId: 'session-123',
      candidateId: 'user-1',
      status: 'COMPLETED',
      overallScore: 80,
      skillScores: { technical: 80, communication: 80, problemSolving: 80, confidence: 80, leadership: 80, criticalThinking: 80 },
      strengths: [],
      weaknesses: [],
      recommendations: [],
      overallSummary: '',
      hiringRecommendation: 'HIRE',
      questionEvaluations: [],
    });

    const { result } = renderHook(() => useInterviewRoom(mockSession));

    await waitFor(() => expect(result.current.phase).toBe('answering'));

    // Submit an answer
    act(() => result.current.setAnswer('My answer'));

    await act(async () => {
      await result.current.submitAnswer();
    });

    // Draft should be gone from localStorage
    expect(
      localStorage.getItem('interview-draft-session-123-turn-001')
    ).toBeNull();
  });
});
