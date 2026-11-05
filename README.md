# Mookiland Birthday Party Portal

Birthday package information and online booking portal for Mookiland.

## Architecture
- Frontend: static web app hosted with GitHub Pages
- Backend: Google Apps Script Web App
- Database: a new, dedicated Google Sheets workbook created by the Apps Script setup function

## Project status
- [x] Initial GitHub project scaffold
- [x] Initial Apps Script database schema
- [x] Idempotent Google Sheets database setup function
- [x] Initial Apps Script health and public configuration endpoints
- [x] One-time Google setup guide
- [ ] Customer package catalogue and booking interface
- [ ] Race-safe slot reservation and 72-hour expiry
- [ ] Payment-proof upload and admin verification
- [ ] Admin dashboard, invoice and reporting
- [ ] End-to-end testing and production deployment

## Booking rules captured
- Locations: Mooki Garden, Mooki Backyard, Covered Terrace Lounge
- Sessions: Morning and Afternoon (exact operating hours still need confirmation)
- Maximum: one booking per location per session per day
- Deposit: 50% of booking total
- Pending booking slot hold: 72 hours
- Statuses: Pending Deposit, Confirmed, Expired
- Admin notification: dwi.purnami@mookiland.com

## Google setup
See [SETUP.md](./SETUP.md). The setup must be authorized from the Google account that will own the new database. The booking workflow is not live yet.

## Security
Do not store bank credentials, API keys, passwords, OAuth tokens, or other secrets in frontend files or this public repository. Do not make the database spreadsheet public.
