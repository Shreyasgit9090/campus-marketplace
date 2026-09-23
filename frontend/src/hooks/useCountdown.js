import { useEffect, useRef, useState } from 'react';

export default function useCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const start = (seconds = 30) => {
    clearInterval(intervalRef.current);
    setSecondsLeft(seconds);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  return { secondsLeft, start };
}
