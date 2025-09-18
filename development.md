# Development Log - 001

This document summarizes the features and fixes implemented in the application.

## Key Features Implemented:

1.  **Global Company Profile & Currency Management**:
    - A "Company Profile" page under the Admin section allows users to update company name, contact details, and global currency.
    - The company name in the main sidebar header is now dynamic and updates when changed in the profile.
    - The selected currency (`USD`, `EUR`, etc.) is now reflected application-wide on all pages that display monetary values, including the Dashboard, Cash Book, and all order/quotation pages.

2.  **Dummy Data & Development Mode**:
    - A "Development" tab has been added to the Dashboard.
    - It features an "Enable Dummy Data" switch to populate the entire application with a rich, two-month dataset for testing and demonstration.
    - Disabling the switch clears all transactional and master data, providing a clean state.

3.  **Individual Print & Share Functionality**:
    - "Print" and "Share" buttons have been added to the action menu for each individual item on the Purchase Orders, Sale Orders, and Quotations pages.
    - **Print**: Generates a clean, printable view of a single selected document.
    - **Share**: Uses the browser's native share functionality or copies a link to the clipboard if sharing is not supported.

4.  **Application-Wide Reporting Page**:
    - A new "Reporting" page has been added, accessible from the sidebar.
    - Users can select a date range to generate a consolidated report.
    - The report includes filtered data from the Cash Book, Purchase Orders, Sale Orders, and Quotations within the selected period.
    - A print function is available to create a clean printout of the entire generated report.

5.  **UI & Data Display Improvements**:
    - All primary data tables (Cash Book, Purchase Orders, Sale Orders, Quotations) are now sorted by date in descending order, showing the most recent entries first.
    - The "Orders" section has been consistently renamed to "Sale Orders" throughout the application for better clarity.

## Bug Fixes:

- Fixed multiple crashes and build errors related to incorrect component imports and syntax errors.
- Resolved an issue where company profile data was not saving correctly upon submission.
- Fixed a bug where monetary values on the dashboard and other pages were not updating to reflect the globally selected currency.
- Corrected a flaw where Print/Share buttons were acting globally instead of on individual items.
- Fixed runtime errors related to missing React imports for `React.forwardRef` in multiple components.
