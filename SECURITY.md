# 🔐 Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

---

## 🚨 Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@vetra.com**

### What to Include

Please include the following information:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** of the vulnerability
4. **Suggested fix** (if you have one)
5. **Your contact information** (optional, for follow-up)

### Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial Assessment:** Within 5 business days
- **Status Update:** Every 7 days until resolved
- **Resolution:** Depends on severity (see below)

---

## 🎯 Vulnerability Severity

We use the CVSS v3.0 scoring system:

### Critical (9.0-10.0)
- **Response Time:** 24-48 hours
- **Fix Timeline:** Within 7 days
- **Examples:** 
  - Remote code execution
  - SQL injection
  - Authentication bypass

### High (7.0-8.9)
- **Response Time:** 48-72 hours
- **Fix Timeline:** Within 14 days
- **Examples:**
  - Privilege escalation
  - Sensitive data exposure
  - Cross-site scripting (XSS)

### Medium (4.0-6.9)
- **Response Time:** Within 1 week
- **Fix Timeline:** Within 30 days
- **Examples:**
  - CSRF vulnerabilities
  - Insecure direct object references
  - Information disclosure

### Low (0.1-3.9)
- **Response Time:** Within 2 weeks
- **Fix Timeline:** Within 90 days
- **Examples:**
  - Minor information disclosure
  - UI redressing
  - Missing security headers

---

## 🛡️ Security Measures

### Frontend (Chrome Extension)

- ✅ **Content Security Policy (CSP)**
- ✅ **No eval() or inline scripts**
- ✅ **Secure communication with backend (HTTPS only)**
- ✅ **User data encryption**
- ✅ **No sensitive data in localStorage**

### Backend API

- ✅ **JWT Authentication** with refresh tokens
- ✅ **Rate Limiting** (100 req/15min per IP)
- ✅ **Input Validation** on all endpoints
- ✅ **SQL Injection Protection** (parameterized queries)
- ✅ **XSS Protection** (sanitized outputs)
- ✅ **CSRF Protection** (token-based)
- ✅ **Helmet.js** security headers
- ✅ **HTTPS only** in production
- ✅ **Secure password hashing** (bcrypt)

### Database

- ✅ **Encrypted connections** (SSL/TLS)
- ✅ **Least privilege access**
- ✅ **Regular backups**
- ✅ **Audit logging**

### Infrastructure

- ✅ **Docker containers** (isolated environments)
- ✅ **Regular dependency updates** (Dependabot)
- ✅ **Code scanning** (CodeQL)
- ✅ **Secret management** (environment variables)

---

## 🔒 Best Practices for Users

### Wallet Security

1. **Never share your private keys** - Vetra never asks for them
2. **Verify transaction details** before signing
3. **Keep your extension updated**
4. **Use hardware wallets** when possible
5. **Enable 2FA** on your Google account

### Extension Security

1. **Download only from Chrome Web Store**
2. **Check permissions** before installing
3. **Review risk scores** before signing transactions
4. **Report suspicious behavior**

### Account Security

1. **Use strong passwords** (for Pro accounts)
2. **Enable 2FA** (coming soon)
3. **Review login history** regularly
4. **Log out from shared devices**

---

## 🔍 Security Audits

We conduct regular security audits:

- **Code Review:** Every major release
- **Dependency Scan:** Weekly (automated)
- **Penetration Testing:** Quarterly
- **Third-Party Audit:** Annually (planned)

### Past Audits

| Date       | Type              | Status | Report |
|------------|-------------------|--------|--------|
| 2024-01-07 | Initial Security Review | ✅ Passed | Internal |

---

## 🏆 Bug Bounty Program

### Coming Soon!

We're planning to launch a bug bounty program in Q2 2024.

**Potential Rewards:**
- Critical: Up to $5,000
- High: Up to $2,000
- Medium: Up to $500
- Low: Up to $100

### Scope (Planned)

**In Scope:**
- Chrome Extension
- Backend API
- Multi-Agent System
- On-chain contracts

**Out of Scope:**
- Third-party services
- Social engineering
- Physical attacks
- Denial of Service (DoS)

---

## 📜 Responsible Disclosure

We appreciate responsible disclosure and will:

1. **Acknowledge your report** within 48 hours
2. **Keep you updated** on our progress
3. **Credit you** in our security advisories (with your permission)
4. **Consider you** for our bug bounty program (when launched)

### Public Disclosure

We request that you:

1. **Give us time** to fix the vulnerability (90 days minimum)
2. **Avoid data access** beyond what's necessary to prove the vulnerability
3. **Don't disrupt** our services or harm users
4. **Coordinate with us** before public disclosure

---

## 🔐 Security Hall of Fame

We'll publicly thank security researchers who help us improve Vetra's security (with their permission).

### 2024
- (List will be updated as vulnerabilities are reported and fixed)

---

## 📞 Contact

- **Security Email:** security@vetra.com
- **PGP Key:** [Coming soon]
- **Response Time:** Within 48 hours

### Emergency Contact

For critical vulnerabilities requiring immediate attention:
- **Email:** security@vetra.com (mark as URGENT)
- **Expected Response:** Within 24 hours

---

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Chrome Extension Security](https://developer.chrome.com/docs/extensions/mv3/security/)

---

## ⚖️ Legal

By reporting a vulnerability, you agree to:

1. Act in good faith to avoid privacy violations, data destruction, or service interruption
2. Not exploit the vulnerability beyond what is necessary to demonstrate it
3. Allow us a reasonable time to fix the vulnerability before any public disclosure

---

## 🔄 Updates

This security policy was last updated on: **January 7, 2024**

We may update this policy as needed. Check back regularly for changes.

---

**Thank you for helping keep Vetra and our users safe! 🛡️**

