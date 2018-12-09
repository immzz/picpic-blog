module.exports = {
    collectCoverage: false,
    verbose: false,
    coverageThreshold: {
      global: {
        // TODO: Restore threshold to 80% when released.
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
      },
    },
    moduleFileExtensions: ['js', 'jsx', 'json']
  }