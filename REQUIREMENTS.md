# Project Requirements



## Functional Requirements

### General
1. Switching between the mode to create lists for programming a scanner and the mode to test the scanner (QR code generation) must be handled by a hamburger menu in a navbar at the top of the application.

### Barcodes Manage Mode
1. The application must allow users to create and manage a list of barcodes to program a barcode scanner.
2. Users should be able to present the code one by one to a barcode scanner.
3. The barcode can entered by value.
4. The user can optionally add a note to each barcode.
5. The user can change the order of the list by drag and drop.
6. The user can save the list including the delay.
7. The user can load a list including the delay.
8. The user can share a link with the list data as part of the url e.g. `http://localhost:5173/bcl/N4IgdghgtgpiBcIQBoQGcCWAjALjGALogPYCuACADYRADWylYA7PQNZUkA0IjbAvpBjABfIA`. After klick on a button "Share List", the created url is copied to the clipboard. The compression of the list object is handled by the `function compressToUrl()` in the file `src/lib/barcodelist2url.ts`.
9. The application must automatically switch to Program Mode when a barcode list is loaded from a shared URL or from localStorage with existing barcodes, providing immediate access to programming functionality.
10. The barcode value can be uploaded as image where the image is scanned by a barcode library and the text is stored in the value field
11. The decoded barcode value from an image needs to contain the following CODE128 specific controll codes: {FNC1},{FNC2},{FNC3},{FNC4}
12. The barcode image to decode can be taken from the clipboard as image
13. The application must support camera-based barcode scanning using the device's camera for direct barcode input.
14. All action buttons (Save List, Load List, Share List, Reset List) must include appropriate lucide-react icons for improved user experience and visual clarity.

### Program Mode
1. The user can change the default delay for presenting the barcode from 1 second to values between 1-30.
2. The user can activate the programm mode, where only one value presented as barcode after the other is shown with a delay of 2 seconds. Ignore any keys while presenting.
3. The application must provide proper error handling and graceful fallback to localStorage when URL data loading fails or is corrupted.
4. The system must handle React StrictMode double execution in development without data corruption or duplicate processing.

### QR Test Mode
1. The application must allow the user to enter arbitrary text and generate a QR code based on that text.
2. The input field is only shown when no text exists
3. right to the input field a icon to switch from input field to only show the content
4. if the text is only shown there is a icon to switch to the input field with the text
5. when no input field and QR-Code is shown, catch all keys pressed and log them in an area under the barcode. non visible character like ESC or LF should be translated to `<Esc=27>` or `<LF=10>`
6. do not output the shift key
7. add trash icon to reset the output of keys

## Non-Functional Requirements
1. The application should be responsive and work on modern browsers.
2. Code should follow best practices and be linted using ESLint.
3. The system should be maintainable and modular, with reusable components.
4. The list should be stored in browser local storage and reloaded from local storage if exists
5. The application must provide robust URL data loading with proper caching to prevent duplicate processing during development.
6. The system must handle compressed URL data with LZ-String compression and provide proper error handling for malformed or corrupted data.
7. The application must maintain data integrity across React component re-renders and development mode double execution.

## Technical Requirements
1. Built with React and TypeScript.
2. Uses Vite for development and build processes.
3. All dependencies managed via pnpm.
4. Source code organized under the `src/` directory.
5. Configuration files for TypeScript, ESLint, and Vite must be present.
6. Use shadcn for components
7. Use Vitest 4.0+ for testing framework with jsdom environment and v8 coverage provider.
8. Implement component separation architecture with dedicated BarcodeManager and ProgramDisplay components.
9. Use LZ-String library for URL data compression and decompression functionality.
10. Integrate lucide-react for consistent iconography across the application.
11. Implement proper caching mechanisms for URL data processing to handle React development mode constraints.

## Future Requirements (Optional)
1. Support for additional device types.

