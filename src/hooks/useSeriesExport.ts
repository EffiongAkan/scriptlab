import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EpisodeScript {
  id: string;
  title: string;
}

export const useSeriesExport = () => {
  const { toast } = useToast();

  const fetchElements = async (scriptId: string) => {
    const { data, error } = await supabase
      .from("script_elements")
      .select("*")
      .eq("script_id", scriptId)
      .order("position", { ascending: true });
    if (error) throw error;
    return data ?? [];
  };

  const renderEpisodeToPDF = (
    doc: jsPDF,
    title: string,
    elements: any[]
  ) => {
    const lineHeight = 0.1667;
    const leftMargin = 1.5;
    const bottomMargin = 10;
    let y = 1.5;
    let pageNumber = 1;
    let sceneCount = 0;

    doc.setFont("Courier", "bold");
    doc.setFontSize(14);
    doc.text(title.toUpperCase(), 4.25, 1, { align: "center" });
    doc.setFont("Courier", "normal");
    doc.setFontSize(12);
    doc.text(`${pageNumber}.`, 7.5, 0.5);

    const validElements = elements.filter(
      (el) => el && el.content && el.content.trim() !== ""
    );

    validElements.forEach((element) => {
      const content = element.content.trim();
      let x = leftMargin;
      let text = content;
      let extraTopSpace = 0;
      let extraBottomSpace = lineHeight;
      let dialogueMaxWidth = 6.0;
      let isHeading = false;

      switch (element.type) {
        case "heading":
          sceneCount++;
          isHeading = true;
          extraTopSpace = lineHeight * 2;
          text = content.toUpperCase();
          doc.setFont("Courier", "bold");
          break;
        case "action":
          doc.setFont("Courier", "normal");
          break;
        case "character":
          x = 3.7;
          extraTopSpace = lineHeight * 2;
          text = content.toUpperCase();
          dialogueMaxWidth = 3.0;
          doc.setFont("Courier", "bold");
          break;
        case "dialogue":
          x = 2.5;
          dialogueMaxWidth = 3.5;
          doc.setFont("Courier", "normal");
          break;
        case "parenthetical":
          x = 3.1;
          text = `(${content})`;
          dialogueMaxWidth = 2.5;
          doc.setFont("Courier", "italic");
          break;
        case "transition":
          x = 5.5;
          extraTopSpace = lineHeight;
          text = content.toUpperCase();
          dialogueMaxWidth = 2.0;
          doc.setFont("Courier", "normal");
          break;
        default:
          doc.setFont("Courier", "normal");
      }

      y += extraTopSpace;

      // Draw scene numbers on left and right margins for scene headings
      if (isHeading) {
        doc.setFontSize(10);
        doc.setFont("Courier", "bold");
        doc.text(sceneCount.toString(), 0.7, y);
        doc.text(sceneCount.toString(), 7.8, y);
        doc.setFontSize(12);
      }

      const lines = doc.splitTextToSize(text, dialogueMaxWidth);

      lines.forEach((line: string) => {
        if (y > bottomMargin) {
          doc.addPage();
          pageNumber++;
          doc.setFont("Courier", "normal");
          doc.setFontSize(12);
          doc.text(`${pageNumber}.`, 7.5, 0.5);
          y = 1;
        }
        doc.text(line, x, y);
        y += lineHeight;
      });

      y += extraBottomSpace;
      doc.setFont("Courier", "normal");
    });

    return doc;
  };

  const exportAllAsPDF = async (
    seriesName: string,
    episodes: EpisodeScript[]
  ) => {
    if (episodes.length === 0) {
      toast({ title: "Nothing to export", description: "No episodes found.", variant: "destructive" });
      return;
    }

    toast({ title: "Preparing export…", description: `Fetching ${episodes.length} episodes. Please wait.` });

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "in", format: "letter" });

      // Cover page
      doc.setFont("Courier", "bold");
      doc.setFontSize(18);
      doc.text(seriesName.toUpperCase(), 4.25, 3.5, { align: "center" });
      doc.setFontSize(12);
      doc.setFont("Courier", "normal");
      doc.text("Complete Series Script", 4.25, 4.1, { align: "center" });
      doc.text(`${episodes.length} Episode${episodes.length !== 1 ? "s" : ""}`, 4.25, 4.4, { align: "center" });

      for (const episode of episodes) {
        const elements = await fetchElements(episode.id);
        if (elements.length === 0) continue;
        doc.addPage();
        renderEpisodeToPDF(doc, episode.title, elements);
      }

      const filename = `${seriesName.replace(/[^a-z0-9]/gi, "_")}_Complete_Series.pdf`;
      doc.save(filename);
      toast({ title: "Export Complete ✅", description: `Saved as "${filename}"` });
    } catch (err: any) {
      console.error("Series export failed:", err);
      toast({ title: "Export Failed", description: err?.message || "Could not export series.", variant: "destructive" });
    }
  };

  const exportIndividualPDFs = async (
    seriesName: string,
    episodes: EpisodeScript[]
  ) => {
    if (episodes.length === 0) {
      toast({ title: "Nothing to export", description: "No episodes found.", variant: "destructive" });
      return;
    }

    toast({ title: "Preparing export…", description: `Generating ${episodes.length} individual PDFs. Please wait.` });

    let exported = 0;
    for (const episode of episodes) {
      try {
        const elements = await fetchElements(episode.id);
        if (elements.length === 0) continue;

        const doc = new jsPDF({ orientation: "portrait", unit: "in", format: "letter" });
        renderEpisodeToPDF(doc, episode.title, elements);

        const filename = `${episode.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
        doc.save(filename);
        exported++;
        await new Promise((r) => setTimeout(r, 700));
      } catch (err) {
        console.error(`Failed to export episode: ${episode.title}`, err);
      }
    }

    toast({ title: "Export Complete ✅", description: `${exported} of ${episodes.length} episodes exported.` });
  };

  return { exportAllAsPDF, exportIndividualPDFs };
};
