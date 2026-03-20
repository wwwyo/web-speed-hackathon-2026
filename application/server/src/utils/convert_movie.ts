import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

/**
 * 動画ファイルをMP4に変換する
 * - 先頭5秒のみ切り出し
 * - 正方形にクロップ
 * - 10fps、音声なし
 */
export async function convertMovie(input: Buffer): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "movie-"));
  const inputPath = path.join(tmpDir, `input-${randomUUID()}`);
  const outputPath = path.join(tmpDir, `output-${randomUUID()}.mp4`);

  try {
    await fs.writeFile(inputPath, input);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-t", "5",
          "-r", "10",
          "-vf", "crop='min(iw,ih)':'min(iw,ih)'",
          "-an",
          "-pix_fmt", "yuv420p",
          "-movflags", "+faststart",
        ])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .run();
    });

    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
