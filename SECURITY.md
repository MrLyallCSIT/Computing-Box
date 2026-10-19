# Security Policy

## Supported Versions

**Computing:Box** uses a rolling Calendar Versioning (`vYY.MM.DD.x`) release model deployed continuously from the `main` branch. Because the project is a statically generated Astro site, security patches and dependency updates are applied exclusively to the latest release.

| Version | Supported |
| ------- | --------- |
| `main` (Latest `vYY.MM.DD.x` release) | :white_check_mark: |
| Older `vYY.MM.DD.x` tags / releases | :x: |

If you are self-hosting an exported build (`Computing:Box Website.zip`) or working from a fork, please update to the latest release before reporting an issue to verify it has not already been patched.

## Reporting a Vulnerability

Please **do not** report security vulnerabilities through public GitHub issues, discussions, or pull requests.

Instead, report vulnerabilities confidentially using **GitHub Private Vulnerability Reporting**:

1. Navigate to the [**Security** tab](https://github.com/MrLyallCSIT/Computing-Box/security) of the `Computing-Box` repository.
2. Click **Report a vulnerability** to open a private security advisory draft.
3. Provide a clear description of the vulnerability, the affected component or dependency, and step-by-step reproduction instructions (or a proof-of-concept).

### What to Expect

* **Acknowledgment:** You will receive an initial response acknowledging your report within **7 days**.
* **Triage & Assessment:** The report will be investigated to determine whether it affects the live site, the build pipeline, or upstream npm packages.
* **Resolution:** 
  * **If accepted:** A fix will be developed in a private fork, merged into `main`, and automatically published in the next `vYY.MM.DD.x` release. You will be credited in the security advisory (unless you prefer to remain anonymous).
  * **If declined:** If the report represents a false positive, a low-risk finding in a dev-only build dependency that does not affect the compiled `dist/` output, or intended behaviour, the advisory will be closed with an explanation.

## Scope & Automated Maintenance

Dependencies in this repository are actively monitored and updated via automated tooling. Before submitting a report regarding a third-party `npm` package vulnerability (`npm audit`), please verify that the vulnerability actually impacts the client-side code or production output rather than a build-time-only dependency.
