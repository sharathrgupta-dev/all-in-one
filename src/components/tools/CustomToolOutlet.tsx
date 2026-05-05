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

export default function CustomToolOutlet({
  slug,
  tool,
}: {
  slug: string;
  tool: Tool;
}) {
  switch (slug) {
    case "image-resizer":
      return <ImageResizerTool tool={tool} />;
    case "image-compressor":
      return <ImageCompressorTool tool={tool} />;
    case "pdf-page-editor":
      return <PdfPageEditorTool tool={tool} />;
    case "xml-suite":
      return <XmlSuiteTool tool={tool} />;
    case "qr-code":
      return <QrCodeTool tool={tool} />;
    case "age-calculator":
      return <AgeCalculatorTool tool={tool} />;
    case "bmi-calculator":
      return <BmiCalculatorTool tool={tool} />;
    case "compound-interest":
      return <CompoundInterestTool tool={tool} />;
    case "loan-emi-calculator":
      return <LoanEmiTool tool={tool} />;
    case "contrast-checker":
      return <ContrastCheckerTool tool={tool} />;
    case "gradient-generator":
      return <GradientGeneratorTool tool={tool} />;
    case "currency-converter":
      return <CurrencyConverterTool tool={tool} />;
    default:
      return null;
  }
}
