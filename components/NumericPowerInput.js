// components/NumericPowerInput.js
import { useState } from 'react';
import styles from './NumericPowerInput.module.css';

export default function NumericPowerInput({ label, value, onChange, allowSigns = true }) {
  const [displayValue, setDisplayValue] = useState(value || '');

  const handleChange = (e) => {
    let input = e.target.value;
    
    // Allow numbers, decimal point, and signs
    if (allowSigns) {
      input = input.replace(/[^0-9.\-+]/g, '');
    } else {
      input = input.replace(/[^0-9.]/g, '');
    }
    
    setDisplayValue(input);
    onChange(input);
  };

  const handleKeypad = (key) => {
    let newValue = displayValue;
    
    if (key === 'clear') {
      newValue = '';
    } else if (key === 'backspace') {
      newValue = displayValue.slice(0, -1);
    } else if (key === '+/-') {
      if (displayValue.startsWith('-')) {
        newValue = displayValue.substring(1);
      } else if (displayValue) {
        newValue = '-' + displayValue;
      }
    } else {
      newValue = displayValue + key;
    }
    
    setDisplayValue(newValue);
    onChange(newValue);
  };

  return (
    <div className={styles.powerInput}>
      <label className={styles.label}>{label}</label>
      <div className={styles.inputContainer}>
        <input
          type="text"
          className={styles.input}
          value={displayValue}
          onChange={handleChange}
          placeholder="0.00"
          inputMode="decimal"
        />
        <div className={styles.keypad}>
          <button type="button" onClick={() => handleKeypad('+/-')} className={styles.keypadButton}>
            +/-
          </button>
          <button type="button" onClick={() => handleKeypad('7')} className={styles.keypadButton}>7</button>
          <button type="button" onClick={() => handleKeypad('8')} className={styles.keypadButton}>8</button>
          <button type="button" onClick={() => handleKeypad('9')} className={styles.keypadButton}>9</button>
          <button type="button" onClick={() => handleKeypad('4')} className={styles.keypadButton}>4</button>
          <button type="button" onClick={() => handleKeypad('5')} className={styles.keypadButton}>5</button>
          <button type="button" onClick={() => handleKeypad('6')} className={styles.keypadButton}>6</button>
          <button type="button" onClick={() => handleKeypad('1')} className={styles.keypadButton}>1</button>
          <button type="button" onClick={() => handleKeypad('2')} className={styles.keypadButton}>2</button>
          <button type="button" onClick={() => handleKeypad('3')} className={styles.keypadButton}>3</button>
          <button type="button" onClick={() => handleKeypad('.')} className={styles.keypadButton}>.</button>
          <button type="button" onClick={() => handleKeypad('0')} className={styles.keypadButton}>0</button>
          <button type="button" onClick={() => handleKeypad('backspace')} className={styles.keypadButton}>
            ⌫
          </button>
          <button type="button" onClick={() => handleKeypad('clear')} className={styles.keypadButton}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

