# [0.8.0](https://github.com/ductrung-nguyen/Orca-vscode/compare/v0.7.0...v0.8.0) (2026-02-19)


### Bug Fixes

* **ci:** resolve TypeScript compilation errors ([33ed6a5](https://github.com/ductrung-nguyen/Orca-vscode/commit/33ed6a593c9f1f9ada3494789c842a8343cf6028))
* **installation:** address Copilot PR review feedback ([2c34238](https://github.com/ductrung-nguyen/Orca-vscode/commit/2c3423810e8c7f6bcc776506838f51c92e796371))
* **installation:** delete incorrect Homebrew and apt installer files ([ed52324](https://github.com/ductrung-nguyen/Orca-vscode/commit/ed523244df5a2c965173691034c60d8013093c28))
* **installation:** remove all automated installation UI elements ([12a9c9e](https://github.com/ductrung-nguyen/Orca-vscode/commit/12a9c9ed93db58d88bb2d8860e0459bae6abe658))
* **installation:** remove incorrect Homebrew and apt installers ([84767ec](https://github.com/ductrung-nguyen/Orca-vscode/commit/84767ec038dfe461c21b7c0d33ff72abccb135c7))
* **installation:** simplify wizard to focus on manual installation ([4dc5a10](https://github.com/ductrung-nguyen/Orca-vscode/commit/4dc5a10eaa2c6d1907fed664ab326a6506ea0249))
* **lint:** escape backslashes in Windows paths ([2eca44d](https://github.com/ductrung-nguyen/Orca-vscode/commit/2eca44d0d3f7f52872e30e55a55ec853bf81ac21))
* **wizard:** fix logo image not displaying in webview ([6e460e4](https://github.com/ductrung-nguyen/Orca-vscode/commit/6e460e4c105fa8b2c3a88f4684ce8220cb5b8018))
* **wizard:** fix version check timeout and installation detail regressions ([8afe24d](https://github.com/ductrung-nguyen/Orca-vscode/commit/8afe24d099f97eaa2849a0bbeb966ef92a722123))
* **wizard:** skip download step when ORCA already detected ([cd5d56d](https://github.com/ductrung-nguyen/Orca-vscode/commit/cd5d56d8a13dcabe9edbdbe231c52f4ee47b4d77))


### Features

* **installation:** add automated ORCA installation with Conda, Homebrew, and Apt ([18af4fe](https://github.com/ductrung-nguyen/Orca-vscode/commit/18af4fe8ba7f97dad0fa0036b75cc6d3374a2171))
* **installation:** redesign wizard for complete beginners ([5401a26](https://github.com/ductrung-nguyen/Orca-vscode/commit/5401a2678808de6bc83618fef1c1aaab59a93804))
* **wizard:** improve configure step with auto-detection and fix validation ([7e9f4ce](https://github.com/ductrung-nguyen/Orca-vscode/commit/7e9f4cee48a560df78e4dc3923cea4513de411df))

# [0.7.0](https://github.com/ductrung-nguyen/Orca-vscode/compare/v0.6.0...v0.7.0) (2026-02-12)


### Features

* **input:** expand functionals and basis sets for Input Creation ([ac1e1c7](https://github.com/ductrung-nguyen/Orca-vscode/commit/ac1e1c7fe7941aa6eee56d5ce7f82e8eb53195a6)), closes [#17](https://github.com/ductrung-nguyen/Orca-vscode/issues/17)

# [0.6.0](https://github.com/ductrung-nguyen/Orca-vscode/compare/v0.5.0...v0.6.0) (2025-12-28)


### Bug Fixes

* **dashboard:** improve TOC, remove diagnostics, fix convergence display ([afa6e33](https://github.com/ductrung-nguyen/Orca-vscode/commit/afa6e336185b075ece2dfcb3d82d879285e7d4e5))
* resolve ESLint errors for semantic release ([b83c069](https://github.com/ductrung-nguyen/Orca-vscode/commit/b83c069e3cf68cd21eb0c5e9c3f4cfe9c2be187b))


### Features

* **003:** Phase 1 - Vue3 + Vite project setup for webview-ui ([8c814cc](https://github.com/ductrung-nguyen/Orca-vscode/commit/8c814cc592fbcb5f5d751f2db1f79827d0e73e01))
* enhance TOC visibility toggle and export functionality ([a48b129](https://github.com/ductrung-nguyen/Orca-vscode/commit/a48b129c7831b9344afd5cbfe6f2207eb59131f3))
* upgrade PrimeVue to version 4 and integrate new diagnostics section ([b1fa0b8](https://github.com/ductrung-nguyen/Orca-vscode/commit/b1fa0b84da2ede57f98d4362295ea01fa1fd0fe7))

# [0.5.0](https://github.com/ductrung-nguyen/Orca-vscode/compare/v0.4.0...v0.5.0) (2025-12-27)


### Bug Fixes

* add automatic file encoding detection for cross-platform support ([ae3e9c3](https://github.com/ductrung-nguyen/Orca-vscode/commit/ae3e9c3df39650d1ab8ab41b521202c3d1e192f9))
* add iteration patterns to top-level TOC for single-point calculations ([28027a1](https://github.com/ductrung-nguyen/Orca-vscode/commit/28027a1190e236408cd1139d15f6faa46e22eeab))
* add pointer-events:none to collapsed TOC children to fix click navigation ([a60ceda](https://github.com/ductrung-nguyen/Orca-vscode/commit/a60ceda321aca9af2fb5433909e7c01d18de0835))
* improve TOC tree view with proper hierarchical structure ([04a6fd2](https://github.com/ductrung-nguyen/Orca-vscode/commit/04a6fd209fdbe487eac98cf4f2c52c73b0658a8e))
* **parser:** improve geometry optimization energy extraction ([12b7026](https://github.com/ductrung-nguyen/Orca-vscode/commit/12b7026d36ebc68a1f53c6a090cc509a8eb0b13e))


### Features

* **dashboard:** add collapsible iteration TOC for geometry optimization ([65a5959](https://github.com/ductrung-nguyen/Orca-vscode/commit/65a5959c2d7f9329205c4873be2b611b448e7103)), closes [#002](https://github.com/ductrung-nguyen/Orca-vscode/issues/002)
* **dashboard:** improve Results Dashboard accuracy and UX ([d43d1c2](https://github.com/ductrung-nguyen/Orca-vscode/commit/d43d1c21746f23568e8390074eb5572f5f326dd5)), closes [#11](https://github.com/ductrung-nguyen/Orca-vscode/issues/11)

# [0.4.0](https://github.com/ductrung-nguyen/Orca-vscode/compare/v0.3.0...v0.4.0) (2025-12-24)


### Bug Fixes

* address Copilot review comments ([e910bf9](https://github.com/ductrung-nguyen/Orca-vscode/commit/e910bf99b5c46c9e810701591d101d3464a4e7de))
* resolve CI test failures ([164a36d](https://github.com/ductrung-nguyen/Orca-vscode/commit/164a36d76f9ae69d0719b7fbd727a946c57d10f5))
* support scientific notation in SCF iteration energy parsing ([d871e82](https://github.com/ductrung-nguyen/Orca-vscode/commit/d871e82cd2adc729f1c3e82278b8ca4f6564acf3))


### Features

* **005:** Phase 1 - TOC Data Generation Parser Extension ([1aecba7](https://github.com/ductrung-nguyen/Orca-vscode/commit/1aecba738838fa8a16d26fe72af4c74c8e85a533))
* **ci:** Add GitHub Actions CI/CD pipeline ([2b82d63](https://github.com/ductrung-nguyen/Orca-vscode/commit/2b82d630ce3c690608764fd0be65e205e03b9d7f))
* **codelens:** Add CodeLens provider for .out files with Open Dashboard action ([579f4ae](https://github.com/ductrung-nguyen/Orca-vscode/commit/579f4ae3924c88759b67244e00a09d8be86b3d3d))
* **codelens:** Add CodeLens support for .out files with direct dashboard access ([5cdc595](https://github.com/ductrung-nguyen/Orca-vscode/commit/5cdc595a6b327b863e7cd1c0079af9a7fb8cfcbf))
* **dashboard:** add 'go to line' functionality in output file viewer ([0acf671](https://github.com/ductrung-nguyen/Orca-vscode/commit/0acf67152f8f61e7e3cb4739377149bf031c5792))
* **dashboard:** auto-open dashboard and add open file button ([54dfa68](https://github.com/ductrung-nguyen/Orca-vscode/commit/54dfa683e454f9c24368eb28b80aa6ae24b23260))
* **dashboard:** improve UI layout and add CodeLens run action ([0bbe9b7](https://github.com/ductrung-nguyen/Orca-vscode/commit/0bbe9b7f85d069f691300d6842ed1edcaa9d42fd))
* Enhance output file management and analysis features in VS-ORCA v0.3.0 ([b722f86](https://github.com/ductrung-nguyen/Orca-vscode/commit/b722f860fd0aff60683787b73ca0e9333a056a68))
