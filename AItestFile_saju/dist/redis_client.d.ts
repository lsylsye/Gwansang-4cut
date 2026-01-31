/**
 * Redis 클라이언트 모듈
 * RedisSearch 연결 및 기본 설정
 */
import { RedisClientType } from 'redis';
export declare const SAJU_INDEX_NAME = "idx:saju_knowledge";
export declare const SAJU_DOC_PREFIX = "saju:doc:";
/**
 * Redis 클라이언트 생성 및 연결
 */
export declare function getRedisClient(): Promise<RedisClientType>;
/**
 * Redis 연결 종료
 */
export declare function closeRedisClient(): Promise<void>;
/**
 * RedisSearch 모듈 확인
 */
export declare function checkRedisSearch(): Promise<boolean>;
/**
 * 인덱스 존재 여부 확인
 */
export declare function indexExists(indexName: string): Promise<boolean>;
/**
 * 인덱스 정보 조회
 */
export declare function getIndexInfo(indexName: string): Promise<Record<string, any> | null>;
//# sourceMappingURL=redis_client.d.ts.map