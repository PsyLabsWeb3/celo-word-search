'use client';

import React from 'react';
import WordSearchGrid from './WordSearchGrid';

const WordSearchPage = () => {
  return (
    <div className="min-h-screen p-2 md:p-8 transition-colors duration-500 bg-background">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-8">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-[#1e1e30]/80 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-8 shadow-2xl text-white">
            <h1 className="text-3xl md:text-6xl font-black text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 mb-1">
              WORD SEARCH
            </h1>
            <p className="text-center text-blue-200/60 text-sm md:text-lg mb-4 md:mb-0">Find the hidden words in the grid</p>
            
            <div className="mt-4 md:mt-8 grid md:grid-cols-2 gap-4 md:gap-6 items-center">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 md:p-4">
                <p className="font-bold text-blue-300 mb-2 md:mb-3 flex items-center gap-2 text-xs md:text-base">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-400 animate-pulse" />
                  HOW TO PLAY
                </p>
                <ul className="space-y-1 md:space-y-2 text-blue-100/70 text-[10px] md:text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5 md:mt-1">•</span>
                    <span>Press/Touch and drag from start to end</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5 md:mt-1">•</span>
                    <span>Release to confirm selection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5 md:mt-1">•</span>
                    <span>Words can be horizontal, vertical, or diagonal</span>
                  </li>
                </ul>
              </div>
              <div className="hidden md:block">
                <div className="aspect-video rounded-xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-white/5 flex items-center justify-center">
                  <div className="text-blue-400/20 text-6xl font-black select-none">
                    SEARCH
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <WordSearchGrid />
        </div>
      </div>
    </div>
  );
};

export default WordSearchPage;