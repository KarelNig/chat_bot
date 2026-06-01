"use client";

import { motion } from "framer-motion";

export function TypingIndicator(): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 4 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex justify-start"
    >
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
        {([0, 1, 2] as const).map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-violet-500 block"
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 0.55,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
