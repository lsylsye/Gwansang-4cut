/**
 * 임베딩 모듈 - ko-sroberta 기반 텍스트 벡터화
 * @xenova/transformers 사용 (로컬 실행)
 */
export declare const EMBEDDING_DIMENSION = 384;
/**
 * 임베딩 파이프라인 초기화 (싱글톤)
 */
export declare function initEmbedding(): Promise<any>;
/**
 * 텍스트를 벡터로 변환
 */
export declare function embedText(text: string): Promise<number[]>;
/**
 * 여러 텍스트를 벡터로 변환 (배치 처리)
 */
export declare function embedTexts(texts: string[]): Promise<number[][]>;
/**
 * 벡터를 Redis 저장용 Buffer로 변환
 */
export declare function vectorToBuffer(vector: number[]): Buffer;
/**
 * Buffer를 벡터로 변환
 */
export declare function bufferToVector(buffer: Buffer): number[];
/**
 * 코사인 유사도 계산 (디버깅/테스트용)
 */
export declare function cosineSimilarity(a: number[], b: number[]): number;
//# sourceMappingURL=embedding.d.ts.map