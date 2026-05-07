# Changelog

> Auto-generated from git log. Run `npm run changelog` to refresh.

## 2026-05-07

### Added
- implement manual theme toggle in layout and update Header component to sync theme state with localStorage (`3497e37`)
- enhance theme management in Header component and update layout styles for improved dark mode support (`01cf65f`)
- implement dynamic import for CommandPalette to optimize initial bundle size and update styling for improved accessibility (`66a62a2`)
- update package.json with browserslist configuration, enhance layout preconnect hints for optimized loading, and refine styling in various components for improved accessibility and user experience (`8c02893`)
- add blog routes to sitemap, update navigation links in Header and Footer, and refine JSON Formatter links for improved user access (`8d5dc2e`)
- update affiliate links in Footer and HomePage, enhance tool metadata with dynamic content, and improve tool descriptions for better user engagement (`e64b693`)
- integrate FAQ sections into JWT Debugger and Tool Slug layouts, enhancing user experience with structured data and improved SEO (`fdb61fb`)
- add sponsor bar and affiliate links to the HomePage and Footer components for enhanced monetization (`84a7529`)
- enhance proxy route to block private addresses and improve request validation; update API Tester and Code Beautify metadata with additional keywords (`0716677`)
- update next.config.ts for production optimizations, add Footer component to tool layout, and implement dynamic imports for tool components to improve performance (`9fb2148`)
- add YAML tools to the workspace routes and update tool registry with new YAML converters and formatter (`5d32583`)
- update tools registry and enhance Image Format Converter to support SVG; add Vercel analytics and speed insights (`355d74a`)
- add Unicode Checker tool to the tool registry and update related components for integration (`1cc7980`)
- update tool registry with new tools including Image Format Converter, SVG Optimizer, EXIF Viewer, HTTP Status Reference, and CSS Box Shadow Builder; enhance ToolSearch component with recent and favourite tools functionality (`aa08778`)
- refactor ToolSearch component to accept tools as a prop, improving modularity and reducing client bundle size (`5d9183d`)

### Changed
- reorganize affiliate links section in Footer component for improved layout and clarity (`dc2007e`)

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
