/**
 * 인덱싱 CLI 도구
 * knowledge 폴더의 MD 파일을 Redis에 인덱싱
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadKnowledgeBase, Chunk } from './rag';
import { initEmbedding, embedText, vectorToBuffer } from './embedding';
import { 
  getRedisClient, 
  closeRedisClient, 
  checkRedisSearch 
} from './redis_client';
import { 
  createSajuIndex, 
  dropSajuIndex, 
  indexChunks,
  getIndexedDocCount 
} from './redis_search';
import { StepLogger, ProgressBar, Spinner } from './progress';

/**
 * 청크들의 임베딩 생성 (진행률 표시)
 */
async function generateEmbeddings(chunks: Chunk[]): Promise<number[][]> {
  console.log(`🤖 ${chunks.length}개 청크 임베딩 생성 중...`);
  
  const embeddings: number[][] = [];
  const progressBar = new ProgressBar(chunks.length, '   임베딩 생성');
  
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await embedText(chunks[i].content);
    embeddings.push(embedding);
    progressBar.update(i + 1);
  }
  
  progressBar.finish('임베딩 생성 완료');
  return embeddings;
}

/**
 * 전체 인덱싱 실행
 */
async function runFullIndexing(knowledgePath: string, force: boolean = false): Promise<void> {
  console.log('━'.repeat(55));
  console.log('📚 사주 지식베이스 인덱싱');
  console.log('━'.repeat(55));

  const logger = new StepLogger(6); // 총 6단계

  // 1. Redis 연결 확인
  logger.startStep("Redis 연결", "Redis 서버 연결 및 상태 확인");
  const spinner1 = new Spinner("Redis 연결 중...");
  spinner1.start();
  const client = await getRedisClient();
  spinner1.stop("Redis 연결 완료");
  
  // 2. RedisSearch 모듈 확인
  logger.startStep("RedisSearch 확인", "RedisSearch 모듈 활성화 여부 확인");
  const spinner2 = new Spinner("RedisSearch 모듈 확인 중...");
  spinner2.start();
  const hasSearch = await checkRedisSearch();
  spinner2.stop();
  
  if (!hasSearch) {
    logger.error('RedisSearch가 필요합니다. redis-stack-server 이미지를 사용하세요.');
    process.exit(1);
  }
  logger.success("RedisSearch 모듈 활성화됨");

  // 3. 임베딩 모델 초기화
  logger.startStep("임베딩 모델 초기화", "벡터화 모델 로딩");
  await initEmbedding();
  logger.success("임베딩 모델 로딩 완료");

  // 4. 기존 인덱스 처리
  logger.startStep("인덱스 준비", "기존 인덱스 확인 및 처리");
  if (force) {
    logger.log("기존 인덱스 삭제 중...", 2);
    await dropSajuIndex();
    logger.success("기존 인덱스 삭제 완료");
  } else {
    logger.info("기존 인덱스 유지");
  }

  // 5. 인덱스 생성
  logger.startStep("인덱스 생성", "RedisSearch 인덱스 스키마 생성");
  const spinner3 = new Spinner("인덱스 생성 중...");
  spinner3.start();
  await createSajuIndex();
  spinner3.stop();
  logger.success("인덱스 생성 완료");

  // 6. 문서 로드
  logger.startStep("문서 로드", `지식베이스 로드: ${knowledgePath}`);
  const spinner4 = new Spinner("문서 로드 중...");
  spinner4.start();
  const chunks = loadKnowledgeBase(knowledgePath);
  spinner4.stop();
  
  if (chunks.length === 0) {
    logger.warning('인덱싱할 문서가 없습니다.');
    return;
  }
  logger.success(`${chunks.length}개 청크 로드 완료`);

  // 7. 임베딩 생성
  logger.startStep("임베딩 생성", `${chunks.length}개 청크 벡터화`);
  const embeddings = await generateEmbeddings(chunks);

  // 8. Redis에 저장
  logger.startStep("Redis 저장", "인덱싱된 데이터를 Redis에 저장");
  const progressBar = new ProgressBar(chunks.length, '   Redis 저장');
  
  const client2 = await getRedisClient();
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = embeddings[i];
    
    const docKey = `saju:doc:${chunk.fileName}:${chunk.chunkIndex}`;
    const embeddingBuffer = vectorToBuffer(embedding);

    await client2.hSet(docKey, {
      content: chunk.content,
      fileName: chunk.fileName,
      chunkIndex: String(chunk.chunkIndex),
      embedding: embeddingBuffer,
    });
    
    progressBar.update(i + 1);
  }
  progressBar.finish('Redis 저장 완료');

  // 9. 결과 확인
  const spinner5 = new Spinner("인덱스 상태 확인 중...");
  spinner5.start();
  const docCount = await getIndexedDocCount();
  spinner5.stop();
  
  console.log(`\n✅ 인덱싱 완료: ${docCount}개 문서`);
  logger.success(`인덱싱 완료: ${docCount}개 문서`);
}

/**
 * 인덱스 상태 확인
 */
async function checkIndexStatus(): Promise<void> {
  console.log('━'.repeat(55));
  console.log('📊 인덱스 상태 확인');
  console.log('━'.repeat(55));

  await getRedisClient();
  await checkRedisSearch();
  
  const docCount = await getIndexedDocCount();
  console.log(`\n📚 인덱싱된 문서 수: ${docCount}`);
}

/**
 * 인덱스 삭제
 */
async function deleteIndex(): Promise<void> {
  console.log('━'.repeat(55));
  console.log('🗑️ 인덱스 삭제');
  console.log('━'.repeat(55));

  await getRedisClient();
  await dropSajuIndex();
}

/**
 * CLI 인자 파싱
 */
function parseArgs(): { command: string; force: boolean; path?: string } {
  const args = process.argv.slice(2);
  let command = 'index'; // 기본 명령
  let force = false;
  let knowledgePath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--force' || arg === '-f') {
      force = true;
    } else if (arg === '--path' || arg === '-p') {
      knowledgePath = args[++i];
    } else if (arg === 'index' || arg === 'status' || arg === 'delete') {
      command = arg;
    } else if (arg === '--help' || arg === '-h') {
      command = 'help';
    }
  }

  return { command, force, path: knowledgePath };
}

/**
 * 도움말 출력
 */
function showHelp(): void {
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
async function main(): Promise<void> {
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
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ 오류: ${error.message}`);
    } else {
      console.error('\n❌ 알 수 없는 오류가 발생했습니다.');
    }
    process.exit(1);
  } finally {
    await closeRedisClient();
  }
}

main();
