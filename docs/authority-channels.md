# Official authority channels

ResolveLink uses a compact action panel so a citizen can carry the graph-backed evidence to an official channel instead of stopping at an internal recommendation. These routes are for the Bengaluru demonstration and are shown as public links; they are not simulated submission APIs.

## Primary Bengaluru civic route

- **BBMP civic helpline: 1533.** The official Karnataka Praja Seve iPGRS portal publishes BBMP 1533 among its department helplines.
- **Namma Bengaluru / Sahaaya 2.0:** https://nammabengaluru.org.in/

The official Karnataka Government App Store describes Namma Bengaluru (Sahaaya 2.0) as a unified grievance application developed by BBMP for citizen complaints. It integrates BBMP, BESCOM, BWSSB, BMTC, BMRCL, BMRDA and BDA grievance modules, and lets citizens track grievance status.

## Escalation route

- **Karnataka Praja Seve / iPGRS: 1902** — https://ipgrs.karnataka.gov.in/

The official iPGRS portal describes Praja Seve as a unified platform for filing grievances with government departments and tracking resolutions. It publishes 1902 as the helpline and also lists BBMP 1533 in its department helplines.

## Product behavior

ResolveLink does not claim to file a complaint automatically. It shows the appropriate official route, labels the demo data as synthetic, and provides a copyable evidence brief containing the case ID, location, issue, priority, recurrence evidence, and recommended action. In production, an authenticated connector could submit the brief and persist the official grievance ID as the next graph event.

## Source pages

- Karnataka Government App Store, Sahaaya 2.0: https://apps.karnataka.gov.in/app/87/en
- Karnataka Praja Seve / iPGRS: https://ipgrs.karnataka.gov.in/
- Namma Bengaluru portal: https://nammabengaluru.org.in/
