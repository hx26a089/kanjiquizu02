/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { KatakanaData } from '../types';

interface KanjiOriginVisualizerProps {
  data: KatakanaData;
  animate?: boolean;
}

export default function KanjiOriginVisualizer({ data, animate = true }: KanjiOriginVisualizerProps) {
  // 分類に応じたカラーコードの決定（エディトリアル和テイスト）
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hen': // 偏
        return { bg: 'bg-[#D44D26]/10 text-[#D44D26] border-[#D44D26]/20', badge: 'bg-[#D44D26]' };
      case 'tsukuri': // 旁
        return { bg: 'bg-[#2E6F40]/10 text-[#2E6F40] border-[#2E6F40]/20', badge: 'bg-[#2E6F40]' };
      case 'kanmuri': // 冠
        return { bg: 'bg-[#1A1A1A]/5 text-[#1A1A1A]/70 border-[#1A1A1A]/15', badge: 'bg-[#1A1A1A]' };
      case 'full': // 全体
        return { bg: 'bg-[#A05C1B]/10 text-[#A05C1B] border-[#A05C1B]/20', badge: 'bg-[#A05C1B]' };
      default: // 一部・草書
        return { bg: 'bg-[#1A1A1A]/5 text-[#1A1A1A]/60 border-[#1A1A1A]/15', badge: 'bg-[#1A1A1A]' };
    }
  };

  const colors = getTypeColor(data.type);

  // SVGやレイアウトを活用して、漢字とカタカナの「重ね合わせ・変化」を美しく示す
  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto p-3 bg-[#F3F0E9] rounded-none border border-[#1A1A1A]/10 shadow-xs" id={`visualizer-${data.char}`}>
      {/* 分類バッジ（コンパクトに） */}
      <div className="flex justify-between items-center w-full mb-2">
        <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-none border ${colors.bg}`}>
          {data.typeName}由来
        </span>
        <span className="text-[9px] text-[#1A1A1A]/50 font-serif">
          画数: {data.strokeCount}画 / 音: {data.romaji.toUpperCase()}
        </span>
      </div>

      {/* メインの比較グラフィック（サイズ縮小） */}
      <div className="relative flex items-center justify-center gap-5 py-3 w-full">
        
        {/* 左側: 元の漢字カード */}
        <motion.div 
          className="relative flex flex-col items-center justify-center w-20 h-20 bg-white rounded-none border border-[#1A1A1A]/15 shadow-xs overflow-hidden"
          initial={animate ? { opacity: 0, x: -15 } : false}
          animate={animate ? { opacity: 1, x: 0 } : false}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* 薄い格子状背景テクスチャ */}
          <div className="absolute inset-0 bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:12px_12px] opacity-2.5 pointer-events-none" />
          
          <span className="text-3xl font-bold font-serif text-[#1A1A1A] z-10">
            {data.kanji}
          </span>
          <span className="absolute bottom-1 text-[8px] text-[#1A1A1A]/40 font-serif z-10">
            元: {data.kanji}
          </span>

          {/* 切り出し部分の視覚的ハイライトフレーム（朱枠） */}
          <motion.div 
            className="absolute inset-1.5 rounded-none border border-dashed border-[#D44D26]/40 pointer-events-none"
            initial={animate ? { scale: 0.8, opacity: 0 } : false}
            animate={animate ? { scale: 1, opacity: 1 } : false}
            transition={{ delay: 0.5, duration: 0.3 }}
          />
        </motion.div>

        {/* 中央: 変化を指し示す矢印 */}
        <div className="flex flex-col items-center justify-center">
          <motion.div
            className="flex items-center justify-center text-[#D44D26]"
            initial={animate ? { scale: 0.5, opacity: 0 } : false}
            animate={animate ? { scale: 1, opacity: 1 } : false}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            {/* 太めの和風矢印（サイズ縮小） */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </motion.div>
          <span className="text-[8px] text-[#D44D26] font-bold mt-1 tracking-widest font-serif uppercase">
            Trace
          </span>
        </div>

        {/* 右側: 誕生したカタカナカード */}
        <motion.div 
          className="relative flex flex-col items-center justify-center w-20 h-20 bg-white rounded-none border border-[#D44D26]/20 shadow-xs overflow-hidden"
          initial={animate ? { opacity: 0, scale: 0.8, x: 15 } : false}
          animate={animate ? { opacity: 1, scale: 1, x: 0 } : false}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* ほんのり朱色の背景 */}
          <div className="absolute inset-0 bg-[#D44D26]/2 pointer-events-none" />
          
          <span className="text-4xl font-black font-serif text-[#D44D26] z-10 tracking-tight">
            {data.char}
          </span>
          <span className="absolute bottom-1 text-[8px] text-[#D44D26]/60 font-serif font-bold z-10">
            カナ: {data.char}
          </span>
        </motion.div>

        {/* 漢字のどの部分か */}
        <motion.div 
          className="absolute -bottom-2 bg-white text-[#1A1A1A]/70 text-[9px] px-2 py-0.5 rounded-none border border-[#1A1A1A]/10 pointer-events-none shadow-xs font-serif"
          initial={animate ? { opacity: 0 } : false}
          animate={animate ? { opacity: 1 } : false}
          transition={{ delay: 0.6 }}
        >
          {data.part}
        </motion.div>
      </div>

      {/* 成り立ちの詳細テキスト（コンパクトに） */}
      <div className="mt-3 w-full bg-white rounded-none p-3.5 border border-[#1A1A1A]/10 text-left">
        <h4 className="text-[10px] font-serif font-bold text-[#1A1A1A] mb-1 flex items-center gap-1.5 uppercase tracking-wide">
          <span className="inline-block w-1 h-3 bg-[#D44D26] rounded-none"></span>
          成り立ちの解説
        </h4>
        <p className="text-[10px] text-[#1A1A1A]/70 leading-relaxed font-serif">
          {data.originDetail}
        </p>

        {data.meaning && (
          <div className="mt-1.5 pt-1.5 border-t border-[#1A1A1A]/10 flex items-baseline gap-1.5 font-serif">
            <span className="text-[8px] font-bold text-[#1A1A1A]/40 shrink-0 uppercase tracking-wider">意味:</span>
            <span className="text-[10px] text-[#1A1A1A]/70">{data.meaning}</span>
          </div>
        )}

        {data.visualTips && (
          <div className="mt-2 pt-2 border-t border-[#1A1A1A]/10">
            <p className="text-[9px] text-[#D44D26] bg-[#D44D26]/5 p-1.5 rounded-none border border-[#D44D26]/15 leading-relaxed font-serif">
              <strong className="font-bold">💡 覚え方:</strong> {data.visualTips}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
