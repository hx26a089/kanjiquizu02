/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Search, Filter, Volume2, Trophy, Sparkles } from 'lucide-react';
import { katakanaList } from '../data';
import { UserStats } from '../types';
import KanjiOriginVisualizer from './KanjiOriginVisualizer';

interface CharacterDictionaryProps {
  userStats: UserStats;
  selectedChar: string;
  setSelectedChar: (char: string) => void;
}

type SortKey = 'goyuon' | 'stroke' | 'type';

export default function CharacterDictionary({ 
  userStats,
  selectedChar,
  setSelectedChar
}: CharacterDictionaryProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('goyuon');

  // 音声再生
  const playSound = (char: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(char);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // カタカナリストをフィルタリング・ソート
  const processedList = useMemo(() => {
    let result = [...katakanaList];

    // 検索フィルタ
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.char.toLowerCase().includes(term) ||
        item.kanji.toLowerCase().includes(term) ||
        item.romaji.toLowerCase().includes(term) ||
        item.meaning.toLowerCase().includes(term) ||
        item.originDetail.toLowerCase().includes(term)
      );
    }

    // 分類フィルタ
    if (selectedType !== 'all') {
      result = result.filter(item => item.type === selectedType);
    }

    // ソート
    if (sortBy === 'stroke') {
      result.sort((a, b) => a.strokeCount - b.strokeCount || a.char.localeCompare(b.char));
    } else if (sortBy === 'type') {
      result.sort((a, b) => a.type.localeCompare(b.type) || a.char.localeCompare(b.char));
    }

    return result;
  }, [searchTerm, selectedType, sortBy]);

  // 現在選択されている文字の詳細データ
  const activeData = useMemo(() => {
    return katakanaList.find(item => item.char === selectedChar) || katakanaList[0];
  }, [selectedChar]);

  // 各文字のマスター状況
  const getCharStatus = (char: string) => {
    const stat = userStats.charStats[char];
    const isMastered = stat?.isMastered || false;
    return { isMastered };
  };

  return (
    <div className="p-2 max-w-sm mx-auto" id="dictionary-section">
      {/* タイトル (PC対応でさらに小さく) */}
      <div className="mb-2 text-center">
        <h2 className="text-sm font-bold text-[#1A1A1A] font-serif flex items-center justify-center gap-1.5">
          <BookOpen className="text-[#D44D26]" size={16} />
          カタカナ成り立ち図鑑
        </h2>
        <p className="text-[9.5px] text-stone-800 font-bold font-serif">
          46文字の成り立ちとルーツ漢字を詳しく調べられます。
        </p>
      </div>

      {/* コントロール・グリッドをぎゅっと1つにまとめたカード */}
      <div className="bg-white rounded-none p-3 border border-stone-400 shadow-[3px_3px_0px_rgba(26,26,26,0.08)] space-y-2 mb-2">
        {/* 検索入力 */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-700" size={12} />
          <input
            type="text"
            placeholder="文字、元の漢字、意味から検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#F3F0E9] border border-stone-400 rounded-none text-[10px] placeholder-stone-600 font-semibold text-[#1A1A1A] focus:outline-hidden focus:border-[#D44D26] focus:bg-white transition-all font-serif"
            id="dict-search-input"
          />
        </div>

        {/* フィルター・ソート (高さを低く横並びに) */}
        <div className="flex justify-between items-center text-[9px] pt-1.5 border-t border-stone-400">
          <div className="flex items-center gap-1">
            <span className="text-stone-850 font-black font-serif uppercase tracking-wider flex items-center gap-0.5">
              <Filter size={8} />
              分類:
            </span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-[#F3F0E9] border border-stone-400 rounded-none text-[9px] font-black py-0.5 px-1 text-stone-900 focus:outline-hidden transition-all font-serif cursor-pointer"
              id="dict-filter-type"
            >
              <option value="all">すべて</option>
              <option value="hen">偏（ひだり）</option>
              <option value="tsukuri">旁（みぎ）</option>
              <option value="kanmuri">冠（うえ）</option>
              <option value="full">全体の変形</option>
              <option value="part">一部の省略</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-stone-850 font-black font-serif uppercase">順序:</span>
            <div className="inline-flex bg-[#F3F0E9] p-0.5 rounded-none border border-stone-400">
              <button
                onClick={() => setSortBy('goyuon')}
                className={`text-[8px] font-black px-1.5 py-0.5 rounded-none transition-all font-serif cursor-pointer ${sortBy === 'goyuon' ? 'bg-[#1A1A1A] text-white' : 'text-stone-800 hover:text-[#1A1A1A]'}`}
                id="btn-sort-goyuon"
              >
                五十音
              </button>
              <button
                onClick={() => setSortBy('stroke')}
                className={`text-[8px] font-black px-1.5 py-0.5 rounded-none transition-all font-serif cursor-pointer ${sortBy === 'stroke' ? 'bg-[#1A1A1A] text-white' : 'text-stone-800 hover:text-[#1A1A1A]'}`}
                id="btn-sort-stroke"
              >
                画数
              </button>
            </div>
          </div>
        </div>

        {/* グリッド一覧 (高さを極限まで圧縮。スクロールで非常に快適) */}
        <div className="pt-2 border-t border-stone-400">
          {processedList.length === 0 ? (
            <div className="text-center py-6 text-stone-850 font-bold text-[10px] font-serif" id="dict-no-results">
              合致する文字がありません。
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-1 max-h-[110px] overflow-y-auto pr-0.5" id="dict-grid">
              {processedList.map((item) => {
                const { isMastered } = getCharStatus(item.char);
                const isActive = selectedChar === item.char;

                return (
                  <button
                    key={item.char}
                    onClick={() => setSelectedChar(item.char)}
                    className={`relative flex flex-col items-center justify-center py-1 px-0.5 rounded-none border transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#D44D26] text-white border-[#D44D26] shadow-2xs font-black' 
                        : 'bg-white border-stone-300 hover:bg-[#F3F0E9] text-[#1A1A1A]'
                    }`}
                    id={`dict-btn-${item.char}`}
                  >
                    {/* マスターインジケータ */}
                    {isMastered && (
                      <div className={`absolute top-0.5 right-0.5 w-1 h-1 rounded-none ${isActive ? 'bg-white' : 'bg-[#2E6F40]'}`} />
                    )}

                    <span className="text-sm font-black font-serif leading-none">
                      {item.char}
                    </span>
                    <span className={`text-[8px] font-bold font-serif leading-none mt-0.5 ${isActive ? 'text-white/70' : 'text-stone-750 font-semibold'}`}>
                      {item.kanji}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 選択した文字の成り立ち詳細カード (1カラム直下配置、スクロールを絶対に出さないスマートなサイズ感) */}
      <div id="dict-detail-panel">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedChar}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-none border border-stone-400 shadow-[3px_3px_0px_rgba(26,26,26,0.08)] p-3 flex flex-col items-center"
          >
            {/* 発音ボタン付き小型表示 (ヘッダーをさらにコンパクトに) */}
            <div className="flex items-center gap-3 mb-2.5 w-full justify-start border-b border-stone-300 pb-2">
              <div className="relative shrink-0">
                <div className="w-12 h-12 bg-[#F3F0E9] rounded-none border border-stone-400 flex items-center justify-center font-serif font-black text-xl text-[#1A1A1A]">
                  {activeData.char}
                </div>
                <button
                  onClick={() => playSound(activeData.char)}
                  className="absolute -bottom-0.5 -right-0.5 p-1 bg-[#1A1A1A] hover:bg-[#D44D26] text-white rounded-none shadow-2xs transition-all cursor-pointer"
                  title="音声を再生"
                >
                  <Volume2 size={8} />
                </button>
              </div>

              <div className="text-left font-serif">
                <p className="text-sm font-bold text-[#1A1A1A] flex items-center gap-0.5">
                  <span>{activeData.kanji}</span>
                  <span className="text-[8px] text-stone-750 font-bold">由来</span>
                </p>
                <p className="text-[8px] text-stone-850 font-bold tracking-wider uppercase leading-none mt-0.5">
                  Romaji: <span className="font-bold text-[#1A1A1A]">{activeData.romaji.toUpperCase()}</span>
                </p>
                <p className="text-[8px] text-stone-900 font-medium mt-1 leading-normal">
                  意味: {activeData.meaning}
                </p>
              </div>
            </div>

            {/* 成り立ちビジュアル */}
            <div className="w-full">
              <KanjiOriginVisualizer data={activeData} animate={true} />
            </div>

            {/* クイズ成績 */}
            {userStats.charStats[activeData.char] && userStats.charStats[activeData.char].askedCount > 0 && (
              <div className="w-full mt-2 bg-[#F3F0E9] rounded-none p-2 border border-stone-400 text-left font-serif">
                <div className="flex items-center justify-between text-[8px] font-bold text-stone-850 mb-1 uppercase tracking-wider">
                  <span>学習成績</span>
                  {userStats.charStats[activeData.char].isMastered && (
                    <span className="text-[#2E6F40] flex items-center gap-0.5 font-bold">
                      🏆 マスター！
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-[9px]">
                  <div>
                    <span className="text-stone-850 font-semibold">出題: </span>
                    <span className="font-bold text-[#1A1A1A]">{userStats.charStats[activeData.char].askedCount}回</span>
                  </div>
                  <div>
                    <span className="text-stone-850 font-semibold">正解率: </span>
                    <span className="font-bold text-[#1A1A1A]">
                      {Math.round((userStats.charStats[activeData.char].correctCount / userStats.charStats[activeData.char].askedCount) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
