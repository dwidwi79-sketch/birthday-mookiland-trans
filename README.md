# Mookiland Birthday Party Portal

Birthday package information and online booking portal for Mookiland.

## Architecture
- Frontend: static web app hosted with GitHub Pages
- Backend: Google Apps Script Web App (to be created)
- Database: Google Sheets (to be created)
- Booking workflow: slot availability, 72-hour pending-deposit hold, 50% deposit, admin verification

## Project status
Initial scaffold. No existing application source was provided; implementation starts from a clean project.

## Business rules captured
- Locations: Mooki Garden, Mooki Backyard, Covered Terrace Lounge
- Sessions: Morning and Afternoon
- Maximum: one booking per location per session (two sessions per day)
- Deposit: 50% of booking total
- Pending booking slot hold: 72 hours
- Statuses: Pending Deposit, Confirmed, Expired
- Admin notification: dwi.purnami@mookiland.com

## Next implementation stages
1. Build customer-facing package catalogue and booking interface.
2. Build Apps Script API and Google Sheets schema.
3. Implement race-safe slot reservation and 72-hour expiry.
4. Build admin dashboard, payment verification, and email notifications.
5. Test end-to-end and configure GitHub Pages / Apps Script deployment.

Do not store bank credentials, API keys, or other secrets in frontend files.
