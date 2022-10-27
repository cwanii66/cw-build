const semver = require('semver')

exports.checkNode = function(minNodeVersion) {
    const nodeVersion = semver.valid(
        semver.coerce(process.version)
    )
    
    return (semver.satisfies(nodeVersion, `>=${minNodeVersion}`))
}
