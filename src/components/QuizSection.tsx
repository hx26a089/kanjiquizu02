/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, RotateCcw, Volume2, Award, Target, Flame } from 'lucide-react';
import { QuizQuestion, KatakanaData } from '../types';
import { generateQuizQuestions, updateUserStats } from '../utils/quizHelper';
import { getKatakanaByChar } from '../data';

interface QuizSectionProps {
  onBackToMenu: () => void;
  targetChars?: string[];
  modeTitle?: string;
}

// === AudioContext による効果音合成 ===
const playGunshotSE = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // ホワイトノイズ生成
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // 低音を強調するフィルター
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

    // 音量エンベロープ
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start();
  } catch (e) {
    console.warn("Gunshot SE failed", e);
  }
};

const playCriticalSE = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(1000 + i * 350, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.4);
      
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.38);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.4);
    }
  } catch (e) {
    console.warn("Critical SE failed", e);
  }
};

const playEmptySE = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.1);
  } catch (e) {
    console.warn("Empty SE failed", e);
  }
};

const playGunLoadSE = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    
    // 金属音カチャッ
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.08);
    
    // シャキーン（ロード完了）
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1500, now + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(800, now + 0.18);
    gain2.gain.setValueAtTime(0.1, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.18);
  } catch (e) {
    console.warn("Gun load SE failed", e);
  }
};

const playFeverStartSE = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    
    // ファンファーレ（サイバー和風なピロリロリロリラーン！）
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.15, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.25);
    });
  } catch (e) {
    console.warn("Fever SE failed", e);
  }
};

const playFeverHitSE = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    // シャキーン＋爆発音
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.2);
  } catch (e) {
    console.warn("Fever Hit SE failed", e);
  }
};

