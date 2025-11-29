const fs = require('fs');
const path = require('path');
const { Credential, XrpAnchor } = require('../models');
const logger = require('../utils/logger');

class RecoveryService {
  async backup(dir) {
    const baseDir = dir || process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outDir = path.join(baseDir, stamp);
    await fs.promises.mkdir(outDir, { recursive: true });
    const creds = await Credential.find({}).lean();
    const anchors = await XrpAnchor.find({}).lean();
    const files = [];
    const cPath = path.join(outDir, 'credentials.json');
    const aPath = path.join(outDir, 'xrpAnchors.json');
    await fs.promises.writeFile(cPath, JSON.stringify(creds));
    await fs.promises.writeFile(aPath, JSON.stringify(anchors));
    files.push(cPath, aPath);
    logger.info('Backup created', { outDir, counts: { credentials: creds.length, anchors: anchors.length } });
    return { outDir, files, counts: { credentials: creds.length, anchors: anchors.length } };
  }
  async restore(dir) {
    const cPath = path.join(dir, 'credentials.json');
    const aPath = path.join(dir, 'xrpAnchors.json');
    const results = { credentials: { inserted: 0 }, anchors: { inserted: 0 } };
    try {
      const creds = JSON.parse(await fs.promises.readFile(cPath, 'utf8'));
      for (const c of creds) {
        const filter = { uniqueHash: c.uniqueHash };
        const update = { $setOnInsert: c };
        await Credential.updateOne(filter, update, { upsert: true });
        results.credentials.inserted++;
      }
    } catch {}
    try {
      const anchors = JSON.parse(await fs.promises.readFile(aPath, 'utf8'));
      for (const a of anchors) {
        const filter = { certificateHash: a.certificateHash };
        const update = { $setOnInsert: a };
        await XrpAnchor.updateOne(filter, update, { upsert: true });
        results.anchors.inserted++;
      }
    } catch {}
    logger.info('Backup restored', { dir, results });
    return results;
  }
}

module.exports = new RecoveryService();