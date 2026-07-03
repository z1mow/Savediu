"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

/**
 * Sayfa/kart girişlerinde kullanılan yumuşak fade + yukarı kayma.
 * ease-out-expo hissi ([0.22, 1, 0.36, 1]); art arda bloklara
 * kademeli (staggered) delay verilir: 0, 0.06, 0.1, 0.14…
 */
export function FadeIn({
  delay = 0,
  children,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
