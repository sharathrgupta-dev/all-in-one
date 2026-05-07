# Changelog

> Auto-generated from git log. Run `npm run changelog` to refresh.

## 2026-05-07

### Added
- update tools registry and enhance Image Format Converter to support SVG; add Vercel analytics and speed insights (`d09ad7b`)
- add Unicode Checker tool to the tool registry and update related components for integration (`1cc7980`)
- update tool registry with new tools including Image Format Converter, SVG Optimizer, EXIF Viewer, HTTP Status Reference, and CSS Box Shadow Builder; enhance ToolSearch component with recent and favourite tools functionality (`aa08778`)
- refactor ToolSearch component to accept tools as a prop, improving modularity and reducing client bundle size (`5d9183d`)

## 2026-05-06

### Added
- implement redirects for JSON formatter and enhance layout with viewport settings and accessibility improvements (`433d67a`)
- enhance Graph Calculator layout with detailed descriptions, supported functions, and tips for improved user guidance and experience (`e7d9b64`)
- enhance API Tester and Code Beautify pages with detailed descriptions, features, and usage instructions to improve user experience and understanding (`a3c6244`)
- add detailed explanations and usage examples for cron expressions, diff checker, epoch time, and JSON toolkit to enhance user understanding and functionality (`a45b34d`)
- enhance JWT Debugger page with detailed explanations of JWT structure, signing algorithms, and security warnings for improved user understanding (`be3ff63`)
- update tool layout and page components to display related tools and enhance tool descriptions (`5da0c04`)
- add Google verification metadata to enhance site authenticity and SEO (`4b19c39`)
- add JSON-LD structured data for homepage and tool pages to improve SEO and metadata representation (`013ed96`)
- integrate Google Tag Manager for enhanced tracking and analytics (`461cd0b`)
- add Google AdSense account information to metadata in layout (`9a326e1`)
- Add Vercel Web Analytics integration (`68b0dac`)
- update privacy policy content and layout, including advertising disclosures and cookie usage information (`9707121`)

## 2026-05-05

### Added
- add various tools including HTML Preview, Markdown Preview, Regex Tester, String Inspector, and UUID Generator (`ecfb356`)
- Add Background Remover tool and update configuration for turbopack support. Include @imgly/background-removal dependency in package.json and package-lock.json. Clean up unused imports and enhance tool descriptions across various components. (`ca6410b`)
- Add unit conversion functionality and categorize tools into finance, health, math, and datetime sections. Enhance AgeCalculatorTool with improved type handling and update CustomToolOutlet to support new tool categories. (`d86db82`)
- Add QR code generation tools and enhance finance, health, and math categories in the tool registry (`334cbf1`)
- Add pdf-lib dependency and introduce new tools in Code Beautify (`22c85d5`)

### Changed
- rename project from DevForge to DevBench and update related metadata (`242f099`)
- Update package dependencies and enhance Code Beautify layout. Added Prettier and sql-formatter to package.json, improved metadata descriptions, and integrated CodeBeautifyWorkspace component. Enhanced CopyButton component with a disabled state. (`f7d59bb`)
- Remove favicon and update page layout with new features, including dynamic matrix size support and improved descriptions. Replace icons in Header and Footer components with DevForgeMark. (`2e188d7`)

## 2026-05-04

### Changed
- Implement initial project structure and setup (`56cc343`)
- Initial commit (`8bb03c1`)
