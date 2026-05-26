import { useRef, useState, useEffect, useCallback } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

const Carousel = ({ children, className = "", rows = 2 }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0, hasMoved: false });

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, children]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  // Drag handlers
  const handleMouseDown = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    dragState.current = {
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      hasMoved: false,
    };
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.5;
    if (Math.abs(walk) > 5) dragState.current.hasMoved = true;
    el.scrollLeft = dragState.current.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const el = scrollRef.current;
    if (el) {
      el.style.cursor = "grab";
      el.style.userSelect = "";
    }
    // Reset after a tick to allow click events to check hasMoved
    setTimeout(() => {
      dragState.current.hasMoved = false;
    }, 50);
  };

  // Touch handlers
  const handleTouchStart = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    dragState.current = {
      startX: e.touches[0].pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      hasMoved: false,
    };
  };

  const handleTouchMove = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    const x = e.touches[0].pageX - el.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.5;
    if (Math.abs(walk) > 5) dragState.current.hasMoved = true;
    el.scrollLeft = dragState.current.scrollLeft - walk;
  };

  return (
    <div className={`relative group/carousel ${className}`}>
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-dark-800/90 backdrop-blur-sm border border-dark-600/50 flex items-center justify-center text-white shadow-xl opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-accent-primary hover:border-accent-primary hover:scale-110 -translate-x-1/2"
          aria-label="Scroll left"
        >
          <HiChevronLeft className="text-xl" />
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-dark-800/90 backdrop-blur-sm border border-dark-600/50 flex items-center justify-center text-white shadow-xl opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-accent-primary hover:border-accent-primary hover:scale-110 translate-x-1/2"
          aria-label="Scroll right"
        >
          <HiChevronRight className="text-xl" />
        </button>
      )}

      {/* Gradient edges */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-dark-900 to-transparent z-10 pointer-events-none" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-dark-900 to-transparent z-10 pointer-events-none" />
      )}

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className={`grid ${rows === 2 ? 'grid-rows-2' : 'grid-rows-1'} grid-flow-col auto-cols-max gap-4 overflow-x-auto scrollbar-hide pb-2 cursor-grab select-none`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {children}
      </div>
    </div>
  );
};

export default Carousel;
