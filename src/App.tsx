import { Compass, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import QuizModal from './components/QuizModal';
import ResultScreen, { type AnsweredRecord } from './components/ResultScreen';
import ScoreboardModal from './components/ScoreboardModal';
import StartScreen from './components/StartScreen';
import VillageCanvas, { type PlayerHudPosition } from './components/VillageCanvas';
import { VILLAGE_NPCS, type NpcProfile } from './data/questions';
import { saveScoreToSheetDB } from './services/sheetdb';
import { retroAudio } from './utils/sound';

export default function App() {
  const [gameMode, setGameMode] = useState<'title' | 'playing' | 'finished'>('title');
  const [playerName, setPlayerName] = useState('');
  const [score, setScore] = useState(0);
  const [answeredRecords, setAnsweredRecords] = useState<AnsweredRecord[]>([]);
  const [nearbyNpc, setNearbyNpc] = useState<NpcProfile | null>(null);
  const [activeQuizNpc, setActiveQuizNpc] = useState<NpcProfile | null>(null);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playerPos, setPlayerPos] = useState<PlayerHudPosition>({ x: 0, z: 5.5 });
  const [resetSignal, setResetSignal] = useState(0);
  const [showMinimap, setShowMinimap] = useState(true);

  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saving');
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const finalScoreSubmittedRef = useRef(false);

  const virtualInputRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });

  const completedNpcIds = useMemo(
    () => answeredRecords.map((r) => r.npcId),
    [answeredRecords],
  );

  const persistFinalScore = useCallback(async (nameToSave: string, finalScore: number) => {
    setSaveStatus('saving');
    setSaveErrorMsg(null);
    try {
      await saveScoreToSheetDB(nameToSave, finalScore);
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
      setSaveErrorMsg(
        err instanceof Error ? err.message : '점수 저장 중 오류가 발생했습니다.',
      );
    }
  }, []);

  const handleStartGame = useCallback((name: string) => {
    setPlayerName(name);
    setScore(0);
    setAnsweredRecords([]);
    setNearbyNpc(null);
    setActiveQuizNpc(null);
    setSaveStatus('saving');
    setSaveErrorMsg(null);
    finalScoreSubmittedRef.current = false;
    setResetSignal((n) => n + 1);
    setGameMode('playing');
    retroAudio.playTalk();
  }, []);

  const handleInteractNpc = useCallback(
    (npc: NpcProfile) => {
      if (gameMode !== 'playing' || activeQuizNpc) return;
      if (completedNpcIds.includes(npc.id)) return;
      retroAudio.playTalk();
      setActiveQuizNpc(npc);
    },
    [gameMode, activeQuizNpc, completedNpcIds],
  );

  const handleAnswerSubmitted = useCallback(
    (npcId: number, selectedChoiceId: string, isCorrect: boolean) => {
      // Grade only the first answer per NPC question
      setAnsweredRecords((prev) => {
        if (prev.some((r) => r.npcId === npcId)) return prev;
        return [...prev, { npcId, selectedChoiceId, isCorrect }];
      });

      if (isCorrect) {
        setScore((s) => s + 10);
        retroAudio.playCorrect();
      } else {
        retroAudio.playWrong();
      }
    },
    [],
  );

  const handleContinueFromQuiz = useCallback(() => {
    setActiveQuizNpc(null);
    if (answeredRecords.length >= VILLAGE_NPCS.length) {
      // All 10 questions completed -> stop movement and transition to Result Screen
      setNearbyNpc(null);
      setGameMode('finished');
      retroAudio.playVictory();
      if (!finalScoreSubmittedRef.current) {
        finalScoreSubmittedRef.current = true;
        void persistFinalScore(playerName, score);
      }
    }
  }, [answeredRecords.length, persistFinalScore, playerName, score]);

  const handleRestart = useCallback(() => {
    setScore(0);
    setAnsweredRecords([]);
    setNearbyNpc(null);
    setActiveQuizNpc(null);
    finalScoreSubmittedRef.current = false;
    setResetSignal((n) => n + 1);
    setGameMode('title');
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      retroAudio.setMuted(next);
      return next;
    });
  }, []);

  const setVirtualDir = (x: number, z: number) => {
    virtualInputRef.current.x = x;
    virtualInputRef.current.z = z;
  };

  const movementLocked =
    gameMode !== 'playing' || activeQuizNpc !== null || scoreboardOpen;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#DFF4FF]">
      {/* Full-viewport 3D Village Canvas */}
      <VillageCanvas
        gameMode={gameMode}
        movementLocked={movementLocked}
        completedNpcIds={completedNpcIds}
        onNearbyNpcChange={setNearbyNpc}
        onInteractNpc={handleInteractNpc}
        onPlayerMove={setPlayerPos}
        virtualInputRef={virtualInputRef}
        resetSignal={resetSignal}
      />

      {/* Playing HUD (Unobstructed Center Viewport) */}
      {gameMode === 'playing' && (
        <>
          {/* Top Status Strip */}
          <header className="pointer-events-none absolute top-4 left-4 right-4 z-10 flex items-start justify-between gap-4">
            <div className="pointer-events-auto pixel-panel px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <div className="font-display text-base text-[#451A03] whitespace-nowrap">
                {playerName}
              </div>
              <span className="text-[#D6C3A5]" aria-hidden="true">
                |
              </span>
              <div className="font-bold text-[#78350F] whitespace-nowrap">
                해결한 문제{' '}
                <span className="font-mono-num text-[#B45309]">
                  {answeredRecords.length} / {VILLAGE_NPCS.length}
                </span>
              </div>
              <span className="text-[#D6C3A5]" aria-hidden="true">
                |
              </span>
              <div className="font-bold text-[#78350F] whitespace-nowrap">
                현재 점수{' '}
                <span className="font-mono-num text-[#15803D]">{score}점</span>
              </div>
            </div>

            <div className="pointer-events-auto flex items-start gap-2.5">
              <button
                type="button"
                onClick={() => setShowMinimap((v) => !v)}
                title="마을 지도 켜기/끄기"
                className="pixel-btn p-2.5 bg-[#FFFDF6] hover:bg-[#FEF3C7] text-[#5C2D0C] cursor-pointer"
              >
                <Compass className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={toggleMute}
                title={muted ? '소리 켜기' : '소리 끄기'}
                className="pixel-btn p-2.5 bg-[#FFFDF6] hover:bg-[#FEF3C7] text-[#5C2D0C] cursor-pointer"
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </header>

          {/* Compact Corner Village Radar (helps locate remaining NPCs) */}
          {showMinimap && (
            <div className="pointer-events-none absolute top-20 right-4 z-10 pixel-panel p-2 bg-[#FFFDF6]">
              <div className="relative w-28 h-28 bg-[#D8F3DC] border-2 border-[#78350F] overflow-hidden">
                {/* Brook line on east side */}
                <div
                  className="absolute top-0 bottom-0 bg-[#38BDF8]"
                  style={{ left: '84%', width: '8%' }}
                />
                {/* Central fountain */}
                <div
                  className="absolute w-3 h-3 bg-[#9CA3AF] border border-[#451A03] -translate-x-1/2 -translate-y-1/2"
                  style={{ left: '50%', top: '50%' }}
                />
                {/* NPC markers */}
                {VILLAGE_NPCS.map((npc) => {
                  const done = completedNpcIds.includes(npc.id);
                  const leftPct = ((npc.position[0] + 28) / 56) * 100;
                  const topPct = ((npc.position[2] + 28) / 56) * 100;
                  return (
                    <div
                      key={npc.id}
                      className={`absolute w-2.5 h-2.5 border border-[#451A03] -translate-x-1/2 -translate-y-1/2 ${
                        done ? 'bg-[#22C55E]' : 'bg-[#FACC15]'
                      }`}
                      style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                    />
                  );
                })}
                {/* Student player dot */}
                <div
                  className="absolute w-3 h-3 bg-[#2563EB] border-2 border-white -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${((playerPos.x + 28) / 56) * 100}%`,
                    top: `${((playerPos.z + 28) / 56) * 100}%`,
                  }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-[#78350F] px-0.5">
                <span>나: 파랑</span>
                <span>남은 주민: 노랑</span>
              </div>
            </div>
          )}

          {/* Proximity Prompt: "스페이스바로 대화" */}
          {nearbyNpc && !activeQuizNpc && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
              <button
                type="button"
                onClick={() => handleInteractNpc(nearbyNpc)}
                className="pixel-btn px-5 py-3 bg-[#FACC15] hover:bg-[#FDE047] text-[#451A03] font-display text-lg whitespace-nowrap cursor-pointer"
              >
                {nearbyNpc.name} ({nearbyNpc.role}) · 스페이스바로 대화
              </button>
            </div>
          )}

          {/* Bottom Helper Dock + Mobile Touch D-Pad */}
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between gap-4">
            {/* Compact Mobile/Touch D-Pad (shown on small screens) */}
            <div className="pointer-events-auto sm:hidden grid grid-cols-3 gap-1 w-28">
              <div />
              <button
                type="button"
                onPointerDown={() => setVirtualDir(0, -1)}
                onPointerUp={() => setVirtualDir(0, 0)}
                onPointerLeave={() => setVirtualDir(0, 0)}
                className="pixel-btn h-9 bg-[#FFFDF6] font-bold text-sm"
                aria-label="위로 이동"
              >
                ▲
              </button>
              <div />
              <button
                type="button"
                onPointerDown={() => setVirtualDir(-1, 0)}
                onPointerUp={() => setVirtualDir(0, 0)}
                onPointerLeave={() => setVirtualDir(0, 0)}
                className="pixel-btn h-9 bg-[#FFFDF6] font-bold text-sm"
                aria-label="왼쪽 이동"
              >
                ◀
              </button>
              <button
                type="button"
                onPointerDown={() => setVirtualDir(0, 1)}
                onPointerUp={() => setVirtualDir(0, 0)}
                onPointerLeave={() => setVirtualDir(0, 0)}
                className="pixel-btn h-9 bg-[#FFFDF6] font-bold text-sm"
                aria-label="아래로 이동"
              >
                ▼
              </button>
              <button
                type="button"
                onPointerDown={() => setVirtualDir(1, 0)}
                onPointerUp={() => setVirtualDir(0, 0)}
                onPointerLeave={() => setVirtualDir(0, 0)}
                className="pixel-btn h-9 bg-[#FFFDF6] font-bold text-sm"
                aria-label="오른쪽 이동"
              >
                ▶
              </button>
            </div>

            <div className="pointer-events-auto mx-auto pixel-panel px-4 py-2 text-xs sm:text-sm font-bold text-[#78350F] whitespace-nowrap">
              이동: W A S D / 방향키 · 주민 근처에서 스페이스바로 대화
            </div>
          </div>
        </>
      )}

      {/* Start Screen Overlay */}
      {gameMode === 'title' && (
        <StartScreen
          initialName={playerName}
          onStartGame={handleStartGame}
          onOpenScoreboard={() => setScoreboardOpen(true)}
        />
      )}

      {/* NPC Quiz Modal */}
      {gameMode === 'playing' && activeQuizNpc && (
        <QuizModal
          npc={activeQuizNpc}
          questionIndex={
            answeredRecords.some((r) => r.npcId === activeQuizNpc.id)
              ? answeredRecords.length - 1
              : answeredRecords.length
          }
          totalQuestions={VILLAGE_NPCS.length}
          onAnswerSubmitted={handleAnswerSubmitted}
          onContinue={handleContinueFromQuiz}
        />
      )}

      {/* Result Screen when all 10 problems are solved */}
      {gameMode === 'finished' && (
        <ResultScreen
          playerName={playerName}
          score={score}
          records={answeredRecords}
          saveStatus={saveStatus}
          saveErrorMsg={saveErrorMsg}
          onRetrySave={() => void persistFinalScore(playerName, score)}
          onOpenScoreboard={() => setScoreboardOpen(true)}
          onRestart={handleRestart}
        />
      )}

      {/* SheetDB Scoreboard Modal */}
      <ScoreboardModal
        isOpen={scoreboardOpen}
        onClose={() => setScoreboardOpen(false)}
      />
    </div>
  );
}