export default function QuizSection({ 
  onBackToMenu, 
  targetChars,
  modeTitle = '通常クイズ'
}: QuizSectionProps) {
  // クイズ設定
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  // シューティングゲーム要素のState
  const [ammo, setAmmo] = useState<number>(3);
  const [shootMode, setShootMode] = useState<'shoot' | 'select'>('select');
  const [screenShake, setScreenShake] = useState<boolean>(false);
  // 各オプションに対する射撃ヒット情報
  const [panelHits, setPanelHits] = useState<{
    [option: string]: { x: number; y: number; isCritical: boolean; width: number; height: number }[];
  }>({});

  // フィーバーモードのState
  const [isFeverMode, setIsFeverMode] = useState<boolean>(false);
  const [feverTimeLeft, setFeverTimeLeft] = useState<number>(3.0);

  // 回答状況
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [sessionWrongAnswers, setSessionWrongAnswers] = useState<string[]>([]);
  
  // クイズ終了
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // カタカナの音声再生
  const playSound = (char: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(char);
      utterance.lang = 'ja-JP';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // クイズ開始
  const handleStartQuiz = (count: number) => {
    const generated = generateQuizQuestions(count, targetChars);
    setQuestions(generated);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setSessionWrongAnswers([]);
    setQuizFinished(false);
    
    // シューティング状態リセット
    setAmmo(3);
    setShootMode('select');
    setPanelHits({});
    setIsFeverMode(false);
    setFeverTimeLeft(3.0);
    
    setQuizStarted(true);
  };

  // 対象がある場合は自動的に初期化
  useEffect(() => {
    if (targetChars && targetChars.length > 0) {
      handleStartQuiz(targetChars.length);
    }
  }, [targetChars]);

  // フィーバーモードのカウントダウンタイマー処理
  useEffect(() => {
    let intervalId: any;
    if (isFeverMode && feverTimeLeft > 0 && !hasAnswered) {
      intervalId = setInterval(() => {
        setFeverTimeLeft((prev) => {
          if (prev <= 0.1) {
            clearInterval(intervalId);
            handleFeverTimeout();
            return 0;
          }
          return parseFloat((prev - 0.1).toFixed(1));
        });
      }, 100);
    }
    return () => clearInterval(intervalId);
  }, [isFeverMode, feverTimeLeft, hasAnswered]);

  // フィーバーモード時間切れ時の処理
  const handleFeverTimeout = () => {
    setIsFeverMode(false);
    setShootMode('select');
    
    const currentQuestion = questions[currentIndex];
    if (currentQuestion) {
      setSessionWrongAnswers(prev => {
        if (!prev.includes(currentQuestion.char)) {
          return [...prev, currentQuestion.char];
        }
        return prev;
      });
      // 統計データ更新 (タイムアウトは不正解)
      updateUserStats(currentQuestion.char, false);
    }
    
    proceedToNext();
  };

  // フィーバーモード終了＆次へ
  const endFeverAndProceed = (correct: boolean) => {
    setIsFeverMode(false);
    setHasAnswered(true);
    playFeverHitSE();
    
    const currentQuestion = questions[currentIndex];
    if (currentQuestion) {
      if (correct) {
        setScore(prev => prev + 1);
        updateUserStats(currentQuestion.char, true);
        playSound(currentQuestion.char);
      }
    }

    setTimeout(() => {
      proceedToNext();
    }, 450); // 0.45秒後に即進行
  };

  // モード切り替え
  const toggleMode = (mode: 'shoot' | 'select') => {
    if (isFeverMode) return; // フィーバー中は切り替え不可
    if (mode === 'shoot') {
      if (ammo <= 0) {
        playEmptySE();
        return;
      }
      playGunLoadSE();
    }
    setShootMode(mode);
  };

  // オプション射撃処理
  const handleShootOption = (option: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (hasAnswered) return;

    // フィーバーモード中の射撃ロジック
    if (isFeverMode) {
      playGunshotSE();
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 200);

      const currentQuestion = questions[currentIndex];
      const isCorrectOption = option === currentQuestion.correctAnswer;

      // 撃ち抜いた箇所に弾痕追加
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.nativeEvent.offsetX;
      const clickY = e.nativeEvent.offsetY;
      const percentX = (clickX / rect.width) * 100;
      const percentY = (clickY / rect.height) * 100;

      const hit = {
        x: percentX,
        y: percentY,
        isCritical: true, // フィーバー中は全弾クリティカル
        width: rect.width,
        height: rect.height
      };

      setPanelHits(prev => ({
        ...prev,
        [option]: [...(prev[option] || []), hit]
      }));

      playCriticalSE();

      // 丸（正解）に当たったら、即座に次の問題に進む！
      if (isCorrectOption) {
        endFeverAndProceed(true);
      }
      return;
    }

    // 通常モード中の射撃ロジック
    if (ammo <= 0) {
      playEmptySE();
      setShootMode('select');
      return;
    }

    // 弾薬消費
    const newAmmo = ammo - 1;
    setAmmo(newAmmo);
    playGunshotSE();

    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.nativeEvent.offsetX;
    const clickY = e.nativeEvent.offsetY;
    const percentX = (clickX / rect.width) * 100;
    const percentY = (clickY / rect.height) * 100;

    const currentQuestion = questions[currentIndex];
    const isCritical = (percentX >= 35 && percentX <= 65) && (percentY >= 30 && percentY <= 70);

    const hit = {
      x: percentX,
      y: percentY,
      isCritical,
      width: rect.width,
      height: rect.height
    };

    setPanelHits(prev => ({
      ...prev,
      [option]: [...(prev[option] || []), hit]
    }));

    if (isCritical) {
      playCriticalSE();
    }

    if (newAmmo <= 0) {
      setShootMode('select');
    }
  };

  // 通常の選択回答
  const handleSelectOption = (option: string) => {
    if (hasAnswered) return;

    setSelectedAnswer(option);
    setHasAnswered(true);

    const currentQuestion = questions[currentIndex];
    const correct = option === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    // 統計データ更新
    updateUserStats(currentQuestion.char, correct);

    let nextScore = score;
    if (correct) {
      nextScore = score + 1;
      setScore(nextScore);
    } else {
      setSessionWrongAnswers(prev => {
        if (!prev.includes(currentQuestion.char)) {
          return [...prev, currentQuestion.char];
        }
        return prev;
      });
    }

    playSound(currentQuestion.char);

    // 解説なしテンポアップ仕様：1秒後に自動で次へ
    setTimeout(() => {
      // 5問正解（5の倍数に達した）かつ正解した時、フィーバーモードを起動する！
      if (correct && nextScore > 0 && nextScore % 5 === 0) {
        triggerFeverMode();
      } else {
        proceedToNext();
      }
    }, 1000);
  };

  // フィーバーモード突入処理
  const triggerFeverMode = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setAmmo(99); // フィーバー中は∞弾薬
      setShootMode('shoot'); // 強制的に射撃モード
      setPanelHits({});
      setIsFeverMode(true);
      setFeverTimeLeft(3.0);
      playFeverStartSE();
    } else {
      setQuizFinished(true);
    }
  };

  // 次の問題へ進む通常処理
  const proceedToNext = () => {
    setSelectedAnswer(null);
    setHasAnswered(false);
    setAmmo(3);
    setShootMode('select');
    setPanelHits({});
    setIsFeverMode(false);
    setFeverTimeLeft(3.0);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const currentQuestion = questions[currentIndex];

  // 設定画面 (よりコンパクトに)
  if (!quizStarted) {
    return (
      <div className="flex flex-col items-center justify-center p-2 text-center max-w-sm mx-auto" id="quiz-setup">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-none p-4 border border-[#1A1A1A]/10 shadow-[3px_3px_0px_rgba(26,26,26,0.04)] w-full"
        >
          <div className="inline-flex p-2 bg-[#D44D26]/10 text-[#D44D26] rounded-none mb-2 border border-[#D44D26]/15">
            <Award size={24} />
          </div>
          <h2 className="text-base font-bold text-[#1A1A1A] mb-1 font-serif">
            カタカナ成り立ちシューティング
          </h2>
          <p className="text-[#1A1A1A]/60 text-[10px] mb-4 leading-normal font-serif">
            カタカナのルーツとなった漢字を射撃で透かして見破るクイズゲーム！ 弾丸を撃ち込んで後ろに隠された⭕️❌を暴き、正しい漢字を選択しましょう！
          </p>

          <div className="mb-4">
            <label className="block text-[#1A1A1A]/70 text-[9px] uppercase tracking-widest font-bold mb-1.5 font-serif">
              出題する問題数を選んでください
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[5, 10, 20].map((num) => (
                <button
                  key={num}
                  onClick={() => setQuestionCount(num)}
                  className={`py-1 px-2 rounded-none border text-[10px] font-bold transition-all font-serif cursor-pointer ${
                    questionCount === num
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-2xs'
                      : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/10 hover:bg-[#F3F0E9]'
                  }`}
                  id={`btn-count-${num}`}
                >
                  {num}問
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 max-w-xs mx-auto">
            <button
              onClick={() => handleStartQuiz(questionCount)}
              className="w-full py-2 bg-[#D44D26] hover:bg-[#D44D26]/90 text-white font-bold rounded-none transition-all font-serif flex items-center justify-center gap-1 text-[10px] uppercase tracking-widest cursor-pointer"
              id="btn-start-quiz"
            >
              ゲームを始める
            </button>
            <button
              onClick={onBackToMenu}
              className="w-full py-1.5 bg-transparent hover:bg-[#1A1A1A]/5 text-[#1A1A1A] border border-[#1A1A1A]/35 font-bold rounded-none transition-all text-[9px] uppercase tracking-widest cursor-pointer"
              id="btn-cancel-quiz"
            >
              メニューに戻る
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // クイズ結果画面 (コンパクトに)
  if (quizFinished) {
    const accuracy = Math.round((score / questionCount) * 100);
    
    return (
      <div className="p-2 max-w-sm mx-auto" id="quiz-result">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-none p-4 border border-[#1A1A1A]/10 shadow-[3px_3px_0px_rgba(26,26,26,0.04)] text-center"
        >
          <div className="inline-flex p-2.5 bg-[#D44D26]/10 text-[#D44D26] border border-[#D44D26]/15 rounded-none mb-2">
            <Award size={30} className="animate-bounce" />
          </div>
          
          <h2 className="text-base font-bold text-[#1A1A1A] mb-0.5 font-serif">
            作戦終了！
          </h2>
          <p className="text-[#1A1A1A]/40 text-[8px] mb-3 font-serif tracking-widest uppercase">
            {modeTitle.toUpperCase()} RESULTS
          </p>

          <div className="bg-[#F3F0E9] rounded-none p-2.5 border border-[#1A1A1A]/10 mb-3 max-w-xs mx-auto">
            <div className="grid grid-cols-2 gap-2 divide-x divide-[#1A1A1A]/10">
              <div>
                <span className="text-[8px] text-[#1A1A1A]/50 block mb-0.5 font-serif uppercase tracking-wider">正解数</span>
                <span className="text-lg font-black text-[#1A1A1A] font-serif">
                  {score} <span className="text-[10px] text-[#1A1A1A]/40 font-normal">/ {questionCount}問</span>
                </span>
              </div>
              <div>
                <span className="text-[8px] text-[#1A1A1A]/50 block mb-0.5 font-serif uppercase tracking-wider">正答率</span>
                <span className={`text-lg font-black font-serif ${accuracy >= 80 ? 'text-[#2E6F40]' : accuracy >= 50 ? 'text-[#A05C1B]' : 'text-[#D44D26]'}`}>
                  {accuracy}%
                </span>
              </div>
            </div>
          </div>

          {sessionWrongAnswers.length > 0 ? (
            <div className="mb-4 text-left bg-[#F3F0E9]/40 rounded-none p-2.5 border border-[#1A1A1A]/10">
              <h3 className="text-[10px] font-bold text-[#D44D26] mb-1 flex items-center gap-1 font-serif">
                <span className="w-3 h-3 bg-[#D44D26] text-white rounded-none flex items-center justify-center text-[8px] font-black">X</span>
                間違えた文字（{sessionWrongAnswers.length}文字）
              </h3>
              <p className="text-[10px] text-[#1A1A1A]/60 mb-2 leading-tight font-serif">
                成り立ち漢字をもう一度復習しましょう！タップで発音が再生されます。
              </p>
              <div className="flex flex-wrap gap-1">
                {sessionWrongAnswers.map((char) => {
                  const data = getKatakanaByChar(char);
                  return (
                    <div 
                      key={char} 
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white rounded-none border border-[#1A1A1A]/10 text-[10px] font-bold shadow-2xs hover:bg-[#F3F0E9] transition-all cursor-pointer"
                      onClick={() => playSound(char)}
                    >
                      <span className="text-[#D44D26] font-black font-serif">{char}</span>
                      <span className="text-[#1A1A1A]/30 font-serif">←</span>
                      <span className="text-[#1A1A1A]/80 font-serif">{data?.kanji}</span>
                      <Volume2 size={8} className="text-[#1A1A1A]/30" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mb-4 bg-[#2E6F40]/10 rounded-none p-3 border border-[#2E6F40]/25">
              <h3 className="text-[11px] font-bold text-[#2E6F40] mb-0.5 flex items-center justify-center gap-1 font-serif">
                🎉 パーフェクト！
              </h3>
              <p className="text-[10px] text-[#2E6F40]/80 leading-normal font-serif">
                すべての成り立ちを完全にマスターしました！
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5 max-w-xs mx-auto">
            <button
              onClick={() => handleStartQuiz(questionCount)}
              className="w-full py-1.5 bg-[#1A1A1A] hover:bg-[#D44D26] text-white text-[9px] uppercase tracking-widest font-bold rounded-none shadow-2xs transition-all font-serif flex items-center justify-center gap-1 cursor-pointer"
              id="btn-retry-quiz"
            >
              <RotateCcw size={10} />
              もう一度挑戦
            </button>
            <button
              onClick={onBackToMenu}
              className="w-full py-1.5 bg-transparent hover:bg-[#1A1A1A]/5 text-[#1A1A1A] border border-[#1A1A1A]/30 text-[9px] uppercase tracking-widest font-bold rounded-none transition-all cursor-pointer"
              id="btn-back-to-menu"
            >
              メニューに戻る
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // クイズ本編画面
  return (
    <div className="p-2 max-w-sm mx-auto relative select-none" id="quiz-play">
      
      {/* フィーバーモード特有の炎のエフェクトヘッダー */}
      {isFeverMode && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: [1, 1.05, 1], opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="bg-linear-to-r from-red-600 via-orange-500 to-yellow-500 text-white p-1.5 mb-2 rounded-none flex items-center justify-center gap-1 border border-red-700 shadow-lg"
        >
          <Flame size={14} className="animate-bounce" />
          <span className="text-[10px] font-black tracking-widest uppercase font-serif animate-pulse">
            🔥 FEVER MODE ACTIVE 🔥
          </span>
          <Flame size={14} className="animate-bounce" />
        </motion.div>
      )}

      {/* 進行状況バー */}
      <div className="flex justify-between items-center mb-1 px-0.5">
        <span className="text-[8px] font-bold text-[#1A1A1A]/40 font-serif uppercase tracking-widest">
          Q {currentIndex + 1} / {questions.length}
        </span>
        <div className="flex items-center gap-1 bg-white text-[#1A1A1A]/70 text-[8px] font-bold px-1.5 py-0.5 rounded-none border border-[#1A1A1A]/10 font-serif">
          <span>正答: {score}</span>
        </div>
      </div>
      <div className="w-full h-0.5 bg-[#1A1A1A]/10 overflow-hidden mb-2">
        <div 
          className={`h-full transition-all duration-300 ${isFeverMode ? 'bg-orange-500' : 'bg-[#D44D26]'}`}
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* フィーバータイマーバー（3秒カウントダウン） */}
      {isFeverMode && (
        <div className="mb-2 bg-stone-200 border border-red-500/30 p-0.5">
          <div className="flex justify-between text-[7px] font-bold text-red-600 px-0.5 mb-0.5">
            <span>FEVER LIMIT</span>
            <span>{feverTimeLeft.toFixed(1)}s</span>
          </div>
          <div className="w-full h-2 bg-stone-300 overflow-hidden">
            <motion.div 
              className="h-full bg-linear-to-r from-red-600 to-orange-500"
              style={{ width: `${(feverTimeLeft / 3.0) * 100}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
        </div>
      )}

      {/* 銃弾とモード選択 */}
      <div className={`p-2 mb-2 rounded-none flex flex-row justify-between items-center gap-1.5 border shadow-[2px_2px_0px_rgba(26,26,26,0.1)] transition-colors ${
        isFeverMode ? 'bg-red-950 border-red-800 text-white' : 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
      }`}>
        {/* 弾薬 */}
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-bold uppercase tracking-widest text-white/40 font-serif">AMMO:</span>
          {isFeverMode ? (
            <div className="flex items-center gap-1">
              <Target size={11} className="text-orange-400 fill-orange-400 animate-spin" />
              <span className="text-[10px] font-black text-orange-400 tracking-wider animate-pulse">打ち放題 (∞)</span>
            </div>
          ) : (
            <div className="flex gap-0.5" id="ammo-container">
              {[1, 2, 3].map((bullet) => (
                <motion.span 
                  key={bullet}
                  initial={{ scale: 1 }}
                  animate={bullet <= ammo ? { scale: [1, 1.2, 1] } : { scale: 0.5, opacity: 0.1 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block"
                >
                  <Target size={11} className={bullet <= ammo ? "text-[#D44D26] fill-[#D44D26]" : "text-white/25"} />
                </motion.span>
              ))}
            </div>
          )}
          {!isFeverMode && <span className="text-[9px] font-serif font-black text-white/80">({ammo})</span>}
        </div>

        {/* モードトグル */}
        <div className="flex bg-[#F3F0E9]/10 p-0.5 border border-white/10 rounded-none shrink-0">
          <button
            onClick={() => toggleMode('shoot')}
            disabled={isFeverMode || ammo <= 0 || hasAnswered}
            className={`px-2 py-0.5 text-[8px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-1 font-serif cursor-pointer ${
              isFeverMode || (shootMode === 'shoot' && ammo > 0)
                ? 'bg-[#D44D26] text-white'
                : 'text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
            id="btn-mode-shoot"
          >
            <span>🔫 撃ち抜く</span>
          </button>
          <button
            onClick={() => toggleMode('select')}
            disabled={isFeverMode || hasAnswered}
            className={`px-2 py-0.5 text-[8px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-1 font-serif cursor-pointer ${
              shootMode === 'select' || ammo <= 0
                ? 'bg-white text-[#1A1A1A]'
                : 'text-white/50 hover:text-white'
            }`}
            id="btn-mode-select"
          >
            <span>👆 答える</span>
          </button>
        </div>
      </div>

      {/* シューティングスコープ・照準フレーム */}
      <AnimatePresence>
        {shootMode === 'shoot' && !hasAnswered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-30"
          >
            <div className={`absolute inset-0 border-2 border-dashed animate-pulse ${
              isFeverMode ? 'border-orange-500/60' : 'border-[#D44D26]/40'
            }`} />
            
            <div className={`absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 ${isFeverMode ? 'border-orange-500' : 'border-[#D44D26]'}`} />
            <div className={`absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 ${isFeverMode ? 'border-orange-500' : 'border-[#D44D26]'}`} />
            <div className={`absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 ${isFeverMode ? 'border-orange-500' : 'border-[#D44D26]'}`} />
            <div className={`absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 ${isFeverMode ? 'border-orange-500' : 'border-[#D44D26]'}`} />

            <motion.div 
              initial={{ y: 80, x: 20, rotate: 10 }}
              animate={{ y: 0, x: 0, rotate: 0 }}
              exit={{ y: 80, x: 20, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              className="absolute bottom-2 right-4 w-16 h-16 opacity-90 filter drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)] flex items-center justify-center"
            >
              <svg viewBox="0 0 64 64" className={`w-14 h-14 fill-current ${isFeverMode ? 'text-orange-500' : 'text-[#D44D26]'}`}>
                <path d="M12 28h24v6H12zM28 34h12v4H28z" />
                <path d="M34 34l8 18h-6l-8-18z" />
                <path d="M30 38h4v4h-4z" />
                <path d="M2 30h10v2H2z" className="opacity-60 animate-pulse" />
              </svg>
            </motion.div>

            <div className={`absolute top-6 left-1/2 -translate-x-1/2 text-white text-[7px] px-1.5 py-0.5 font-mono uppercase tracking-widest font-bold shadow-2xs ${
              isFeverMode ? 'bg-orange-600 animate-ping' : 'bg-[#D44D26]'
            }`}>
              {isFeverMode ? 'FEVER LOCK-ON' : 'LOCK-ON ACTIVE'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 問題カード */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 15 }}
          animate={screenShake ? {
            x: [0, -6, 6, -4, 4, -2, 2, 0],
            y: [0, 4, -4, 3, -3, 1, -1, 0],
            transition: { duration: 0.18 }
          } : { opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 }}
          transition={{ duration: 0.15 }}
          className={`bg-white rounded-none p-3 border shadow-[3px_3px_0px_rgba(26,26,26,0.02)] transition-all duration-300 ${
            isFeverMode 
              ? 'bg-red-50/40 border-red-500/30 ring-2 ring-red-500/20' 
              : shootMode === 'shoot' && !hasAnswered 
                ? 'bg-[#D44D26]/2 border-[#D44D26]/20' 
                : 'border-[#1A1A1A]/10'
          }`}
        >
          {/* 問題タイトル */}
          <div className="text-center mb-2">
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-none inline-block mb-1 font-serif uppercase tracking-widest ${
              isFeverMode
                ? 'bg-orange-600 text-white'
                : shootMode === 'shoot' && !hasAnswered 
                  ? 'bg-[#D44D26] text-white border border-[#D44D26]' 
                  : 'bg-[#D44D26]/10 text-[#D44D26] border border-[#D44D26]/20'
            }`}>
              {isFeverMode ? 'Fever Bullet Storm' : shootMode === 'shoot' && !hasAnswered ? 'Shooting Ready' : 'Origins Trace Mode'}
            </span>
            
            <h3 className="text-xs font-bold text-[#1A1A1A] font-serif leading-tight">
              「<span className="text-sm font-black text-[#D44D26] font-serif underline decoration-[#D44D26]/30 underline-offset-2">{currentQuestion.char}</span>」の成り立ちの漢字は？
            </h3>
          </div>

          {/* 出題用の文字のビジュアル表示 */}
          <div className="flex justify-center items-center gap-2 mb-2.5">
            <div className={`relative flex justify-center items-center w-14 h-14 bg-white rounded-none border shadow-xs ${
              isFeverMode ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-[#1A1A1A]/10'
            }`}>
              <span className={`text-2xl font-serif font-black ${isFeverMode ? 'text-orange-600' : 'text-[#1A1A1A]'}`}>
                {currentQuestion.char}
              </span>
              <button 
                onClick={() => playSound(currentQuestion.char)}
                className="absolute bottom-0.5 right-0.5 p-0.5 bg-white hover:bg-[#F3F0E9] active:scale-95 text-[#1A1A1A]/40 hover:text-[#1A1A1A] rounded-none border border-[#1A1A1A]/20 shadow-xs transition-all cursor-pointer"
                title="音声を再生"
              >
                <Volume2 size={9} />
              </button>
            </div>
          </div>

          {/* シューティングギミック説明 */}
          {!hasAnswered && (
            <div className="text-center mb-2.5 text-[8px] font-serif uppercase tracking-wider flex items-center justify-center gap-1 bg-[#F3F0E9]/50 py-0.5 border border-[#1A1A1A]/5">
              {isFeverMode ? (
                <>
                  <Flame size={9} className="text-orange-500 animate-pulse" />
                  <span className="text-orange-700 font-bold">【フィーバー】丸(正解)を撃ち抜けば即次の問題へ！</span>
                </>
              ) : shootMode === 'shoot' && ammo > 0 ? (
                <>
                  <Target size={9} className="text-[#D44D26] animate-pulse" />
                  <span>漢字パネルをクリックして射撃！ 裏が透けて見えます！</span>
                </>
              ) : (
                <>
                  <span>👆 正しいと思う漢字を選択して回答しましょう！</span>
                </>
              )}
            </div>
          )}

          {/* 選択肢ボタン */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === currentQuestion.correctAnswer;
              const hits = panelHits[option] || [];
              
              const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
                if (shootMode === 'shoot' || isFeverMode) {
                  handleShootOption(option, e);
                } else {
                  handleSelectOption(option);
                }
              };

              let borderClass = 'border-[#1A1A1A]/10';
              let textOpacity = 'opacity-100';
              let cursorStyle = (shootMode === 'shoot' || isFeverMode) && !hasAnswered ? 'cursor-crosshair' : 'cursor-pointer';

              if (hasAnswered) {
                if (isCorrectOption) {
                  borderClass = 'border-[#2E6F40]';
                } else if (isSelected) {
                  borderClass = 'border-[#D44D26]';
                } else {
                  textOpacity = 'opacity-30';
                }
              }

              const isShootingTargetStyle = (shootMode === 'shoot' || isFeverMode) && !hasAnswered;

              return (
                <button
                  key={option}
                  onClick={handleClick}
                  disabled={hasAnswered}
                  className={`h-11 rounded-none border font-bold font-serif transition-all relative overflow-hidden flex items-center justify-center bg-white ${borderClass} ${textOpacity} ${cursorStyle} ${
                    isShootingTargetStyle 
                      ? isFeverMode 
                        ? 'hover:border-orange-500 bg-orange-50/20' 
                        : 'hover:border-[#D44D26] bg-[#D44D26]/2' 
                      : 'hover:bg-[#F3F0E9]/30'
                  }`}
                  id={`btn-option-${option}`}
                >
                  {/* 的を模した同心円 */}
                  {isShootingTargetStyle && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-20">
                      <div className={`w-8 h-8 rounded-full border ${isFeverMode ? 'border-orange-500' : 'border-[#D44D26]'}`} />
                      <div className={`w-4 h-4 rounded-full border absolute ${isFeverMode ? 'border-orange-500' : 'border-[#D44D26]'}`} />
                    </div>
                  )}

                  {/* レイヤー1: 裏レイヤー（隠された⭕️❌） */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-85 select-none pointer-events-none">
                    {isCorrectOption ? (
                      <span className="text-[#2E6F40] text-[36px] font-black tracking-normal leading-none select-none font-serif">⭕️</span>
                    ) : (
                      <span className="text-[#D44D26] text-[36px] font-black tracking-normal leading-none select-none font-serif">❌</span>
                    )}
                  </div>

                  {/* レイヤー2: カバー（表レイヤー。漢字） */}
                  <div 
                    className="absolute inset-0 bg-white flex items-center justify-between px-3 transition-all duration-300 pointer-events-none opacity-100"
                    style={{
                      backgroundColor: isShootingTargetStyle ? '#FAF6F0' : '#FFFFFF'
                    }}
                  >
                    <span className="text-[7px] uppercase tracking-widest opacity-25 font-serif select-none">Opt</span>
                    <span className="text-xl font-serif font-black text-[#1A1A1A]">{option}</span>
                    <div className="w-2" />
                  </div>

                  {/* レイヤー3: 弾痕 */}
                  {hits.map((hit, i) => {
                    const btnW = hit.width || 120;
                    const btnH = hit.height || 44;

                    return (
                      <div
                        key={i}
                        style={{
                          left: `${hit.x}%`,
                          top: `${hit.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className={`absolute w-5 h-5 rounded-full border shadow-inner overflow-hidden bg-transparent pointer-events-none select-none z-10 ${
                          isFeverMode ? 'border-orange-500' : 'border-[#1A1A1A]'
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#1A1A1A]/85 to-transparent opacity-50 mix-blend-multiply" />
                        
                        <div 
                          style={{
                            position: 'absolute',
                            width: `${btnW}px`,
                            height: `${btnH}px`,
                            left: `-${(hit.x * btnW) / 100 - 10}px`,
                            top: `-${(hit.y * btnH) / 100 - 10}px`,
                          }}
                          className="flex items-center justify-center pointer-events-none select-none"
                        >
                          {isCorrectOption ? (
                            <span className="text-[#2E6F40] text-[36px] font-black leading-none">⭕️</span>
                          ) : (
                            <span className="text-[#D44D26] text-[36px] font-black leading-none">❌</span>
                          )}
                        </div>
                        
                        <div className={`absolute inset-0 border rounded-full scale-90 ${isFeverMode ? 'border-orange-500/70' : 'border-[#1A1A1A]/70'}`} />
                        {hit.isCritical && (
                          <div className={`absolute inset-0 animate-ping rounded-full ${isFeverMode ? 'bg-orange-500/25' : 'bg-[#D44D26]/25'}`} />
                        )}
                      </div>
                    );
                  })}

                  {/* レイヤー4: 正解判定後のフル表示マーク */}
                  {hasAnswered && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-transparent z-20">
                      {isCorrectOption && (
                        <div className="absolute inset-0 bg-[#2E6F40]/10 flex items-center justify-center border-2 border-[#2E6F40]">
                          <Check size={24} className="text-[#2E6F40]" />
                        </div>
                      )}
                      {isSelected && !isCorrectOption && (
                        <div className="absolute inset-0 bg-[#D44D26]/10 flex items-center justify-center border-2 border-[#D44D26]">
                          <X size={24} className="text-[#D44D26]" />
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 回答・判定中のクイックフラッシュエフェクト */}
          <AnimatePresence>
            {hasAnswered && !isFeverMode && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-center py-1.5"
                id="quick-answer-feedback"
              >
                <div className="flex items-center gap-1.5 justify-center">
                  {isCorrect ? (
                    <span className="flex items-center gap-0.5 px-3 py-1 bg-[#2E6F40] text-white rounded-none font-bold text-[10px] font-serif uppercase tracking-widest animate-bounce">
                      ⭕️ 正解！
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 px-3 py-1 bg-[#D44D26] text-white rounded-none font-bold text-[10px] font-serif uppercase tracking-widest animate-pulse">
                      ❌ 不正解
                    </span>
                  )}
                  {!isCorrect && (
                    <span className="text-[10px] text-[#1A1A1A] font-bold font-serif">
                      正解は: {currentQuestion.correctAnswer}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
