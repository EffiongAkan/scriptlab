
import jsPDF from 'jspdf';
import { ScriptElementType } from '@/hooks/useScriptContent';

export interface ExportOptions {
  format: 'pdf' | 'fountain' | 'fdx' | 'docx' | 'txt';
  includeTitle: boolean;
  includeCoverPage: boolean;
  pageNumbers: boolean;
  fontSize: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  watermark?: string;
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  filename: string;
  error?: string;
}

export class ScriptExportService {
  static async exportScript(
    title: string,
    elements: ScriptElementType[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      switch (options.format) {
        case 'pdf':
          return await this.exportToPDF(title, elements, options);
        case 'fountain':
          return this.exportToFountain(title, elements, options);
        case 'fdx':
          return this.exportToFDX(title, elements, options);
        case 'docx':
          return this.exportToDocx(title, elements, options);
        case 'txt':
          return this.exportToText(title, elements, options);
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  private static async exportToPDF(
    title: string,
    elements: ScriptElementType[],
    options: ExportOptions
  ): Promise<ExportResult> {
    // Initialize with 'in' (inches) and 'letter' format to match Quick Export
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter'
    });

    const pageWidth = 8.5; // Letter width in inches
    const pageHeight = 11; // Letter height in inches
    let yPosition = 1; // Start content at 1 inch

    // Set courier font for screenplay standard
    pdf.setFont("courier");
    pdf.setFontSize(12);

    // Add title page if requested
    if (options.includeCoverPage) {
      pdf.setFontSize(16);
      pdf.setFont("courier", "bold");
      pdf.text(title.toUpperCase(), pageWidth / 2, pageHeight / 3, { align: "center" });

      pdf.setFontSize(12);
      pdf.setFont("courier", "normal");
      pdf.text("Written by", pageWidth / 2, (pageHeight / 3) + 1, { align: "center" });

      // We don't have author name in options, so standard placeholder or check if passed
      // For now, standard placeholder or we could add author to options later. 
      // Quick export had "[Author Name]".
      pdf.text("[Author Name]", pageWidth / 2, (pageHeight / 3) + 1.5, { align: "center" });

      pdf.addPage();
      yPosition = 1; // Reset Y for script content
    }

    // Add watermark if specified
    if (options.watermark) {
      // Logic for watermark on every page is handled inside loop or by adding page event
      // However, jsPDF simple approach is adding it to current page.
      // We'll apply it per page loop below.
    }

    const applyWatermark = () => {
      if (options.watermark) {
        pdf.setTextColor(230, 230, 230);
        pdf.setFontSize(50);
        // 45 degree angle centered
        pdf.text(options.watermark, pageWidth / 2, pageHeight / 2, {
          align: 'center',
          angle: 45
        });
        pdf.setTextColor(0, 0, 0); // Reset
        pdf.setFontSize(12); // Reset
      }
    };

    // Apply watermark to first page (if not cover page, or if cover page included, we just passed it)
    applyWatermark();

    // Process script elements
    pdf.setFont("courier", "normal");
    pdf.setFontSize(12);

    const validElements = elements.filter(el => el && el.content && el.content.trim() !== '');
    const fontSize = 12; // Current font size
    const lineHeight = fontSize * 0.0166666667; // 12pt font, 12pt leading (1/6 inch)

    validElements.forEach(element => {
      // Check for new page
      if (yPosition > pageHeight - options.margins.bottom) { // Use options.margins.bottom
        pdf.addPage();
        applyWatermark();
        yPosition = 1; // 1 inch top margin
      }

      const content = element.content.trim();
      let xPosition = 1;

      pdf.setFontSize(12); switch (element.type) {
        case 'heading':
          pdf.setFont("courier", "bold");
          xPosition = 1;
          yPosition += 0.3; // Extra space before heading
          break;
        case 'action':
          pdf.setFont("courier", "normal");
          xPosition = 1;
          break;
        case 'character':
          pdf.setFont("courier", "bold");
          xPosition = 3.7;
          yPosition += 0.2; // Space before character
          break;
        case 'dialogue':
          pdf.setFont("courier", "normal");
          xPosition = 2.5;
          break;
        case 'parenthetical':
          pdf.setFont("courier", "italic");
          xPosition = 3.2;
          break;
        case 'transition':
          pdf.setFont("courier", "bold");
          xPosition = 6;
          yPosition += 0.2;
          break;
      }

      // Split text to fit (approx 6 inches max width for action, shorter for others)
      // Use logic from useScriptExport (maxWidth 6)
      const splitText = pdf.splitTextToSize(content, 6);
      pdf.text(splitText, xPosition, yPosition);
      yPosition += splitText.length * lineHeight + 0.1; // 0.1 spacing between elements
    });

    // Add page numbers if requested
    if (options.pageNumbers) {
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setFont("courier", "normal");
        pdf.text(`${i}.`, 7.5, 0.5); // Right top corner usually for scripts, or bottom
      }
    }

    const blob = pdf.output('blob');
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;

    return {
      success: true,
      blob,
      filename
    };
  }

