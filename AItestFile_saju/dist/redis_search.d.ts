/**
 * RedisSearch 검색 모듈
 * 벡터 검색 및 풀텍스트 검색 구현
 */
import { Chunk } from './rag';
/**
 * RedisSearch 인덱스 생성
 */
export declare function createSajuIndex(): Promise<void>;
/**
 * 인덱스 삭제
 */
export declare function dropSajuIndex(): Promise<void>;
/**
 * 청크를 Redis에 저장 (임베딩 포함)
 */
export declare function indexChunk(chunk: Chunk, embedding: number[]): Promise<void>;
/**
 * 여러 청크를 Redis에 저장 (배치)
 */
export declare function indexChunks(chunks: Chunk[], embeddings: number[][]): Promise<void>;
/**
 * 벡터 유사도 검색 (KNN)
 */
export declare function searchByVector(queryText: string, topK?: number): Promise<Chunk[]>;
/**
 * 풀텍스트 검색
 */
export declare function searchByText(queryText: string, topK?: number): Promise<Chunk[]>;
/**
 * 하이브리드 검색 (벡터 + 텍스트)
 */
export declare function searchHybrid(queryText: string, topK?: number): Promise<Chunk[]>;
/**
 * 인덱싱된 문서 수 조회
 */
export declare function getIndexedDocCount(): Promise<number>;
/**
 * 검색 결과를 컨텍스트 문자열로 변환
 */
export declare function formatSearchContext(chunks: Chunk[]): string;
//# sourceMappingURL=redis_search.d.ts.map