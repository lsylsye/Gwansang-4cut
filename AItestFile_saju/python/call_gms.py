"""
GMS API를 호출하는 독립 실행형 Python 스크립트
TypeScript에서 child_process로 호출할 수 있도록 설계됨

사용법:
    python call_gms.py <system_prompt_file> <user_prompt_file> [output_file]

또는 JSON 입력:
    python call_gms.py --json <prompts_json_file> [output_file]
"""

import sys
import json
import os
from gms_api import call_gms_api, get_config


def main():
    """메인 함수"""
    if len(sys.argv) < 2:
        print("사용법:")
        print("  python call_gms.py <system_prompt_file> <user_prompt_file> [output_file]")
        print("  python call_gms.py --json <prompts_json_file> [output_file]")
        sys.exit(1)
    
    try:
        # JSON 모드
        if sys.argv[1] == "--json":
            if len(sys.argv) < 3:
                print("❌ JSON 파일 경로가 필요합니다.")
                sys.exit(1)
            
            json_file = sys.argv[2]
            output_file = sys.argv[3] if len(sys.argv) > 3 else None
            
            with open(json_file, 'r', encoding='utf-8') as f:
                prompts = json.load(f)
            
            system_prompt = prompts.get('systemPrompt', '')
            user_prompt = prompts.get('userPrompt', '')
        
        # 파일 모드
        else:
            if len(sys.argv) < 3:
                print("❌ 시스템 프롬프트와 사용자 프롬프트 파일이 필요합니다.")
                sys.exit(1)
            
            system_file = sys.argv[1]
            user_file = sys.argv[2]
            output_file = sys.argv[3] if len(sys.argv) > 3 else None
            
            with open(system_file, 'r', encoding='utf-8') as f:
                system_prompt = f.read()
            
            with open(user_file, 'r', encoding='utf-8') as f:
                user_prompt = f.read()
        
        # API 호출
        result = call_gms_api(system_prompt, user_prompt)
        
        # 결과 출력
        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(result)
            print(f"✅ 결과가 저장되었습니다: {output_file}")
        else:
            print(result)
        
        sys.exit(0)
        
    except Exception as e:
        print(f"❌ 오류: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
