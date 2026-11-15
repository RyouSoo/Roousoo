import { Play, Trophy } from 'lucide-react';
import { useRef, useState } from 'react';

interface StartScreenProps {
  initialName: string;
  onStartGame: (playerName: string) => void;
  onOpenScoreboard: () => void;
}

export default function StartScreen({
  initialName,
  onStartGame,
  onOpenScoreboard,
}: StartScreenProps) {
  const [name, setName] = useState(initialName);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg('학생 이름을 입력한 뒤 게임을 시작해 주세요.');
      inputRef.current?.focus();
      return;
    }
    setErrorMsg('');
    onStartGame(trimmed);
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-[rgba(255,248,235,0.28)]">
      <div className="pixel-panel w-full max-w-lg p-7 sm:p-8 text-center">
        <div className="mb-3 text-sm font-bold tracking-wide text-[#B45309]">
          초등학교 3학년 수학 · 분수와 사칙연산
        </div>

        <h1 className="font-display text-4xl sm:text-5xl text-[#451A03] mb-3 tracking-tight text-balance">
          분수 마을 탐험대
        </h1>

        <p className="text-sm sm:text-base text-[#78350F] leading-relaxed mb-6">
          따뜻한 3D 픽셀 마을을 걸어 다니며 열 명의 주민을 만나 보세요.
          <br />
          주민들이 내는 3학년 수학 문제를 풀면 100점에 도전할 수 있어요!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <label
              htmlFor="student-name-input"
              className="block text-sm font-bold text-[#5C2D0C] mb-1.5"
            >
              학생 이름
            </label>
            <input
              ref={inputRef}
              id="student-name-input"
              type="text"
              maxLength={16}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="이름을 입력하세요 (예: 김민수)"
              className="pixel-input w-full px-4 py-3 text-base font-bold text-[#451A03] placeholder:text-[#B45309]/60"
            />
            {errorMsg && (
              <p className="mt-1.5 text-xs font-bold text-[#DC2626]" role="alert">
                {errorMsg}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={onOpenScoreboard}
              className="pixel-btn flex items-center justify-center gap-2 px-5 py-3.5 bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#5C2D0C] font-display text-lg whitespace-nowrap cursor-pointer"
            >
              <Trophy className="w-5 h-5 shrink-0" />
              <span>점수 보기</span>
            </button>

            <button
              type="submit"
              className="pixel-btn flex items-center justify-center gap-2 px-5 py-3.5 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#451A03] font-display text-lg whitespace-nowrap cursor-pointer"
            >
              <Play className="w-5 h-5 shrink-0 fill-current" />
              <span>게임 시작하기</span>
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t-2 border-dashed border-[#E7D5BE] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-medium text-[#78350F]">
          <span>이동: W A S D 또는 방향키</span>
          <span aria-hidden="true">·</span>
          <span>대화: 스페이스바</span>
          <span aria-hidden="true">·</span>
          <span>총 10문제 (문제당 10점)</span>
        </div>
      </div>
    </div>
  );
}
