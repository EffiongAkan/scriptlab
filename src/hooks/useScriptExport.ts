
import { ScriptElementType } from "./useScriptContent";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";

export const useScriptExport = () => {
  const { toast } = useToast();

  // Enhanced validation for script content
  const validateScriptContent = (elements: ScriptElementType[]): { isValid: boolean; message: string } => {
    if (!elements || !Array.isArray(elements)) {
      return { isValid: false, message: "Invalid script data" };
    }

    if (elements.length === 0) {
      return { isValid: false, message: "No script elements found" };
    }

    // Check if there's at least one element with meaningful content
    const hasContent = elements.some(element =>
      element &&
      element.content &&
      element.content.trim() !== '' &&
      element.content.trim().length > 2
    );

    if (!hasContent) {
      return { isValid: false, message: "No meaningful content to export" };
    }

    return { isValid: true, message: "Content is valid" };
  };

  // Enhanced script formatting with better structure
  const formatScriptContent = (title: string, elements: ScriptElementType[], authorName: string = '[Author Name]'): string => {
    const validation = validateScriptContent(elements);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    // Filter out empty elements and format content
    const validElements = elements.filter(element =>
      element && element.content && element.content.trim() !== ''
    );

    const content = validElements.map(element => {
      const content = element.content.trim();

      switch (element.type) {
        case 'heading':
          return `\n\n${content.toUpperCase()}\n\n`;
        case 'action':
          return `${content}\n\n`;
        case 'character':
          return `\n\n                    ${content.toUpperCase()}\n`;
        case 'dialogue':
          return `          ${content}\n\n`;
        case 'parenthetical':
          return `                    (${content})\n`;
        case 'transition':
          return `\n                              ${content.toUpperCase()}\n\n`;
        default:
          return `${content}\n`;
      }
    }).join('');

    return `${title.toUpperCase()}\n\n\nWritten by\n\n${authorName}\n\n\n${content}`;
  };

  // Export as TXT with improved error handling
  const exportAsTXT = async (title: string, elements: ScriptElementType[], authorName?: string) => {
    try {
      const validation = validateScriptContent(elements);
      if (!validation.isValid) {
        toast({
          title: "Export Failed",
          description: validation.message,
          variant: "destructive"
        });
        return;
      }

      const formattedContent = formatScriptContent(title, elements, authorName);
      const safeTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();

      const blob = new Blob([formattedContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeTitle || 'untitled-script'}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Add to export history
      if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
        const record = {
          scriptId: title, // Using title as fallback scriptId
          scriptTitle: title,
          format: 'txt',
          filename: `${safeTitle}.txt`,
          fileSize: new Blob([formattedContent]).size
        };

        try {
          const stored = localStorage.getItem('scriptExportHistory');
          const history = stored ? JSON.parse(stored) : [];
          history.unshift({
            ...record,
            id: crypto.randomUUID(),
            exportedAt: new Date().toISOString()
          });
          localStorage.setItem('scriptExportHistory', JSON.stringify(history.slice(0, 50)));
        } catch (e) {
          console.warn('Could not save export history:', e);
        }
      }

      toast({
        title: "Export Successful",
        description: `Script exported as ${safeTitle}.txt`,
      });
    } catch (error) {
      console.error("Error exporting as TXT:", error);
      toast({
        title: "Export Failed",
        description: `Could not export script: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // Export as PDF with improved formatting
  const exportAsPDF = async (title: string, elements: ScriptElementType[], authorName: string = '[Author Name]', email?: string, phoneNumber?: string) => {
    try {
      const validation = validateScriptContent(elements);
      if (!validation.isValid) {
        toast({
          title: "Export Failed",
          description: validation.message,
          variant: "destructive"
        });
        return;
      }

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "in",
        format: "letter"
      });

      // Set courier font for screenplay standard
      doc.setFont("Courier");
      doc.setFontSize(12);

      // Add title page
      doc.setFontSize(16);
      doc.setFont("Courier", "bold");
      doc.text(title.toUpperCase(), 4.25, 3, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("Courier", "normal");
      doc.text("Written by", 4.25, 4, { align: "center" });
      doc.text(authorName, 4.25, 4.5, { align: "center" });

      // Add email and phone number to lower left
      if (email || phoneNumber) {
        doc.setFontSize(10);
        doc.setFont("courier", "normal");
        let yPos = 9.5;

        if (email) {
          doc.text(email, 1, yPos);
          yPos += 0.2;
        }

        if (phoneNumber) {
          doc.text(phoneNumber, 1, yPos);
        }
      }

      // Add new page for script content
      doc.addPage();
      
      // Page 1 number
      doc.setFont("Courier", "normal");
      doc.setFontSize(12);
      doc.text("1.", 7.5, 0.5);

      const validElements = elements.filter(el => el && el.content && el.content.trim() !== '');
      let yPosition = 1;
      const bottomMargin = 10; // Letter size (11) minus 1 inch bottom margin
      // True 12pt Courier line height: 12pt = 1/6 inch = 0.1667in
      const lineHeight = 0.1667;
      let sceneCount = 0;
      let pageNumber = 1;

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

        const splitText = doc.splitTextToSize(content, maxWidth);
        
        // Orphan prevention: If it's a heading or character, ensure we have enough room for at least 2 more lines below it
        const extraRoomNeeded = (element.type === 'heading' || element.type === 'character') ? (lineHeight * 3) : 0;
        
        // Check if we need to page break before printing
        if (yPosition + spaceBefore + (splitText.length * lineHeight) + extraRoomNeeded > bottomMargin) {
          doc.addPage();
          pageNumber++;
          yPosition = 1; // Reset to top margin
          spaceBefore = 0; // Don't add space at the top of a new page
          
          // Print page number immediately
          doc.setFont("Courier", "normal");
          doc.setFontSize(12);
          doc.text(`${pageNumber}.`, 7.5, 0.5);
        }

        yPosition += spaceBefore;

        doc.setFontSize(fontSize);

        switch (element.type) {
          case 'heading':
            doc.setFont("Courier", "bold");
            xPosition = 1;
            sceneCount++;
            // Draw scene numbers on both sides
            doc.setFontSize(10);
            doc.text(sceneCount.toString(), 0.7, yPosition);
            doc.text(sceneCount.toString(), 7.8, yPosition);
            doc.setFontSize(fontSize);
            break;
          case 'action':
            doc.setFont("Courier", "normal");
            xPosition = 1;
            break;
          case 'character':
            doc.setFont("Courier", "bold");
            xPosition = 3.7;
            break;
          case 'dialogue':
            doc.setFont("Courier", "normal");
            xPosition = 2.5;
            break;
          case 'parenthetical':
            doc.setFont("Courier", "italic");
            xPosition = 3.2;
            break;
          case 'transition':
            doc.setFont("Courier", "bold");
            xPosition = 6;
            break;
        }

        doc.text(splitText, xPosition, yPosition);
        
        // Advance yPosition by the height of the text printed
        yPosition += splitText.length * lineHeight;
      });

      const safeTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      doc.save(`${safeTitle || 'untitled-script'}.pdf`);

      toast({
        title: "Export Successful",
        description: `Script exported as ${safeTitle}.pdf`,
      });
    } catch (error) {
      console.error("Error exporting as PDF:", error);
      toast({
        title: "Export Failed",
        description: `Could not export script: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // Enhanced Fountain export with proper syntax
  const exportAsFountain = async (title: string, elements: ScriptElementType[], authorName: string = '[Author Name]') => {
    try {
      const validation = validateScriptContent(elements);
      if (!validation.isValid) {
        toast({
          title: "Export Failed",
          description: validation.message,
          variant: "destructive"
        });
        return;
      }

      // Fountain metadata header
      let fountainContent = `Title: ${title}\n`;
      fountainContent += `Credit: Written by\n`;
      fountainContent += `Author: ${authorName}\n`;
      fountainContent += `Draft date: ${new Date().toLocaleDateString()}\n\n`;

      const validElements = elements.filter(el => el && el.content && el.content.trim() !== '');

      validElements.forEach(element => {
        const content = element.content.trim();

        switch (element.type) {
          case 'heading':
            fountainContent += `\n.${content.toUpperCase()}\n\n`;
            break;
          case 'action':
            fountainContent += `${content}\n\n`;
            break;
          case 'character':
            fountainContent += `@${content.toUpperCase()}\n`;
            break;
          case 'parenthetical':
            fountainContent += `(${content})\n`;
            break;
          case 'dialogue':
            fountainContent += `${content}\n\n`;
            break;
          case 'transition':
            fountainContent += `> ${content.toUpperCase()}\n\n`;
            break;
          default:
            fountainContent += `${content}\n`;
        }
      });

      const safeTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const blob = new Blob([fountainContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeTitle || 'untitled-script'}.fountain`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Script exported as ${safeTitle}.fountain`,
      });
    } catch (error) {
      console.error("Error exporting as Fountain:", error);
      toast({
        title: "Export Failed",
        description: `Could not export script: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // Export as FDX
  const exportAsFDX = async (title: string, elements: ScriptElementType[], authorName: string = '[Author Name]') => {
    try {
      const validation = validateScriptContent(elements);
      if (!validation.isValid) {
        toast({
          title: "Export Failed",
          description: validation.message,
          variant: "destructive"
        });
        return;
      }

      const escapeXml = (text: string) => {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      };

      let fdxContent = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      fdxContent += `<FinalDraft DocumentType="Script" Template="No" Version="1">\n`;
      fdxContent += `<Content>\n`;

      // Title as first heading
      fdxContent += `<Paragraph Type="Scene Heading">\n<Text>${escapeXml(title)}</Text>\n</Paragraph>\n`;

      const validElements = elements.filter(el => el && el.content && el.content.trim() !== '');

      validElements.forEach(element => {
        const content = element.content.trim();

        let fdxType = 'Action';
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

        fdxContent += `<Paragraph Type="${fdxType}">\n<Text>${escapeXml(content)}</Text>\n</Paragraph>\n`;
      });

      fdxContent += `</Content>\n</FinalDraft>`;

      const safeTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const blob = new Blob([fdxContent], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeTitle || 'untitled-script'}.fdx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Script exported as ${safeTitle}.fdx`,
      });
    } catch (error) {
      console.error("Error exporting as FDX:", error);
      toast({
        title: "Export Failed",
        description: `Could not export script: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // Import from Fountain (enhanced)
  const importFromFountain = (fountainText: string): { title: string, elements: Partial<ScriptElementType>[] } => {
    let title = "Untitled Screenplay";
    const elements: Partial<ScriptElementType>[] = [];

    // Extract title from Fountain metadata
    const titleMatch = fountainText.match(/Title:\s*(.+)/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }

    // Split content into lines and process
    const lines = fountainText.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and metadata
      if (!line || line.match(/^[A-Za-z]+:/)) continue;

      // Scene heading
      if (line.startsWith('.') || line.match(/^(INT|EXT|INT\/EXT|I\/E)/i)) {
        const headingContent = line.startsWith('.') ? line.substring(1).trim() : line;
        elements.push({
          type: 'heading',
          content: headingContent
        });
      }
      // Character
      else if (line.startsWith('@') || (line === line.toUpperCase() && line.length > 1 && !line.startsWith('>'))) {
        const characterContent = line.startsWith('@') ? line.substring(1).trim() : line;
        elements.push({
          type: 'character',
          content: characterContent
        });

        // Look for dialogue following character
        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j].trim();
          if (!nextLine) break;

          if (nextLine.match(/^\(.+\)$/)) {
            // Parenthetical
            elements.push({
              type: 'parenthetical',
              content: nextLine.replace(/^\(|\)$/g, '')
            });
          } else if (!nextLine.startsWith('@') && !nextLine.startsWith('.') && !nextLine.startsWith('>')) {
            // Dialogue
            elements.push({
              type: 'dialogue',
              content: nextLine
            });
          } else {
            break;
          }
          j++;
        }
        i = j - 1;
      }
      // Transition
      else if (line.startsWith('>')) {
        elements.push({
          type: 'transition',
          content: line.substring(1).trim()
        });
      }
      // Action (everything else)
      else if (line) {
        elements.push({
          type: 'action',
          content: line
        });
      }
    }

    return { title, elements };
  };

  return {
    exportAsTXT,
    exportAsPDF,
    exportAsFountain,
    exportAsFDX,
    importFromFountain,
    validateScriptContent
  };
};
