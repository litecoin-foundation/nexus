#!/usr/bin/env python3
"""Verify the exact vendor reconstruction and its documented review units."""

from collections import Counter
import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()


def require(condition, message):
    if not condition:
        raise SystemExit(message)


def main():
    data = json.loads((ROOT / 'docs/bsx-integration/history.json').read_text())
    base, vendor, checkpoint = (data[key] for key in ('base', 'vendor', 'reconstructed'))
    require(git('rev-parse', vendor + '^{tree}') == data['tree'], 'Vendor tree changed.')
    require(git('rev-parse', checkpoint + '^{tree}') == data['tree'], 'Reconstructed tree differs from the vendor.')
    git('diff', '--exit-code', vendor, checkpoint)
    git('merge-base', '--is-ancestor', checkpoint, 'HEAD')

    original = git('rev-list', '--reverse', base + '..' + vendor).splitlines()
    require(original == [row['sha'] for row in data['history']], 'Original commit mapping is incomplete or out of order.')
    rebuilt = git('rev-list', '--reverse', base + '..' + checkpoint).splitlines()
    require(rebuilt == [group['commit'] for group in data['groups']], 'Reconstructed commit sequence differs from the manifest.')
    parent = base
    files = []
    for group in data['groups']:
        sha = group['commit']
        require(git('rev-parse', sha + '^') == parent, 'Unexpected reconstruction parent.')
        actual = git('diff', '--name-only', parent, sha).splitlines()
        require(actual == group['files'], f'File mapping differs for {sha}.')
        files.extend(actual)
        parent = sha
    require(all(count == 1 for count in Counter(files).values()), 'A file appears in more than one reconstruction unit.')
    require(set(files) == set(git('diff', '--name-only', base, vendor).splitlines()), 'Reconstruction omits vendor files.')

    if data.get('followup_commits'):
        parent = data['followup_base']
        git('merge-base', '--is-ancestor', checkpoint, parent)
        for commit in data['followup_commits']:
            sha = commit['commit']
            require(git('rev-parse', sha + '^') == parent, 'Unexpected follow-up parent.')
            require(git('diff', '--name-only', parent, sha).splitlines() == commit['files'],
                    'Follow-up file mapping differs for ' + sha)
            parent = sha
        git('merge-base', '--is-ancestor', parent, 'HEAD')

    changed = set(git('diff', '--name-only', checkpoint, 'HEAD').splitlines())
    allowed = set(data['cleanup_allowed_paths']) | set(data.get('followup_allowed_paths', []))
    unexpected = changed - allowed
    require(not unexpected, 'Undocumented post-checkpoint paths: ' + ', '.join(sorted(unexpected)))
    require(not git('status', '--porcelain'), 'Commit or set aside worktree changes before verifying the final branch.')
    if '--check-protected-refs' in sys.argv:
        require(git('rev-parse', 'bsx_merge') == vendor, 'bsx_merge moved from the frozen vendor tip.')
        require(git('rev-parse', 'glass') == base, 'glass moved from the frozen base.')
    print(f'PASS: {len(original)} vendor commits reconstructed into {len(rebuilt)} commits.')
    print(f'PASS: identical vendor/checkpoint tree {data["tree"]}.')
    print(f'PASS: {len(changed)} documented post-checkpoint paths; working tree clean.')


if __name__ == '__main__':
    main()
