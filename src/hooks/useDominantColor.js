import { useState, useEffect } from 'react';
import { FastAverageColor } from 'fast-average-color';

const fac = new FastAverageColor();

export const useDominantColor = (imageUrl, defaultColor = '#0b0b12') => {
  const [color, setColor] = useState(defaultColor);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setColor(defaultColor);
      setIsLight(false);
      return;
    }

    const fetchColor = async () => {
      try {
        // FastAverageColor can load image crossOrigin if necessary
        const result = await fac.getColorAsync(imageUrl, {
          algorithm: 'dominant',
          crossOrigin: 'anonymous',
        });
        setColor(result.hex);
        setIsLight(result.isLight);
      } catch (error) {
        console.warn("Could not extract dominant color:", error);
        setColor(defaultColor);
        setIsLight(false);
      }
    };

    fetchColor();
  }, [imageUrl, defaultColor]);

  return { color, isLight };
};
