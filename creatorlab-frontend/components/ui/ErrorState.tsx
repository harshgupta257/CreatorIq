interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex h-[400px] flex-col items-center justify-center gap-3 px-5 text-center">
      <p className="text-[13px] text-[#ff3864] max-w-[460px]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="h-8 px-4 border border-[#ff006e] text-[#ff006e] text-[12px] uppercase tracking-wider rounded-[5px] hover:bg-[#ff006e]/10 transition-colors duration-200 cursor-pointer"
        >
          Retry
        </button>
      )}
    </div>
  );
}
