import { useState, useEffect } from "react";

/** 한 글자씩 채워지는 타이핑 효과. skipToEnd 시 애니 없이 전체 텍스트 즉시 노출 (복귀 시용) */
export function useTypewriter(
    fullText: string,
    options?: { speedMs?: number; onComplete?: () => void; enabled?: boolean; skipToEnd?: boolean }
) {
    const [text, setText] = useState("");
    const [isComplete, setIsComplete] = useState(false);
    const { speedMs = 70, onComplete, enabled = true, skipToEnd = false } = options ?? {};

    useEffect(() => {
        if (!enabled || !fullText) {
            if (!enabled) {
                setText("");
                setIsComplete(false);
            }
            return;
        }
        if (skipToEnd) {
            setText(fullText);
            setIsComplete(true);
            onComplete?.();
            return;
        }
        setText("");
        setIsComplete(false);
        let i = 0;
        const id = setInterval(() => {
            if (i >= fullText.length) {
                clearInterval(id);
                setText(fullText);
                setIsComplete(true);
                onComplete?.();
                return;
            }
            setText(fullText.slice(0, i + 1));
            i += 1;
        }, speedMs);
        return () => clearInterval(id);
    }, [fullText, enabled, speedMs, skipToEnd]);

    return { text, isComplete };
}
