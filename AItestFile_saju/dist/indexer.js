"use strict";
/**
 * 인덱싱 CLI 도구
 * knowledge 폴더의 MD 파일을 Redis에 인덱싱
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
const path = __importStar(require("path"));
const rag_1 = require("./rag");
const embedding_1 = require("./embedding");
const redis_client_1 = require("./redis_client");
const redis_search_1 = require("./redis_search");
/**
 * 청크들의 임베딩 생성 (진행률 표시)
 */
async function generateEmbeddings(chunks) {
    console.log(`🤖 ${chunks.length}개 청크 임베딩 생성 중...`);
    const embeddings = [];
    for (let i = 0; i < chunks.length; i++) {
        const embedding = await (0, embedding_1.embedText)(chunks[i].content);
        embeddings.push(embedding);
        if ((i + 1) % 5 === 0 || i === chunks.length - 1) {
            process.stdout.write(`\r   진행: ${i + 1}/${chunks.length}`);
        }
    }
    console.log('\n✅ 임베딩 생성 완료');
    return embeddings;
}
/**
 * 전체 인덱싱 실행
 */
async function runFullIndexing(knowledgePath, force = false) {
    console.log('━'.repeat(55));
    console.log('📚 사주 지식베이스 인덱싱');
    console.log('━'.repeat(55));
    // 1. Redis 연결 확인
    const client = await (0, redis_client_1.getRedisClient)();
    // 2. RedisSearch 모듈 확인
    const hasSearch = await (0, redis_client_1.checkRedisSearch)();
    if (!hasSearch) {
        console.error('❌ RedisSearch가 필요합니다. redis-stack-server 이미지를 사용하세요.');
        process.exit(1);
    }
    // 3. 임베딩 모델 초기화
    await (0, embedding_1.initEmbedding)();
    // 4. 기존 인덱스 처리
    if (force) {
        console.log('\n🗑️ 기존 인덱스 삭제 중...');
        await (0, redis_search_1.dropSajuIndex)();
    }
    // 5. 인덱스 생성
    await (0, redis_search_1.createSajuIndex)();
    // 6. 문서 로드
    console.log(`\n📂 문서 로드 중: ${knowledgePath}`);
    const chunks = (0, rag_1.loadKnowledgeBase)(knowledgePath);
    if (chunks.length === 0) {
        console.log('⚠️ 인덱싱할 문서가 없습니다.');
        return;
    }
    // 7. 임베딩 생성
    const embeddings = await generateEmbeddings(chunks);
    // 8. Redis에 저장
    await (0, redis_search_1.indexChunks)(chunks, embeddings);
    // 9. 결과 확인
    const docCount = await (0, redis_search_1.getIndexedDocCount)();
    console.log(`\n✅ 인덱싱 완료: ${docCount}개 문서`);
}
/**
 * 인덱스 상태 확인
 */
async function checkIndexStatus() {
    console.log('━'.repeat(55));
    console.log('📊 인덱스 상태 확인');
    console.log('━'.repeat(55));
    await (0, redis_client_1.getRedisClient)();
    await (0, redis_client_1.checkRedisSearch)();
    const docCount = await (0, redis_search_1.getIndexedDocCount)();
    console.log(`\n📚 인덱싱된 문서 수: ${docCount}`);
}
/**
 * 인덱스 삭제
 */
async function deleteIndex() {
    console.log('━'.repeat(55));
    console.log('🗑️ 인덱스 삭제');
    console.log('━'.repeat(55));
    await (0, redis_client_1.getRedisClient)();
    await (0, redis_search_1.dropSajuIndex)();
}
/**
 * CLI 인자 파싱
 */
function parseArgs() {
    const args = process.argv.slice(2);
    let command = 'index'; // 기본 명령
    let force = false;
    let knowledgePath;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--force' || arg === '-f') {
            force = true;
        }
        else if (arg === '--path' || arg === '-p') {
            knowledgePath = args[++i];
        }
        else if (arg === 'index' || arg === 'status' || arg === 'delete') {
            command = arg;
        }
        else if (arg === '--help' || arg === '-h') {
            command = 'help';
        }
    }
    return { command, force, path: knowledgePath };
}
/**
 * 도움말 출력
 */
function showHelp() {
    console.log(`
📚 사주 지식베이스 인덱싱 CLI

사용법:
  npx ts-node src/indexer.ts [명령] [옵션]

명령:
  index     문서 인덱싱 (기본)
  status    인덱스 상태 확인
  delete    인덱스 삭제

옵션:
  --force, -f     기존 인덱스 삭제 후 재생성
  --path, -p      knowledge 폴더 경로 (기본: ./knowledge)
  --help, -h      도움말 표시

예시:
  npx ts-node src/indexer.ts index
  npx ts-node src/indexer.ts index --force
  npx ts-node src/indexer.ts status
  npx ts-node src/indexer.ts delete
`);
}
/**
 * 메인 실행
 */
async function main() {
    const args = parseArgs();
    try {
        switch (args.command) {
            case 'index':
                const knowledgePath = args.path || path.join(process.cwd(), 'knowledge');
                await runFullIndexing(knowledgePath, args.force);
                break;
            case 'status':
                await checkIndexStatus();
                break;
            case 'delete':
                await deleteIndex();
                break;
            case 'help':
            default:
                showHelp();
                break;
        }
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`\n❌ 오류: ${error.message}`);
        }
        else {
            console.error('\n❌ 알 수 없는 오류가 발생했습니다.');
        }
        process.exit(1);
    }
    finally {
        await (0, redis_client_1.closeRedisClient)();
    }
}
main();
//# sourceMappingURL=indexer.js.map