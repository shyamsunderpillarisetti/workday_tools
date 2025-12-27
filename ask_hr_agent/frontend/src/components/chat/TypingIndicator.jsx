import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
        <span className="text-white font-bold text-sm">M</span>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-slate-400"
              animate={{
                y: [0, -4, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
          <span className="ml-2 text-sm text-slate-500">AskHR is typing...</span>
        </div>
      </div>
    </div>
  );
}
