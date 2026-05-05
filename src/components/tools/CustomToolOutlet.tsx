import type { Tool } from "@/lib/tools-registry";
import ImageResizerTool from "@/components/tools/ImageResizerTool";
import PdfPageEditorTool from "@/components/tools/PdfPageEditorTool";
import XmlSuiteTool from "@/components/tools/XmlSuiteTool";
import QrCodeTool from "@/components/tools/QrCodeTool";
import AgeCalculatorTool from "@/components/tools/AgeCalculatorTool";
import BmiCalculatorTool from "@/components/tools/BmiCalculatorTool";
import CompoundInterestTool from "@/components/tools/CompoundInterestTool";
import LoanEmiTool from "@/components/tools/LoanEmiTool";
import ImageCompressorTool from "@/components/tools/ImageCompressorTool";
import ContrastCheckerTool from "@/components/tools/ContrastCheckerTool";
import GradientGeneratorTool from "@/components/tools/GradientGeneratorTool";
import CurrencyConverterTool from "@/components/tools/CurrencyConverterTool";
import FinanceFormTools from "@/components/tools/FinanceFormTools";
import HealthFormTools from "@/components/tools/HealthFormTools";
import MathFormTools from "@/components/tools/MathFormTools";
import DateTimeFormTools from "@/components/tools/DateTimeFormTools";
import BackgroundRemoverTool from "@/components/tools/BackgroundRemoverTool";
import HtmlPreviewTool from "@/components/tools/HtmlPreviewTool";
import Base64ImageTool from "@/components/tools/Base64ImageTool";
import StringInspectorTool from "@/components/tools/StringInspectorTool";
import MarkdownPreviewTool from "@/components/tools/MarkdownPreviewTool";
import RegexTesterTool from "@/components/tools/RegexTesterTool";
import UuidGeneratorTool from "@/components/tools/UuidGeneratorTool";

const FINANCE_SLUGS = new Set([
  "simple-interest", "gst-calculator", "discount-calculator",
  "tip-calculator", "roi-calculator", "profit-loss-calculator",
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

export default function CustomToolOutlet({
  slug,
  tool,
}: {
  slug: string;
  tool: Tool;
}) {
  if (FINANCE_SLUGS.has(slug))  return <FinanceFormTools tool={tool} />;
  if (HEALTH_SLUGS.has(slug))   return <HealthFormTools tool={tool} />;
  if (MATH_SLUGS.has(slug))     return <MathFormTools tool={tool} />;
  if (DATETIME_SLUGS.has(slug)) return <DateTimeFormTools tool={tool} />;

  switch (slug) {
    case "background-remover":  return <BackgroundRemoverTool tool={tool} />;
    case "image-resizer":       return <ImageResizerTool tool={tool} />;
    case "image-compressor":    return <ImageCompressorTool tool={tool} />;
    case "pdf-page-editor":     return <PdfPageEditorTool tool={tool} />;
    case "xml-suite":           return <XmlSuiteTool tool={tool} />;
    case "qr-code":             return <QrCodeTool tool={tool} />;
    case "age-calculator":      return <AgeCalculatorTool tool={tool} />;
    case "bmi-calculator":      return <BmiCalculatorTool tool={tool} />;
    case "compound-interest":   return <CompoundInterestTool tool={tool} />;
    case "loan-emi-calculator": return <LoanEmiTool tool={tool} />;
    case "contrast-checker":    return <ContrastCheckerTool tool={tool} />;
    case "gradient-generator":  return <GradientGeneratorTool tool={tool} />;
    case "currency-converter":  return <CurrencyConverterTool tool={tool} />;
    case "html-preview":        return <HtmlPreviewTool tool={tool} />;
    case "base64-image":        return <Base64ImageTool tool={tool} />;
    case "string-inspector":    return <StringInspectorTool tool={tool} />;
    case "markdown-preview":    return <MarkdownPreviewTool tool={tool} />;
    case "regex-tester":        return <RegexTesterTool tool={tool} />;
    case "uuid-generator":      return <UuidGeneratorTool tool={tool} />;
    default:                    return null;
  }
}
