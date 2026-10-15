import {readConfig, type MbsxConfig} from './adapter';
import {defaultConfig} from './adapter/config';
import {draftProblem, draftWarnings, persisted} from './settingsDraft';

jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/docs',
}));
jest.mock('./network', () => ({getNetwork: () => 'mainnet'}));
jest.mock('../../store/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));
jest.mock('./adapter', () => {
  const config = jest.requireActual('./adapter/config');
  return {
    applyConfig: jest.fn(),
    defaultConfig: config.defaultConfig,
    electrumUrlError: config.electrumUrlError,
    readConfig: jest.fn(),
  };
});

const shipped = (): MbsxConfig => defaultConfig();
const own = (): MbsxConfig => ({
  ...shipped(),
  bridge_pubkey: `02${'ab'.repeat(32)}`,
  bridge_host: 'ws://my.glue:9002',
});

describe('the swap server settings', () => {
  it('pass as shipped', () => {
    expect(draftProblem(shipped())).toBeNull();
  });

  it('refuse a malformed pubkey, address or port, but take another server', () => {
    const problem = (change: Partial<MbsxConfig>) =>
      draftProblem({...shipped(), ...change})?.message;
    expect(problem({bridge_pubkey: '02abc'})).toMatch('pubkey');
    expect(problem({bridge_pubkey: `04${'ab'.repeat(32)}`})).toMatch('pubkey');
    expect(problem({bridge_host: ''})).toMatch('is empty');
    expect(problem({bridge_host: 'https://my.glue:9002'})).toMatch(
      'must start wss:// or ws://',
    );
    expect(problem({bridge_port: NaN})).toMatch('port');
    expect(problem({bridge_port: 70000})).toMatch('port');
    expect(draftProblem({...own(), bridge_port: 9002})).toBeNull();
  });

  it('ask once before trusting another server, or an unencrypted one', async () => {
    (readConfig as jest.Mock).mockResolvedValue(shipped());
    expect(await draftWarnings(shipped(), persisted(shipped()))).toEqual([]);

    const warnings = await draftWarnings(own(), persisted(shipped()));
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toMatch('trusts');
    expect(warnings[1]).toMatch('unencrypted');

    (readConfig as jest.Mock).mockResolvedValue(own());
    expect(await draftWarnings(own(), persisted(own()))).toEqual([]);
  });

  it('asks once before a new plain tcp server on mainnet', async () => {
    const withTcp = (): MbsxConfig => {
      const config: MbsxConfig = JSON.parse(JSON.stringify(shipped()));
      const coin = Object.values(config.coins).find(
        settings => settings.enabled === true,
      )!;
      coin.electrumx.push({url: 'tcp://plain.example:50001'});
      return config;
    };
    (readConfig as jest.Mock).mockResolvedValue(shipped());
    expect(await draftWarnings(withTcp(), persisted(shipped()))).toEqual([
      expect.stringMatching(
        /^tcp:\/\/plain.example:50001 is reached over plain tcp:\/\//,
      ),
    ]);
    expect(
      await draftWarnings(
        {...withTcp(), chain: 'regtest'},
        persisted(shipped()),
      ),
    ).toEqual([]);
    const withSsl: MbsxConfig = JSON.parse(JSON.stringify(withTcp()));
    Object.values(withSsl.coins).forEach(settings =>
      settings.electrumx.forEach(server => {
        server.url = server.url.replace('tcp://', 'ssl://');
      }),
    );
    expect(await draftWarnings(withSsl, persisted(shipped()))).toEqual([]);
    (readConfig as jest.Mock).mockResolvedValue(withTcp());
    expect(await draftWarnings(withTcp(), persisted(withTcp()))).toEqual([]);
  });
});
