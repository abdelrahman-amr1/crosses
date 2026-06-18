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
    async function fetchLeaderboard() {
      try {
        // Fetch students, courses, and all total scores concurrently in a single batch (no waterfall!)
        const [allStudents, courses, scoresMap] = await Promise.all([
          db.getStudents(tenant),
          db.getCourses(tenant),
          db.getTenantLeaderboard(tenant)
        ]);

        // Construct leaderboard entries using real scores only
        let entries: LeaderboardEntry[] = allStudents.map((std, idx) => {
          const course = courses.find((c) => c.id === std.courseId);
          const score = scoresMap[std.name] || 0; // 100% real score from DB
          
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
      } catch (e) {
        console.error("Failed to load leaderboard:", e);
      }
    }
    fetchLeaderboard();
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
              className={`p-3.5 rounded-2xl flex items-center justify-between border transition-all duration-300 hover:scale-[1.01] ${
                isMe
                  ? "bg-blue-50/80 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40 shadow-sm"
                  : "bg-slate-50 border-slate-100/50 hover:bg-slate-100/30 dark:bg-slate-900 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Rank number or Trophy */}
                <div className="w-6 flex-shrink-0 flex justify-center">
                  {getRankBadge(entry.rank)}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt={entry.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} className="text-slate-400" />
                  )}
                </div>

                {/* Student Info */}
                <div className="min-w-0">
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-xs sm:text-sm flex items-center gap-1.5 truncate">
                    <span className="truncate">{entry.name}</span>
                    {isMe && <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0">أنت</span>}
                  </h4>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-slate-450 dark:text-slate-400 mt-1 font-semibold">
                    <span className="flex-shrink-0">كشف: #{entry.rollNumber}</span>
                    <span className="text-slate-350 dark:text-slate-700">•</span>
                    <span className="truncate max-w-[110px]" title={entry.courseTitle}>{entry.courseTitle}</span>
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="text-left flex-shrink-0 pl-1">
                <span className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white">{entry.score}</span>
                <span className="text-[10px] text-slate-450 dark:text-slate-400 font-bold mr-1">نقطة</span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
