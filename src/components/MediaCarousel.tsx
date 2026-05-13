"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { wrap } from "popmotion";
import { Loader2, AlertCircle } from "lucide-react";

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

export const MediaCarousel = ({ media, onIndexChange }: { media: any[], onIndexChange?: (index: number) => void }) => {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const imageIndex = wrap(0, media.length, page);
  const currentMedia = media[imageIndex];

  // RESET logic when image changes
  useEffect(() => {
    setIsImageLoading(true);
    setHasError(false);

    // FIX: If the image is already cached, 'onLoad' might not fire.
    // We check if the image is already 'complete' manually.
    if (imgRef.current?.complete) {
      setIsImageLoading(false);
    }
    if (onIndexChange) onIndexChange(imageIndex);

  }, [imageIndex]);

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  if (!media || media.length === 0) return <div className="w-full h-full bg-slate-900" />;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">

      {/* 1. Loader/Error States Overlay */}
      <AnimatePresence>
        {(isImageLoading || hasError) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950"
          >
            {hasError ? (
              <>
                <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Media Unavailable</p>
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
                <Loader2 className="w-6 h-6 text-memoryes-primary animate-spin" />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Swipable Media Container */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.img
          ref={imgRef}
          key={page}
          src={currentMedia.url}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          // CRITICAL: Handlers to prevent getting stuck
          onLoad={() => setIsImageLoading(false)}
          onError={() => {
            setIsImageLoading(false);
            setHasError(true);
          }}
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);
            if (swipe < -swipeConfidenceThreshold) paginate(1);
            else if (swipe > swipeConfidenceThreshold) paginate(-1);
          }}
          className={`absolute w-full h-full object-cover cursor-grab active:cursor-grabbing transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'
            }`}
        />
      </AnimatePresence>

      {/* 3. Page Indicator Overlay */}
      {media.length > 1 && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center z-30 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-black text-white/90 tracking-[2px]">
            {imageIndex + 1} / {media.length}
          </div>
        </div>
      )}
    </div>
  );
};