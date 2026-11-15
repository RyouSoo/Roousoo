import { RefreshCw, Trophy, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { fetchScoresFromSheetDB, type ScoreRecord } from '../services/sheetdb';

interface ScoreboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScoreboardModal({ isOpen, onClose }: ScoreboardModalProps) {
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchScoresFromSheetDB();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '점수를 불러오는 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void loadScores();
    }
  }, [isOpen, loadScores]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-[rgba(69,26,3,0.45)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scoreboard-title"
    >
      <div className="pixel-panel w-full max-w-lg p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between gap-4 pb-4 border-b-2 border-[#E7D5BE]">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-[#D97706] shrink-0" />
            <h2 id="scoreboard-title" className="font-display text-2xl text-[#451A03]">
              명예의 전당 · 점수 보기
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadScores()}
              disabled={loading}
              title="새로고침"
              className="pixel-btn p-2 bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#5C2D0C] cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="닫기"
              className="pixel-btn p-2 bg-[#FEE2E2] hover:bg-[#FECACA] text-[#7F1D1D] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 text-center text-sm font-bold text-[#78350F]">
              점수 기록을 불러오는 중입니다...
            </div>
          ) : error ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm font-bold text-[#DC2626]">{error}</p>
              <button
                type="button"
                onClick={() => void loadScores()}
                className="pixel-btn px-4 py-2 bg-[#FEF3C7] hover:bg-[#FDE68A] text-sm font-bold text-[#5C2D0C] cursor-pointer"
              >
                다시 불러오기
              </button>
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-sm font-medium text-[#78350F]">
              아직 기록된 점수가 없습니다. 첫 번째 탐험가가 되어 보세요!
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#78350F] text-xs font-bold text-[#78350F]">
                  <th className="py-2 px-3 w-16">순위</th>
                  <th className="py-2 px-3">이름</th>
                  <th className="py-2 px-3 text-right">점수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3E3C3] text-sm">
                {records.map((rec, idx) => (
                  <tr
                    key={`${rec.이름}-${idx}`}
                    className={idx < 3 ? 'bg-[#FFFBEB] font-bold' : 'bg-white/60'}
                  >
                    <td className="py-2.5 px-3 font-mono-num text-[#B45309]">
                      {idx + 1}위
                    </td>
                    <td className="py-2.5 px-3 text-[#451A03]">{rec.이름}</td>
                    <td className="py-2.5 px-3 text-right font-mono-num text-[#15803D] font-bold">
                      {rec.점수}점
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-5 pt-4 border-t-2 border-[#E7D5BE] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn px-6 py-2.5 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#451A03] font-display text-base cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
