/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KatakanaData, QuizQuestion, UserStats } from '../types';
import { katakanaList } from '../data';

// 配列をシャッフルするヘルパー
export const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// クイズ問題を生成する
export const generateQuizQuestions = (
  count: number = 10,
  targetChars?: string[] // 特定の文字（復習対象など）のみをターゲットにする場合
): QuizQuestion[] => {
  // 対象となるカタカナリストを決定
  let sourceList = katakanaList;
  if (targetChars && targetChars.length > 0) {
    sourceList = katakanaList.filter(item => targetChars.includes(item.char));
  }

  // 出題用の文字をシャッフルして必要数選択
  const questionPool = shuffleArray(sourceList).slice(0, Math.min(count, sourceList.length));

  return questionPool.map((item, index) => {
    // クイズの種類を常に「カタカナを見て漢字を選ぶ」形式に固定
    const questionType = 'kanji_from_katakana';
    
    // 正解
    const correctAnswer = item.kanji;

    // ダミーの選択肢を集める
    // 固有のダミー漢字を優先して選択肢（最大3つ）を作成する
    let dummyAnswers: string[] = [];
    if (item.dummyKanji && item.dummyKanji.length > 0) {
      dummyAnswers = shuffleArray(item.dummyKanji).slice(0, 3);
    }

    // ダミー漢字が3つに満たない場合は、他のカタカナの成り立ち漢字で補填する
    if (dummyAnswers.length < 3) {
      const neededCount = 3 - dummyAnswers.length;
      const otherItems = katakanaList.filter(other => other.char !== item.char && !dummyAnswers.includes(other.kanji));
      const shuffledOthers = shuffleArray(otherItems);
      const additionalDummies = shuffledOthers.slice(0, neededCount).map(other => other.kanji);
      dummyAnswers = [...dummyAnswers, ...additionalDummies];
    }

    // 正解とダミーを混ぜてシャッフル
    const options = shuffleArray([correctAnswer, ...dummyAnswers]);

    return {
      id: `${item.char}_${index}_${Date.now()}`,
      char: item.char,
      correctAnswer,
      options,
      questionType,
      part: item.part,
      originDetail: item.originDetail,
      visualTips: item.visualTips
    };
  });
};

// ローカルストレージキーの定義
const STORAGE_KEYS = {
  REVIEW_LIST: 'katakana_origin_review_list',
  STATS: 'katakana_origin_stats',
};

// 復習リスト（間違えたカタカナの文字配列）を取得
export const getReviewList = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.REVIEW_LIST);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to parse review list', e);
    return [];
  }
};

// 復習リストに追加
export const addToReviewList = (char: string): string[] => {
  const current = getReviewList();
  if (!current.includes(char)) {
    const updated = [...current, char];
    localStorage.setItem(STORAGE_KEYS.REVIEW_LIST, JSON.stringify(updated));
    return updated;
  }
  return current;
};

// 復習リストから削除
export const removeFromReviewList = (char: string): string[] => {
  const current = getReviewList();
  const updated = current.filter(item => item !== char);
  localStorage.setItem(STORAGE_KEYS.REVIEW_LIST, JSON.stringify(updated));
  return updated;
};

// 初期統計データの生成
const createEmptyStats = (): UserStats => {
  const charStats: { [char: string]: any } = {};
  katakanaList.forEach(item => {
    charStats[item.char] = {
      askedCount: 0,
      correctCount: 0,
      isMastered: false,
    };
  });

  return {
    totalQuizzesPlayed: 0,
    correctAnswersCount: 0,
    wrongAnswersCount: 0,
    charStats,
  };
};

// 統計データを取得
export const getUserStats = (): UserStats => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.STATS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 新しいカタカナが追加された場合などのためにマージ
      const empty = createEmptyStats();
      const mergedCharStats = { ...empty.charStats, ...parsed.charStats };
      return {
        ...empty,
        ...parsed,
        charStats: mergedCharStats,
      };
    }
    return createEmptyStats();
  } catch (e) {
    console.error('Failed to parse stats', e);
    return createEmptyStats();
  }
};

// 統計データの更新
export const updateUserStats = (
  char: string,
  isCorrect: boolean
): UserStats => {
  const stats = getUserStats();

  stats.totalQuizzesPlayed += 1;
  if (isCorrect) {
    stats.correctAnswersCount += 1;
  } else {
    stats.wrongAnswersCount += 1;
  }

  if (!stats.charStats[char]) {
    stats.charStats[char] = {
      askedCount: 0,
      correctCount: 0,
      isMastered: false,
    };
  }

  const charStat = stats.charStats[char];
  charStat.askedCount += 1;
  if (isCorrect) {
    charStat.correctCount += 1;
  }

  // 連続正解判定の簡易版として、正答率が75%以上かつ出題回数が2回以上の場合にマスターとする
  const accuracy = charStat.askedCount > 0 ? (charStat.correctCount / charStat.askedCount) : 0;
  charStat.isMastered = charStat.askedCount >= 2 && accuracy >= 0.75;

  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  return stats;
};

// 統計データのリセット
export const resetUserStats = (): UserStats => {
  const empty = createEmptyStats();
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(empty));
  localStorage.removeItem(STORAGE_KEYS.REVIEW_LIST);
  return empty;
};
