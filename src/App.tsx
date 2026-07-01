/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  BookOpen, 
  ChevronRight, 
  Play
} from 'lucide-react';
import { getUserStats, resetUserStats } from './utils/quizHelper';
import { UserStats } from './types';
import QuizSection from './components/QuizSection';
import CharacterDictionary from './components/CharacterDictionary';
import Statistics from './components/Statistics';

type Tab = 'home' | 'quiz' | 'dict' | 'stats';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // 初回データロード
  useEffect(() => {
    setUserStats(getUserStats());
  }, [activeTab]); // タブが切り替わるたびに最新状態を同期

  // 全体の統計情報をリセットする
  const handleResetData = () => {
    if (confirm('すべての学習データをリセットして、最初からやり直しますか？\n（これまでのクイズ履歴や成績がすべて消去されます）')) {
      const emptyStats = resetUserStats();
      setUserStats(emptyStats);
      alert('データを初期化しました。');
    }
  };

  // ローディング
  if (!userStats) {
    return (
      <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center font-serif">
        <div className="text-stone-400 text-[10px] tracking-wider animate-pulse">
          読み込み中...
        </div>
      </div>
    );
  }

  // クイズで何文字マスターしたか
  const masteredCount = Object.values(userStats.charStats).filter((s: any) => s.isMastered).length;

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#1A1A1A] flex flex-col antialiased font-serif">
      {/* 共通ヘッダー (PC向けに超コンパクト・スマート化。中央寄せ) */}
      <header className="border-b border-[#1A1A1A]/10 bg-[#F9F7F2]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-sm mx-auto px-3 py-1.5 flex items-center justify-between">
          
          {/* ロゴ・タイトル */}
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveTab('home')} id="header-logo">
            <div className="w-6 h-6 bg-white border border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] font-serif font-black text-xs shadow-[1.5px_1.5px_0px_rgba(26,26,26,0.15)]">
              カ
            </div>
            <div className="space-y-0">
              <h1 className="text-xs font-serif font-black tracking-tight text-[#1A1A1A] leading-tight">
                Katakana Origins
              </h1>
              <p className="text-[7px] text-[#1A1A1A]/60 font-bold tracking-widest uppercase leading-none">
                Etymology Quiz
              </p>
            </div>
          </div>

          {/* 右側：ヘッダー進捗サマリー */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-white/50 border border-[#1A1A1A]/10 px-1.5 py-0.5 text-[9px]">
              <span className="text-[7px] uppercase tracking-widest text-[#1A1A1A]/50 font-bold font-serif">
                マスター:
              </span>
              <span className="font-serif text-[#1A1A1A] font-bold">
                {masteredCount} <span className="text-[8px] text-[#1A1A1A]/40">/ 46</span>
              </span>
              <div className="w-8 h-1 bg-[#1A1A1A]/10 overflow-hidden ml-0.5">
                <div 
                  className="h-full bg-[#D44D26]"
                  style={{ width: `${(masteredCount / 46) * 100}%` }}
                />
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* メインコンテンツエリア (下部ナビがあるためpb-11、PCフルスクリーンのため間隔を限界まで最適化) */}
      <main className="flex-1 pb-11 pt-1 max-w-sm mx-auto w-full">
        <div className="w-full">
          <AnimatePresence mode="wait">
            
            {/* ホーム（ウェルカム）画面 */}
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="px-3 py-1.5 space-y-2"
                id="home-tab"
              >
                {/* ヒーローカード (PC向けに超コンパクト化) */}
                <div className="relative rounded-none border border-[#1A1A1A]/15 bg-white p-4 overflow-hidden shadow-[2px_2px_0px_rgba(26,26,26,0.03)]">
                  {/* 装飾用の薄い和風格子背景 */}
                  <div className="absolute inset-0 bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:16px_16px] opacity-2 pointer-events-none" />
                  
                  <div className="relative z-10 space-y-2 text-left">
                    <span className="inline-block text-[7px] tracking-widest font-bold uppercase bg-[#D44D26]/10 text-[#D44D26] border border-[#D44D26]/20 px-1.5 py-0.5 rounded-none font-serif">
                      Etymology Guide
                    </span>
                    <h2 className="text-base font-serif leading-snug text-[#1A1A1A] tracking-tight">
                      そのカタカナ、どの<span className="italic underline underline-offset-2 decoration-[#D44D26] decoration-2">「漢字」</span>から生まれた？
                    </h2>
                    <p className="text-[10px] text-[#1A1A1A]/70 leading-relaxed font-serif">
                      日本のカタカナは、平安時代にお経のふりがな（訓点）として漢字の一部（偏や旁など）を抜き出して誕生しました。
                      隠された漢字を暴くクイズで奥深いルーツを学びましょう！
                    </p>
                    
                    <div className="pt-0.5 flex gap-2">
                      <button
                        onClick={() => setActiveTab('quiz')}
                        className="py-1.5 px-3 bg-[#1A1A1A] hover:bg-[#D44D26] text-white text-[8px] font-bold uppercase tracking-widest rounded-none transition-all font-serif flex items-center gap-1 cursor-pointer"
                        id="btn-hero-quiz"
                      >
                        <Play size={8} fill="currentColor" />
                        ゲームを始める
                      </button>
                      <button
                        onClick={() => setActiveTab('dict')}
                        className="py-1.5 px-3 bg-transparent hover:bg-[#1A1A1A]/5 text-[#1A1A1A] border border-[#1A1A1A]/35 text-[8px] font-bold uppercase tracking-widest rounded-none transition-all font-serif flex items-center gap-1 cursor-pointer"
                        id="btn-hero-dict"
                      >
                        <BookOpen size={8} />
                        なりたち図鑑
                      </button>
                    </div>
                  </div>
                </div>

                {/* ミニなりたちレクチャーカード（解説を横並びではなくコンパクトなリスト風に） */}
                <div className="bg-white rounded-none p-3 border border-[#1A1A1A]/10 text-left space-y-1.5">
                  <h4 className="text-[9px] font-bold text-[#D44D26] font-serif uppercase tracking-widest">なりたちパターン</h4>
                  <div className="grid grid-cols-3 gap-2 text-[9px] leading-tight">
                    <div className="border-r border-[#1A1A1A]/10 pr-1">
                      <span className="font-bold text-[#D44D26]">偏（へん）</span>
                      <p className="text-[#1A1A1A]/60 mt-0.5">「阿」の左側(阝)から「ア」誕生</p>
                    </div>
                    <div className="border-r border-[#1A1A1A]/10 pr-1 pl-0.5">
                      <span className="font-bold text-[#D44D26]">冠（かんむり）</span>
                      <p className="text-[#1A1A1A]/60 mt-0.5">「宇」のうかんむり(宀)から「ウ」</p>
                    </div>
                    <div className="pl-0.5">
                      <span className="font-bold text-[#D44D26]">草書（崩し）</span>
                      <p className="text-[#1A1A1A]/60 mt-0.5">「川」の崩しから「ツ」誕生</p>
                    </div>
                  </div>
                </div>

                {/* セクション誘導エリア (さらにスマートに) */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-1 gap-1.5">
                    {/* クイズカード */}
                    <div 
                      onClick={() => setActiveTab('quiz')}
                      className="group bg-white hover:bg-[#F3F0E9] rounded-none p-2.5 border border-[#1A1A1A]/10 cursor-pointer transition-all hover:border-[#1A1A1A]/30 flex justify-between items-center"
                      id="menu-quiz-card"
                    >
                      <div className="space-y-0.5 text-left">
                        <span className="inline-block text-[7px] tracking-widest font-bold uppercase bg-[#D44D26]/10 text-[#D44D26] border border-[#D44D26]/20 px-1 py-0.2 rounded-none font-serif">
                          Play
                        </span>
                        <h4 className="text-[10px] font-bold text-[#1A1A1A] font-serif">シューティングクイズ</h4>
                        <p className="text-[8px] text-[#1A1A1A]/50 font-serif">射撃で漢字を透かし見破るゲーム</p>
                      </div>
                      <ChevronRight size={10} className="text-[#1A1A1A]/40 group-hover:text-[#D44D26] transition-colors" />
                    </div>

                    {/* 図鑑カード */}
                    <div 
                      onClick={() => setActiveTab('dict')}
                      className="group bg-white hover:bg-[#F3F0E9] rounded-none p-2.5 border border-[#1A1A1A]/10 cursor-pointer transition-all hover:border-[#1A1A1A]/30 flex justify-between items-center"
                      id="menu-dict-card"
                    >
                      <div className="space-y-0.5 text-left">
                        <span className="inline-block text-[7px] tracking-widest font-bold uppercase bg-[#2E6F40]/10 text-[#2E6F40] border border-[#2E6F40]/20 px-1 py-0.2 rounded-none font-serif">
                          Dictionary
                        </span>
                        <h4 className="text-[10px] font-bold text-[#1A1A1A] font-serif">なりたち漢字図鑑</h4>
                        <p className="text-[8px] text-[#1A1A1A]/50 font-serif">ア〜ンまで一覧でルーツを調べる</p>
                      </div>
                      <ChevronRight size={10} className="text-[#1A1A1A]/40 group-hover:text-[#2E6F40] transition-colors" />
                    </div>

                    {/* 成績カード */}
                    <div 
                      onClick={() => setActiveTab('stats')}
                      className="group bg-white hover:bg-[#F3F0E9] rounded-none p-2.5 border border-[#1A1A1A]/10 cursor-pointer transition-all hover:border-[#1A1A1A]/30 flex justify-between items-center"
                      id="menu-stats-card"
                    >
                      <div className="space-y-0.5 text-left">
                        <span className="inline-block text-[7px] tracking-widest font-bold uppercase bg-[#1A1A1A]/5 text-[#1A1A1A]/70 border border-[#1A1A1A]/15 px-1 py-0.2 rounded-none font-serif">
                          Stats
                        </span>
                        <h4 className="text-[10px] font-bold text-[#1A1A1A] font-serif">進捗と成績分析</h4>
                        <p className="text-[8px] text-[#1A1A1A]/50 font-serif">得意な成り立ち別の正答率統計</p>
                      </div>
                      <ChevronRight size={10} className="text-[#1A1A1A]/40 group-hover:text-[#1A1A1A] transition-colors" />
                    </div>
                  </div>
                </div>

                {/* 豆知識ミニコラム (高さを超低く) */}
                <div className="bg-[#F3F0E9] border border-[#1A1A1A]/10 rounded-none p-2.5 text-left">
                  <h4 className="text-[9px] font-bold text-[#D44D26] mb-0.5 font-serif flex items-center gap-1 uppercase tracking-wide">
                    💡 カタカナとひらがな
                  </h4>
                  <p className="text-[9px] text-[#1A1A1A]/70 leading-relaxed font-serif">
                    ひらがなは漢字の<strong>「全体」を崩して</strong>、カタカナは<strong>「一部」を抜き出して</strong>作られました。そのため、カタカナは直線的で記号的な形をしています。
                  </p>
                </div>
              </motion.div>
            )}

            {/* クイズタブ */}
            {activeTab === 'quiz' && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                id="quiz-tab"
              >
                <QuizSection 
                  onBackToMenu={() => setActiveTab('home')} 
                />
              </motion.div>
            )}

            {/* 図鑑タブ */}
            {activeTab === 'dict' && (
              <motion.div
                key="dict"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                id="dict-tab"
              >
                <CharacterDictionary 
                  userStats={userStats}
                />
              </motion.div>
            )}

            {/* 進捗タブ */}
            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                id="stats-tab"
              >
                <Statistics 
                  userStats={userStats}
                  onReset={handleResetData}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ボトムナビゲーション (よりコンパクトに、PC全画面に中央配置で完全フィット) */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-[#1A1A1A]/10 bg-[#F9F7F2]/95 backdrop-blur-md z-40">
        <div className="max-w-sm mx-auto px-3 py-0.5">
          <div className="flex justify-around items-center" id="bottom-navigation">
            {[
              { id: 'home', label: 'ホーム', icon: '🏠' },
              { id: 'quiz', label: 'クイズ', icon: '🎯' },
              { id: 'dict', label: '図鑑', icon: '📖' },
              { id: 'stats', label: '成績', icon: '📊' }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex flex-col items-center justify-center py-1 px-3 rounded-none transition-all relative cursor-pointer ${
                    isActive 
                      ? 'text-[#D44D26] font-bold border-t-2 border-[#D44D26] bg-[#1A1A1A]/2' 
                      : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]'
                  }`}
                  id={`bottom-nav-${tab.id}`}
                >
                  <span className="text-sm mb-0.5">{tab.icon}</span>
                  <span className="text-[8px] font-bold font-serif tracking-tight leading-none">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </footer>
    </div>
  );
}
