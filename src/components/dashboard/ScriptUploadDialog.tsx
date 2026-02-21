import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuid } from "uuid";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface ScriptUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface ParsedLine {
    text: string;
    x: number;
    y: number;
}

export const ScriptUploadDialog: React.FC<ScriptUploadDialogProps> = ({ open, onOpenChange }) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [scriptTitle, setScriptTitle] = useState("");
    const [parsingError, setParsingError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            // Auto-set title from filename if empty
            if (!scriptTitle) {
                setScriptTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
            }
            setParsingError(null);
        }
    };

    const parseFDX = async (text: string): Promise<any[]> => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const paragraphs = xmlDoc.getElementsByTagName("Paragraph");
        const elements: any[] = [];

        // Map FDX types to our types
        const typeMap: Record<string, string> = {
            "Scene Heading": "heading",
            "Action": "action",
            "Character": "character",
            "Dialogue": "dialogue",
            "Parenthetical": "parenthetical",
            "Transition": "transition",
            "Shot": "heading",
            "General": "action"
        };

        Array.from(paragraphs).forEach((p, index) => {
            const type = p.getAttribute("Type") || "Action";
            const mappedType = typeMap[type] || "action";

            // Extract text content (handling nested Text nodes)
            let content = "";
            const textNodes = p.getElementsByTagName("Text");
            if (textNodes.length > 0) {
                Array.from(textNodes).forEach(t => {
                    content += t.textContent || "";
                });
            } else {
                content = p.textContent || "";
            }

            if (content.trim()) {
                elements.push({
                    id: uuid(),
                    type: mappedType,
                    content: content.trim(),
                    position: index
                });
            }
        });

        return elements;
    };

    const parseText = (text: string): any[] => {
        // Simple parser for plain text - treats lines as action unless they look like scene headings
        const lines = text.split('\n');
        return lines.map((line, index) => {
            const content = line.trim();
            if (!content) return null;

            let type = "action";
            if (content.toUpperCase() === content && (content.includes("INT.") || content.includes("EXT."))) {
                type = "heading";
            } else if (content.toUpperCase() === content && content.length < 30 && !content.endsWith(".")) {
                // Guessing character names (all caps, short, no period)
                type = "character";
            }

            return {
                id: uuid(),
                type,
                content,
                position: index
            };
        }).filter(Boolean);
    };

    const parsePDF = async (file: File): Promise<any[]> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let allLines: ParsedLine[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Extract items with coordinates and dimensions
            const items = textContent.items.map((item: any) => ({
                str: item.str,
                x: item.transform[4], // Translate X
                y: item.transform[5], // Translate Y
                width: item.width,
                hasEOL: item.hasEOL
            }));

            // Sort by Y (descending - top to bottom) then X (ascending - left to right)
            items.sort((a, b) => {
                if (Math.abs(a.y - b.y) > 5) { // Tolerance for same line
                    return b.y - a.y; // Higher Y is higher on page
                }
                return a.x - b.x;
            });

            // Group into lines
            let currentLine: ParsedLine | null = null;
            let lastItemEndX = 0;

            items.forEach((item) => {
                // If item is just whitespace, ignore it (we handle spacing manually)
                // But keep non-breaking spaces if any? Usually pdfjs gives ' ' for space.
                // If we skip ' ', we rely effectively on coordinate math.
                if (item.str.trim().length === 0 && item.str.length > 0) {
                    // It is a space.
                    // If we encounter an explicit space item, we should probably respect it 
                    // OR just rely on the gap logic. 
                    // Let's rely on gap logic for consistency, but if the gap logic is aggressive, 
                    // explicit spaces might be safer.
                    // However, the issue is MISSING spaces where there ARE no space items.
                    // So we must handle the gap logic.
                    return;
                }
                if (item.str.length === 0) return;

                if (!currentLine || Math.abs(item.y - currentLine.y) > 5) {
                    // Start new line
                    if (currentLine) allLines.push(currentLine);
                    currentLine = {
                        text: item.str,
                        x: item.x,
                        y: item.y
                    };
                    lastItemEndX = item.x + item.width;
                } else {
                    // Append to current line

                    // Calculate gap from end of last item to start of this item
                    const gap = item.x - lastItemEndX;

                    // Threshold: If gap is significant (e.g. > 2pt), add a space
                    // A typical space is ~3-4pt. 
                    // Some PDFs might have tight kerning, but 0 or negative gap means sticking together.
                    // 1.5 - 2.0 is a conservative safe threshold.
                    if (gap > 2) {
                        currentLine.text += " ";
                    }

                    currentLine.text += item.str;
                    lastItemEndX = item.x + item.width;
                }
            });
            if (currentLine) allLines.push(currentLine);
        }

        return parseStructuredLines(allLines);
    };

    const parseStructuredLines = (lines: ParsedLine[]): any[] => {
        return lines.map((line, index) => {
            const content = line.text.trim();
            if (!content) return null;

            let type = "action";
            const x = line.x;

            // Heuristics based on standard PDF points (72 dpi)
            // Left margin usually ~72 (1 inch) to ~108 (1.5 inch)
            // Dialogue ~200+
            // Character ~250+
            // Transition ~400+

            // Note: These are rough estimates and might need tuning based on the specific PDF generator

            if (x < 150) {
                // Left aligned: Scene Heading or Action
                if (content.toUpperCase() === content && (content.includes("INT.") || content.includes("EXT.") || content.includes("I/E"))) {
                    type = "heading";
                } else if (content.toUpperCase() === content && content.endsWith(":")) {
                    // Sometimes transitions are left aligned? Rare but possible. 
                    // Or maybe a slugline without INT/EXT
                    type = "action";
                } else {
                    type = "action";
                }
            } else if (x >= 150 && x < 250) {
                // Indented: Dialogue or Parenthetical
                // Lowered upper bound from 280 to 250 to catch characters wider than thought
                if (content.startsWith("(") && content.endsWith(")")) {
                    type = "parenthetical";
                } else {
                    type = "dialogue";
                }
            } else if (x >= 250 && x < 400) {
                // Further indented: Character
                // Lowered threshold from 280 to 250.
                if (content.toUpperCase() === content) {
                    type = "character";
                } else {
                    // It could still be Character IF it is mixed case but looks like a name (rare in script)
                    // But usually Dialogue if mixed case.
                    type = "dialogue";
                }
            } else if (x >= 400) {
                // Far right: Transition
                if (content.toUpperCase() === content && content.endsWith("TO:")) {
                    type = "transition";
                } else {
                    // Could be a character name if it's very long or centered weirdly?
                    // But generally transitions.
                    type = "transition";
                }
            }

            // Enhanced Heuristics Override
            // If it is ALL CAPS and indented at all (x > 150), and short, favor Character over Dialogue
            if (x > 180 && x < 400 && content.toUpperCase() === content && content.length < 40 && !content.includes("(") && !content.includes(")")) {
                // Likely a character name, even if margins are slightly off
                type = "character";
            }

            // Fallback/Correction logic
            // If previous was Character, this is likely Dialogue or Parenthetical
            // But we process line by line here. 

            return {
                id: uuid(),
                type,
                content,
                position: index
            };
        }).filter(Boolean);
    };

    const parseDOCX = async (file: File): Promise<any[]> => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return parseText(result.value);
    };

    const handleUpload = async () => {
        if (!file || !scriptTitle) return;

        setIsUploading(true);
        setParsingError(null);

        try {
            let elements: any[] = [];

            if (file.name.endsWith('.fdx')) {
                const text = await file.text();
                elements = await parseFDX(text);
            } else if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                const text = await file.text();
                elements = parseText(text);
            } else if (file.name.endsWith('.pdf')) {
                elements = await parsePDF(file);
            } else if (file.name.endsWith('.docx')) {
                elements = await parseDOCX(file);
            } else {
                throw new Error("File format not supported. Please use .txt, .fdx, .pdf, or .docx");
            }

            if (elements.length === 0) {
                throw new Error("No content could be extracted from the file.");
            }

            // Create Script
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const newScriptId = uuid();
            const { error: scriptError } = await supabase.from('scripts').insert({
                id: newScriptId,
                title: scriptTitle,
                user_id: user.id,
                genre: 'Drama' // Default
            });

            if (scriptError) throw scriptError;

            // Insert Elements
            const elementsToInsert = elements.map(el => ({
                ...el,
                script_id: newScriptId
            }));

            // Insert in batches to avoid payload limits
            const batchSize = 100;
            for (let i = 0; i < elementsToInsert.length; i += batchSize) {
                const batch = elementsToInsert.slice(i, i + batchSize);
                const { error: elemError } = await supabase.from('script_elements').insert(batch);
                if (elemError) throw elemError;
            }

            toast({
                title: "Script Uploaded",
                description: "Your script has been successfully imported.",
            });

            onOpenChange(false);
            navigate(`/editor/${newScriptId}`);

        } catch (error) {
            console.error("Upload error:", error);
            setParsingError(error instanceof Error ? error.message : "Failed to upload script");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Upload Script</DialogTitle>
                    <DialogDescription>
                        Import an existing script (.txt, .fdx, .pdf, .docx) to edit and analyze.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${file ? 'border-naija-green bg-naija-green/5' : 'border-gray-300 hover:border-naija-green'
                            }`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".txt,.fdx,.md,.pdf,.docx"
                            onChange={handleFileChange}
                        />

                        {file ? (
                            <div className="flex flex-col items-center">
                                <FileText className="h-10 w-10 text-naija-green mb-2" />
                                <p className="font-medium text-gray-900">{file.name}</p>
                                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                <Button variant="ghost" size="sm" className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => {
                                    e.stopPropagation();
                                    setFile(null);
                                    setScriptTitle("");
                                }}>
                                    Remove
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                                <p className="font-medium text-gray-900">Click to upload or drag and drop</p>
                                <p className="text-sm text-gray-500">Supports .txt, .fdx, .pdf, .docx</p>
                            </div>
                        )}
                    </div>

                    {file && (
                        <div className="space-y-2">
                            <Label htmlFor="script-title">Script Title</Label>
                            <Input
                                id="script-title"
                                value={scriptTitle}
                                onChange={(e) => setScriptTitle(e.target.value)}
                                placeholder="Enter script title"
                            />
                        </div>
                    )}

                    {parsingError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Upload Failed</AlertTitle>
                            <AlertDescription>{parsingError}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!file || !scriptTitle || isUploading}
                            className="bg-naija-green hover:bg-naija-green-dark text-white"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import Script
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
