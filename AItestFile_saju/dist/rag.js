"use strict";
/**
 * RAG 모듈 - 로컬 knowledge 폴더 기반 검색
 * TF-IDF 기반 간단한 검색 구현
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadKnowledgeBase = loadKnowledgeBase;
exports.searchChunks = searchChunks;
exports.formatContext = formatContext;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * 문서를 chunk로 분할 (400~800자 단위)
 */
function splitIntoChunks(content, fileName, chunkSize = 600, overlap = 100) {
    const chunks = [];
    const lines = content.split("\n");
    let currentChunk = "";
    let chunkIndex = 0;
    for (const line of lines) {
        if (currentChunk.length + line.length > chunkSize && currentChunk.length > 0) {
            chunks.push({
                content: currentChunk.trim(),
                fileName,
                chunkIndex: chunkIndex++,
            });
            // overlap 처리: 마지막 일부 유지
            const words = currentChunk.split(" ");
            const overlapWords = words.slice(-Math.floor(words.length * 0.2));
            currentChunk = overlapWords.join(" ") + "\n" + line;
        }
        else {
            currentChunk += (currentChunk ? "\n" : "") + line;
        }
    }
    if (currentChunk.trim()) {
        chunks.push({
            content: currentChunk.trim(),
            fileName,
            chunkIndex: chunkIndex,
        });
    }
    return chunks;
}
/**
 * 한국어 + 영어 토큰화
 */
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s가-힣]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 1);
}
/**
 * TF-IDF 기반 문서 빈도 계산
 */
function computeTfIdf(chunks, query) {
    const queryTokens = tokenize(query);
    const docFreq = new Map();
    const N = chunks.length;
    // 문서 빈도 계산
    for (const chunk of chunks) {
        const tokens = new Set(tokenize(chunk.content));
        for (const token of tokens) {
            docFreq.set(token, (docFreq.get(token) || 0) + 1);
        }
    }
    // TF-IDF 점수 계산
    const results = chunks.map((chunk) => {
        const tokens = tokenize(chunk.content);
        const termFreq = new Map();
        for (const token of tokens) {
            termFreq.set(token, (termFreq.get(token) || 0) + 1);
        }
        let score = 0;
        for (const qToken of queryTokens) {
            const tf = (termFreq.get(qToken) || 0) / tokens.length;
            const df = docFreq.get(qToken) || 0;
            const idf = df > 0 ? Math.log(N / df) : 0;
            score += tf * idf;
        }
        return { chunk, score };
    });
    return results.sort((a, b) => b.score - a.score);
}
/**
 * knowledge 폴더에서 모든 문서 로드
 */
function loadKnowledgeBase(knowledgePath) {
    const chunks = [];
    if (!fs.existsSync(knowledgePath)) {
        console.warn(`⚠️ knowledge 폴더가 없습니다: ${knowledgePath}`);
        return chunks;
    }
    const files = fs.readdirSync(knowledgePath);
    for (const file of files) {
        if (!file.endsWith(".md") && !file.endsWith(".txt"))
            continue;
        const filePath = path.join(knowledgePath, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const fileChunks = splitIntoChunks(content, file);
        chunks.push(...fileChunks);
    }
    console.log(`📚 ${chunks.length}개의 chunk를 로드했습니다.`);
    return chunks;
}
/**
 * RAG 검색 수행 - topK개 관련 chunk 반환
 */
function searchChunks(chunks, query, topK = 5) {
    if (chunks.length === 0) {
        return [];
    }
    const scored = computeTfIdf(chunks, query);
    const topChunks = scored.slice(0, topK).map((item) => ({
        ...item.chunk,
        score: item.score,
    }));
    return topChunks;
}
/**
 * 검색 결과를 컨텍스트 문자열로 변환
 */
function formatContext(chunks) {
    if (chunks.length === 0) {
        return "[컨텍스트 없음]";
    }
    return chunks
        .map((c, i) => `--- [출처: ${c.fileName}, chunk ${c.chunkIndex}] ---\n${c.content}`)
        .join("\n\n");
}
//# sourceMappingURL=rag.js.map