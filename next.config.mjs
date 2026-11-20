import constants from 'next/constants.js'

const { PHASE_DEVELOPMENT_SERVER } = constants

// Keep a running dev server's chunks intact when production validation runs.
export default function nextConfig(phase) {
  return {
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  }
}
