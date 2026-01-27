import React, { useState, useRef, useEffect } from 'react';
import Calendar from 'react-calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  placeholder?: string;
  themeColor?: 'green' | 'orange';
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'YYYY.MM.DD',
  themeColor = 'orange',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // YYYY-MM-DD를 YYYY.MM.DD 형식으로 변환
  const toDisplayFormat = (dateString: string): string => {
    if (!dateString) return '';
    return dateString.replace(/-/g, '.');
  };

  // YYYY.MM.DD를 YYYY-MM-DD 형식으로 변환
  const toStorageFormat = (displayString: string): string => {
    return displayString.replace(/\./g, '-');
  };

  // value prop이 변경되면 inputValue 동기화
  useEffect(() => {
    setInputValue(toDisplayFormat(value));
  }, [value]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateChange = (date: Value) => {
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}`;
      onChange(formatted);
      setInputValue(toDisplayFormat(formatted));
      setIsOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // 숫자와 점만 허용
    newValue = newValue.replace(/[^\d.]/g, '');
    
    // 점 제거하고 숫자만 추출
    const digits = newValue.replace(/\./g, '');
    
    // 자동 포맷팅: YYYY.MM.DD
    let formatted = '';
    if (digits.length > 0) {
      formatted = digits.slice(0, 4); // 년도
      if (digits.length > 4) {
        formatted += '.' + digits.slice(4, 6); // 월
      }
      if (digits.length > 6) {
        formatted += '.' + digits.slice(6, 8); // 일
      }
    }
    
    setInputValue(formatted);
    
    // YYYY.MM.DD 형식이 완성되면 onChange 호출
    if (/^\d{4}\.\d{2}\.\d{2}$/.test(formatted)) {
      const [year, month, day] = formatted.split('.').map(Number);
      const date = new Date(year, month - 1, day);
      // 유효한 날짜인지 확인
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        onChange(toStorageFormat(formatted));
      }
    }
  };

  const handleInputBlur = () => {
    // 입력이 비어있으면 그대로 두기
    if (!inputValue) {
      onChange('');
      return;
    }
    // 유효하지 않은 형식이면 이전 값으로 복원
    if (!/^\d{4}\.\d{2}\.\d{2}$/.test(inputValue)) {
      setInputValue(toDisplayFormat(value));
    }
  };

  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const brandColor = themeColor === 'green' ? 'brand-green' : 'brand-orange';
  const brandColorHex = themeColor === 'green' ? '#00897B' : '#FF7043';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Field */}
      <div
        className={`
          flex items-center gap-3 bg-white/80 border-2 border-gray-100 
          focus-within:border-${brandColor} shadow-inner h-12 rounded-xl 
          transition-all px-3
          ${isOpen ? `border-${brandColor}` : ''}
        `}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-5 h-5 text-${brandColor} hover:opacity-70 transition-opacity cursor-pointer`}
        >
          <CalendarIcon className="w-5 h-5" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <style>{`
                .custom-calendar {
                  width: 100%;
                  border: none;
                  font-family: 'Pretendard', sans-serif;
                  background: white;
                  padding: 16px;
                }
                
                .custom-calendar .react-calendar__navigation {
                  display: flex;
                  margin-bottom: 12px;
                }
                
                .custom-calendar .react-calendar__navigation button {
                  background: none;
                  border: none;
                  font-size: 16px;
                  font-weight: 700;
                  color: #374151;
                  padding: 8px 12px;
                  border-radius: 8px;
                  cursor: pointer;
                  transition: all 0.15s;
                }
                
                .custom-calendar .react-calendar__navigation button:hover {
                  background: #f3f4f6;
                }
                
                .custom-calendar .react-calendar__navigation button:disabled {
                  color: #d1d5db;
                }
                
                .custom-calendar .react-calendar__month-view__weekdays {
                  text-align: center;
                  font-size: 12px;
                  font-weight: 600;
                  color: #9ca3af;
                  margin-bottom: 8px;
                }
                
                .custom-calendar .react-calendar__month-view__weekdays abbr {
                  text-decoration: none;
                }
                
                .custom-calendar .react-calendar__tile {
                  background: none;
                  border: none;
                  padding: 10px;
                  font-size: 14px;
                  font-weight: 500;
                  color: #374151;
                  border-radius: 8px;
                  cursor: pointer;
                  transition: all 0.15s;
                }
                
                .custom-calendar .react-calendar__tile:hover {
                  background: #f3f4f6;
                }
                
                .custom-calendar .react-calendar__tile--now {
                  background: #fef3c7;
                  color: #92400e;
                }
                
                .custom-calendar .react-calendar__tile--active {
                  background: ${brandColorHex} !important;
                  color: white !important;
                  font-weight: 700;
                }
                
                .custom-calendar .react-calendar__tile--active:hover {
                  background: ${brandColorHex} !important;
                  opacity: 0.9;
                }
                
                .custom-calendar .react-calendar__month-view__days__day--weekend {
                  color: #ef4444;
                }
                
                .custom-calendar .react-calendar__month-view__days__day--neighboringMonth {
                  color: #d1d5db;
                }
                
                .custom-calendar .react-calendar__decade-view__years__year,
                .custom-calendar .react-calendar__year-view__months__month,
                .custom-calendar .react-calendar__century-view__decades__decade {
                  padding: 16px 8px;
                  font-size: 14px;
                  font-weight: 500;
                  border-radius: 12px;
                }
                
                .custom-calendar .react-calendar__decade-view__years__year:hover,
                .custom-calendar .react-calendar__year-view__months__month:hover,
                .custom-calendar .react-calendar__century-view__decades__decade:hover {
                  background: #f3f4f6;
                }
              `}</style>
              <Calendar
                className="custom-calendar"
                value={parseDate(value)}
                onChange={handleDateChange}
                locale="ko-KR"
                formatDay={(locale, date) => date.getDate().toString()}
                calendarType="gregory"
                prev2Label="«"
                next2Label="»"
                minDetail="decade"
                defaultView="decade"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
