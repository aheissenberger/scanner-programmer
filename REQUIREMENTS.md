# Project Requirements

## Functional Requirements
1. The application must allow users to create and manage a list of barcodes to program a barcode scanner.
2. Users should be able to present the code one by one to a barcode scanner.
3. The barcode can be scanned or entered by value.
4. The user can optional add a note to each barcode.
4. The user can change the order of the list by drag and drop
5. The user can save the list including the delay
6. The user can load a list including the delay
6. The user can change the default delay for presenting the barcode from 1 second to values between 1-30
7. The user can activate the programm mode, where only one value presented as barcode after the other is shown with a delay of 2 second. Ignore any keys while presenting.

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

