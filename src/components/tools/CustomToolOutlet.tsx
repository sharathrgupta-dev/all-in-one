import dynamic from "next/dynamic";
import type { Tool } from "@/lib/tools-registry";

// Each tool is its own chunk — only the visited tool's code is downloaded
const ImageResizerTool        = dynamic(() => import("@/components/tools/ImageResizerTool"));
const PdfPageEditorTool       = dynamic(() => import("@/components/tools/PdfPageEditorTool"));
const XmlSuiteTool            = dynamic(() => import("@/components/tools/XmlSuiteTool"));
const QrCodeTool              = dynamic(() => import("@/components/tools/QrCodeTool"));
const AgeCalculatorTool       = dynamic(() => import("@/components/tools/AgeCalculatorTool"));
const BmiCalculatorTool       = dynamic(() => import("@/components/tools/BmiCalculatorTool"));
const CompoundInterestTool    = dynamic(() => import("@/components/tools/CompoundInterestTool"));
const LoanEmiTool             = dynamic(() => import("@/components/tools/LoanEmiTool"));
const ImageCompressorTool     = dynamic(() => import("@/components/tools/ImageCompressorTool"));
const ContrastCheckerTool     = dynamic(() => import("@/components/tools/ContrastCheckerTool"));
const GradientGeneratorTool   = dynamic(() => import("@/components/tools/GradientGeneratorTool"));
const CurrencyConverterTool   = dynamic(() => import("@/components/tools/CurrencyConverterTool"));
const FinanceFormTools        = dynamic(() => import("@/components/tools/FinanceFormTools"));
const HealthFormTools         = dynamic(() => import("@/components/tools/HealthFormTools"));
const MathFormTools           = dynamic(() => import("@/components/tools/MathFormTools"));
const DateTimeFormTools       = dynamic(() => import("@/components/tools/DateTimeFormTools"));
const BackgroundRemoverTool   = dynamic(() => import("@/components/tools/BackgroundRemoverTool"));
const HtmlPreviewTool         = dynamic(() => import("@/components/tools/HtmlPreviewTool"));
const Base64ImageTool         = dynamic(() => import("@/components/tools/Base64ImageTool"));
const StringInspectorTool     = dynamic(() => import("@/components/tools/StringInspectorTool"));
const MarkdownPreviewTool     = dynamic(() => import("@/components/tools/MarkdownPreviewTool"));
const RegexTesterTool         = dynamic(() => import("@/components/tools/RegexTesterTool"));
const UuidGeneratorTool       = dynamic(() => import("@/components/tools/UuidGeneratorTool"));
const HttpStatusReferenceTool = dynamic(() => import("@/components/tools/HttpStatusReferenceTool"));
const CssBoxShadowTool        = dynamic(() => import("@/components/tools/CssBoxShadowTool"));
const ImageFormatConverterTool = dynamic(() => import("@/components/tools/ImageFormatConverterTool"));
const SvgOptimizerTool        = dynamic(() => import("@/components/tools/SvgOptimizerTool"));
const ExifViewerTool          = dynamic(() => import("@/components/tools/ExifViewerTool"));
const UnicodeCheckerTool      = dynamic(() => import("@/components/tools/UnicodeCheckerTool"));

const FINANCE_SLUGS = new Set([
  "simple-interest", "gst-calculator", "discount-calculator",
  "tip-calculator", "roi-calculator", "profit-loss-calculator",
  "salary-hike-calculator",
]);
const HEALTH_SLUGS = new Set([
  "bmr-calculator", "calorie-calculator",
  "water-intake-calculator", "body-fat-calculator",
]);
const MATH_SLUGS = new Set([
  "quadratic-solver", "pythagorean-theorem", "gcd-lcm-calculator",
]);
const DATETIME_SLUGS = new Set([
  "days-between-dates", "countdown-calculator",
  "week-number-calculator", "due-date-calculator",
]);

export default function CustomToolOutlet({ slug, tool }: { slug: string; tool: Tool }) {
  if (FINANCE_SLUGS.has(slug))  return <FinanceFormTools tool={tool} />;
  if (HEALTH_SLUGS.has(slug))   return <HealthFormTools tool={tool} />;
  if (MATH_SLUGS.has(slug))     return <MathFormTools tool={tool} />;
  if (DATETIME_SLUGS.has(slug)) return <DateTimeFormTools tool={tool} />;

  switch (slug) {
    case "background-remover":       return <BackgroundRemoverTool tool={tool} />;
    case "image-resizer":            return <ImageResizerTool tool={tool} />;
    case "image-compressor":         return <ImageCompressorTool tool={tool} />;
    case "pdf-page-editor":          return <PdfPageEditorTool tool={tool} />;
    case "xml-suite":                return <XmlSuiteTool tool={tool} />;
    case "qr-code":                  return <QrCodeTool tool={tool} />;
    case "age-calculator":           return <AgeCalculatorTool tool={tool} />;
    case "bmi-calculator":           return <BmiCalculatorTool tool={tool} />;
    case "compound-interest":        return <CompoundInterestTool tool={tool} />;
    case "loan-emi-calculator":      return <LoanEmiTool tool={tool} />;
    case "contrast-checker":         return <ContrastCheckerTool tool={tool} />;
    case "gradient-generator":       return <GradientGeneratorTool tool={tool} />;
    case "currency-converter":       return <CurrencyConverterTool tool={tool} />;
    case "html-preview":             return <HtmlPreviewTool tool={tool} />;
    case "base64-image":             return <Base64ImageTool tool={tool} />;
    case "string-inspector":         return <StringInspectorTool tool={tool} />;
    case "markdown-preview":         return <MarkdownPreviewTool tool={tool} />;
    case "regex-tester":             return <RegexTesterTool tool={tool} />;
    case "uuid-generator":           return <UuidGeneratorTool tool={tool} />;
    case "http-status-reference":    return <HttpStatusReferenceTool tool={tool} />;
    case "css-box-shadow":           return <CssBoxShadowTool tool={tool} />;
    case "image-format-converter":   return <ImageFormatConverterTool tool={tool} />;
    case "svg-optimizer":            return <SvgOptimizerTool tool={tool} />;
    case "exif-viewer":              return <ExifViewerTool tool={tool} />;
    case "unicode-checker":          return <UnicodeCheckerTool tool={tool} />;
    default:                         return null;
  }
}
