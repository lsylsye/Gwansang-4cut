"use strict";
/**
 * RedisSearch 검색 모듈
 * 벡터 검색 및 풀텍스트 검색 구현
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSajuIndex = createSajuIndex;
exports.dropSajuIndex = dropSajuIndex;
exports.indexChunk = indexChunk;
exports.indexChunks = indexChunks;
exports.searchByVector = searchByVector;
exports.searchByText = searchByText;
exports.searchHybrid = searchHybrid;
exports.getIndexedDocCount = getIndexedDocCount;
exports.formatSearchContext = formatSearchContext;
const redis_client_1 = require("./redis_client");
const embedding_1 = require("./embedding");
/**
 * RedisSearch 인덱스 생성
 */
async function createSajuIndex() {
    const client = await (0, redis_client_1.getRedisClient)();
    // 기존 인덱스 확인
    if (await (0, redis_client_1.indexExists)(redis_client_1.SAJU_INDEX_NAME)) {
        console.log(`⚠️ 인덱스 '${redis_client_1.SAJU_INDEX_NAME}' 이미 존재함`);
        return;
    }
    console.log(`📋 인덱스 '${redis_client_1.SAJU_INDEX_NAME}' 생성 중...`);
    // FT.CREATE 명령 실행
    await client.sendCommand([
        'FT.CREATE', redis_client_1.SAJU_INDEX_NAME,
        'ON', 'HASH',
        'PREFIX', '1', redis_client_1.SAJU_DOC_PREFIX,
        'SCHEMA',
        'content', 'TEXT', 'WEIGHT', '1.0',
        'fileName', 'TAG',
        'chunkIndex', 'NUMERIC',
        'embedding', 'VECTOR', 'HNSW', '6',
        'TYPE', 'FLOAT32',
        'DIM', String(embedding_1.EMBEDDING_DIMENSION),
        'DISTANCE_METRIC', 'COSINE',
    ]);
    console.log(`✅ 인덱스 '${redis_client_1.SAJU_INDEX_NAME}' 생성 완료`);
}
/**
 * 인덱스 삭제
 */
async function dropSajuIndex() {
    const client = await (0, redis_client_1.getRedisClient)();
    if (!(await (0, redis_client_1.indexExists)(redis_client_1.SAJU_INDEX_NAME))) {
        console.log(`⚠️ 인덱스 '${redis_client_1.SAJU_INDEX_NAME}' 존재하지 않음`);
        return;
    }
    await client.sendCommand(['FT.DROPINDEX', redis_client_1.SAJU_INDEX_NAME, 'DD']);
    console.log(`🗑️ 인덱스 '${redis_client_1.SAJU_INDEX_NAME}' 삭제 완료`);
}
/**
 * 청크를 Redis에 저장 (임베딩 포함)
 */
async function indexChunk(chunk, embedding) {
    const client = await (0, redis_client_1.getRedisClient)();
    const docKey = `${redis_client_1.SAJU_DOC_PREFIX}${chunk.fileName}:${chunk.chunkIndex}`;
    const embeddingBuffer = (0, embedding_1.vectorToBuffer)(embedding);
    await client.hSet(docKey, {
        content: chunk.content,
        fileName: chunk.fileName,
        chunkIndex: chunk.chunkIndex,
        embedding: embeddingBuffer,
    });
}
/**
 * 여러 청크를 Redis에 저장 (배치)
 */
async function indexChunks(chunks, embeddings) {
    const client = await (0, redis_client_1.getRedisClient)();
    console.log(`📥 ${chunks.length}개 청크 인덱싱 중...`);
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];
        const docKey = `${redis_client_1.SAJU_DOC_PREFIX}${chunk.fileName}:${chunk.chunkIndex}`;
        const embeddingBuffer = (0, embedding_1.vectorToBuffer)(embedding);
        await client.hSet(docKey, {
            content: chunk.content,
            fileName: chunk.fileName,
            chunkIndex: String(chunk.chunkIndex),
            embedding: embeddingBuffer,
        });
        if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
            process.stdout.write(`\r   진행: ${i + 1}/${chunks.length}`);
        }
    }
    console.log('\n✅ 인덱싱 완료');
}
/**
 * 벡터 유사도 검색 (KNN)
 */
