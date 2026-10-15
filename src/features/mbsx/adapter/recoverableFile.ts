import * as RNFS from '@dr.pogodin/react-native-fs';

// Callers serialize reads and writes for a path. iOS moveFile cannot replace an
// existing file, so retain the previous file until the new one is in place.
// A stopped process can leave either the old primary, a complete pending write,
// or the backup. Never treat an unreadable orphaned write as a missing file.
export const recoverFile = async (path: string): Promise<boolean> => {
  if (await RNFS.exists(path)) {
    return true;
  }
  const pending = `${path}.tmp`;
  const backup = `${path}.bak`;
  if (await RNFS.exists(pending)) {
    const content = await RNFS.readFile(pending);
    let valid = false;
    try {
      const parsed: unknown = JSON.parse(content);
      valid =
        typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
    } catch {
      // Only malformed JSON can fall back to the previous committed file.
      // Filesystem/read errors propagate, leaving all recovery files untouched.
    }
    if (valid) {
      await RNFS.moveFile(pending, path);
      return true;
    }
    if (!(await RNFS.exists(backup))) {
      throw new Error(`Cannot recover ${path}: the pending file is unreadable`);
    }
  }
  if (await RNFS.exists(backup)) {
    await RNFS.moveFile(backup, path);
    return true;
  }
  return false;
};

export const clearRecoveryFiles = async (path: string): Promise<void> => {
  for (const suffix of ['.tmp', '.bak']) {
    if (await RNFS.exists(path + suffix)) {
      await RNFS.unlink(path + suffix);
    }
  }
};

export const writeRecoverableFile = async (
  path: string,
  content: string,
): Promise<void> => {
  await recoverFile(path);
  const pending = `${path}.tmp`;
  const backup = `${path}.bak`;
  await RNFS.writeFile(pending, content);
  if (await RNFS.exists(path)) {
    if (await RNFS.exists(backup)) {
      await RNFS.unlink(backup);
    }
    await RNFS.moveFile(path, backup);
  }
  await RNFS.moveFile(pending, path);
  // Leave the backup until the next write. Cleanup failure must not turn a
  // successful commit into a reported failure. A present primary always wins.
};
