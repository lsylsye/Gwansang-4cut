/**
 * RAG 모듈 - 로컬 knowledge 폴더 기반 검색
 * TF-IDF 기반 간단한 검색 구현
 */
export interface Chunk {
    content: string;
    fileName: string;
    chunkIndex: number;
    score?: number;
}
/**
 * knowledge 폴더에서 모든 문서 로드
 */
export declare function loadKnowledgeBase(knowledgePath: string): Chunk[];
/**
 * RAG 검색 수행 - topK개 관련 chunk 반환
 */
export declare function searchChunks(chunks: Chunk[], query: string, topK?: number): Chunk[];
/**
 * 검색 결과를 컨텍스트 문자열로 변환
 */
export declare function formatContext(chunks: Chunk[]): string;
//# sourceMappingURL=rag.d.ts.map