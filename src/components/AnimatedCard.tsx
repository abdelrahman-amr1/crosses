"use client";

import { motion } from "framer-motion";

export default function AnimatedCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 cursor-pointer"
    >
      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400">{description}</p>
    </motion.div>
  );
}
