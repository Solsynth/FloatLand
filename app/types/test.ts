export interface ActivationTestRequirement {
  key: string
  available: boolean
  passed: boolean
}

export interface ActivationProgress {
  isActivated: boolean
  testsEnabled: boolean
  testsBypassed: boolean
  requireVerifiedContact: boolean
  hasVerifiedContact: boolean
  requiredRequirementCount: number
  completedRequirementCount: number
  tests: ActivationTestRequirement[]
}

export interface ParticipantChoice { id: string; content: string; config: Record<string, unknown> }
export interface ParticipantQuestion { id: string; content: string; type: 0 | 1 | 2; difficulty: number; points: number; config: Record<string, unknown>; choices: ParticipantChoice[] }
export interface ParticipantTest { key: string; title: string; description?: string; timeLimitSeconds?: number; questions: ParticipantQuestion[] }
export interface ParticipantAttempt {
  id: string
  key?: string
  title?: string
  isTrial?: boolean
  status: 'inProgress' | 'pendingReview' | 'passed' | 'failed' | 'expired'
  startedAt: string
  deadlineAt?: string | null
  submittedAt?: string | null
  reviewedAt?: string | null
  score?: number | null
  questions: ParticipantQuestion[]
  answers?: Array<{
    questionId: string
    value: { choiceIds?: string[]; text?: string | null }
    isCorrect?: boolean | null
    awardedPoints?: number | null
    reviewNote?: string | null
  }>
}
