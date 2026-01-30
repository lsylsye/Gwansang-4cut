/**
 * 프로그레스 바 및 로깅 유틸리티
 */

/**
 * 프로그레스 바 표시
 */
export class ProgressBar {
  private total: number;
  private current: number;
  private width: number;
  private label: string;
  private startTime: number;

  constructor(total: number, label: string = '', width: number = 30) {
    this.total = total;
    this.current = 0;
    this.width = width;
    this.label = label;
    this.startTime = Date.now();
  }

  update(current: number, additionalInfo?: string): void {
    this.current = Math.min(current, this.total);
    const percentage = Math.floor((this.current / this.total) * 100);
    const filled = Math.floor((this.current / this.total) * this.width);
    const empty = this.width - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    process.stdout.write(
      `\r${this.label} ${bar} ${percentage}% (${this.current}/${this.total}) ${elapsed}s${additionalInfo ? ' ' + additionalInfo : ''}`
    );
    
    if (this.current >= this.total) {
      process.stdout.write('\n');
    }
  }

  increment(additionalInfo?: string): void {
    this.update(this.current + 1, additionalInfo);
  }

  finish(message?: string): void {
    this.update(this.total);
    if (message) {
      console.log(`   ${message}`);
    }
  }
}

/**
 * 단계별 로거
 */
export class StepLogger {
  private stepNumber: number = 0;
  private totalSteps: number;

  constructor(totalSteps: number) {
    this.totalSteps = totalSteps;
  }

  startStep(stepName: string, description?: string): void {
    this.stepNumber++;
    console.log(`\n[${this.stepNumber}/${this.totalSteps}] ${stepName}`);
    if (description) {
      console.log(`   ${description}`);
    }
    console.log('   ──────────────────────────────────────────────');
  }

  log(message: string, indent: number = 1): void {
    const indentStr = '   '.repeat(indent);
    console.log(`${indentStr}${message}`);
  }

  success(message: string): void {
    console.log(`   ✅ ${message}`);
  }

  error(message: string): void {
    console.log(`   ❌ ${message}`);
  }

  warning(message: string): void {
    console.log(`   ⚠️  ${message}`);
  }

  info(message: string): void {
    console.log(`   ℹ️  ${message}`);
  }

  progress(current: number, total: number, label?: string): void {
    const percentage = Math.floor((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 2)) + '░'.repeat(50 - Math.floor(percentage / 2));
    process.stdout.write(`\r   ${label || '진행 중'} ${bar} ${percentage}% (${current}/${total})`);
    if (current >= total) {
      process.stdout.write('\n');
    }
  }
}

/**
 * 간단한 프로그레스 바 (한 줄)
 */
export function showProgress(current: number, total: number, label: string = ''): void {
  const percentage = Math.floor((current / total) * 100);
  const width = 30;
  const filled = Math.floor((current / total) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  process.stdout.write(`\r${label} ${bar} ${percentage}% (${current}/${total})`);
  
  if (current >= total) {
    process.stdout.write('\n');
  }
}

/**
 * 스피너 (비동기 작업용)
 */
export class Spinner {
  private interval: NodeJS.Timeout | null = null;
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private frameIndex = 0;
  private message: string;

  constructor(message: string = '') {
    this.message = message;
  }

  start(): void {
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.frames[this.frameIndex]} ${this.message}`);
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
    }, 100);
  }

  stop(successMessage?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write('\r' + ' '.repeat(50) + '\r'); // 줄 지우기
    if (successMessage) {
      console.log(`✅ ${successMessage}`);
    }
  }
}