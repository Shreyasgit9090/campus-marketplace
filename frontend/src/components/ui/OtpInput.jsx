import { useRef } from 'react';
import { motion } from 'framer-motion';

export default function OtpInput({ value, onChange, length = 6 }) {
  const inputsRef = useRef([]);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const setDigit = (idx, char) => {
    const next = digits.slice();
    next[idx] = char;
    onChange(next.join(''));
  };

  const handleChange = (idx, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    setDigit(idx, char);
    if (char && idx < length - 1) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted.padEnd(length, '').slice(0, length).replace(/ /g, ''));
    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex justify-between gap-2">
      {digits.map((d, idx) => (
        <motion.input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.04 }}
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className="h-12 w-full max-w-12 rounded-xl border border-neutral-200 bg-white text-center
            text-lg font-semibold text-neutral-900 focus:outline-none focus:ring-2
            focus:ring-brand-600/30 focus:border-brand-600 transition-colors"
        />
      ))}
    </div>
  );
}
