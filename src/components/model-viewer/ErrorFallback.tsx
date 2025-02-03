import Image from 'next/image';

type ErrorFallbackProps = {
  imageUrl: string;
};

export function ErrorFallback({ imageUrl }: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="w-full relative h-screen md:aspect-[16/9] lg:h-[600px]"
    >
      <Image
        src={imageUrl}
        alt="Product image"
        fill
        className="object-contain"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority
      />
      <div
        className="absolute bottom-4 left-4 text-sm text-text-primary bg-background-secondary px-3 py-2 rounded-lg"
        aria-label="エラーメッセージ"
      >
        3Dモデルの読み込みに失敗しました
        <br />
        <span className="text-xs">
          ページを再読み込みするか、しばらく経ってからお試しください
        </span>
      </div>
    </div>
  );
}
