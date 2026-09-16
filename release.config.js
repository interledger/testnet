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
// Both branches are listed on every run, not only the branch being released.
// semantic-release can clamp main only if it can also read the v1.x tags.
// Listing v1.x before that branch exists costs nothing: semantic-release drops
// configured branches that have no matching remote branch.
//
// Keep the "v" prefix. semantic-release classifies a branch named "1.x" as a
// *maintenance* branch, which is for versions below the default branch and is
// the opposite of what this line does. "v1.x" is classified as a release branch.
//
// v1.x is spelled out as an object to make its channel explicit. Note that the
// channel is not what marks its GitHub releases as pre-release: that comes from
// the branch being a release branch that is not the first one in this array
// (see is-prerelease.js in @semantic-release/github). Do not add
// "prerelease: false" here by analogy with the maintenance entry below — that
// flag is checked first and would turn the pre-release marking off, letting a
// v1.x release compete with main for the "Latest" badge.
//
// Maintenance branches (release/vX.Y) are added dynamically so semantic-release
// accepts whichever branch the workflow is triggered against, without needing
// to hardcode every future maintenance branch in advance.
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