async function searchByVector(queryText, topK = 5) {
    const client = await (0, redis_client_1.getRedisClient)();
    // 쿼리 텍스트 임베딩
    const queryEmbedding = await (0, embedding_1.embedText)(queryText);
    const queryBuffer = (0, embedding_1.vectorToBuffer)(queryEmbedding);
    // FT.SEARCH 명령 (KNN 벡터 검색)
    const result = await client.sendCommand([
        'FT.SEARCH', redis_client_1.SAJU_INDEX_NAME,
        `*=>[KNN ${topK} @embedding $query_vec AS score]`,
        'PARAMS', '2', 'query_vec', queryBuffer,
        'SORTBY', 'score',
        'RETURN', '4', 'content', 'fileName', 'chunkIndex', 'score',
        'DIALECT', '2',
    ]);
    return parseSearchResult(result);
}
/**
 * 풀텍스트 검색
 */
async function searchByText(queryText, topK = 5) {
    const client = await (0, redis_client_1.getRedisClient)();
    // 검색어 이스케이프 및 정리
    const cleanQuery = queryText
        .replace(/[^\w\s가-힣]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1)
        .join(' ');
    if (!cleanQuery) {
        return [];
    }
    const result = await client.sendCommand([
        'FT.SEARCH', redis_client_1.SAJU_INDEX_NAME,
        cleanQuery,
        'LIMIT', '0', String(topK),
        'RETURN', '3', 'content', 'fileName', 'chunkIndex',
    ]);
    return parseSearchResult(result);
}
/**
 * 하이브리드 검색 (벡터 + 텍스트)
 */
async function searchHybrid(queryText, topK = 5) {
    const client = await (0, redis_client_1.getRedisClient)();
    // 쿼리 텍스트 임베딩
    const queryEmbedding = await (0, embedding_1.embedText)(queryText);
    const queryBuffer = (0, embedding_1.vectorToBuffer)(queryEmbedding);
    // 검색어 정리
    const cleanQuery = queryText
        .replace(/[^\w\s가-힣]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1)
        .slice(0, 5) // 상위 5개 키워드만
        .join(' ');
    // 하이브리드 쿼리: 텍스트 매칭 + 벡터 KNN
    const query = cleanQuery
        ? `(${cleanQuery})=>[KNN ${topK} @embedding $query_vec AS score]`
        : `*=>[KNN ${topK} @embedding $query_vec AS score]`;
    const result = await client.sendCommand([
        'FT.SEARCH', redis_client_1.SAJU_INDEX_NAME,
        query,
        'PARAMS', '2', 'query_vec', queryBuffer,
        'SORTBY', 'score',
        'RETURN', '4', 'content', 'fileName', 'chunkIndex', 'score',
        'DIALECT', '2',
    ]);
    return parseSearchResult(result);
}
/**
 * 검색 결과 파싱
 */
function parseSearchResult(result) {
    const chunks = [];
    if (!result || result.length < 1) {
        return chunks;
    }
    const totalCount = result[0];
    // 결과 파싱: [count, docKey1, [field1, val1, ...], docKey2, ...]
    for (let i = 1; i < result.length; i += 2) {
        const docKey = result[i];
        const fields = result[i + 1];
        if (!fields)
            continue;
        const fieldMap = {};
        for (let j = 0; j < fields.length; j += 2) {
            fieldMap[fields[j]] = fields[j + 1];
        }
        chunks.push({
            content: fieldMap.content || '',
            fileName: fieldMap.fileName || docKey,
            chunkIndex: parseInt(fieldMap.chunkIndex || '0', 10),
            score: fieldMap.score ? parseFloat(fieldMap.score) : undefined,
        });
    }
    return chunks;
}
/**
 * 인덱싱된 문서 수 조회
 */
async function getIndexedDocCount() {
    const client = await (0, redis_client_1.getRedisClient)();
    try {
        const info = await client.sendCommand(['FT.INFO', redis_client_1.SAJU_INDEX_NAME]);
        // num_docs 필드 찾기
        for (let i = 0; i < info.length; i += 2) {
            if (info[i] === 'num_docs') {
                return parseInt(info[i + 1], 10);
            }
        }
        return 0;
    }
    catch {
        return 0;
    }
}
/**
 * 검색 결과를 컨텍스트 문자열로 변환
 */
function formatSearchContext(chunks) {
    if (chunks.length === 0) {
        return '[컨텍스트 없음]';
    }
    return chunks
        .map((c, i) => `--- [출처: ${c.fileName}, chunk ${c.chunkIndex}${c.score ? `, 유사도: ${(1 - c.score).toFixed(3)}` : ''}] ---\n${c.content}`)
        .join('\n\n');
}
//# sourceMappingURL=redis_search.js.map