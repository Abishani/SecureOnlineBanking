# Security Validation & Mitigation Strategies

## 1. Vulnerability Mitigation

### A. Injection Attacks (SQL/NoSQL Injection)
**Risk:** Attackers injecting malicious queries to manipulate database.
**Mitigation:** 
- Used **Mongoose ODM** which performs automatic sanitization and schema validation.
- Casting of data types (e.g., ensuring `amount` is a number) prevents query operator injection.
- **Proof:** `User.findOne({ email })` treats email as a literal string.

### B. Cross-Site Scripting (XSS)
**Risk:** Injecting scripts into web pages to steal tokens or session data.
**Mitigation:**
- **React Framework**: React automatically escapes data before rendering it to the DOM, preventing basic reflected/stored XSS.
- **Helmet Middleware**: `helmet()` in Express sets `Content-Security-Policy` and other headers to restrict script sources.

### C. Cross-Site Request Forgery (CSRF)
**Risk:** Forcing authenticated users to perform actions without consent.
**Mitigation:**
- **JWT Storage**: We store tokens in `localStorage`. This makes the app **immune to CSRF** because standard browser requests (forms/images) cannot read local storage or attach headers automatically.
- **Trade-off**: `localStorage` is accessible via XSS. (See XSS mitigation above).

### D. Brute Force & DoS
**Risk:** Guessing passwords or flooding the server.
**Mitigation:**
- **Rate Limiting**: `express-rate-limit` caps requests per IP (100 req/15min).
- **Fraud Rule 1**: Login blocked after 4 failed attempts.
- **Fraud Rule 7**: Velocity check blocks rapid transactions.

## 2. Testing Evidence

### Automated Security Script (`security_test.js`)
We run a script to validate:
1. **Password Encryption**: Verifies DB does not store plain text.
2. **Fraud Triggering**: Simulates attacks to ensure `FraudEngine` blocks them.
3. **MFA**: Verifies TOTP generation and validation logic.

### Manual Verification
- **Account Lockout**: Verified by attempting 5 invalid logins.
- **MFA Flow**: Verified by scanning QR code with Google Authenticator.

## 3. Professional Security Tooling

### A. Burp Suite (Recommended for Fraud Testing)
Burp Suite is ideal for testing rules without code changes by intercepting traffic.
**How to use:**
1.  **Proxy Traffic:** Configure browser to route through Burp.
2.  **Intercept:** Turn on Interceptor.
3.  **Trigger Login:** Click Login in the React App.
4.  **Modify Request:** In Burp, edit the Headers:
    *   **Rule 6 (Device):** Change `User-Agent` to `AttackerBot/1.0`.
    *   **Rule 2 (IPs):** Add/Edit `X-Forwarded-For: 50.50.50.50`.
5.  **Forward:** Send the modified request.
6.  **Verify:** Check the JSON response for `risk.triggeredRules`.

### B. Snyk & SonarQube (Static Analysis)
These tools check for **code vulnerabilities**, not logic.
*   **Snyk:** Run `snyk test` to find insecure dependencies (e.g., old versions of `jsonwebtoken`).
*   **SonarQube:** Scans for code quality issues (e.g., hardcoded secrets, SQL injection risks).
*   **Limitations:** They **CANNOT** test if "Rule 4: Unusual Time" is working. They only check if the code structure is safe.
