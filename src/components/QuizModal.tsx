import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { NpcProfile } from '../data/questions';
import FractionText from './FractionText';

interface QuizModalProps {
  npc: NpcProfile;
  questionIndex: number;
  totalQuestions: number;
  onAnswerSubmitted: (npcId: number, selectedChoiceId: string, isCorrect: boolean) => void;
  onContinue: () => void;
}

const CHOICE_LABELS = ['①', '②', '③', '④'];

export default function QuizModal({
  npc,
  questionIndex,
  totalQuestions,
  onAnswerSubmitted,
  onContinue,
}: QuizModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const q = npc.question;
  const isCorrect = selectedId === q.correctChoiceId;
  const correctChoice = q.choices.find((c) => c.id === q.correctChoiceId);

  const handleSelect = (choiceId: string) => {
    // Only the FIRST answer is graded for this question!
    if (submitted) return;
    setSelectedId(choiceId);
    setSubmitted(true);
    onAnswerSubmitted(npc.id, choiceId, choiceId === q.correctChoiceId);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!submitted) {
        if (e.key === '1' && q.choices[0]) handleSelect(q.choices[0].id);
        if (e.key === '2' && q.choices[1]) handleSelect(q.choices[1].id);
        if (e.key === '3' && q.choices[2]) handleSelect(q.choices[2].id);
        if (e.key === '4' && q.choices[3]) handleSelect(q.choices[3].id);
      } else if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        onContinue();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[rgba(69,26,3,0.45)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-npc-name"
    >
      <div className="pixel-panel w-full max-w-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        {/* NPC Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b-2 border-[#E7D5BE]">
          <div>
            <div className="text-xs font-bold text-[#B45309]">
              {npc.role} · {q.topic}
            </div>
            <h2 id="quiz-npc-name" className="font-display text-2xl text-[#451A03] mt-0.5">
              {npc.name}의 질문
            </h2>
          </div>
          <div className="font-mono-num text-sm font-bold text-[#78350F]">
            문제 {questionIndex + 1} / {totalQuestions}
          </div>
        </div>

        {/* NPC Greeting */}
        <p className="mt-3 text-sm font-medium text-[#78350F] bg-[#FFFBEB] px-3.5 py-2 border-2 border-[#FDE68A]">
          “{npc.greeting}”
        </p>

        {/* Math Question */}
        <div className="mt-4 p-4 sm:p-5 bg-white border-2 border-[#78350F] text-base sm:text-lg font-bold text-[#451A03]">
          <FractionText tokens={q.prompt} />
        </div>

        {/* Answer Choices */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {q.choices.map((choice, idx) => {
            const isChosen = selectedId === choice.id;
            const isAnswer = choice.id === q.correctChoiceId;

            let btnStyle = 'bg-[#FFFDF6] hover:bg-[#FEF3C7] text-[#451A03]';
            if (submitted) {
              if (isAnswer) {
                btnStyle = 'bg-[#DCFCE7] text-[#14532D] border-[#15803D]';
              } else if (isChosen && !isAnswer) {
                btnStyle = 'bg-[#FEE2E2] text-[#7F1D1D] border-[#DC2626]';
              } else {
                btnStyle = 'bg-[#F5F5F4] text-[#78716C] opacity-75';
              }
            }

            return (
              <button
                key={choice.id}
                type="button"
                disabled={submitted}
                onClick={() => handleSelect(choice.id)}
                className={`pixel-btn flex items-center gap-3 px-4 py-3 text-left text-base font-bold cursor-pointer ${btnStyle}`}
              >
                <span className="font-mono-num text-lg shrink-0">{CHOICE_LABELS[idx]}</span>
                <FractionText tokens={choice.tokens} />
              </button>
            );
          })}
        </div>

        {/* Immediate Answer & Short Explanation after First Submission */}
        {submitted && (
          <div
            className={`mt-5 p-4 border-2 ${
              isCorrect
                ? 'bg-[#F0FDF4] border-[#16A34A] text-[#14532D]'
                : 'bg-[#FEF2F2] border-[#DC2626] text-[#7F1D1D]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 font-display text-xl">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-[#16A34A] shrink-0" />
                    <span>정답입니다! (+10점)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-[#DC2626] shrink-0" />
                    <span>아쉬워요! (0점)</span>
                  </>
                )}
              </div>

              {correctChoice && (
                <div className="text-sm font-bold flex items-center gap-1.5 bg-white/80 px-2.5 py-1 border border-current">
                  <span>정답:</span>
                  <FractionText tokens={correctChoice.tokens} />
                </div>
              )}
            </div>

            <div className="text-sm leading-relaxed font-medium text-[#451A03] bg-white/85 p-3 border border-[#E7D5BE]">
              <span className="font-bold text-[#B45309] mr-1.5">해설:</span>
              <FractionText tokens={q.explanation} />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onContinue}
                className="pixel-btn flex items-center gap-2 px-5 py-2.5 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#451A03] font-display text-base cursor-pointer"
              >
                <span>
                  {questionIndex + 1 >= totalQuestions ? '결과 화면 보기' : '마을로 돌아가기'}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
