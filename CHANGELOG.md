# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [0.7.0]
### Added
- Added `ipUtil.isIPinRange`, and `ipUtil.ipToNumberString` methods.
### Fixed

### Changed

### Removed

## [0.6.0] - 2023-04-18
### Changed
- AUTOTOOL-3108: Reduce package size

## [0.5.7] - 2023-03-27
### Added
- Add a RELEASE tag to tracing data

### Changed
- Update packages

## [0.5.6] - 2023-02-17
### Fixed
- request.send skips parsing JSON response when charset is included in content-type header

## [0.5.5] - 2023-02-15
### Changed
- AUTOTOOL-3602: request.send parses response body based on content header

## [0.5.4] - 2023-01-05
### Changed
- Update copyright

## [0.5.3] - 2023-01-04
### Changed
- Update packages

## [0.5.2] 2022-12-20
### Added

### Fixed

### Changed
- Handle special F5 addresses (any, route domain, etc) in ipUtils.splitAddress

### Removed

## [0.5.1] 2022-12-08
### Added

### Fixed
- Fix path to tmsh for older BIG-IP versions

### Changed

### Removed

## [0.5.0] 2022-12-08
### Added

### Fixed
- Get primary admin user from system for http requests to port 8100

### Changed

### Removed

## [0.4.11] 2022-11-22
### Added

### Fixed

### Changed
- Update packages

### Removed

## [0.4.10] 2022-10-06
### Added

### Fixed
- Handle wildcard addresses with route domains in minimizeIP

### Changed

### Removed

## [0.4.9] 2022-10-06
### Added

### Fixed
- AUTOTOOL-3505: handle wildcard addresses in minimizeIP

### Changed

### Removed

## [0.4.8]
### Added

### Fixed

### Changed
- Fix use of 'this' in secureVault

### Removed

## [0.4.7] 2022-09-29
### Added

### Fixed

### Changed
- Update packages

### Removed

## [0.4.6] 2022-07-27
### Added

### Fixed

### Changed
- Update packages

### Removed

## [0.4.5] - 2022-05-03
### Changed
- Update packages

## [0.4.4] - 2022-03-16
### Added
- Utilized atg-shared-templates

### Changed
- Update packages

## [0.4.3] - 2022-02-01
### Fixed
- Update packages

## [0.4.2] - 2022-01-28
### Changed
- Update packages

## [0.4.1] - 2022-01-07
### Changed
- Update packages

## [0.3.0] - 2021-11-15
### Added
- Add ipUtil code

## [0.2.4]
### Changed
- Update packages

## [0.2.3] - 2021-11-02
### Added
- Tracer lib for performance tracing

## [0.2.2] - 2021-10-18
### Changed
- Update packages

## [0.2.1] - 2021-04-12
### Added
- SecureVault for assisting with encryption and decryption

## [0.2.0] - 2021-03-01
### Removed
- Removed mochaReporters/elasticSearchReporter
- Removed write-copyright.js script

## [0.1.1] - 2021-02-01
### Added
- Add write-copyright.js file

### Changed
- Improved contributing documentation

## [0.1.0] - 2020-06-15
### Added
- Add promiseUtil
- Add CI/CD to the MR pipeline and other general improvements
- Add the CHANGELOG, built the file structure, added ESLINT, and added basic arrayUtil function as an example
- Add mochaReporters/elasticSearchReporter to send mocha test results to elastic search
