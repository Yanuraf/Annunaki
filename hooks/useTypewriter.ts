
import { useState, useEffect } from 'react';

export const useTypewriter = (text: string, speed: number = 20): { displayText: string; isFinished: boolean } => {
  const [displayText, setDisplayText] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!text) return;
    
    setDisplayText('');
    setIsFinished(false);
    let i = 0;
    
    const intervalId = setInterval(() => {
      if (i < text.length) {
        setDisplayText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(intervalId);
        setIsFinished(true);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed]);

  return { displayText, isFinished };
};
