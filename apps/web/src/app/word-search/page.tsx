'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import WordSearchGrid from './WordSearchGrid';

const WordSearchPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen p-2 md:p-8 transition-colors duration-500 bg-[#8CE4FF]">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-8">
        <div className="flex justify-center w-full px-2">
          <Button
            onClick={() => router.push('/')}
            className="w-full sm:w-auto border-4 border-black bg-accent font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-accent hover:shadow-none"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back To Home
          </Button>
        </div>
        <div className="relative">
          <div className="mr-2 border-4 border-black bg-orange-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 md:p-8">
            <h1 className="text-4xl md:text-7xl font-black text-center text-black mb-1 italic uppercase decoration-blue-500 decoration-8 underline-offset-8">
              WORD SEARCH
            </h1>
            <p className="text-center font-bold text-black text-sm md:text-xl mt-4">Find the hidden words in the grid</p>
            
            <div className="mt-6 md:mt-10">
              <div className="bg-yellow-200 border-4 border-black p-4 md:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-black text-black mb-3 flex items-center gap-2 text-sm md:text-lg">
                  {/* <span className="w-3 h-3 border-2 border-black bg-white" /> */}
                  HOW TO PLAY:
                </p>
                <ul className="space-y-2 text-black font-bold text-xs md:text-base">
                  <li className="flex items-start gap-2">
                    <span className="text-black">•</span>
                    <span>Press/Touch and drag from start to end</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-black">•</span>
                    <span>Release to confirm selection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-black">•</span>
                    <span>Words can be horizontal, vertical, or diagonal</span>
                  </li>
                </ul>
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