  private static exportToFountain(
    title: string,
    elements: ScriptElementType[],
    options: ExportOptions
  ): ExportResult {
    let fountain = '';

    // Metadata Header matching useScriptExport
    if (options.includeTitle) {
      fountain += `Title: ${title}\n`;
      fountain += `Credit: Written by\n`;
      fountain += `Author: [Author Name]\n`; // Ideally passed in options
      fountain += `Draft date: ${new Date().toLocaleDateString()}\n\n`;
    }

    const validElements = elements.filter(el => el && el.content && el.content.trim() !== '');

    validElements.forEach(element => {
      const content = element.content.trim();
      if (!content) return;

      switch (element.type) {
        case 'heading':
          fountain += `\n.${content.toUpperCase()}\n\n`;
          break;
        case 'character':
          fountain += `@${content.toUpperCase()}\n`;
          break;
        case 'dialogue':
          fountain += `${content}\n\n`;
          break;
        case 'parenthetical':
          fountain += `(${content})\n`;
          break;
        case 'action':
          fountain += `${content}\n\n`;
          break;
        case 'transition':
          fountain += `> ${content.toUpperCase()}\n\n`;
          break;
        default:
          fountain += `${content}\n\n`;
      }
    });

    const blob = new Blob([fountain], { type: 'text/plain;charset=utf-8' });
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.fountain`;

    return {
      success: true,
      blob,
      filename
    };
  }

  private static exportToFDX(
    title: string,
    elements: ScriptElementType[],
    options: ExportOptions
  ): ExportResult {
    let fdx = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    fdx += `<FinalDraft DocumentType="Script" Template="No" Version="1">\n`;
    fdx += `<Content>\n`;

    if (options.includeTitle) {
      fdx += `<Paragraph Type="Scene Heading">\n<Text>${title}</Text>\n</Paragraph>\n`;
    }

    elements.forEach((element) => {
      const content = element.content.trim();
      if (!content) return;

      let fdxType = '';
      switch (element.type) {
        case 'heading':
          fdxType = 'Scene Heading';
          break;
        case 'character':
          fdxType = 'Character';
          break;
        case 'dialogue':
          fdxType = 'Dialogue';
          break;
        case 'parenthetical':
          fdxType = 'Parenthetical';
          break;
        case 'action':
          fdxType = 'Action';
          break;
        case 'transition':
          fdxType = 'Transition';
          break;
      }

      fdx += `<Paragraph Type="${fdxType}">\n<Text>${this.escapeXml(content)}</Text>\n</Paragraph>\n`;
    });

    fdx += `</Content>\n</FinalDraft>`;

    const blob = new Blob([fdx], { type: 'application/xml' });
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.fdx`;

    return {
      success: true,
      blob,
      filename
    };
  }

  private static exportToDocx(
    title: string,
    elements: ScriptElementType[],
    options: ExportOptions
  ): ExportResult {
    // Simplified DOCX export (would need docx library for full implementation)
    let content = '';

    if (options.includeTitle) {
      content += `${title}\n\n`;
    }

    elements.forEach((element) => {
      content += `${element.content}\n`;
      if (element.type !== 'character' && element.type !== 'parenthetical') {
        content += '\n';
      }
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;

    return {
      success: true,
      blob,
      filename
    };
  }

  private static exportToText(
    title: string,
    elements: ScriptElementType[],
    options: ExportOptions
  ): ExportResult {
    let content = '';

    if (options.includeTitle) {
      content += `${title.toUpperCase()}\n\n`;
      content += `Written by\n\n[Author Name]\n\n\n`;
    }

    elements.forEach((element) => {
      const elementContent = element.content.trim();
      if (!elementContent) return;

      switch (element.type) {
        case 'heading':
          content += `\n\n${elementContent.toUpperCase()}\n\n`;
          break;
        case 'character':
          content += `\n\n                    ${elementContent.toUpperCase()}\n`;
          break;
        case 'dialogue':
          content += `          ${elementContent}\n\n`;
          break;
        case 'parenthetical':
          content += `                    (${elementContent})\n`;
          break;
        case 'action':
          content += `${elementContent}\n\n`;
          break;
        case 'transition':
          content += `\n                              ${elementContent.toUpperCase()}\n\n`;
          break;
        default:
          content += `${elementContent}\n`;
      }
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;

    return {
      success: true,
      blob,
      filename
    };
  }

  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
