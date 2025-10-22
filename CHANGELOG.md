# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Multi-Agent Risk Analysis System integration
- Comprehensive backend API with 30+ endpoints
- 7 frontend screens (Welcome, Home, Transaction Analysis, Wallet, Plans, Settings, History)
- PostgreSQL database with 4 tables (users, transactions, attestations, providers)
- Redis caching layer
- WebSocket real-time notifications
- Docker deployment setup
- CI/CD pipeline with GitHub Actions
- Comprehensive documentation (API specs, implementation guides)
- Google OAuth authentication
- Guest mode authentication
- Rate limiting and security middleware
- Prometheus metrics endpoint
- Health check system
- Mock Multi-Agent server for testing

### Changed
- README.md updated with professional documentation
- Project structure reorganized (frontend/backend separation)
- Authentication system improved with JWT refresh tokens

### Security
- Helmet.js security headers
- CORS configuration
- Input validation on all endpoints
- Rate limiting per IP and user
- JWT token authentication

---

## [0.1.0] - 2024-01-07

### Added
- Initial project setup
- Basic Chrome Extension structure
- Frontend UI components
- Backend API foundation
- Database schema design
- Authentication system
- Risk analysis placeholder

### Infrastructure
- pnpm workspace configuration
- Docker Compose for development
- GitHub repository templates
- CI/CD pipeline setup

---

## Types of Changes

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes

---

## Versioning

- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backwards-compatible)
- **PATCH** version for bug fixes (backwards-compatible)

---

[Unreleased]: https://github.com/vetra/vetra/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/vetra/vetra/releases/tag/v0.1.0

