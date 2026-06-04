"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";

interface Flashcard {
  id: string | number;
  question: string;
  answer: string;
}

export default function FlashcardGame({ initialCards }: { initialCards: Flashcard[] }) {
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const handleAssessment = (knewIt: boolean) => {
    setIsFlipped(false);
    
    setTimeout(() => {
      if (knewIt) {
        setScore((prev) => prev + 1);
        // Remove card from queue if knew it
        const remainingCards = [...cards];
        remainingCards.splice(currentIndex, 1);
        setCards(remainingCards);
        
        if (remainingCards.length === 0) {
          setIsFinished(true);
        } else {
          // Keep current index unless it's out of bounds
          setCurrentIndex((prev) => (prev >= remainingCards.length ? 0 : prev));
        }
      } else {
        // Did not know it: Move this card to the end of the queue to repeat it (Spaced Repetition simulation)
        const currentCard = cards[currentIndex];
        const remainingCards = [...cards];
        remainingCards.splice(currentIndex, 1);
        remainingCards.push(currentCard); // Push to end
        setCards(remainingCards);
        
        // Move to next card, or cycle back to 0
        setCurrentIndex((prev) => (prev >= remainingCards.length - 1 ? 0 : prev));
      }
    }, 300);
  };

  const restart = () => {
    setCards(initialCards);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
    setIsFlipped(false);
  };

  if (isFinished) {
    return (
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-2xl text-center max-w-lg w-full mx-auto border border-slate-100 dark:border-slate-700"
      >
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-bold mb-4 text-slate-800 dark:text-white">أحسنت! انتهى التدريب</h2>
        <p className="text-xl text-slate-500 mb-8">
          أجبت بشكل صحيح على {score} سؤال/أسئلة!
        </p>
        <button 
          onClick={restart}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg"
        >
          <RefreshCw size={24} />
          العب مرة أخرى
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl w-full mx-auto perspective-1000">
      <div className="flex justify-between items-center mb-6 text-slate-500 font-medium">
        <span>البطاقات المتبقية: {cards.length}</span>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">نظام التكرار المتباعد الذكي</span>
      </div>

      <div 
        className="relative w-full h-80 sm:h-96 cursor-pointer transform-style-3d transition-transform duration-500"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <AnimatePresence mode="wait">
          {!isFlipped ? (
            <motion.div
              key="front"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 w-full h-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border-2 border-blue-100 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center backface-hidden"
            >
              <span className="text-blue-500 font-bold mb-4 bg-blue-50 px-4 py-1 rounded-full text-sm">السؤال</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white leading-relaxed">
                {cards[currentIndex]?.question || "سؤال مفقود"}
              </h3>
              <p className="absolute bottom-6 text-slate-400 text-sm">اضغط على البطاقة لقلبها</p>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 w-full h-full bg-blue-600 rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center text-center backface-hidden text-white"
            >
              <span className="text-blue-200 font-bold mb-4 bg-blue-700 px-4 py-1 rounded-full text-sm">الإجابة</span>
              <h3 className="text-2xl sm:text-3xl font-bold leading-relaxed mb-8">
                {cards[currentIndex]?.answer || "إجابة مفقودة"}
              </h3>
              
              <div className="absolute bottom-6 w-full px-8 flex justify-between gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAssessment(false); }}
                  className="flex-1 bg-rose-500 hover:bg-rose-400 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-500/30"
                >
                  <RefreshCw size={20} /> لم أعرفها (تكرار)
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAssessment(true); }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/30"
                >
                  <CheckCircle2 size={20} /> عرفتها
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
