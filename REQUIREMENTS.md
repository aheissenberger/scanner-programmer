# Project Requirements



## Functional Requirements

### General
1. Switching between the mode to create lists for programming a scanner and the mode to test the scanner (QR code generation) must be handled by a hamburger menu in a navbar at the top of the application.

### Programmer Mode
1. The application must allow users to create and manage a list of barcodes to program a barcode scanner.
2. Users should be able to present the code one by one to a barcode scanner.
3. The barcode can be scanned or entered by value.
4. The user can optionally add a note to each barcode.
5. The user can change the order of the list by drag and drop.
6. The user can save the list including the delay.
7. The user can load a list including the delay.
8. The user can change the default delay for presenting the barcode from 1 second to values between 1-30.
9. The user can activate the programm mode, where only one value presented as barcode after the other is shown with a delay of 2 seconds. Ignore any keys while presenting.

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

## Technical Requirements
1. Built with React and TypeScript.
2. Uses Vite for development and build processes.
3. All dependencies managed via pnpm.
4. Source code organized under the `src/` directory.
5. Configuration files for TypeScript, ESLint, and Vite must be present.
6. Use shadcn for components

## Future Requirements (Optional)
1. Support for additional device types.

