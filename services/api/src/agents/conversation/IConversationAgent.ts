export interface ConversationSummaryResult {
  summary: string;
  newTopics: string[];
  /** 0-100 rough read on how well this specific answer was - feeds the
   *  Planner's adaptive difficulty decision. Not a substitute for the
   *  end-of-interview Evaluation Agent's real scoring, just a fast,
   *  cheap-to-compute per-turn signal. */
  answerQuality: number;
}

export interface IConversationAgent {
  summarizeTurn(
    previousSummary: string,
    question: string,
    answer: string
  ): Promise<ConversationSummaryResult>;
}
