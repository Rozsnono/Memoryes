"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { wrap } from "popmotion";

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export const MediaCarousel = ({ media }: { media: any[] }) => {
  const [[page, direction], setPage] = useState([0, 0]);

  // Handle wrap-around for the array
  const imageIndex = wrap(0, media.length, page);

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  if (!media || media.length === 0) return <div className="w-full h-full bg-slate-200" />;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
      <AnimatePresence initial={false} custom={direction}>
        <motion.img
          key={page}
          src={media[imageIndex].url}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          className="absolute w-full h-full object-cover cursor-grab active:cursor-grabbing"
        />
      </AnimatePresence>

      {/* Indicator Dots */}
      {media.length > 1 && (
        <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-2 z-20 pointer-events-none">
          {media.map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{
                width: i === imageIndex ? 24 : 6,
                backgroundColor: i === imageIndex ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.4)"
              }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>
      )}
    </div>
  );
};