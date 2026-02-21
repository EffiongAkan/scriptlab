import jsPDF from 'jspdf';
import { EnhancedScriptAnalytics } from '@/hooks/useEnhancedScriptAnalytics';

export const exportScriptAnalysisToPDF = (
    analysis: EnhancedScriptAnalytics,
    scriptTitle: string = 'Script'
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    const timestamp = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Helper function to add text with automatic page breaks
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color: [number, number, number] = [0, 0, 0]) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setTextColor(color[0], color[1], color[2]);

        const lines = doc.splitTextToSize(text, maxWidth);

        lines.forEach((line: string) => {
            if (yPosition > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }
            doc.text(line, margin, yPosition);
            yPosition += fontSize * 0.5;
        });

        yPosition += 3; // Add spacing after text block
    };

    const addHeading = (text: string, level: number = 1) => {
        yPosition += 5;
        const fontSize = level === 1 ? 16 : level === 2 ? 14 : 12;
        addText(text, fontSize, true, [0, 102, 204]); // Blue color for headings
        yPosition += 2;
    };

    const addSeparator = () => {
        yPosition += 3;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;
    };

    // Title Page
    addHeading('Script Analysis Report', 1);
    addText(`Script: ${scriptTitle}`, 12, true);
    addText(`Generated: ${timestamp}`, 10);
    addSeparator();

    // Overall Assessment
    if (analysis.premiumAnalysis?.overview) {
        const overview = analysis.premiumAnalysis.overview;
        addHeading('Overall Assessment', 1);
        addText(`Overall Score: ${overview.overallScore}/100`, 11, true);
        yPosition += 2;

        if (overview.executiveSummary) {
            addText('Executive Summary', 11, true);
            addText(overview.executiveSummary);
        }

        if (overview.marketViability) {
            addText('Market Viability', 11, true);
            addText(overview.marketViability);
        }

        if (overview.targetAudience) {
            addText('Target Audience', 11, true);
            addText(overview.targetAudience);
        }

        addSeparator();
    }

    // Plot Analysis
    if (analysis.premiumAnalysis?.plotAnalysis) {
        const plot = analysis.premiumAnalysis.plotAnalysis;
        addHeading('Plot Analysis', 1);

        if (plot.structureAssessment || plot.structureBreakdown) {
            addText('Structure Assessment', 11, true);
            addText(plot.structureAssessment || plot.structureBreakdown);
        }

        if (plot.threeActAnalysis) {
            addText('Act Breakdown', 11, true);
            addText(plot.threeActAnalysis);
        }

        if (plot.plotHoles && plot.plotHoles.length > 0) {
            addText('Plot Holes', 11, true);
            plot.plotHoles.forEach((hole: any, index: number) => {
                addText(`${index + 1}. [${hole.severity?.toUpperCase()}] ${hole.description}`, 10);
                if (hole.solution) {
                    addText(`   Solution: ${hole.solution}`, 9);
                }
            });
        }

        if (plot.narrativeFlow) {
            addText('Narrative Flow', 11, true);
            addText(plot.narrativeFlow);
        }

        addSeparator();
    }

    // Character Analysis
    if (analysis.premiumAnalysis?.characterAnalysis) {
        const char = analysis.premiumAnalysis.characterAnalysis;
        addHeading('Character Analysis', 1);

        if (char.arcAnalysis) {
            addText('Character Arcs', 11, true);
            addText(char.arcAnalysis);
        }

        if (char.characterBreakdown && char.characterBreakdown.length > 0) {
            addText('Character Breakdown', 11, true);
            char.characterBreakdown.forEach((character: any) => {
                addText(character.name, 10, true);
                if (character.role) addText(`Role: ${character.role}`, 9);
                if (character.arc) addText(`Arc: ${character.arc}`, 9);
                if (character.strengths) addText(`Strengths: ${character.strengths}`, 9);
                if (character.weaknesses) addText(`Weaknesses: ${character.weaknesses}`, 9);
                yPosition += 2;
            });
        }

        addSeparator();
    }

    // Pacing Analysis
    if (analysis.premiumAnalysis?.pacingAnalysis) {
        const pacing = analysis.premiumAnalysis.pacingAnalysis;
        addHeading('Pacing Analysis', 1);

        if (pacing.overallRhythm) {
            addText('Overall Rhythm', 11, true);
            addText(pacing.overallRhythm);
        }

        if (pacing.tensionCurve) {
            addText('Tension Curve', 11, true);
            addText(pacing.tensionCurve);
        }

        addSeparator();
    }

    // Theme Analysis
    if (analysis.premiumAnalysis?.themeAnalysis) {
        const theme = analysis.premiumAnalysis.themeAnalysis;
        addHeading('Theme Analysis', 1);

        if (theme.primaryThemes && theme.primaryThemes.length > 0) {
            addText('Primary Themes', 11, true);
            theme.primaryThemes.forEach((t: any) => {
                if (typeof t === 'string') {
                    addText(`• ${t}`, 10);
                } else if (t.theme) {
                    addText(`• ${t.theme}${t.execution ? ': ' + t.execution : ''}`, 10);
                }
            });
        }

        if (theme.themeExecution) {
            addText('Theme Execution', 11, true);
            addText(theme.themeExecution);
        }

        addSeparator();
    }

    // Recommendations
    if (analysis.premiumAnalysis?.actionableRecommendations &&
        analysis.premiumAnalysis.actionableRecommendations.length > 0) {
        addHeading('Actionable Recommendations', 1);

        const priorityOrder = ['critical', 'high', 'medium', 'low'];
        const grouped: Record<string, any[]> = {};

        analysis.premiumAnalysis.actionableRecommendations.forEach((rec: any) => {
            const priority = rec.priority || 'medium';
            if (!grouped[priority]) grouped[priority] = [];
            grouped[priority].push(rec);
        });

        priorityOrder.forEach(priority => {
            if (grouped[priority] && grouped[priority].length > 0) {
                addText(`${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`, 11, true);
                grouped[priority].forEach((rec: any, index: number) => {
                    addText(`${index + 1}. ${rec.title}`, 10, true);
                    if (rec.description) {
                        addText(rec.description, 9);
                    }
                    if (rec.specificSteps && rec.specificSteps.length > 0) {
                        addText('Steps:', 9, true);
                        rec.specificSteps.forEach((step: string) => {
                            addText(`  • ${step}`, 9);
                        });
                    }
                    yPosition += 2;
                });
            }
        });
    }

    // Save PDF
    doc.save(`${scriptTitle.replace(/[^a-z0-9]/gi, '_')}_Analysis_${Date.now()}.pdf`);
};
