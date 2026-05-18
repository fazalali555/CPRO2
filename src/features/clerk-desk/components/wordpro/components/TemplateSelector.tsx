import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { FileText } from "lucide-react";
import { toast } from "sonner";

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: "business" | "personal" | "academic" | "creative";
  thumbnail?: string;
}

const BUILT_IN_TEMPLATES: DocumentTemplate[] = [
  {
    id: "blank",
    name: "Blank Document",
    description: "Start with a blank page",
    content: "",
    category: "personal",
  },
  {
    id: "letter",
    name: "Business Letter",
    description: "Professional business letter template",
    content: `[Your Address]
[Date]

[Recipient Address]

Dear [Recipient Name],

[Body of letter]

Sincerely,
[Your Name]`,
    category: "business",
  },
  {
    id: "resume",
    name: "Resume",
    description: "Professional resume template",
    content: `[YOUR NAME]
[Email] | [Phone] | [LinkedIn]

PROFESSIONAL SUMMARY
[Brief summary of your professional background]

EXPERIENCE
[Job Title] - [Company Name] | [Date Range]
• [Key achievement or responsibility]
• [Key achievement or responsibility]

EDUCATION
[Degree] in [Field] - [University Name] | [Year]

SKILLS
• [Skill 1]
• [Skill 2]
• [Skill 3]`,
    category: "business",
  },
  {
    id: "essay",
    name: "Essay",
    description: "Academic essay template",
    content: `Title: [Essay Title]

Introduction
[Hook and thesis statement]

Body Paragraph 1
[Topic sentence]
[Supporting evidence]
[Analysis]

Body Paragraph 2
[Topic sentence]
[Supporting evidence]
[Analysis]

Conclusion
[Restatement of thesis]
[Final thoughts]`,
    category: "academic",
  },
  {
    id: "report",
    name: "Report",
    description: "Professional report template",
    content: `REPORT TITLE

Executive Summary
[Brief overview of the report]

Table of Contents
1. Introduction
2. Methodology
3. Findings
4. Recommendations
5. Conclusion

Introduction
[Background and context]

Methodology
[How the report was conducted]

Findings
[Key findings and data]

Recommendations
[Suggested actions]

Conclusion
[Summary of key points]`,
    category: "business",
  },
  {
    id: "proposal",
    name: "Proposal",
    description: "Business proposal template",
    content: `PROPOSAL

Project Title: [Title]
Prepared for: [Client Name]
Date: [Date]

Executive Summary
[Brief overview of the proposal]

Problem Statement
[Description of the problem]

Proposed Solution
[Detailed solution]

Timeline
[Project schedule]

Budget
[Cost breakdown]

Conclusion
[Call to action]`,
    category: "business",
  },
];

interface TemplateSelectorProps {
  onSelectTemplate?: (template: DocumentTemplate) => void;
}

/**
 * Template selector dialog component
 */
export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "business" | "personal" | "academic" | "creative">("all");

  const filteredTemplates =
    selectedCategory === "all"
      ? BUILT_IN_TEMPLATES
      : BUILT_IN_TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleSelectTemplate = (template: DocumentTemplate) => {
    onSelectTemplate?.(template);
    setOpen(false);
    toast.success(`Created document from "${template.name}" template`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Document Templates</DialogTitle>
          <DialogDescription>
            Choose a template to start your document
          </DialogDescription>
        </DialogHeader>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {["all", "business", "personal", "academic", "creative"].map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat as any)}
              className="capitalize"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              className="p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            >
              <h3 className="font-semibold text-sm">{template.name}</h3>
              <p className="text-xs text-gray-600 mt-1">{template.description}</p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Get built-in templates
 */
export function getBuiltInTemplates(): DocumentTemplate[] {
  return BUILT_IN_TEMPLATES;
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): DocumentTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}
