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
  Play,
  Volume2,
  Target,
  Flame,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { getUserStats, resetUserStats } from './utils/quizHelper';
import { UserStats } from './types';
import QuizSection from './components/QuizSection';
import CharacterDictionary from './components/CharacterDictionary';
import Statistics from './components/Statistics';
import { katakanaList } from './data';

type Tab = 'home' | 'quiz' | 'dict' | 'stats';

// 五十音表グリッド用の配列（5列レイアウト）
const gojuonGrid = [
  'ア', 'イ', 'ウ', 'エ', 'オ',
  'カ', 'キ', 'ク', 'ケ', 'コ',
  'サ', 'シ', 'ス', 'セ', 'ソ',
  'タ', 'チ', 'ツ', 'テ', 'ト',
  'ナ', 'ニ', 'ヌ', 'ネ', 'ノ',
  'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
  'マ', 'ミ', 'ム', 'メ', 'モ',
  'ヤ', null, 'ユ', null, 'ヨ',
  'ラ', 'リ', 'ル', 'レ', 'ロ',
  'ワ', null, null, null, 'ヲ',
  'ン', null, null, null, null
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [selectedChar, setSelectedChar] = useState<string>('ア');

  // 初回データロード
  useEffect(() => {
    setUserStats(getUserStats());
  }, [activeTab]); // タブが切り替わるたびに最新状態を同期

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

  // 段位の取得
  const getRankName = (count: number) => {
    if (count === 46) return { name: '起源を極めし「漢字マスター」', title: '全文字制覇', color: 'text-amber-600 border-amber-500 bg-amber-500/10' };
    if (count >= 31) return { name: 'なりたちの達人（皆伝）', title: '皆伝', color: 'text-purple-600 border-purple-500 bg-purple-500/10' };
    if (count >= 16) return { name: '貫通の武者（必中）', title: '必中', color: 'text-indigo-600 border-indigo-500 bg-indigo-500/10' };
    if (count >= 6) return { name: '早撃ちの足軽（十段）', title: '十段', color: 'text-blue-600 border-blue-500 bg-blue-500/10' };
    return { name: '初歩の門生（射手見習い）', title: '見習い', color: 'text-[#D44D26] border-[#D44D26]/20 bg-[#D44D26]/5' };
  };

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

  // 称号データ
  const rank = getRankName(masteredCount);

  // 五十音表から直接文字をクリックした時の処理（音声再生、図鑑切り替え、同期）
  const handleQuickSelect = (char: string) => {
    playSound(char);
    setSelectedChar(char);
    setActiveTab('dict');
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#1A1A1A] flex flex-col antialiased font-serif relative overflow-x-hidden">
      {/* 装飾用の非常に薄い和風格子背景（大画面時に余白を美しく彩る） */}
      <div className="absolute inset-0 bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03] pointer-events-none z-0" />

      {/* 共通ヘッダー (PC向けに超コンパクト・スマート化。中央寄せ) */}
      <header className="border-b border-[#1A1A1A]/10 bg-[#F9F7F2]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-sm lg:max-w-5xl mx-auto px-3 py-1.5 flex items-center justify-between transition-all">
          
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

      {/* メインコンテンツエリア (大画面では3カラムのグリッド。両サイドの無駄な空間を完璧なコンテンツで埋める) */}
      <main className="flex-1 pb-16 pt-3 w-full max-w-sm lg:max-w-5xl mx-auto px-3 lg:px-0 relative z-10">
        <div className="lg:grid lg:grid-cols-[240px_1fr_280px] lg:gap-6 lg:items-start">
          
          {/* 左サイドバー：大画面でのみ表示（段位称号、修行進捗、コツとヒント） */}
          <aside className="hidden lg:flex flex-col gap-4 sticky top-[60px] max-h-[calc(100vh-100px)] overflow-y-auto pr-1">
            
            {/* 射撃熟練度の段位・称号カード */}
            <div className="bg-white border border-[#1A1A1A]/10 p-3.5 text-left rounded-none shadow-[2px_2px_0px_rgba(26,26,26,0.02)] space-y-2.5">
              <span className="inline-block text-[7px] tracking-widest font-bold uppercase bg-[#D44D26]/10 text-[#D44D26] border border-[#D44D26]/20 px-1.5 py-0.5 rounded-none font-serif">
                Shooter Rank
              </span>
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-[#1A1A1A]/50 uppercase tracking-widest">現在の射撃段位</h4>
                <div className={`p-2 border font-bold text-[11px] rounded-none flex items-center gap-1.5 ${rank.color}`}>
                  <Award size={14} className="shrink-0" />
                  <div className="leading-tight">
                    <p className="text-[7px] uppercase tracking-wider text-[#1A1A1A]/50 font-sans font-normal">Rank {rank.title}</p>
                    <p className="font-serif text-[#1A1A1A] tracking-tight">{rank.name}</p>
                  </div>
                </div>
              </div>

              {/* 円形進捗のスマート表示 */}
              <div className="pt-2 border-t border-[#1A1A1A]/5 flex items-center justify-between text-[10px]">
                <div className="font-serif">
                  <p className="text-[#1A1A1A]/40 text-[8px] leading-none">MASTERED</p>
                  <p className="text-base font-black text-[#1A1A1A] mt-0.5">
                    {Math.round((masteredCount / 46) * 100)}<span className="text-[10px] font-normal text-stone-400">%</span>
                  </p>
                </div>
                <div className="text-right text-[9px] font-serif">
                  <p className="text-[#1A1A1A]/40 text-[8px] leading-none">残り文字</p>
                  <p className="font-bold text-[#D44D26] mt-0.5">{46 - masteredCount} 文字</p>
                </div>
              </div>
            </div>

            {/* 遊び方・射撃の極意カード */}
            <div className="bg-white border border-[#1A1A1A]/10 p-3.5 text-left rounded-none shadow-[2px_2px_0px_rgba(26,26,26,0.02)] space-y-2.5">
              <span className="inline-block text-[7px] tracking-widest font-bold uppercase bg-[#2E6F40]/10 text-[#2E6F40] border border-[#2E6F40]/20 px-1.5 py-0.5 rounded-none font-serif flex items-center gap-1 w-fit">
                <Info size={8} /> TIPS & TRICKS
              </span>
              
              <div className="space-y-2 font-serif text-[10px] leading-relaxed text-[#1A1A1A]/80">
                <div className="space-y-0.5">
                  <h5 className="font-bold text-[#D44D26] flex items-center gap-1">
                    <Target size={10} /> 🎯 穴あけ覗き見
                  </h5>
                  <p className="text-[#1A1A1A]/60 text-[9px] pl-3.5">
                    的を撃つかタップすると、カタカナの隙間に「穴」があきます。奥に透けて見える「赤いルーツ漢字」をヒントに、正解のパネルを射抜きましょう！
                  </p>
                </div>
                
                <div className="space-y-0.5 pt-1.5 border-t border-[#1A1A1A]/5">
                  <h5 className="font-bold text-[#D44D26] flex items-center gap-1">
                    <Flame size={10} /> 🔥 フィーバータイム
                  </h5>
                  <p className="text-[#1A1A1A]/60 text-[9px] pl-3.5">
                    5問連続正解すると、3秒間の「打ち放題フィーバー」に突入！無限の弾薬で、正解の「⭕️」を連射して得点を荒稼ぎしましょう！
                  </p>
                </div>
              </div>
            </div>

            {/* クイック・データ初期化 */}
            <button
              onClick={handleResetData}
              className="py-1.5 px-3 bg-transparent hover:bg-[#D44D26]/5 text-stone-400 hover:text-[#D44D26] border border-[#1A1A1A]/10 hover:border-[#D44D26]/30 text-[8px] font-bold uppercase tracking-widest rounded-none transition-all font-serif flex items-center justify-center gap-1 cursor-pointer"
            >
              <RotateCcw size={10} />
              修練データを初期化する
            </button>

          </aside>

          {/* 中央メインエリア：常に表示。ここがこれまでの max-w-sm サイズのコンテンツ */}
          <div className="w-full max-w-sm mx-auto bg-white/40 border border-[#1A1A1A]/10 lg:shadow-lg rounded-none overflow-hidden relative">
            <div className="absolute inset-0 bg-[#F9F7F2]/40 backdrop-blur-[1px] pointer-events-none" />
            
            <div className="relative z-10">
              <AnimatePresence mode="wait">
                
                {/* ホーム（ウェルカム）画面 */}
                {activeTab === 'home' && (
                  <motion.div
                    key="home"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="px-3 py-1.5 space-y-2 animate-in fade-in duration-200"
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
                      selectedChar={selectedChar}
                      setSelectedChar={setSelectedChar}
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
          </div>

          {/* 右サイドバー：大画面でのみ表示（照準アニメーション、インタラクティブ五十音早見表） */}
          <aside className="hidden lg:flex flex-col gap-4 sticky top-[60px] max-h-[calc(100vh-100px)] overflow-y-auto pl-1">
            
            {/* 射撃ターゲット（和モダン装飾イラスト） */}
            <div className="bg-white border border-[#1A1A1A]/10 p-3 flex flex-col items-center justify-center text-center rounded-none relative overflow-hidden shadow-[2px_2px_0px_rgba(26,26,26,0.02)]">
              {/* 薄い伝統和風背景をSVGの後ろに */}
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#d44d26_1px,transparent_1px)] [background-size:10px_10px]" />
              
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full text-[#D44D26] opacity-80 animate-[spin_12s_linear_infinite]" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="50" y1="2" x2="50" y2="98" stroke="currentColor" strokeWidth="0.75" />
                  <line x1="2" y1="50" x2="98" y2="50" stroke="currentColor" strokeWidth="0.75" />
                </svg>
                <div className="font-serif font-black text-[#1A1A1A] text-xl z-10 animate-pulse">
                  漢
                </div>
              </div>
              
              <div className="mt-2.5 space-y-0.5 z-10">
                <span className="text-[7px] tracking-widest font-bold uppercase text-[#D44D26] font-serif">Etymology Target</span>
                <h4 className="text-[10px] font-bold font-serif">なりたち五十音早見表</h4>
                <p className="text-[8px] text-[#1A1A1A]/50 font-serif leading-none">盤面を叩いてルーツ漢字を聴く</p>
              </div>
            </div>

            {/* インタラクティブカタカナなりたち五十音グリッド */}
            <div className="bg-white border border-[#1A1A1A]/10 p-3 rounded-none shadow-[2px_2px_0px_rgba(26,26,26,0.02)]">
              <div className="grid grid-cols-5 gap-1 text-[9px]" id="sidebar-gojuon-grid">
                {gojuonGrid.map((char, index) => {
                  if (char === null) {
                    return (
                      <div 
                        key={`empty-${index}`} 
                        className="aspect-square bg-stone-500/2 border border-dashed border-[#1A1A1A]/5 rounded-none flex items-center justify-center text-[8px]"
                      />
                    );
                  }

                  const matchedData = katakanaList.find(item => item.char === char);
                  const isMastered = matchedData ? (userStats.charStats[char]?.isMastered || false) : false;
                  const isCurrent = selectedChar === char && activeTab === 'dict';

                  return (
                    <button
                      key={char}
                      onClick={() => handleQuickSelect(char)}
                      className={`aspect-square relative flex flex-col items-center justify-center border rounded-none transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#D44D26] border-[#D44D26] text-white'
                          : 'bg-white border-[#1A1A1A]/10 hover:bg-[#F3F0E9] text-[#1A1A1A]'
                      }`}
                      title={`${char} (${matchedData?.kanji || ''} 由来)`}
                    >
                      {/* マスター印：点滅する小さな緑の丸 */}
                      {isMastered && (
                        <span className={`absolute top-0.5 right-0.5 w-1 h-1 rounded-full ${isCurrent ? 'bg-white' : 'bg-[#2E6F40]'}`} />
                      )}
                      
                      <span className="text-[11px] font-serif font-bold leading-none select-none">
                        {char}
                      </span>
                      <span className={`text-[7px] font-serif scale-85 leading-none mt-0.5 select-none ${isCurrent ? 'text-white/70' : 'text-[#1A1A1A]/40'}`}>
                        {matchedData?.kanji || ''}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2.5 flex items-center justify-center gap-3 text-[8px] text-[#1A1A1A]/50 font-serif">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E6F40]" />
                  <span>マスター済</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 border border-[#1A1A1A]/10 bg-white" />
                  <span>未マスター</span>
                </div>
              </div>
            </div>

          </aside>

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
