import { jsPDF } from 'jspdf';
import { ScriptElementType } from '@/hooks/useScriptContent';

export interface BreakdownData {
  title: string;
  scenes: { number: number; heading: string; characters: string[] }[];
  locations: { name: string; count: number; type: 'INT' | 'EXT' | 'OTHER' }[];
  characters: { name: string; dialogues: number; sceneCount: number }[];
  props: string[];
}

export const exportToCSV = (data: BreakdownData) => {
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Title
  csvContent += `Breakdown for ${data.title}\n\n`;

  // Scenes
  csvContent += "SCENE BREAKDOWN\n";
  csvContent += "Scene #,Heading,Characters\n";
  data.scenes.forEach(s => {
    const chars = s.characters.join("; ");
    csvContent += `${s.number},"${s.heading}","${chars}"\n`;
  });
  csvContent += "\n";

  // Locations
  csvContent += "LOCATIONS\n";
  csvContent += "Location,Type,Appearances\n";
  data.locations.forEach(l => {
    csvContent += `"${l.name}",${l.type},${l.count}\n`;
  });
  csvContent += "\n";

  // Characters
  csvContent += "CAST LIST\n";
  csvContent += "Character,Scenes,Dialogue Blocks\n";
  data.characters.forEach(c => {
    csvContent += `"${c.name}",${c.sceneCount},${c.dialogues}\n`;
  });
  csvContent += "\n";

  // Props
  csvContent += "POTENTIAL PROPS/ELEMENTS\n";
  data.props.forEach(p => {
    csvContent += `"${p}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${data.title}_Breakdown.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (data: BreakdownData) => {
  const doc = new jsPDF();
  const margin = 20;
  let y = 20;

  const checkPage = (height: number) => {
    if (y + height > 280) {
      doc.addPage();
      y = 20;
    }
  };

  // Header
  doc.setFontSize(22);
  doc.text("Production Breakdown", margin, y);
  y += 10;
  doc.setFontSize(14);
  doc.text(`Script: ${data.title}`, margin, y);
  y += 15;

  // Stats
  doc.setFontSize(12);
  doc.text(`Total Scenes: ${data.scenes.length}`, margin, y);
  doc.text(`Total Characters: ${data.characters.length}`, margin + 80, y);
  y += 15;

  // Scene List
  doc.setFontSize(16);
  doc.text("Scene List", margin, y);
  y += 10;
  doc.setFontSize(10);
  data.scenes.forEach(s => {
    checkPage(10);
    doc.text(`${s.number}. ${s.heading}`, margin, y);
    y += 5;
    const chars = s.characters.length > 0 ? `Characters: ${s.characters.join(", ")}` : "No characters";
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(chars, margin + 5, y);
    doc.setTextColor(0);
    doc.setFontSize(10);
    y += 7;
  });

  y += 10;
  checkPage(20);

  // Locations
  doc.setFontSize(16);
  doc.text("Locations", margin, y);
  y += 10;
  doc.setFontSize(10);
  data.locations.forEach(l => {
    checkPage(5);
    doc.text(`${l.name} (${l.type}) - ${l.count} scenes`, margin, y);
    y += 5;
  });

  y += 10;
  checkPage(20);

  // Cast
  doc.setFontSize(16);
  doc.text("Cast", margin, y);
  y += 10;
  doc.setFontSize(10);
  data.characters.forEach(c => {
    checkPage(5);
    doc.text(`${c.name} - ${c.sceneCount} scenes, ${c.dialogues} dialogue blocks`, margin, y);
    y += 5;
  });

  doc.save(`${data.title}_Breakdown.pdf`);
};
