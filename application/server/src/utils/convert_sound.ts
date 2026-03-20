import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const UNKNOWN_ARTIST = "Unknown Artist";
const UNKNOWN_TITLE = "Unknown Title";

interface ConvertResult {
  mp3Buffer: Buffer;
  artist: string;
  title: string;
}

/**
 * 音声ファイルをMP3に変換し、メタデータを抽出する（1パス）
 * - 入力ファイルをtmpに書き出し、ffmpegでMP3変換 + ffmetadata出力を同時に行う
 * - Shift_JISメタデータはUTF-8に変換
 */
export async function convertAndExtractSound(input: Buffer): Promise<ConvertResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sound-"));
  const inputPath = path.join(tmpDir, `input-${randomUUID()}`);
  const outputPath = path.join(tmpDir, `output-${randomUUID()}.mp3`);
  const metaPath = path.join(tmpDir, `meta-${randomUUID()}.txt`);

  try {
    await fs.writeFile(inputPath, input);

    // メタデータ抽出（ffmetadata形式で出力）
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(["-f", "ffmetadata"])
        .output(metaPath)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .run();
    });

    // MP3変換
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(["-vn"])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .run();
    });

    const mp3Buffer = await fs.readFile(outputPath);
    const { artist, title } = await extractMetadata(metaPath);

    return { mp3Buffer, artist, title };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function extractMetadata(metaPath: string): Promise<{ artist: string; title: string }> {
  try {
    const raw = await fs.readFile(metaPath);
    let outputUtf8: string;
    try {
      outputUtf8 = new TextDecoder("utf-8", { fatal: true }).decode(raw);
    } catch {
      outputUtf8 = new TextDecoder("shift_jis").decode(raw);
    }

    const meta = parseFFmetadata(outputUtf8);

    return {
      artist: meta["artist"] ?? UNKNOWN_ARTIST,
      title: meta["title"] ?? UNKNOWN_TITLE,
    };
  } catch {
    return {
      artist: UNKNOWN_ARTIST,
      title: UNKNOWN_TITLE,
    };
  }
}

function parseFFmetadata(ffmetadata: string): Partial<Record<string, string>> {
  return Object.fromEntries(
    ffmetadata
      .split("\n")
      .filter((line) => !line.startsWith(";") && line.includes("="))
      .map((line) => {
        const idx = line.indexOf("=");
        return [line.slice(0, idx)!.trim().toLowerCase(), line.slice(idx + 1)!.trim()];
      }),
  );
}
