# One-time Google setup

The GitHub repository stores the application source. Google Sheets and Apps Script must be created under the Mookiland Google account, so the account owner must authorize the initial setup.

## Current status

- The Apps Script source is in `apps-script/`.
- The setup function creates a new spreadsheet named **Mookiland Birthday Booking Database**.
- It creates the initial tabs and headers without touching any existing workbook.
- The customer booking and admin workflows are not active yet.

## Setup steps

1. Sign in to the Google account that should own the Birthday Mookiland database.
2. Open [Google Apps Script](https://script.google.com/).
3. Create a new standalone project named **Mookiland Birthday Booking**.
4. In the Apps Script editor, create script files matching the files in this repository's `apps-script/` folder:
   - `Code.gs`
   - `Schema.gs`
   - `Setup.gs`
5. Copy the complete contents of each corresponding file into its Apps Script file.
6. In **Project Settings**, enable **Show "appsscript.json" manifest file in editor**, then replace the manifest with the repository's `apps-script/appsscript.json` content.
7. Save the project. Select `setupBirthdayMookilandDatabase` and click **Run**.
8. Review the requested Google permissions and authorize them.
9. Open **Execution log**. The setup function logs the new spreadsheet URL and ID. Keep the URL for the next integration step.

The setup function is safe to run again: it reuses the spreadsheet ID saved in Script Properties and checks existing headers before adding defaults. It stops if it detects a header mismatch rather than overwriting existing data.

## Important

- Do not publish the spreadsheet publicly.
- Do not put bank account details, passwords, OAuth tokens, or other secrets in frontend files or this public repository.
- Do not deploy the web app for customer use yet. Booking creation, payment-proof upload, slot locking, expiry, admin authorization, and email workflows are still under development.
- Exact Morning and Afternoon operating hours must be confirmed before customer booking is enabled.
