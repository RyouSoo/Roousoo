import { CheckCircle2, RotateCcw, Trophy, XCircle } from 'lucide-react';
import { VILLAGE_NPCS } from '../data/questions';

export interface AnsweredRecord {
  npcId: number;
  selectedChoiceId: string;
  isCorrect: boolean;
}

interface ResultScreenProps {
  playerName: string;
  score: number;
  records: AnsweredRecord[];
  saveStatus: 'saving' | 'saved' | 'error';
  saveErrorMsg: string | null;
  onRetrySave: () => void;
  onOpenScoreboard: () => void;
  onRestart: () => void;
}

export default function ResultScreen({
  playerName,
  score,
  records,
  saveStatus,
  saveErrorMsg,
  onRetrySave,
  onOpenScoreboard,
  onRestart,
}: ResultScreenProps) {
  const correctCount = records.filter((r) => r.isCorrect).length;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[rgba(69,26,3,0.45)]">
      <div className="pixel-panel w-full max-w-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="text-center pb-5 border-b-2 border-[#E7D5BE]">
          <div className="text-sm font-bold text-[#B45309] mb-1">10문제 모두 완료!</div>
          <h2 className="font-display text-3xl sm:text-4xl text-[#451A03] mb-3">
            {playerName} 학생의 탐험 결과
          </h2>

          <div className="inline-flex items-baseline gap-2 bg-[#FEF3C7] border-3 border-[#5C2D0C] px-6 py-3">
            <span className="font-mono-num text-4xl sm:text-5xl font-bold text-[#B45309]">
              {score}
            </span>
            <span className="font-display text-xl text-[#5C2D0C]">점 / 100점</span>
          </div>

          <p className="mt-3 text-sm font-bold text-[#78350F]">
            10문제 중 <span className="font-mono-num text-[#15803D]">{correctCount}문제</span>를
            맞혔어요!
          </p>

          {/* SheetDB Save Status */}
          <div className="mt-3 text-xs font-bold">
            {saveStatus === 'saving' && (
              <span className="text-[#B45309]">점수판에 이름과 점수를 기록하는 중입니다...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-[#15803D]">
                점수판에 기록이 안전하게 저장되었습니다!
              </span>
            )}
            {saveStatus === 'error' && (
              <div className="inline-flex flex-wrap items-center justify-center gap-2 text-[#DC2626]">
                <span>{saveErrorMsg ?? '저장에 실패했습니다.'}</span>
                <button
                  type="button"
                  onClick={onRetrySave}
                  className="underline font-bold cursor-pointer"
                >
                  다시 저장
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 10 Questions Summary */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {VILLAGE_NPCS.map((npc, idx) => {
            const rec = records.find((r) => r.npcId === npc.id);
            const ok = rec?.isCorrect ?? false;
            return (
              <div
                key={npc.id}
                className={`p-2.5 border-2 text-center ${
                  ok
                    ? 'bg-[#F0FDF4] border-[#16A34A] text-[#14532D]'
                    : 'bg-[#FEF2F2] border-[#DC2626] text-[#7F1D1D]'
                }`}
              >
                <div className="text-xs font-bold opacity-80">문제 {idx + 1}</div>
                <div className="font-display text-sm truncate">{npc.name}</div>
                <div className="mt-1 flex items-center justify-center gap-1 font-mono-num text-xs font-bold">
                  {ok ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                      <span>+10점</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-[#DC2626]" />
                      <span>0점</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t-2 border-[#E7D5BE] grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onOpenScoreboard}
            className="pixel-btn flex items-center justify-center gap-2 px-5 py-3 bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#5C2D0C] font-display text-lg cursor-pointer"
          >
            <Trophy className="w-5 h-5 shrink-0" />
            <span>점수 보기</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="pixel-btn flex items-center justify-center gap-2 px-5 py-3 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#451A03] font-display text-lg cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 shrink-0" />
            <span>다시 도전하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
