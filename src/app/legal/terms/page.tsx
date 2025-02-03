import { promises as fs } from 'fs';
import path from 'path';
import React from 'react';
import ReactMarkdown from 'react-markdown';

export default async function Terms() {
  // マークダウンファイルのパスを設定
  const termsPath = path.join(process.cwd(), 'src/app/legal/terms/content.md');
  // ファイルの内容を読み込み
  const content = await fs.readFile(termsPath, 'utf-8');

  return (
    <div
      aria-label="利用規約"
      className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12 md:mt-20"
    >
      <h1 className="text-lg sm:text-xl md:text-3xl font-bold mb-8 text-text-primary">
        《利用規約》
      </h1>

      <article
        role="article"
        aria-label="利用規約"
        className="
        prose prose-invert 
        prose-sm sm:prose-base md:prose-lg 
        max-w-none
        prose-h1:text-xl sm:prose-h1:text-2xl md:prose-h1:text-3xl
        prose-h2:text-lg sm:prose-h2:text-xl md:prose-h2:text-2xl
        prose-h3:text-base sm:prose-h3:text-lg md:prose-h3:text-xl
        prose-h3:border-b prose-h3:border-accent-dark prose-h3:pb-2 prose-h3:mb-4
        prose-p:text-xs sm:prose-p:text-base md:prose-p:text-lg
        prose-li:text-xxs sm:prose-li:text-base md:prose-li:text-lg
      "
      >
        <ReactMarkdown>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
