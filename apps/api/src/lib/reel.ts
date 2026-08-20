import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";

export interface ReelInput {
  frames: Buffer[];
  durationSec: 5 | 10;
  headline: string;
  offer: string;
  cta: string;
  style: string;
  withText: boolean;
}

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => {
      err += d.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(err || `ffmpeg exited ${code}`));
    });
  });
}

function escapeDrawtext(s: string) {
  return s.replace(/[:\\']/g, "\\$&").slice(0, 48);
}

export async function renderReel(input: ReelInput): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "reel-"));
  try {
    const count = Math.max(1, input.frames.length);
    const sceneDur = input.durationSec / 4;
    const scenes = [0, 1, 2, 3].map((i) => input.frames[i % count]!);
    const labels = input.withText
      ? [input.headline, input.offer, "Featured", input.cta]
      : ["", "", "", ""];
    const parts: string[] = [];
    for (let i = 0; i < 4; i++) {
      const framePath = join(dir, `scene-${i}.png`);
      const prepared = await sharp(scenes[i])
        .resize(1080, 1920, { fit: "cover" })
        .png()
        .toBuffer();
      await writeFile(framePath, prepared);
      const out = join(dir, `clip-${i}.mp4`);
      const zoom = input.style === "ENERGETIC" ? 1.18 : 1.08;
      const text = labels[i] ? `drawtext=text='${escapeDrawtext(labels[i]!)}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-220:box=1:boxcolor=0x4F46E5@0.85:boxborderw=24` : "null";
      const vf = `scale=1080:1920,zoompan=z='min(zoom+0.0015,${zoom})':d=${Math.round(sceneDur * 25)}:s=1080x1920,${text},format=yuv420p`;
      await run(process.env.FFMPEG_PATH ?? "ffmpeg", [
        "-y",
        "-loop",
        "1",
        "-i",
        framePath,
        "-vf",
        vf,
        "-t",
        String(sceneDur),
        "-r",
        "25",
        "-pix_fmt",
        "yuv420p",
        out,
      ]);
      parts.push(`file '${out}'`);
    }
    const list = join(dir, "list.txt");
    await writeFile(list, parts.join("\n"));
    const output = join(dir, "reel.mp4");
    await run(process.env.FFMPEG_PATH ?? "ffmpeg", [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      list,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      output,
    ]);
    const { readFile } = await import("node:fs/promises");
    return readFile(output);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function ensureTmp() {
  await mkdir(join(tmpdir(), "sellerstudio"), { recursive: true });
}
