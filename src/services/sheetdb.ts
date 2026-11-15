export const SHEETDB_ENDPOINT = 'https://sheetdb.io/api/v1/lwpp1r4vdtbqh';

export interface ScoreRecord {
  이름: string;
  점수: number;
}

export async function saveScoreToSheetDB(name: string, score: number): Promise<void> {
  const response = await fetch(SHEETDB_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: [
        {
          이름: name.trim(),
          점수: score,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`점수 저장에 실패했습니다. (HTTP ${response.status})`);
  }
}

export async function fetchScoresFromSheetDB(): Promise<ScoreRecord[]> {
  const response = await fetch(SHEETDB_ENDPOINT, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`점수 목록을 불러오지 못했습니다. (HTTP ${response.status})`);
  }

  const raw = (await response.json()) as Array<Record<string, unknown>>;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((row) => {
      const rawName = row['이름'] ?? row['name'] ?? '';
      const rawScore = row['점수'] ?? row['score'] ?? 0;
      const numericScore = Number(rawScore);
      return {
        이름: String(rawName).trim() || '이름 없음',
        점수: Number.isFinite(numericScore) ? numericScore : 0,
      };
    })
    .filter((entry) => entry.이름.length > 0)
    .sort((a, b) => b.점수 - a.점수);
}
