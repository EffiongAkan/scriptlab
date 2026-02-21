import { EnhancedScriptAnalytics } from '@/hooks/useEnhancedScriptAnalytics';

export const exportScriptAnalysis = (
    analysis: EnhancedScriptAnalytics,
    scriptTitle: string = 'Script'
) => {
    const timestamp = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let markdown = `# Script Analysis Report\n\n`;
    markdown += `**Script:** ${scriptTitle}\n`;
    markdown += `**Generated:** ${timestamp}\n\n`;
    markdown += `---\n\n`;

    // Overall Assessment
    if (analysis.premiumAnalysis?.overview) {
        const overview = analysis.premiumAnalysis.overview;
        markdown += `## Overall Assessment\n\n`;
        markdown += `**Overall Score:** ${overview.overallScore}/100\n\n`;
        markdown += `### Executive Summary\n${overview.executiveSummary}\n\n`;
        if (overview.marketViability) {
            markdown += `### Market Viability\n${overview.marketViability}\n\n`;
        }
        if (overview.targetAudience) {
            markdown += `### Target Audience\n${overview.targetAudience}\n\n`;
        }
        if (overview.commercialPotential) {
            markdown += `### Commercial Potential\n${overview.commercialPotential}\n\n`;
        }
        markdown += `---\n\n`;
    }

    // Plot Analysis
    if (analysis.premiumAnalysis?.plotAnalysis) {
        const plot = analysis.premiumAnalysis.plotAnalysis;
        markdown += `## Plot Analysis\n\n`;

        if (plot.structureAssessment || plot.structureBreakdown) {
            markdown += `### Structure Assessment\n${plot.structureAssessment || plot.structureBreakdown}\n\n`;
        }

        if (plot.threeActAnalysis) {
            markdown += `### Act Breakdown\n${plot.threeActAnalysis}\n\n`;
        }

        if (plot.keyMoments) {
            markdown += `### Key Plot Moments\n`;
            if (plot.keyMoments.incitingIncident) {
                markdown += `**Inciting Incident:** ${plot.keyMoments.incitingIncident}\n\n`;
            }
            if (plot.keyMoments.midpoint) {
                markdown += `**Midpoint:** ${plot.keyMoments.midpoint}\n\n`;
            }
            if (plot.keyMoments.climax) {
                markdown += `**Climax:** ${plot.keyMoments.climax}\n\n`;
            }
        }

        if (plot.plotHoles && plot.plotHoles.length > 0) {
            markdown += `### Plot Holes\n`;
            plot.plotHoles.forEach((hole: any, index: number) => {
                markdown += `${index + 1}. **[${hole.severity?.toUpperCase()}]** ${hole.description}\n`;
                if (hole.solution) {
                    markdown += `   - *Solution:* ${hole.solution}\n`;
                }
                markdown += `\n`;
            });
        }

        if (plot.narrativeFlow) {
            markdown += `### Narrative Flow\n${plot.narrativeFlow}\n\n`;
        }

        if (plot.tensionAnalysis) {
            markdown += `### Tension Analysis\n${plot.tensionAnalysis}\n\n`;
        }

        if (plot.subplotIntegration || (plot.subplots && plot.subplots.length > 0)) {
            markdown += `### Subplots\n`;
            if (plot.subplots && plot.subplots.length > 0) {
                plot.subplots.forEach((subplot: any, index: number) => {
                    markdown += `${index + 1}. ${subplot.description}`;
                    if (subplot.integration) {
                        markdown += ` (Integration: ${subplot.integration}/10)`;
                    }
                    if (subplot.suggestions) {
                        markdown += `\n   - *Suggestions:* ${subplot.suggestions}`;
                    }
                    markdown += `\n\n`;
                });
            } else {
                markdown += `${plot.subplotIntegration}\n\n`;
            }
        }

        markdown += `---\n\n`;
    }

    // Character Analysis
    if (analysis.premiumAnalysis?.characterAnalysis) {
        const char = analysis.premiumAnalysis.characterAnalysis;
        markdown += `## Character Analysis\n\n`;

        if (char.arcAnalysis) {
            markdown += `### Character Arcs\n${char.arcAnalysis}\n\n`;
        }

        if (char.characterBreakdown && char.characterBreakdown.length > 0) {
            markdown += `### Character Breakdown\n`;
            char.characterBreakdown.forEach((character: any) => {
                markdown += `#### ${character.name}\n`;
                if (character.role) markdown += `**Role:** ${character.role}\n`;
                if (character.arc) markdown += `**Arc:** ${character.arc}\n`;
                if (character.strengths) markdown += `**Strengths:** ${character.strengths}\n`;
                if (character.weaknesses) markdown += `**Weaknesses:** ${character.weaknesses}\n`;
                markdown += `\n`;
            });
        }

        if (char.dialogueQuality) {
            markdown += `### Dialogue Quality\n`;
            if (char.dialogueQuality.analysis) {
                markdown += `${char.dialogueQuality.analysis}\n\n`;
            }
            if (char.dialogueQuality.strengths && char.dialogueQuality.strengths.length > 0) {
                markdown += `**Strengths:**\n`;
                char.dialogueQuality.strengths.forEach((s: string) => {
                    markdown += `- ${s}\n`;
                });
                markdown += `\n`;
            }
            if (char.dialogueQuality.improvements && char.dialogueQuality.improvements.length > 0) {
                markdown += `**Areas for Improvement:**\n`;
                char.dialogueQuality.improvements.forEach((i: string) => {
                    markdown += `- ${i}\n`;
                });
                markdown += `\n`;
            }
        }

        markdown += `---\n\n`;
    }

    // Pacing Analysis
    if (analysis.premiumAnalysis?.pacingAnalysis) {
        const pacing = analysis.premiumAnalysis.pacingAnalysis;
        markdown += `## Pacing Analysis\n\n`;

        if (pacing.overallRhythm) {
            markdown += `### Overall Rhythm\n${pacing.overallRhythm}\n\n`;
        }

        if (pacing.tensionCurve) {
            markdown += `### Tension Curve\n${pacing.tensionCurve}\n\n`;
        }

        if (pacing.slowPoints && pacing.slowPoints.length > 0) {
            markdown += `### Slow Points\n`;
            pacing.slowPoints.forEach((point: string) => {
                markdown += `- ${point}\n`;
            });
            markdown += `\n`;
        }

        if (pacing.highlights && pacing.highlights.length > 0) {
            markdown += `### Highlights\n`;
            pacing.highlights.forEach((highlight: string) => {
                markdown += `- ${highlight}\n`;
            });
            markdown += `\n`;
        }

        markdown += `---\n\n`;
    }

    // Theme Analysis
    if (analysis.premiumAnalysis?.themeAnalysis) {
        const theme = analysis.premiumAnalysis.themeAnalysis;
        markdown += `## Theme Analysis\n\n`;

        if (theme.primaryThemes && theme.primaryThemes.length > 0) {
            markdown += `### Primary Themes\n`;
            theme.primaryThemes.forEach((t: any) => {
                if (typeof t === 'string') {
                    markdown += `- ${t}\n`;
                } else if (t.theme) {
                    markdown += `- **${t.theme}**`;
                    if (t.execution) markdown += `: ${t.execution}`;
                    markdown += `\n`;
                }
            });
            markdown += `\n`;
        }

        if (theme.themeExecution) {
            markdown += `### Theme Execution\n${theme.themeExecution}\n\n`;
        }

        if (theme.subtextAnalysis) {
            markdown += `### Subtext Analysis\n${theme.subtextAnalysis}\n\n`;
        }

        markdown += `---\n\n`;
    }

    // Cultural Analysis
    if (analysis.premiumAnalysis?.culturalAnalysis) {
        const cultural = analysis.premiumAnalysis.culturalAnalysis;
        markdown += `## Cultural Analysis\n\n`;

        if (cultural.authenticityAssessment) {
            markdown += `### Authenticity Assessment\n${cultural.authenticityAssessment}\n\n`;
        }

        if (cultural.culturalElements && cultural.culturalElements.length > 0) {
            markdown += `### Cultural Elements\n`;
            cultural.culturalElements.forEach((element: any) => {
                if (typeof element === 'string') {
                    markdown += `- ${element}\n`;
                } else if (element.element) {
                    markdown += `- **${element.element}**`;
                    if (element.assessment) markdown += `: ${element.assessment}`;
                    markdown += `\n`;
                }
            });
            markdown += `\n`;
        }

        markdown += `---\n\n`;
    }

    // Professional Readiness
    if (analysis.premiumAnalysis?.technicalAssessment) {
        const tech = analysis.premiumAnalysis.technicalAssessment;
        markdown += `## Professional Readiness\n\n`;

        if (tech.formatting) {
            markdown += `### Formatting\n${tech.formatting}\n\n`;
        }

        if (tech.writingQuality) {
            markdown += `### Writing Quality\n${tech.writingQuality}\n\n`;
        }

        if (tech.professionalReadiness) {
            markdown += `### Professional Readiness\n${tech.professionalReadiness}\n\n`;
        }

        markdown += `---\n\n`;
    }

    // Recommendations
    if (analysis.premiumAnalysis?.actionableRecommendations &&
        analysis.premiumAnalysis.actionableRecommendations.length > 0) {
        markdown += `## Actionable Recommendations\n\n`;

        const priorityOrder = ['critical', 'high', 'medium', 'low'];
        const grouped: Record<string, any[]> = {};

        analysis.premiumAnalysis.actionableRecommendations.forEach((rec: any) => {
            const priority = rec.priority || 'medium';
            if (!grouped[priority]) grouped[priority] = [];
            grouped[priority].push(rec);
        });

        priorityOrder.forEach(priority => {
            if (grouped[priority] && grouped[priority].length > 0) {
                markdown += `### ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority\n\n`;
                grouped[priority].forEach((rec: any, index: number) => {
                    markdown += `${index + 1}. **${rec.title}**\n`;
                    if (rec.description) {
                        markdown += `   ${rec.description}\n`;
                    }
                    if (rec.specificSteps && rec.specificSteps.length > 0) {
                        markdown += `   \n   **Steps:**\n`;
                        rec.specificSteps.forEach((step: string) => {
                            markdown += `   - ${step}\n`;
                        });
                    }
                    markdown += `\n`;
                });
            }
        });
    }

    // Create and download file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${scriptTitle.replace(/[^a-z0-9]/gi, '_')}_Analysis_${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
