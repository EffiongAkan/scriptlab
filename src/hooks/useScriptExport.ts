
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
      doc.setFont("courier");
      doc.setFontSize(12);

      // Add title page
      doc.setFontSize(16);
      doc.setFont("courier", "bold");
      doc.text(title.toUpperCase(), 4.25, 3, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("courier", "normal");
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

      const validElements = elements.filter(el => el && el.content && el.content.trim() !== '');
      let yPosition = 1;
      const pageHeight = 10.5; // Letter size minus margins
      const lineHeight = 0.2;

      validElements.forEach(element => {
        if (yPosition > pageHeight) {
          doc.addPage();
          yPosition = 1;
        }

        const content = element.content.trim();
        let xPosition = 1;
        let fontSize = 12;

        doc.setFontSize(fontSize);

        switch (element.type) {
          case 'heading':
            doc.setFont("courier", "bold");
            xPosition = 1;
            yPosition += 0.3;
            break;
          case 'action':
            doc.setFont("courier", "normal");
            xPosition = 1;
            break;
          case 'character':
            doc.setFont("courier", "bold");
            xPosition = 3.7;
            yPosition += 0.2;
            break;
          case 'dialogue':
            doc.setFont("courier", "normal");
            xPosition = 2.5;
            break;
          case 'parenthetical':
            doc.setFont("courier", "italic");
            xPosition = 3.2;
            break;
          case 'transition':
            doc.setFont("courier", "bold");
            xPosition = 6;
            yPosition += 0.2;
            break;
        }

        // Define specific widths for element types to ensure proper right margins
        let maxWidth = 6.5; // Default width (Action)

        switch (element.type) {
          case 'dialogue':
            maxWidth = 3.5; // Tighter dialogue width standard
            break;
          case 'parenthetical':
            maxWidth = 2.5;
            break;
          case 'character':
            maxWidth = 4.0;
            break;
          case 'transition':
            maxWidth = 2.0;
            break;
          case 'action':
          case 'heading':
          default:
            maxWidth = 6.5;
            break;
        }

        const splitText = doc.splitTextToSize(content, maxWidth);
        doc.text(splitText, xPosition, yPosition);
        yPosition += splitText.length * lineHeight + 0.1;
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
    importFromFountain,
    validateScriptContent
  };
};
