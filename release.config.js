// Release branches, in ascending version order. semantic-release derives the
// version range each branch may publish from the tags on the branches after it:
//
//   - main  The 0.x production line. When v1.x holds a v1.0.0 tag, main is
//           clamped to ">=0.x <1.0.0" and accepts only patch and minor. A
//           breaking change merged here then fails the release with
//           EINVALIDNEXTVERSION. That failure is the guardrail, not a defect:
//           the commit belongs on v1.x.
//   - v1.x  The next-major development line. It publishes on its own "v1.x"
//           channel, so its GitHub releases are marked pre-release and never
//           take the "Latest" badge away from main.
//
// You might ask, why are we not just using release/v1.0.x instead? The reason
// is because we might want multiple feature versions of v1.x deployed in
// various environments simultaneously, and using release/v1.0.x would tie us to a
// single patch line, which is less flexible.
//
const branch = process.env.GITHUB_REF_NAME || 'main'
const maintenanceMatch = branch.match(/^release\/v(\d+)\.(\d+)$/)

const branches = [
  'main',
  {
    name: 'v1.x',
    channel: 'v1.x'
  }
]
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
