import { promises as fs } from "fs";
import path from "path";

import exifr from "exifr";
import { Router } from "express";
import httpErrors from "http-errors";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { Image } from "@web-speed-hackathon-2026/server/src/models";
import { UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const EXTENSION = "webp";

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  // sharp でメタデータ取得 + WebP 変換を一度に行う
  const image = sharp(req.body);
  const metadata = await image.metadata().catch(() => null);
  if (!metadata || !metadata.format) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const alt = await extractAltFromExif(req.body);

  const webpBuffer = await image.rotate().webp({ quality: 80 }).toBuffer();

  const imageId = uuidv4();
  const filePath = path.resolve(UPLOAD_PATH, `./images/${imageId}.${EXTENSION}`);
  await fs.mkdir(path.resolve(UPLOAD_PATH, "images"), { recursive: true });
  await fs.writeFile(filePath, webpBuffer);

  await Image.create({ id: imageId, alt });

  return res.status(200).type("application/json").send({ id: imageId });
});

async function extractAltFromExif(buffer: Buffer): Promise<string> {
  try {
    const exif = await exifr.parse(buffer, { pick: ["ImageDescription"] });
    if (exif?.ImageDescription) {
      return exif.ImageDescription;
    }
  } catch {
    // EXIF パース失敗
  }
  return "";
}
