// src/components/landing/BenefitsCarousel.js
import React, { useState, useEffect } from 'react';

const BenefitsCarousel = ({ benefits, autoRotate = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoRotate) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % benefits.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [benefits.length, autoRotate]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % benefits.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + benefits.length) % benefits.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Carousel Container */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="w-full flex-shrink-0 p-8 md:p-12"
            >
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Icon */}
                <div className="text-6xl md:text-7xl flex-shrink-0">
                  {benefit.icon}
                </div>
                
                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    {benefit.title}
                  </h3>
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    {benefit.description}
                  </p>
                  <div className="flex justify-center md:justify-start">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      {benefit.stats}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
      >
        ‹
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
      >
        ›
      </button>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-6 space-x-2">
        {benefits.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-blue-600 w-8'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default BenefitsCarousel;