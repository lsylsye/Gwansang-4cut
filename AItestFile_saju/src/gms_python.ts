/**
 * Python 스크립트를 통한 GMS API 호출 (Jupyter Lab GPU 서버용)
 * 
 * 사용법:
 *   - 환경변수 USE_PYTHON_GMS=true로 설정하면 Python 스크립트를 사용
 *   - Python 스크립트는 python/call_gms.py를 사용
 */

import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Python을 사용하여 GMS API 호출
 */
export async function callGmsApiPython(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const pythonDir = path.join(process.cwd(), "python");
  const scriptPath = path.join(pythonDir, "call_gms.py");
  const tempDir = path.join(process.cwd(), "temp");
  
  // temp 디렉토리 생성
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // 임시 파일 경로
  const promptsFile = path.join(tempDir, `prompts_${Date.now()}.json`);
  const outputFile = path.join(tempDir, `output_${Date.now()}.txt`);
  
  try {
    // 프롬프트를 JSON 파일로 저장
    const prompts = {
      systemPrompt,
      userPrompt,
    };
    fs.writeFileSync(promptsFile, JSON.stringify(prompts, null, 2), "utf-8");
    
    // Python 스크립트 실행
    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    const command = `${pythonCmd} "${scriptPath}" --json "${promptsFile}" "${outputFile}"`;
    
    console.log(`\n🐍 Python 스크립트 실행: ${scriptPath}`);
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: pythonDir,
      env: {
        ...process.env,
        PYTHONPATH: pythonDir,
      },
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    
    if (stderr && !stderr.includes("✅")) {
      console.warn("⚠️ Python 스크립트 경고:", stderr);
    }
    
    // 결과 파일 읽기
    if (fs.existsSync(outputFile)) {
      const result = fs.readFileSync(outputFile, "utf-8");
      
      // 임시 파일 정리
      try {
        fs.unlinkSync(promptsFile);
        fs.unlinkSync(outputFile);
      } catch (e) {
        // 정리 실패는 무시
      }
      
      return result;
    } else {
      throw new Error(
        `❌ Python 스크립트가 출력 파일을 생성하지 않았습니다.\n` +
        `   stdout: ${stdout}\n` +
        `   stderr: ${stderr}`
      );
    }
  } catch (error: any) {
    // 임시 파일 정리
    try {
      if (fs.existsSync(promptsFile)) fs.unlinkSync(promptsFile);
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    } catch (e) {
      // 정리 실패는 무시
    }
    
    if (error.code === "ENOENT") {
      throw new Error(
        `❌ Python을 찾을 수 없습니다.\n` +
        `   Python이 설치되어 있고 PATH에 등록되어 있는지 확인하세요.\n` +
        `   또는 환경변수 USE_PYTHON_GMS를 false로 설정하여 TypeScript 버전을 사용하세요.`
      );
    }
    
    throw new Error(
      `❌ Python 스크립트 실행 실패: ${error.message}\n` +
      `   stdout: ${error.stdout || ""}\n` +
      `   stderr: ${error.stderr || ""}`
    );
  }
}

/**
 * Python 사용 여부 확인
 */
export function shouldUsePython(): boolean {
  return process.env.USE_PYTHON_GMS === "true";
}
