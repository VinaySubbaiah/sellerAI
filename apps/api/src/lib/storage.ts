import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppError, ErrorCodes } from "@sellerstudio/shared";

export interface StorageProvider {
  presignUpload(key: string, mime: string): Promise<{ url: string; method: string; headers: Record<string, string> }>;
  presignDownload(key: string): Promise<string>;
  putObject(key: string, body: Buffer, mime: string): Promise<void>;
  getObject(key: string): Promise<Buffer>;
  deleteObject(key: string): Promise<void>;
}

class LocalStorage implements StorageProvider {
  constructor(private readonly root: string) {}

  private pathFor(key: string) {
    return join(this.root, key);
  }

  async presignUpload(key: string, mime: string) {
    const token = Buffer.from(JSON.stringify({ key, mime, exp: Date.now() + 15 * 60 * 1000 })).toString(
      "base64url",
    );
    const base = process.env.API_PUBLIC_URL ?? "http://localhost:3001";
    return {
      url: `${base}/uploads/local?token=${token}`,
      method: "PUT",
      headers: { "Content-Type": mime },
    };
  }

  async presignDownload(key: string) {
    const token = Buffer.from(JSON.stringify({ key, exp: Date.now() + 15 * 60 * 1000 })).toString("base64url");
    const base = process.env.API_PUBLIC_URL ?? "http://localhost:3001";
    return `${base}/uploads/local-download?token=${token}`;
  }

  async putObject(key: string, body: Buffer, _mime: string) {
    const full = this.pathFor(key);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, body);
  }

  async getObject(key: string) {
    const full = this.pathFor(key);
    if (!existsSync(full)) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Asset not found", 404);
    }
    return readFile(full);
  }

  async deleteObject(key: string) {
    const full = this.pathFor(key);
    if (existsSync(full)) await unlink(full);
  }
}

class S3Storage implements StorageProvider {
  private client: S3Client;
  constructor(
    private bucket: string,
    private ttl: number,
  ) {
    this.client = new S3Client({
      region: process.env.S3_REGION ?? "us-east-1",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials:
        process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.S3_ACCESS_KEY_ID,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

  async presignUpload(key: string, mime: string) {
    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: mime }),
      { expiresIn: this.ttl },
    );
    return { url, method: "PUT", headers: { "Content-Type": mime } };
  }

  async presignDownload(key: string) {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: this.ttl,
    });
  }

  async putObject(key: string, body: Buffer, mime: string) {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: mime }),
    );
  }

  async getObject(key: string) {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) throw new AppError(ErrorCodes.NOT_FOUND, "Asset not found", 404);
    return Buffer.from(bytes);
  }

  async deleteObject(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

let singleton: StorageProvider | undefined;

export function getStorage(): StorageProvider {
  if (singleton) return singleton;
  const provider = process.env.STORAGE_PROVIDER ?? "local";
  if (provider === "s3") {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) throw new AppError(ErrorCodes.CONFIG, "S3_BUCKET is required", 500);
    singleton = new S3Storage(bucket, Number(process.env.SIGNED_URL_TTL_SECONDS ?? 900));
  } else {
    const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
    const dir = process.env.STORAGE_LOCAL_DIR;
    const root = dir ? (dir.startsWith("/") ? dir : join(repoRoot, dir)) : join(repoRoot, "storage");
    singleton = new LocalStorage(root);
  }
  return singleton;
}

export function objectKey(userId: string, kind: string, filename: string) {
  return `users/${userId}/${kind}/${randomUUID()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
}

export { };
