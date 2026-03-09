import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { ActionButton } from "@/components/ui/core/ActionButton";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** 에러 시 표시할 커스텀 fallback (선택) */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 하위 트리에서 발생한 JavaScript 에러를 잡아 복구 UI를 보여줍니다.
 * 에러 시 사용자에게 안내 메시지와 새로고침 버튼을 제공합니다.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 text-center"
          role="alert"
        >
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" aria-hidden />
          </div>
          <h2 className="text-xl font-bold text-gray-800 font-display mb-2">
            문제가 발생했어요
          </h2>
          <p className="text-gray-600 font-sans text-sm sm:text-base max-w-md mb-6">
            일시적인 오류가 발생했습니다. 새로고침 후 다시 시도해 주세요.
          </p>
          <ActionButton
            variant="orange-primary"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2"
          >
            <RefreshCw size={18} />
            다시 시도
          </ActionButton>
        </div>
      );
    }
    return this.props.children;
  }
}
