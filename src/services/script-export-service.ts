
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
    pdf.setFont("Courier");
    pdf.setFontSize(12);

    // Add title page if requested
    if (options.includeCoverPage) {
      pdf.setFontSize(16);
      pdf.setFont("Courier", "bold");
      pdf.text(title.toUpperCase(), pageWidth / 2, pageHeight / 3, { align: "center" });

      pdf.setFontSize(12);
      pdf.setFont("Courier", "normal");
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
    pdf.setFont("Courier", "normal");
    pdf.setFontSize(12);

    const validElements = elements.filter(el => el && el.content && el.content.trim() !== '');
    yPosition = 1;
    const bottomMargin = 10; // Letter size (11) minus 1 inch bottom margin
    // True 12pt Courier line height: 12pt = 1/6 inch = 0.1667in
    const lineHeight = 0.1667;
    let sceneCount = 0;
    let pageNumber = 1;
    
    // Print first page number if needed
    if (options.pageNumbers) {
      const pageNumText = options.includeCoverPage ? '1.' : '1.';
      pdf.setFont("Courier", "normal");
      pdf.setFontSize(10);
      pdf.text(pageNumText, 7.5, 0.5);
    }

    validElements.forEach((element, index) => {
      const content = element.content.trim();
      let xPosition = 1;
      let fontSize = 12;
      let spaceBefore = 0;

      // Determine space before this element based on type and previous element
      if (index > 0) {
        const prevType = validElements[index - 1].type;
        
        if (element.type === 'heading') {
          spaceBefore = lineHeight * 2; // Double space before heading
        } else if (element.type === 'character') {
          // Increase space before character if it follows an action line
          if (prevType === 'action') {
            spaceBefore = lineHeight * 2; // Doubled space
          } else {
            spaceBefore = lineHeight; 
          }
        } else if (element.type === 'action') {
           // Increase space before action if it follows dialogue
          if (prevType === 'dialogue') {
            spaceBefore = lineHeight * 2; // Doubled space
          } else {
            spaceBefore = lineHeight;
          }
        } else if (element.type === 'transition') {
          spaceBefore = lineHeight * 2;
        } else if (element.type === 'dialogue' || element.type === 'parenthetical') {
          // Dialogue follows Character or Parenthetical with 0 blank lines
          spaceBefore = 0; 
        }
      }

      // Define specific widths for element types to ensure proper right margins
      let maxWidth = 6.5; // Default width (Action)
      switch (element.type) {
        case 'dialogue': maxWidth = 3.5; break;
        case 'parenthetical': maxWidth = 2.5; break;
        case 'character': maxWidth = 4.0; break;
        case 'transition': maxWidth = 2.0; break;
        case 'action':
        case 'heading':
        default: maxWidth = 6.5; break;
      }

      const splitText = pdf.splitTextToSize(content, maxWidth);
      
      // Orphan prevention: If it's a heading or character, ensure we have enough room for at least 2 more lines below it
      const extraRoomNeeded = (element.type === 'heading' || element.type === 'character') ? (lineHeight * 3) : 0;
      
      // Check if we need to page break before printing
      if (yPosition + spaceBefore + (splitText.length * lineHeight) + extraRoomNeeded > bottomMargin) {
        pdf.addPage();
        applyWatermark();
        pageNumber++;
        yPosition = 1; // Reset to top margin
        spaceBefore = 0; // Don't add space at the top of a new page
        
        if (options.pageNumbers) {
          pdf.setFont("Courier", "normal");
          pdf.setFontSize(10);
          pdf.text(`${pageNumber}.`, 7.5, 0.5); // Right top corner
        }
      }

      yPosition += spaceBefore;

      pdf.setFontSize(fontSize);

      switch (element.type) {
        case 'heading':
          pdf.setFont("Courier", "bold");
          xPosition = 1;
          sceneCount++;
          // Draw scene numbers on both sides
          pdf.setFontSize(10);
          pdf.text(sceneCount.toString(), 0.7, yPosition);
          pdf.text(sceneCount.toString(), 7.8, yPosition);
          pdf.setFontSize(fontSize);
          break;
        case 'action':
          pdf.setFont("Courier", "normal");
          xPosition = 1;
          break;
        case 'character':
          pdf.setFont("Courier", "bold");
          xPosition = 3.7;
          break;
        case 'dialogue':
          pdf.setFont("Courier", "normal");
          xPosition = 2.5;
          break;
        case 'parenthetical':
          pdf.setFont("Courier", "italic");
          xPosition = 3.2;
          break;
        case 'transition':
          pdf.setFont("Courier", "bold");
          xPosition = 6;
          break;
      }

      pdf.text(splitText, xPosition, yPosition);
      
      // Advance yPosition by the height of the text printed
      yPosition += splitText.length * lineHeight;
    });

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
    let sceneCount = 0;

    validElements.forEach(element => {
      const content = element.content.trim();
      if (!content) return;

      switch (element.type) {
        case 'heading':
          sceneCount++;
          fountain += `\n.${content.toUpperCase()} #${sceneCount}#\n\n`;
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

    let sceneCount = 0;
    elements.forEach((element) => {
      const elementContent = element.content.trim();
      if (!elementContent) return;

      switch (element.type) {
        case 'heading':
          sceneCount++;
          content += `\n\n${sceneCount}. ${elementContent.toUpperCase()}\n\n`;
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
