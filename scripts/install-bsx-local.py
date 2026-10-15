#!/usr/bin/env python3
"""Install the pinned BSX commit from a local clone until it is published."""

import json
import os
from pathlib import Path
import re
import subprocess
import sys


def main():
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python3 scripts/install-bsx-local.py /path/to/react-native-nitro-bsx')
    root = Path(__file__).resolve().parents[1]
    source = Path(sys.argv[1]).expanduser().resolve(strict=True)
    package = json.loads((root / 'package.json').read_text())
    dependency = package['dependencies']['react-native-nitro-bsx']
    match = re.fullmatch(r'git\+ssh://git@gitlab.com/nexus-bsx/react-native-nitro-bsx.git#([0-9a-f]{40})', dependency)
    if not match:
        raise SystemExit('The dependency is no longer the expected Git pin; use the normal installation workflow.')
    revision = match[1]
    subprocess.run(['git', '-C', str(source), 'cat-file', '-e', revision + '^{commit}'], check=True)

    # Only this process and its children see the URL rewrite. Bun clones the
    # pinned commit, so uncommitted local changes never enter the installation.
    env = os.environ.copy()
    count = int(env.get('GIT_CONFIG_COUNT', '0'))
    for remote in ('ssh://git@gitlab.com/nexus-bsx/react-native-nitro-bsx.git',
                   'git@gitlab.com:nexus-bsx/react-native-nitro-bsx.git'):
        env[f'GIT_CONFIG_KEY_{count}'] = f'url.{source.as_uri()}.insteadOf'
        env[f'GIT_CONFIG_VALUE_{count}'] = remote
        count += 1
    env['GIT_CONFIG_COUNT'] = str(count)
    print(f'Installing BSX commit {revision} from {source}', flush=True)
    subprocess.run(['bun', 'install', '--frozen-lockfile'], cwd=root, env=env, check=True)


if __name__ == '__main__':
    main()
