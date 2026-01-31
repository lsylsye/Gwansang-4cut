/**
 * 임베딩 모듈 - ko-sroberta 기반 텍스트 벡터화
 * @xenova/transformers 사용 (로컬 실행)
 */

// @ts-ignore - transformers 타입 정의 없음
import { pipeline } from '@xenova/transformers';

// 임베딩 모델 설정
const MODEL_NAME = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
// 한국어 지원 다국어 모델 (ko-sroberta 대안, ONNX 지원)
// 차원: 384

export const EMBEDDING_DIMENSION = 384;

// any 타입으로 파이프라인 관리 (transformers 라이브러리 타입 호환성)
let embeddingPipeline: any = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;

/**
 * 임베딩 파이프라인 초기화 (싱글톤)
 */
export async function initEmbedding(): Promise<any> {
  if (embeddingPipeline) {
    return embeddingPipeline;
  }

  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  console.log('🤖 임베딩 모델 로딩 중...');
  console.log(`   모델: ${MODEL_NAME}`);

  initPromise = pipeline('feature-extraction', MODEL_NAME, {
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
export async function embedText(text: string): Promise<number[]> {
  const pipe = await initEmbedding();
  
  // 텍스트 정규화
  const cleanText = text.trim().slice(0, 512); // 최대 512자
  
  const output = await pipe(cleanText, {
    pooling: 'mean',
    normalize: true,
  });

  // Tensor를 배열로 변환
  const embedding = Array.from(output.data as Float32Array);
  
  return embedding;
}

/**
 * 여러 텍스트를 벡터로 변환 (배치 처리)
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const pipe = await initEmbedding();
  
  const embeddings: number[][] = [];
  
  for (const text of texts) {
    const cleanText = text.trim().slice(0, 512);
    const output = await pipe(cleanText, {
      pooling: 'mean',
      normalize: true,
    });
    embeddings.push(Array.from(output.data as Float32Array));
  }
  
  return embeddings;
}

/**
 * 벡터를 Redis 저장용 Buffer로 변환
 */
export function vectorToBuffer(vector: number[]): Buffer {
  const float32Array = new Float32Array(vector);
  return Buffer.from(float32Array.buffer);
}

/**
 * Buffer를 벡터로 변환
 */
export function bufferToVector(buffer: Buffer): number[] {
  const float32Array = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
  return Array.from(float32Array);
}

/**
 * 코사인 유사도 계산 (디버깅/테스트용)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
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
