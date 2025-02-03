import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

// 必要な環境変数のチェックと取得
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not defined`);
  }
  return value;
}

// 環境変数を取得
const AWS_REGION = getRequiredEnvVar('AWS_REGION');
const AWS_ACCESS_KEY_ID = getRequiredEnvVar('AWS_ACCESS_KEY_ID');
const AWS_SECRET_ACCESS_KEY = getRequiredEnvVar('AWS_SECRET_ACCESS_KEY');
const CLOUDFRONT_PRIVATE_URL = getRequiredEnvVar('CLOUDFRONT_PRIVATE_URL');
const CLOUDFRONT_KEY_PAIR_ID = getRequiredEnvVar('CLOUDFRONT_KEY_PAIR_ID');

// AWS共通の設定
const awsConfig = {
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
};

// AWSクライアントのインスタンス化
export const s3Client = new S3Client(awsConfig);
const secretsClient = new SecretsManagerClient(awsConfig);

// 署名付きURL生成関数
export async function getSignedDownloadUrl(modelKey: string): Promise<string> {
  try {
    // プライベートキーの取得
    const secretId =
      process.env.NODE_ENV === 'production'
        ? 'prod-cloudfront/private-key'
        : 'cloudfront/private-key';

    const { SecretString } = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: secretId })
    );

    if (!SecretString) {
      throw new Error('Private key not found');
    }

    const { privateKey } = JSON.parse(SecretString);

    // 1時間有効な署名付きURLを生成
    return getSignedUrl({
      url: `${CLOUDFRONT_PRIVATE_URL}/${encodeURIComponent(modelKey)}`,
      keyPairId: CLOUDFRONT_KEY_PAIR_ID,
      dateLessThan: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      privateKey,
    });
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    throw error;
  }
}
