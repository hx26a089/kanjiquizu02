/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Trophy, BarChart2, BookOpen, AlertCircle } from 'lucide-react';
import { UserStats } from '../types';
import { katakanaList } from '../data';

interface StatisticsProps {
  userStats: UserStats;
  onReset: () => void;
}

export default function Statistics({ userStats, onReset }: StatisticsProps) {
  // マスターした文字の数、学習した文字の数、未学習の数を計算
  const progressData = useMemo(() => {
    let masteredCount = 0;
    let attemptedCount = 0;

    Object.keys(userStats.charStats).forEach((char) => {
      const stat = userStats.charStats[char];
      if (stat.askedCount > 0) {
        attemptedCount += 1;
      }
      if (stat.isMastered) {
        masteredCount += 1;
      }
    });

    const totalCount = katakanaList.length;
    const unattemptedCount = totalCount - attemptedCount;

    return {
      masteredCount,
      attemptedCount,
      unattemptedCount,
      totalCount,
      masteredPercent: Math.round((masteredCount / totalCount) * 100),
      attemptedPercent: Math.round((attemptedCount / totalCount) * 100)
    };
  }, [userStats]);

  // 成り立ちタイプ別の正答率を計算
  const typeStats = useMemo(() => {
    const typesMap: { [key: string]: { label: string; correct: number; total: number } } = {
      hen: { label: '偏（へん・左）', correct: 0, total: 0 },
      tsukuri: { label: '旁（つくり・右）', correct: 0, total: 0 },
      kanmuri: { label: '冠（かんむり・上）', correct: 0, total: 0 },
      full: { label: '全体の変形', correct: 0, total: 0 },
      part: { label: '一部の省略', correct: 0, total: 0 }
    };

    katakanaList.forEach((item) => {
      const stat = userStats.charStats[item.char];
      const typeKey = item.type === 'kusa' ? 'part' : item.type;

      if (typesMap[typeKey]) {
        if (stat && stat.askedCount > 0) {
          typesMap[typeKey].correct += stat.correctCount;
          typesMap[typeKey].total += stat.askedCount;
        }
      }
    });

    return Object.keys(typesMap).map(key => {
      const type = typesMap[key];
      const accuracy = type.total > 0 ? Math.round((type.correct / type.total) * 100) : 0;
      return {
        key,
        label: type.label,
        correct: type.correct,
        total: type.total,
        accuracy
      };
    });
  }, [userStats]);

  // 全回答の正答率
  const totalAccuracy = useMemo(() => {
    const total = userStats.correctAnswersCount + userStats.wrongAnswersCount;
    return total > 0 ? Math.round((userStats.correctAnswersCount / total) * 100) : 0;
  }, [userStats]);

  return (
    <div className="p-2 max-w-sm mx-auto" id="statistics-section">
      {/* ヘッダー (PC対応でさらに小さく) */}
      <div className="mb-2.5 text-center">
        <h2 className="text-sm font-bold text-[#1A1A1A] font-serif flex items-center justify-center gap-1.5">
          <BarChart2 className="text-[#D44D26]" size={16} />
          学習進捗と成績分析
        </h2>
        <p className="text-[9.5px] text-stone-800 font-bold font-serif">
          あなたの学習データの統計と、成り立ちの理解度。
        </p>
      </div>

      <div className="space-y-2">
        
        {/* 全体マスター進捗（ドーナツ風ビジュアル） (サイズをw-20 h-20へ大幅にコンパクト化) */}
        <div className="bg-white rounded-none p-3 border border-stone-400 shadow-[3px_3px_0px_rgba(26,26,26,0.08)]">
          <h3 className="text-[8px] font-bold text-stone-850 font-serif tracking-widest mb-2.5 uppercase text-left">
            制覇の進捗
          </h3>
          
          <div className="flex flex-row items-center gap-4 justify-around">
            
            {/* プログレスサークル */}
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                <circle 
                  cx="40" 
                  cy="40" 
                  r="32" 
                  className="stroke-stone-300" 
                  strokeWidth="6" 
                  fill="transparent" 
                />
                <circle 
                  cx="40" 
                  cy="40" 
                  r="32" 
                  className="stroke-[#D44D26]" 
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - progressData.masteredPercent / 100)}`}
                  strokeLinecap="square"
                  style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                />
              </svg>
              {/* 中央テキスト */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black text-[#1A1A1A] font-serif leading-none">{progressData.masteredPercent}%</span>
                <span className="text-[7.5px] text-stone-850 font-black tracking-widest uppercase font-serif mt-0.5">Master</span>
              </div>
            </div>

            {/* 進捗数値のブレイクダウン */}
            <div className="space-y-2 w-full max-w-[160px] font-serif">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-[#1A1A1A]/85 mb-1">
                  <span className="flex items-center gap-1 text-[9px]">
                    <Trophy size={11} className="text-[#2E6F40]" />
                    マスター
                  </span>
                  <span className="font-mono text-[9px]">{progressData.masteredCount} / {progressData.totalCount}</span>
                </div>
                <div className="w-full h-1.5 bg-stone-300 rounded-none overflow-hidden">
                  <div className="h-full bg-[#2E6F40]" style={{ width: `${progressData.masteredPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold text-[#1A1A1A]/85 mb-1">
                  <span className="flex items-center gap-1 text-[9px]">
                    <BookOpen size={11} className="text-[#D44D26]" />
                    挑戦した
                  </span>
                  <span className="font-mono text-[9px]">{progressData.attemptedCount} / {progressData.totalCount}</span>
                </div>
                <div className="w-full h-1.5 bg-stone-300 rounded-none overflow-hidden">
                  <div className="h-full bg-[#D44D26]" style={{ width: `${progressData.attemptedPercent}%` }} />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* クイズ回答統計のサマリー */}
        <div className="bg-white rounded-none p-3 border border-stone-400 shadow-[3px_3px_0px_rgba(26,26,26,0.08)]">
          <h3 className="text-[8px] font-bold text-stone-850 font-serif tracking-widest mb-2 uppercase text-left">
            総合データ
          </h3>

          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-[#F3F0E9] p-2 rounded-none border border-stone-400">
              <span className="text-[8px] font-bold text-stone-850 block mb-0.5 font-serif uppercase tracking-wider">回答数</span>
              <span className="text-base font-bold font-serif text-[#1A1A1A]">
                {userStats.correctAnswersCount + userStats.wrongAnswersCount} <span className="text-[9px] text-stone-850 font-normal">回</span>
              </span>
            </div>
            <div className="bg-[#2E6F40]/5 p-2 rounded-none border border-[#2E6F40]/35">
              <span className="text-[8px] font-bold text-[#2E6F40] block mb-0.5 font-serif uppercase tracking-wider">正解数</span>
              <span className="text-base font-bold font-serif text-[#2E6F40]">
                {userStats.correctAnswersCount} <span className="text-[9px] text-[#2E6F40] font-normal">回</span>
              </span>
            </div>
            <div className="bg-[#F3F0E9] p-2 rounded-none border border-stone-400">
              <span className="text-[8px] font-bold text-stone-850 block mb-0.5 font-serif uppercase tracking-wider">正答率</span>
              <span className={`text-base font-bold font-serif ${totalAccuracy >= 80 ? 'text-[#2E6F40]' : totalAccuracy >= 50 ? 'text-[#D44D26]' : 'text-[#1A1A1A]'}`}>
                {totalAccuracy}%
              </span>
            </div>
          </div>
        </div>

        {/* 成り立ちタイプ別 正答率の可視化 */}
        <div className="bg-white rounded-none p-3 border border-stone-400 shadow-[3px_3px_0px_rgba(26,26,26,0.08)]">
          <h3 className="text-[8px] font-bold text-stone-850 font-serif tracking-widest mb-2 uppercase text-left">
            成り立ち分類別の正答率
          </h3>

          <div className="space-y-2">
            {typeStats.map((item) => (
              <div key={item.key} className="space-y-0.5">
                <div className="flex justify-between items-center text-[9.5px] font-bold">
                  <span className="text-stone-900 font-serif flex items-center gap-1">
                    <span className="w-1 h-1 bg-[#D44D26]"></span>
                    {item.label}
                  </span>
                  <span className="text-stone-850 font-serif">
                    {item.total > 0 ? `${item.accuracy}% (${item.correct}/${item.total})` : '未挑戦'}
                  </span>
                </div>
                <div className="w-full h-1 bg-stone-300 rounded-none overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.accuracy}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={`h-full rounded-none ${
                      item.total === 0 
                        ? 'bg-[#1A1A1A]/25' 
                        : item.accuracy >= 80 
                          ? 'bg-[#2E6F40]' 
                          : item.accuracy >= 50 
                            ? 'bg-[#D44D26]' 
                            : 'bg-[#1A1A1A]/70'
                    }`} 
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[8.5px] text-stone-900 font-medium mt-2 leading-relaxed flex items-start gap-1 font-serif text-left">
            <AlertCircle size={10} className="shrink-0 mt-0.5 text-[#D44D26]" />
            <span>
              「偏」や「旁」など、どのタイプの変形プロセスが覚えやすいか傾向を分析できます。
            </span>
          </p>
        </div>

        {/* データのリセット (コンパクトに) */}
        <div className="pt-1 flex justify-center">
          <button
            onClick={onReset}
            className="flex items-center gap-1 py-1.5 px-3 border border-[#D44D26]/60 bg-[#D44D26]/5 hover:bg-[#D44D26]/15 text-[#D44D26] text-[9px] font-bold uppercase tracking-widest rounded-none transition-all font-serif cursor-pointer"
            id="btn-reset-stats"
          >
            学習データを初期化する
          </button>
        </div>

      </div>
    </div>
  );
}
