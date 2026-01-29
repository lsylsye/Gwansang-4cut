"use strict";
/**
 * 임베딩 모듈 - ko-sroberta 기반 텍스트 벡터화
 * @xenova/transformers 사용 (로컬 실행)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMBEDDING_DIMENSION = void 0;
exports.initEmbedding = initEmbedding;
exports.embedText = embedText;
exports.embedTexts = embedTexts;
exports.vectorToBuffer = vectorToBuffer;
exports.bufferToVector = bufferToVector;
exports.cosineSimilarity = cosineSimilarity;
// @ts-ignore - transformers 타입 정의 없음
const transformers_1 = require("@xenova/transformers");
// 임베딩 모델 설정
const MODEL_NAME = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
// 한국어 지원 다국어 모델 (ko-sroberta 대안, ONNX 지원)
// 차원: 384
exports.EMBEDDING_DIMENSION = 384;
// any 타입으로 파이프라인 관리 (transformers 라이브러리 타입 호환성)
let embeddingPipeline = null;
let isInitializing = false;
let initPromise = null;
/**
 * 임베딩 파이프라인 초기화 (싱글톤)
 */
async function initEmbedding() {
    if (embeddingPipeline) {
        return embeddingPipeline;
    }
    if (isInitializing && initPromise) {
        return initPromise;
    }
    isInitializing = true;
    console.log('🤖 임베딩 모델 로딩 중...');
    console.log(`   모델: ${MODEL_NAME}`);
    initPromise = (0, transformers_1.pipeline)('feature-extraction', MODEL_NAME, {
        quantized: true, // 경량화 버전 사용
    });
    embeddingPipeline = await initPromise;
    console.log('✅ 임베딩 모델 로딩 완료');
    isInitializing = false;
    return embeddingPipeline;
}
/**
 * 텍스트를 벡터로 변환
 */
async function embedText(text) {
    const pipe = await initEmbedding();
    // 텍스트 정규화
    const cleanText = text.trim().slice(0, 512); // 최대 512자
    const output = await pipe(cleanText, {
        pooling: 'mean',
        normalize: true,
    });
    // Tensor를 배열로 변환
    const embedding = Array.from(output.data);
    return embedding;
}
/**
 * 여러 텍스트를 벡터로 변환 (배치 처리)
 */
async function embedTexts(texts) {
    const pipe = await initEmbedding();
    const embeddings = [];
    for (const text of texts) {
        const cleanText = text.trim().slice(0, 512);
        const output = await pipe(cleanText, {
            pooling: 'mean',
            normalize: true,
        });
        embeddings.push(Array.from(output.data));
    }
    return embeddings;
}
/**
 * 벡터를 Redis 저장용 Buffer로 변환
 */
function vectorToBuffer(vector) {
    const float32Array = new Float32Array(vector);
    return Buffer.from(float32Array.buffer);
}
/**
 * Buffer를 벡터로 변환
 */
function bufferToVector(buffer) {
    const float32Array = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
    return Array.from(float32Array);
}
/**
 * 코사인 유사도 계산 (디버깅/테스트용)
 */
function cosineSimilarity(a, b) {
    if (a.length !== b.length) {
        throw new Error('벡터 차원이 일치하지 않습니다');
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
//# sourceMappingURL=embedding.js.map