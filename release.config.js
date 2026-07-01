// Maintenance branches (release/vX.Y) are added dynamically so semantic-release
// accepts whichever branch the workflow is triggered against, without needing
// to hardcode every future maintenance branch in advance.
const branch = process.env.GITHUB_REF_NAME || 'main'
const maintenanceMatch = branch.match(/^release\/v(\d+)\.(\d+)$/)

const branches = ['main']
if (maintenanceMatch) {
  const [, major, minor] = maintenanceMatch
  branches.push({
    name: branch,
    range: `${major}.${minor}.x`,
    channel: 'maintenance',
    prerelease: false
  })
}

module.exports = {
  branches,
  tagFormat: 'v${version}',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        // Every conventional commit type triggers at least a patch so that
        // running "Create Release" always produces a new version, even if the
        // branch contains only chore/docs/ci commits.
        releaseRules: [
          { breaking: true, release: 'major' },
          { revert: true, release: 'patch' },
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'revert', release: 'patch' },
          { type: 'chore', release: 'patch' },
          { type: 'docs', release: 'patch' },
          { type: 'style', release: 'patch' },
          { type: 'refactor', release: 'patch' },
          { type: 'test', release: 'patch' },
          { type: 'build', release: 'patch' },
          { type: 'ci', release: 'patch' }
        ]
      }
    ],
    '@semantic-release/release-notes-generator',
    '@semantic-release/github'
  ]
}
