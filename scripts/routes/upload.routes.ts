import { Router, Request, Response } from "express";
import multer from "multer";
import { requireApiKey } from "../middleware/auth.middleware";
import { tmpWrite, cleanupTmpFile } from "../services/file.service";
import { uploadToIpfs } from "../upload-ipfs";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 1024 },
}); // up to 1GB

// Upload to IPFS
router.post(
  "/upload",
  requireApiKey as any,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file)
        return res.status(400).json({
          error: "file is required (multipart/form-data field 'file')",
        });
      const tmpPath = await tmpWrite(req.file.originalname, req.file.buffer);
      try {
        const cid = await uploadToIpfs(tmpPath);
        res.json({ cid, uri: `ipfs://${cid}` });
      } finally {
        await cleanupTmpFile(tmpPath);
      }
    } catch (e: any) {
      res.status(500).json({ error: e?.message || String(e) });
    }
  }
);

export default router;
