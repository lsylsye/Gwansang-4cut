/**
 * Python 스크립트를 통한 GMS API 호출 (Jupyter Lab GPU 서버용)
 *
 * 사용법:
 *   - 환경변수 USE_PYTHON_GMS=true로 설정하면 Python 스크립트를 사용
 *   - Python 스크립트는 python/call_gms.py를 사용
 */
/**
 * Python을 사용하여 GMS API 호출
 */
export declare function callGmsApiPython(systemPrompt: string, userPrompt: string): Promise<string>;
/**
 * Python 사용 여부 확인
 */
export declare function shouldUsePython(): boolean;
//# sourceMappingURL=gms_python.d.ts.map