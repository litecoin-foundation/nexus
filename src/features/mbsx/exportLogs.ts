import {Platform} from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import Share from 'react-native-share';
import {readLog} from 'react-native-nitro-bsx';

import {getNetwork} from '../../utils/network';

import {
  getInfo,
  getRequestInfo,
  getSwapInfo,
  getVersion,
  isRunning,
  listRequests,
  listSwaps,
  readConfig,
} from './adapter';
import {stringifyRpc} from './json';
import type {MbsxMessage} from './mbsxSlice';

/**
 * What the report contains, in the words the user is asked to agree to.
 *
 * Kept beside the builder rather than in the screen so the two cannot drift:
 * a consent notice that understates what is being shared is worse than none.
 */
export const EXPORT_CONTENTS = [
  'The module version and chain heights',
  'Your mbsx settings, including the servers it connects to',
  'Every swap and request: amounts, coins, states and on-chain ids',
  'The recent event log',
  "The app's own native log, which is detailed and may name addresses",
];

/**
 * Never in the report. The db is left out for size and for the swap history it
 * holds rather than for keys: swapkeys is sealed under a key derived from the
 * seed, so the file alone opens nothing.
 */
const NEVER_EXPORTED = [
  'the seed phrase, or anything derived from it',
  'the mbsx database, which holds encrypted key material',
  'lnd wallet keys',
];

const section = (title: string, body: string) =>
  `\n## ${title}\n${body.trimEnd()}\n`;

const kv = (rows: [string, unknown][]) =>
  rows.map(([k, v]) => `${k}: ${String(v)}`).join('\n');

/**
 * A plain text report, so it can be read in the issue it gets pasted into
 * without anyone having to run it through a formatter first.
 */
export const buildReport = async (
  messages: MbsxMessage[],
  nativeLog: string,
): Promise<string> => {
  const parts: string[] = [
    '# mbsx debug report',
    `generated: ${new Date().toISOString()}`,
    `\nThis file contains no keys and no seed. See the mbsx debug screen for`,
    `exactly what it does contain.`,
  ];

  parts.push(
    section(
      'app',
      kv([
        ['platform', `${Platform.OS} ${String(Platform.Version)}`],
        ['network', getNetwork()],
        ['module', getVersion()],
        ['running', isRunning()],
      ]),
    ),
  );

  const info = getInfo();
  parts.push(
    section(
      'module',
      info === null ? 'not readable - the core is not running' : stringifyRpc(info),
    ),
  );

  // Read from disk rather than from the running core: a config that fails to
  // load is exactly the case someone exports logs for.
  let config: string;
  try {
    config = stringifyRpc(await readConfig());
  } catch (e) {
    config = `could not be read: ${(e as Error).message}`;
  }
  parts.push(section('config', config));

  const requests = listRequests();
  parts.push(
    section(
      `requests (${requests?.length ?? 'unreadable'})`,
      requests === null
        ? 'not readable'
        : requests
            .map(r => stringifyRpc(getRequestInfo(r.id) ?? r))
            .join('\n\n'),
    ),
  );

  const swaps = listSwaps();
  parts.push(
    section(
      `swaps (${swaps?.length ?? 'unreadable'})`,
      swaps === null
        ? 'not readable'
        : swaps.map(s => stringifyRpc(getSwapInfo(s.id) ?? s)).join('\n\n'),
    ),
  );

  parts.push(
    section(
      `events (${messages.length})`,
      messages.length === 0 ? 'none' : messages.map(m => m.data).join('\n'),
    ),
  );

  parts.push(section('not included', NEVER_EXPORTED.map(s => `- ${s}`).join('\n')));

  // Last, because it is by far the longest: everything above stays readable
  // without scrolling past it.
  parts.push(section('native log', nativeLog));

  return parts.join('\n');
};

/**
 * Writes the report and hands it to the share sheet.
 *
 * Nothing is uploaded: the file goes to the os, and the user picks who receives
 * it. That is the whole privacy model for now - a report that sends itself would
 * be one the user never got to read first.
 */
export const exportLogs = async (messages: MbsxMessage[]): Promise<void> => {
  const path = `${RNFS.CachesDirectoryPath}/mbsx-debug-${Date.now()}.txt`;
  const report = await buildReport(messages, await readLog());
  await RNFS.writeFile(path, report, 'utf8');
  try {
    await Share.open({
      url: `file://${path}`,
      type: 'text/plain',
      title: 'mbsx debug report',
      failOnCancel: false,
    });
  } finally {
    RNFS.unlink(path).catch(() => {});
  }
};
