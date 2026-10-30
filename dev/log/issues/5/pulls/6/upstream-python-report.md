Audit of template revision 34fce74893c36d4e8b40a89e2e2f3ae9b8e5e9ae while investigating konard/medical-speech-to-text#5 found the same deprecated dependency as the JavaScript template:

`.github/actions/artifact/package-lock.json` resolves `glob@10.5.0` through `@actions/artifact@6.3.1 -> archiver@7.0.1 -> archiver-utils@5.0.2`. npm emits a deprecation warning during a clean SDK dependency installation/build. The official SDK is already current, so upgrading its top-level version cannot remove it today.

`archiver-utils/file.js` uses only `glob.sync(pattern, options)`. A scoped `overrides: { "archiver-utils": { "glob": "13.0.6" } }` removes that deprecated package while retaining the API. Verify actual glob inclusions/exclusions and archive bytes, regenerate the committed ncc bundle and licenses, and keep the existing hosted artifact roundtrip. Do not hide install warnings or override unrelated callback-based glob 7 consumers.

Our compatible ZIP/glob probe and lockfile changes are being prepared in https://github.com/konard/medical-speech-to-text/pull/6. Your separate validated Python extractor already avoids the JavaScript template's deprecated Buffer reader; no reader change is needed here.
