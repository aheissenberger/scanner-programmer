# Scanner Programmer

A tool for programming scanner devices.


## Features

### Programmer Mode

- Create and manage a list of barcodes to program a scanner device
- Present barcodes one by one with a configurable delay (1–30 seconds)
- Add optional notes to each barcode
- Drag and drop to reorder barcodes
- Save and load barcode lists (including delay) as JSON
- Program mode: disables keyboard input and cycles through barcodes automatically

### QR Test Mode

- Enter arbitrary text to generate a QR code instantly
- Switch between input and view mode using icon buttons
- When viewing the QR code, all key presses are logged below the code (for scanner output testing)
- Special keys (e.g., ESC, LF) are shown as `<Esc=27>`, `<LF=10>`, etc.
- The Shift key is ignored in the log
- Clear the key log with a trash icon button

### General

- Switch between Programmer Mode and QR Test Mode using a hamburger menu in the navbar

![Edit Mode](doc/edit.png)
![Program Mode](doc/present.png)

## install

`pnpm install`

## usage

`pnpm dev`

## Contributing

Contributions are welcome! If you want to improve the code, or fix bugs, please follow these steps:

1. Fork the repository and create a new branch for your feature or fix.
2. Make your changes and add or update tests as needed.
3. Run `pnpm test` to ensure all tests pass.
4. Open a pull request with a clear description of your changes and the motivation behind them.

For major changes or questions, please open an issue first to discuss what you would like to change.

To add a country start with copying an existing implementation in `./src/download`.
Read [Copilot Instructions](.github/copilot-instructions.md) for an overview of the repository.

Thank you for helping make this project better!


## License

[MIT](./LICENSE) License © 2025 [Andreas Heissenberger](https://github.com/aheissenberger)
