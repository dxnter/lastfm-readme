/** @type {import('semantic-release').Options} */
const options = {
  ci: true,
  branches: [
    '+([0-9])?(.{+([0-9]),x}).x',
    'main',
    'next',
    'next-major',
    { name: 'beta', prerelease: true },
    { name: 'alpha', prerelease: true },
  ],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
      },
    ],
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogTitle: '# Changelog',
        changelogFile: 'CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: [
          { path: 'dist/index.js', label: 'Github Action distribution' },
        ],
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: [
          'CHANGELOG.md',
          'package.json',
          'pnpm-lock.yaml',
          'dist/index.js',
        ],
        message: `chore(release): <%= nextRelease.version %> [skip ci]`,
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: true,
      },
    ],
  ],
};

module.exports = options;
