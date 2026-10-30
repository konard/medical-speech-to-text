# PriMock57 demonstration clips

Source: [PriMock57](https://github.com/babylonhealth/primock57/tree/cd2ac707ad03cb4d2531f4ec6b90c659bf4357c5),
Alex Papadopoulos Korfiatis, Francesco Moramarco, Radmila Sarac and Aleksandar Savkov
(2022), **PriMock57: A Dataset of Primary Care Mock Consultations**, Babylon Health.
Licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).
No warranties are provided by the original publisher or this demonstration.

Changes: ten complete utterances cropped from
`audio/day1_consultation01_doctor.wav`, using its human TextGrid annotations.
Intervals containing uncertainty/unintelligibility markers were excluded. No
other signal processing was performed. `manifest.json` records source revision,
source hashes, exact source frame intervals, clip hashes and original references.

These are actors and a clinician in one **mock** consultation, not ten patients
or independent clinical test cases. They illustrate browser inference and scoring;
results cannot establish performance on Australian clinical speech.

Reproduce with `python3 experiments/issue-1/prepare-demo-data.py` from the repository
root. Cite the original authors and retain this attribution when redistributing.
