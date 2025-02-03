/**
 * アバター画像更新API
 * - セッション認証
 * - 画像の検証と処理
 * - S3へのアップロード
 * - プロフィール情報の更新
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { s3Client } from '@/lib/aws';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { IMAGE_VALIDATION, validateImage } from '@/utils/validation';

// S3のキーを取得する関数
function extractKeyFromUrl(url: string | null): string | null {
  if (!url) return null;
  const cloudFrontUrl = process.env.CLOUDFRONT_USER_URL;
  if (!cloudFrontUrl) return null;

  return url.replace(cloudFrontUrl + '/', '');
}

// 古い画像を削除する関数
async function deleteOldImage(imageUrl: string | null | undefined) {
  if (!imageUrl) return;

  const key = extractKeyFromUrl(imageUrl);
  if (!key) return;

  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_USER_BUCKET,
      Key: key,
    });
    await s3Client.send(command);
  } catch (error) {
    console.error('Failed to delete old image:', error);
    // 古い画像の削除失敗は全体の処理を中断させない
  }
}

// アップロードされた画像をWebP形式に変換し、サイズと品質を最適化する
async function processImage(file: File): Promise<Buffer> {
  // ①画像のバリデーション
  const validation = validateImage(file);
  if (!validation.isValid) {
    throw new Error(validation.error || '画像ファイルの形式を確認してください');
  }

  // ②バッファへの変換
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    // ③画像のリサイズと最適化
    const optimizedImage = await sharp(buffer)
      .resize(
        IMAGE_VALIDATION.MAX_DIMENSIONS,
        IMAGE_VALIDATION.MAX_DIMENSIONS,
        {
          fit: 'contain',
          withoutEnlargement: true,
        }
      )
      .toFormat(IMAGE_VALIDATION.OUTPUT_FORMAT, {
        quality: IMAGE_VALIDATION.QUALITY.INITIAL,
        effort: 6,
      })
      .toBuffer();

    // ④必要に応じて品質の再調整
    if (optimizedImage.length > IMAGE_VALIDATION.MAX_FILE_SIZE) {
      const fallbackImage = await sharp(optimizedImage)
        .toFormat(IMAGE_VALIDATION.OUTPUT_FORMAT, {
          quality: IMAGE_VALIDATION.QUALITY.FALLBACK,
          effort: 6,
        })
        .toBuffer();

      if (fallbackImage.length > IMAGE_VALIDATION.MAX_FILE_SIZE) {
        throw new Error('画像のサイズを制限内に収められませんでした');
      }

      return fallbackImage;
    }

    return optimizedImage;
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('画像の処理に失敗しました');
  }
}

// 処理済み画像をS3にアップロード（CloudFront URLを返す）
async function uploadToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  try {
    // ①アップロードコマンドの作成
    const command = new PutObjectCommand({
      Bucket: process.env.S3_USER_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    });

    // ②S3へのアップロード実行
    await s3Client.send(command);

    // ③CloudFront URLの生成
    return `${process.env.CLOUDFRONT_USER_URL}/${fileName}`;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('画像のアップロードに失敗しました');
  }
}

export async function POST(request: Request) {
  try {
    // ①セッション認証の確認
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });

    // ②画像データの取得と検証
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: '画像ファイルを選択してください' },
        { status: 400 }
      );
    }
    try {
      // ③画像の処理
      const processedImage = await processImage(file);

      // ④画像のアップロードとプロフィール更新
      const fileName = `${session.user.id}-${Date.now()}.${IMAGE_VALIDATION.OUTPUT_FORMAT}`;

      const imageUrl = await uploadToS3(
        processedImage,
        fileName,
        `image/${IMAGE_VALIDATION.OUTPUT_FORMAT}`
      );

      // ⑤古い画像の削除とプロフィール更新
      await Promise.all([
        prisma.user.update({
          where: { id: session.user.id },
          data: { image: imageUrl },
        }),
        deleteOldImage(currentUser?.image),
      ]);

      return NextResponse.json(
        {
          imageUrl: imageUrl,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Avatar image processing error:', error);
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : '画像の処理に失敗しました',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Unexpected avatar update error:', error);
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 }
    );
  }
}
