/**
 * Redis 클라이언트 모듈
 * RedisSearch 연결 및 기본 설정
 */

import { createClient, RedisClientType } from 'redis';

// 환경변수에서 Redis 설정 읽기
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

// 인덱스 및 키 설정
export const SAJU_INDEX_NAME = 'idx:saju_knowledge';
export const SAJU_DOC_PREFIX = 'saju:doc:';

let redisClient: RedisClientType | null = null;

/**
 * Redis 클라이언트 생성 및 연결
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  console.log(`🔗 Redis 연결 중... ${REDIS_HOST}:${REDIS_PORT}`);

  redisClient = createClient({
    socket: {
      host: REDIS_HOST,
      port: REDIS_PORT,
    },
    password: REDIS_PASSWORD,
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis 연결 오류:', err);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis 연결됨');
  });

  await redisClient.connect();

  return redisClient;
}

/**
 * Redis 연결 종료
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    console.log('🔌 Redis 연결 종료');
  }
}

/**
 * RedisSearch 모듈 확인
 */
export async function checkRedisSearch(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    
    // FT._LIST 명령으로 RedisSearch 모듈 확인
    const result = await client.sendCommand(['FT._LIST']);
    console.log('✅ RedisSearch 모듈 활성화됨');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('unknown command')) {
      console.error('❌ RedisSearch 모듈이 없습니다. redis-stack-server 이미지를 사용하세요.');
      return false;
    }
    throw error;
  }
}

/**
 * 인덱스 존재 여부 확인
 */
export async function indexExists(indexName: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    await client.sendCommand(['FT.INFO', indexName]);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unknown index name')) {
      return false;
    }
    throw error;
  }
}

/**
 * 인덱스 정보 조회
 */
export async function getIndexInfo(indexName: string): Promise<Record<string, any> | null> {
  try {
    const client = await getRedisClient();
    const result = await client.sendCommand(['FT.INFO', indexName]);
    return result as Record<string, any>;
  } catch (error) {
    return null;
  }
}
