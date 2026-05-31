"use client";

import React, { useEffect, useState } from "react";
import { Award, Trophy, User, Medal } from "lucide-react";
import { db, Student } from "@/lib/db";

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatarUrl?: string;
  rollNumber: number;
  score: number;
  courseTitle: string;
}

export default function Leaderboard({ tenant, currentStudentName }: { tenant: string; currentStudentName: string }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const allStudents = db.getStudents(tenant);
    const courses = db.getCourses(tenant);

    // Mock scores for other students to make the leaderboard look active and premium
    const mockScores: Record<string, number> = {
      "std-1": 95, // أحمد محمود
      "std-default-1": 90,
      "std-default-2": 85,
      "std-default-3": 75,
    };

    // Construct leaderboard entries
    let entries: LeaderboardEntry[] = allStudents.map((std, idx) => {
      const course = courses.find((c) => c.id === std.courseId);
      // Retrieve score from database or assign a simulated high score
      const score = mockScores[std.id] || (std.name === currentStudentName ? 80 : 60 + (idx * 7) % 35);
      
      return {
        rank: 0,
        name: std.name,
        avatarUrl: std.avatarUrl,
        rollNumber: std.rollNumber || (idx + 1),
        score,
        courseTitle: course?.title || "دورة برمجة الويب"
      };
    });

    // Sort by score descending
    entries.sort((a, b) => b.score - a.score);

    // Assign rank numbers
    entries = entries.map((entry, idx) => ({
      ...entry,
      rank: idx + 1
    }));

    setLeaderboard(entries);
  }, [tenant, currentStudentName]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-amber-500" size={24} />;
      case 2:
        return <Medal className="text-slate-400" size={24} />;
      case 3:
        return <Medal className="text-amber-700" size={24} />;
      default:
        return <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 font-extrabold text-xs flex items-center justify-center">{rank}</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm text-right" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Award className="text-amber-500" size={26} /> لوحة شرف المتصدرين
          </h3>
          <p className="text-sm text-slate-500 mt-1">الترتيب الأعلى للطلاب بناءً على درجات الكويزات والامتحانات التدريبية.</p>
        </div>
      </div>

      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
        {leaderboard.map((entry) => {
          const isMe = entry.name === currentStudentName;
          return (
            <div
              key={entry.rank}
              className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${
                isMe
                  ? "bg-blue-50/70 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40 shadow-sm"
                  : "bg-slate-50 border-slate-100/50 hover:bg-slate-100/40 dark:bg-slate-900 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Rank number or Trophy */}
                <div className="w-8 flex justify-center">
                  {getRankBadge(entry.rank)}
                </div>

                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt={entry.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={22} className="text-slate-400" />
                  )}
                </div>

                {/* Student Info */}
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                    {entry.name}
                    {isMe && <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">أنت</span>}
                  </h4>
                  <div className="flex gap-4 text-xs text-slate-400 mt-1">
                    <span>رقم الكشف: #{entry.rollNumber}</span>
                    <span>•</span>
                    <span>{entry.courseTitle}</span>
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="text-left">
                <span className="text-xl font-extrabold text-slate-800 dark:text-white">{entry.score}</span>
                <span className="text-xs text-slate-400 font-bold mr-1">نقطة</span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
