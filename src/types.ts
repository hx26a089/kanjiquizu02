/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface KatakanaData {
  char: string;          // カタカナ (例: "ア")
  kanji: string;         // 元になった漢字 (例: "阿")
  part: string;          // 漢字のどの部分か (例: "「阿」の偏（左側の「阝」）")
  originDetail: string;  // 詳細な成り立ち解説
  strokeCount: number;    // カタカナの画数
  romaji: string;        // ローマ字
  type: 'hen' | 'tsukuri' | 'kanmuri' | 'kusa' | 'part' | 'full'; // 分類
  typeName: string;      // 分類名 (例: "偏（ひだり）", "冠（かんむり）", "全体")
  visualTips: string;     // 変形プロセスの説明や覚え方のヒント
  meaning: string;       // 元の漢字の意味
  dummyKanji?: string[];  // 紛らわしいそれっぽいダミー漢字候補
}

export interface QuizQuestion {
  id: string;
  char: string;          // クイズの対象カタカナ
  correctAnswer: string; // 正解の漢字
  options: string[];     // 4つの選択肢 (漢字)
  questionType: 'kanji_from_katakana' | 'katakana_from_kanji'; // クイズの種類
  part: string;
  originDetail: string;
  visualTips: string;
}

export interface QuizSession {
  questions: QuizQuestion[];
  currentIndex: number;
  score: number;
  answers: {
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
    timestamp: number;
  }[];
  isFinished: boolean;
}

export interface UserStats {
  totalQuizzesPlayed: number;
  correctAnswersCount: number;
  wrongAnswersCount: number;
  // カタカナごとの統計。キーはカタカナ文字（例: "ア"）
  charStats: {
    [char: string]: {
      askedCount: number;
      correctCount: number;
      isMastered: boolean; // 連続で正解した、あるいは正答率が高い
    }
  };
}
