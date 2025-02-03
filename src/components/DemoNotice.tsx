import { Info } from 'lucide-react';

export default function DemoNotice() {
  return (
    <div className="w-full bg-accent-dark/5 border border-accent-dark/20">
      <div className="max-w-[950px] mx-auto px-4 py-6">
        <div className="flex items-start gap-4">
          <div className="bg-accent-dark/10 p-2 rounded-full">
            <Info className="h-5 w-5 text-accent-dark" />
          </div>
          <div className="font-zen text-xs md:text-base lg:text-lg text-text-secondary">
            このサイトはポートフォリオ用のデモサイトです。実際の商品の販売や決済処理は行っておりません。
            <br className="hidden md:block" />
            Web開発のスキルを紹介する目的で制作されています。
          </div>
        </div>
      </div>
    </div>
  );
}
