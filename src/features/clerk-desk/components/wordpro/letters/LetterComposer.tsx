// components/letters/LetterComposer.tsx

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CharacterCount } from "@tiptap/extension-character-count";
import FontSize from "tiptap-extension-font-size";
import LineHeight from "tiptap-extension-line-height";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, BorderStyle, ImageRun, UnderlineType } from 'docx';
import { getDepartmentLogoPath } from '../../../../../utils';
import { Maximize, Minimize, MoreHorizontal, X, ChevronRight, ChevronLeft, Layout as LayoutIcon, History, FileText, Settings, Minimize2, Sparkles } from 'lucide-react';
import { Drawer } from 'vaul';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'; // Assuming dialog is available
import { Card, Button, Badge, TextField, SelectField, TextArea } from '@/components/M3';
import { DocumentEditor as WordEditor } from '../components/DocumentEditor';
import { EditorProvider, useEditorInstance, useEditorSettings } from '@/contexts/EditorContext';
import { Ribbon } from '../components/Ribbon';
import { StatusBar } from '../components/StatusBar';
import { cn } from "@/lib/utils";
import { CopilotSidebar } from '../components/CopilotSidebar';
import { OfficialLogo } from '@/components/OfficialLogo';
import { QRCode } from '@/components/QRCode';
import { useLetterComposer } from '../../../hooks/useLetterComposer';
import { useClerkDeskShortcuts } from '../../../hooks/useKeyboardShortcuts';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { AIService } from '../../../services/AIService';
import { ExportService } from '../../../services/ExportService';
import { useToast } from '@/contexts/ToastContext';
import { useConfirmDialog } from '../../common/ConfirmDialog';
// MetadataHeader removed — letter details are now in a Dialog popup
import { FindReplace } from '../components/FindReplace';
import { PRIORITY_OPTIONS, STORAGE_KEYS } from '../../../constants';
import { formatDate, formatStatus, formatPriority } from '../../../utils/formatters';
import { validateLetter } from '../../../utils/validators';
import { getDepartmentInfo } from '@/utils/departmentDetector';
import { parseOfficialLetter, ParsedLetter } from '../../../utils/smartLetterParser';
import { getSmartSalutation } from '../../../utils/salutation';
import { useEmployeeContext } from '@/contexts/EmployeeContext';
import { EmployeeRecord, OfficeProfile } from '@/types';

/**
 * Helper for date formatting in official KPK letters
 */
const formatLetterDate = (dateStr?: string): string => {
  if (!dateStr) return "__ / __ / ____";
  // Handle ISO format YYYY-MM-DD
  const iso = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return `${iso[3]} / ${iso[2]} / ${iso[1]}`;
  }
  // Handle DD/MM/YYYY
  const dmy = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    return `${dmy[1].padStart(2, "0")} / ${dmy[2].padStart(2, "0")} / ${dmy[3]}`;
  }
  return dateStr;
};

// Bridge to sync wordpro editor state with letter form state
const EditorStateBridge: React.FC<{ value: string }> = ({ value }) => {
  const editor = useEditorInstance();

  // Sync from formState to editor ONLY when content changes externally
  useEffect(() => {
    if (!editor) return;
    const currentHTML = editor.getHTML();
    if (value !== currentHTML) {
      // If the editor is not focused, it's likely an external change (AI or loading)
      // Or if the editor is empty, we should load the initial value
      if (!editor.isFocused || currentHTML === '<p></p>') {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  return null;
};

// Bridge to sync global settings like viewMode and showNavPane back to parent
const SettingsBridge: React.FC<{
  sidebarOpen: boolean;
  viewMode: string;
  onNavPaneToggle: (show: boolean) => void;
  onViewModeChange: (mode: 'print' | 'fluid' | 'split') => void;
}> = ({ sidebarOpen, viewMode, onNavPaneToggle, onViewModeChange }) => {
  const { settings } = useEditorSettings();
  
  useEffect(() => {
    const show = !!settings.showNavPane;
    if (show !== sidebarOpen) {
      onNavPaneToggle(show);
    }
  }, [settings.showNavPane, sidebarOpen, onNavPaneToggle]);

  useEffect(() => {
    const mode = settings.viewMode || 'print';
    const mappedViewMode = viewMode === 'split' ? 'split' : (viewMode === 'fluid' ? 'fluid' : 'print');
    if (mode !== mappedViewMode) {
      onViewModeChange(mode);
    }
  }, [settings.viewMode, viewMode, onViewModeChange]);

  return null;
};

const InteractiveListManager: React.FC<{
  label: string;
  value: string;
  onChange: (newValue: string) => void;
  placeholder: string;
  addButtonLabel: string;
  iconName: string;
}> = ({ label, value, onChange, placeholder, addButtonLabel, iconName }) => {
  const [newItem, setNewItem] = useState('');
  
  const items = useMemo(() => {
    return (value || '').split('\n').map(x => x.trim()).filter(Boolean);
  }, [value]);

  const handleAdd = () => {
    if (!newItem.trim()) return;
    const updated = [...items, newItem.trim()].join('\n');
    onChange(updated);
    setNewItem('');
  };

  const handleDelete = (index: number) => {
    const updated = items.filter((_, i) => i !== index).join('\n');
    onChange(updated);
  };

  return (
    <div className="space-y-2 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</label>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full">{items.length} Items</span>
      </div>
      
      {items.length > 0 && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100/80 text-xs shadow-sm">
              <span className="font-semibold text-slate-400 w-4">{i + 1}.</span>
              <span className="flex-1 font-medium text-slate-700 break-words">{item}</span>
              <button 
                type="button" 
                onClick={() => handleDelete(i)} 
                className="text-red-500 hover:text-red-700 w-6 h-6 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">{iconName}</span>
          <input
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all"
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            placeholder={placeholder}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
        </div>
        <Button
          variant="tonal"
          size="sm"
          icon="add"
          label={addButtonLabel}
          onClick={handleAdd}
          className="rounded-xl h-[34px] text-xs shrink-0"
        />
      </div>
    </div>
  );
};

export const LetterComposer: React.FC = () => {
  const { showToast } = useToast();
  const { employees } = useEmployeeContext();
  const { confirm, Dialog: ConfirmDialogComponent } = useConfirmDialog();
  
  const {
    formState,
    letters,
    templates,
    officeProfiles,
    departmentRules,
    resolvedValues,
    formattedLetter,
    setField,
    setMultipleFields,
    applyTemplate,
    applyOfficeProfile,
    applyDepartmentRules,
    loadLetter,
    resetForm,
    saveLetter,
    deleteLetter,
    duplicateLetter,
    saveOfficeProfile,
    setViewMode,
  } = useLetterComposer();

  const { viewMode } = formState;

  // Set default viewMode to 'form' (Editor)
  useEffect(() => {
    if (!formState.viewMode || formState.viewMode === 'split') {
       setViewMode('form');
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontSize,
      LineHeight.configure({
        types: ['paragraph', 'heading'],
        defaultLineHeight: '1.5',
      }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Image.configure({
        allowBase64: true,
        inline: true,
      }),
      Table.configure({
        resizable: true,
        handleWidth: 5,
        cellMinWidth: 25,
        lastColumnResizable: true,
        allowTableNodeSelection: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
      Placeholder.configure({
        placeholder: 'Start typing your official letter...',
      }),
      Typography,
    ],
    content: formState.body || "<p></p>",
// ... existing code ...
    editorProps: {
      handlePaste: (view, event, slice) => {
        const text = event.clipboardData?.getData('text/plain');
        if (text && text.length > 50) {
          const parsed = parseOfficialLetter(text);
          if (parsed.confidence >= 35) {
            const updates: any = {};
            
            if (parsed.signatoryTitle) {
              updates.institutionName = parsed.signatoryTitle;
            }
            if (parsed.officeName) {
              updates.letterheadLines = parsed.officeName;
            }

            if (parsed.recipients.length > 1) {
              updates.to = parsed.recipients.join('\n');
            } else if (parsed.recipient) {
              updates.to = parsed.recipient;
            }

            if (parsed.subject) updates.subject = parsed.subject;
            if (parsed.refNo) updates.reference = parsed.refNo;
            if (parsed.date) updates.letterDate = parsed.date;
            if (parsed.copyTo && parsed.copyTo.length > 0) updates.forwardedTo = parsed.copyTo.join('\n');
            if (parsed.enclosures && parsed.enclosures.length > 0) updates.enclosures = parsed.enclosures.join('\n');
            if (parsed.signatoryTitle) updates.signatureTitle = parsed.signatoryTitle;
            if (parsed.signatoryArea) updates.signatureName = parsed.signatoryArea;
            if (parsed.subjectPerson) setSearchTerm(parsed.subjectPerson.name);

            setMultipleFields(updates);
            
            // Set the cleaned body
            setTimeout(() => {
              if (editor && parsed.bodyHtml) {
                editor.commands.setContent(parsed.bodyHtml);
              }
            }, 150);

            showToast('Smart letter detected — filling fields automatically', 'success');
            setSmartPasteData(parsed);
            setSmartPasteDetected(true);
            return true; // We handled the paste
          } else if (parsed.confidence > 0) {
            showToast('Could not fully parse — please fill fields manually', 'info');
            // Insert basic cleaned text but don't auto-fill form
            setTimeout(() => {
              if (editor && parsed.bodyHtml) {
                editor.commands.setContent(parsed.bodyHtml);
              }
            }, 150);
            return true;
          }
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      setField("body", editor.getHTML());
    },
// ... existing code ...
  });

  const handleExportDOCX = async () => {
    try {
      showToast("Preparing dynamic DOCX with exact formatting...", "info");
      
      // Fetch Department Logo
      let logoData: ArrayBuffer | null = null;
      try {
        const logoPath = getDepartmentLogoPath(resolvedValues.departmentType || 'education');
        const response = await fetch(logoPath);
        if (response.ok) {
          logoData = await response.arrayBuffer();
        }
      } catch (e) {
        console.error("Failed to load logo for DOCX", e);
      }

      const activeLogoData = logoData;
      const docxChildren: any[] = [];

      // 1. Build Letterhead table (Side-by-side: Logo, Centered text, Contact/QR)
      const letterheadCells: any[] = [];

      // Cell 1: Logo
      if (activeLogoData) {
        letterheadCells.push(new DocxTableCell({
          children: [
            new Paragraph({
              children: [
                new ImageRun({
                  data: new Uint8Array(activeLogoData),
                  transformation: { width: 55, height: 55 }
                } as unknown as import('docx').IImageOptions)
              ],
              alignment: AlignmentType.LEFT
            })
          ],
          width: { size: 15, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
          }
        }));
      } else {
        letterheadCells.push(new DocxTableCell({
          children: [new Paragraph("")],
          width: { size: 15, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
          }
        }));
      }

      // Cell 2: Centered titles
      letterheadCells.push(new DocxTableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: (resolvedValues.lhLine1 || officeProfile.office_title || 'OFFICE').toUpperCase(),
                bold: true,
                size: 26, // 13pt
                font: 'Times New Roman'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 }
          }),
          ...(resolvedValues.lhLine2 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: resolvedValues.lhLine2,
                  bold: true,
                  size: 20, // 10pt
                  font: 'Times New Roman'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 40 }
            })
          ] : []),
          new Paragraph({
            children: [
              new TextRun({
                text: "Govt. of Khyber Pakhtunkhwa.",
                bold: true,
                size: 18, // 9pt
                font: 'Times New Roman'
              })
            ],
            alignment: AlignmentType.CENTER
          })
        ],
        width: { size: 70, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE }
        }
      }));

      // Cell 3: Tel Contact info
      letterheadCells.push(new DocxTableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `Tel: ${officeProfile.tel || 'N/A'}`,
                bold: true,
                size: 18,
                font: 'Times New Roman'
              })
            ],
            alignment: AlignmentType.RIGHT
          })
        ],
        width: { size: 15, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE }
        }
      }));

      docxChildren.push(new DocxTable({
        rows: [
          new DocxTableRow({
            children: letterheadCells
          })
        ],
        width: { size: 100, type: WidthType.PERCENTAGE }
      }));

      // Double Line Divider below letterhead
      docxChildren.push(new Paragraph({
        text: "",
        spacing: { after: 240 },
        border: {
          bottom: {
            color: "000000",
            space: 4,
            style: BorderStyle.DOUBLE,
            size: 18 // Thick double border
          }
        }
      }));

      // 2. Reference No & Date Line (Using 2-column borderless table)
      docxChildren.push(new DocxTable({
        rows: [
          new DocxTableRow({
            children: [
              new DocxTableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "No. ", bold: true, font: 'Times New Roman', size: 22 }),
                      new TextRun({ text: formState.reference || '___________', bold: true, font: 'Times New Roman', size: 22 })
                    ]
                  })
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE }
                }
              }),
              new DocxTableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Dated: ", bold: true, font: 'Times New Roman', size: 22 }),
                      new TextRun({ text: formatLetterDate(formState.letterDate) || '____/____/______', bold: true, font: 'Times New Roman', size: 22 })
                    ],
                    alignment: AlignmentType.RIGHT
                  })
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE }
                }
              })
            ]
          })
        ],
        width: { size: 100, type: WidthType.PERCENTAGE }
      }));

      docxChildren.push(new Paragraph({ text: "", spacing: { after: 200 } }));

      // 3. To Recipient
      docxChildren.push(new Paragraph({
        children: [
          new TextRun({ text: "To,", bold: true, font: 'Times New Roman', size: 23 })
        ],
        spacing: { after: 80 }
      }));

      const recipientLines = (formState.to || '').split('\n').filter(l => l.trim());
      recipientLines.forEach((line, i) => {
        docxChildren.push(new Paragraph({
          children: [
            new TextRun({ 
              text: line.trim(), 
              bold: true,
              font: 'Times New Roman',
              size: 23 
            })
          ],
          indent: { left: 720 }, // Indent by 0.5 inch (720 twips)
          spacing: { after: 60 }
        }));
      });

      docxChildren.push(new Paragraph({ text: "", spacing: { after: 120 } }));

      // 4. Subject Line
      docxChildren.push(new Paragraph({
        children: [
          new TextRun({ text: "Subject:  ", bold: true, font: 'Times New Roman', size: 23 }),
          new TextRun({ 
            text: (formState.subject || '').toUpperCase(), 
            bold: true, 
            font: 'Times New Roman',
            size: 23,
            underline: { type: UnderlineType.SINGLE } 
          })
        ],
        spacing: { after: 240 }
      }));

      // 5. Salutation
      const sal = resolvedValues.salutation || 'Respected Sir:';
      docxChildren.push(new Paragraph({
        children: [
          new TextRun({ text: sal, bold: true, font: 'Times New Roman', size: 23 })
        ],
        spacing: { after: 200 }
      }));

      // 6. Parse TipTap Editor JSON content to get exact format (bold, italic, list, tables)
      const editorJson = editor?.getJSON() || { type: 'doc', content: [] };
      const editorNodes = editorJson.content || [];

      // Helper to extract text runs from a TipTap paragraph node
      const parseTextRuns = (contentArray: any[]) => {
        if (!contentArray) return [];
        return contentArray.map((node: any) => {
          if (node.type === 'text') {
            const marks = node.marks || [];
            const isBold = marks.some((m: any) => m.type === 'bold');
            const isItalic = marks.some((m: any) => m.type === 'italic');
            const isUnderline = marks.some((m: any) => m.type === 'underline');
            
            return new TextRun({
              text: node.text,
              bold: isBold,
              italics: isItalic,
              underline: isUnderline ? { type: UnderlineType.SINGLE } : undefined,
              font: 'Times New Roman',
              size: 23 // 11.5pt
            });
          }
          return null;
        }).filter(Boolean) as any[];
      };

      editorNodes.forEach((node: any) => {
        if (node.type === 'paragraph') {
          docxChildren.push(new Paragraph({
            children: parseTextRuns(node.content),
            indent: { firstLine: 720 }, // Indent first line (secretariat style)
            spacing: { after: 140, line: 360 }
          }));
        } else if (node.type === 'heading') {
          const headingLevel = Math.min(6, Math.max(1, node.attrs?.level || 1));
          docxChildren.push(new Paragraph({
            children: parseTextRuns(node.content),
            heading: `Heading${headingLevel}` as "Heading1" | "Heading2" | "Heading3" | "Heading4" | "Heading5" | "Heading6",
            spacing: { before: 200, after: 120 }
          }));
        } else if (node.type === 'bulletList') {
          const listItems = (node.content || []) as any[];
          listItems.forEach((li: any) => {
            const para = (li.content?.[0] || { type: 'paragraph', content: [] }) as any;
            docxChildren.push(new Paragraph({
              children: parseTextRuns(para.content),
              bullet: { level: 0 },
              spacing: { after: 80 }
            }));
          });
        } else if (node.type === 'orderedList') {
          const listItems = (node.content || []) as any[];
          listItems.forEach((li: any, index: number) => {
            const para = (li.content?.[0] || { type: 'paragraph', content: [] }) as any;
            const runs = parseTextRuns(para.content);
            docxChildren.push(new Paragraph({
              children: [
                new TextRun({ text: `${index + 1}.  `, bold: true, font: 'Times New Roman', size: 23 }),
                ...runs
              ],
              spacing: { after: 80 }
            }));
          });
        } else if (node.type === 'table') {
          const docxRows: DocxTableRow[] = [];
          const rows = (node.content || []) as any[];
          
          rows.forEach((row: any) => {
            const cells = (row.content || []) as any[];
            const docxCells: DocxTableCell[] = [];
            
            cells.forEach((cell: any) => {
              const cellParas = (cell.content || []) as any[];
              const docxCellParas = cellParas.map((cp: any) => {
                return new Paragraph({
                  children: parseTextRuns(cp.content),
                  spacing: { after: 60 }
                });
              });
              
              docxCells.push(new DocxTableCell({
                children: docxCellParas.length > 0 ? docxCellParas : [new Paragraph("")],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: "aaaaaa" },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: "aaaaaa" },
                  left: { style: BorderStyle.SINGLE, size: 4, color: "aaaaaa" },
                  right: { style: BorderStyle.SINGLE, size: 4, color: "aaaaaa" }
                },
                width: { size: Math.floor(100 / cells.length), type: WidthType.PERCENTAGE }
              }));
            });
            
            docxRows.push(new DocxTableRow({
              children: docxCells
            }));
          });
          
          docxChildren.push(new Paragraph({ text: "", spacing: { before: 200 } }));
          docxChildren.push(new DocxTable({
            rows: docxRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
          }));
          docxChildren.push(new Paragraph({ text: "", spacing: { after: 200 } }));
        }
      });

      // 7. Enclosures (Conditional)
      if (formState.enclosures) {
        docxChildren.push(new Paragraph({ text: "", spacing: { after: 240 } }));
        
        docxChildren.push(new Paragraph({
          children: [
            new TextRun({ text: "Enclosures:", bold: true, font: 'Times New Roman', size: 21, underline: {} })
          ],
          spacing: { after: 80 }
        }));
        
        const enclosureLines = formState.enclosures.split('\n').filter(l => l.trim());
        enclosureLines.forEach(line => {
          docxChildren.push(new Paragraph({
            children: [
              new TextRun({ text: line.trim(), font: 'Times New Roman', size: 21 })
            ],
            indent: { left: 360 },
            spacing: { after: 60 }
          }));
        });
      }

      // 8. Signatory Signature Block (Right Aligned)
      docxChildren.push(new Paragraph({ text: "", spacing: { after: 400 } }));
      
      docxChildren.push(new DocxTable({
        rows: [
          new DocxTableRow({
            children: [
              new DocxTableCell({
                children: [new Paragraph("")],
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE }
                }
              }),
              new DocxTableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Yours faithfully,", font: 'Times New Roman', size: 22 })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 720 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: (formState.signatureName || '').toUpperCase(), bold: true, font: 'Times New Roman', size: 22 })
                    ],
                    alignment: AlignmentType.CENTER,
                    border: {
                      top: { color: "000000", space: 4, style: BorderStyle.SINGLE, size: 4 }
                    },
                    spacing: { before: 60 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: (resolvedValues.signatureTitle || '').toUpperCase(), bold: true, font: 'Times New Roman', size: 18 })
                    ],
                    alignment: AlignmentType.CENTER
                  })
                ],
                width: { size: 50, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE }
                }
              })
            ]
          })
        ],
        width: { size: 100, type: WidthType.PERCENTAGE }
      }));

      // 9. Endorsement / Copy Forwarded To (Conditional)
      if (formState.forwardedTo) {
        docxChildren.push(new Paragraph({ text: "", spacing: { after: 360 } }));
        
        docxChildren.push(new Paragraph({
          children: [
            new TextRun({ text: "Copy Forwarded To:", bold: true, font: 'Times New Roman', size: 20 })
          ],
          spacing: { after: 120 }
        }));
        
        const forwardedLines = formState.forwardedTo.split('\n').filter(l => l.trim());
        forwardedLines.forEach(line => {
          docxChildren.push(new Paragraph({
            children: [
              new TextRun({ text: line.trim(), font: 'Times New Roman', size: 20 })
            ],
            indent: { left: 360 },
            spacing: { after: 60 }
          }));
        });
      }

      // 10. Assemble and set Millimetric Section Margins
      const docPaperSize = paperSize || 'A4';
      const docMarginTop = marginTop || 12;
      const docMarginBottom = marginBottom || 12;
      const docMarginLeft = marginLeft || 15;
      const docMarginRight = marginRight || 20;

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: Math.round(docMarginTop * 56.69),
                bottom: Math.round(docMarginBottom * 56.69),
                left: Math.round(docMarginLeft * 56.69),
                right: Math.round(docMarginRight * 56.69),
              },
              size: {
                width: docPaperSize === 'Legal' ? 12240 : (docPaperSize === 'Letter' ? 12240 : 11906), // twips
                height: docPaperSize === 'Legal' ? 20160 : (docPaperSize === 'Letter' ? 15840 : 16838),
              }
            }
          },
          children: docxChildren,
        }],
      });

      const blob = await Packer.toBlob(doc);
      ExportService.downloadBlob(blob, `${formState.subject || 'Letter'}.docx`);
      showToast("DOCX exported successfully", "success");
    } catch (e) {
      console.error(e);
      showToast("DOCX export failed", "error");
    }
  };

  const handleExportPDF = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let y = height - 50;
      page.drawText((formState.institutionName || officeProfile.office_title || 'Office').toUpperCase(), { 
        x: 50, y, font: fontBold, size: 14 
      });
      
      y -= 40;
      page.drawText("To", { x: 50, y, font: fontBold, size: 12 });
      
      const recipientLines = (formState.to || '').split('\n').filter(l => l.trim());
      recipientLines.forEach((line, i) => {
        y -= 20;
        page.drawText(line.trim(), { 
          x: 100, y, font: i === 1 ? fontBold : font, size: 11 
        });
      });
      
      y -= 30;
      page.drawText("Subject: ", { x: 50, y, font: fontBold, size: 12 });
      const subjectWidth = fontBold.widthOfTextAtSize("Subject: ", 12);
      page.drawText(formState.subject, { 
        x: 50 + subjectWidth, y, font: fontBold, size: 12 
      });
      // Draw underline
      const textWidth = fontBold.widthOfTextAtSize(formState.subject, 12);
      page.drawLine({
        start: { x: 50 + subjectWidth, y: y - 2 },
        end: { x: 50 + subjectWidth + textWidth, y: y - 2 },
        thickness: 1,
      });
      
      y -= 40;
      const cleanBody = (editor?.getText() || formState.body.replace(/<[^>]*>?/gm, '')).substring(0, 1000);
      page.drawText(cleanBody, { x: 50, y, font, size: 11, maxWidth: width - 100 });
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      ExportService.downloadBlob(blob, `${formState.subject || 'Letter'}.pdf`);
      showToast("PDF exported successfully", "success");
    } catch (e) {
      showToast("PDF export failed", "error");
    }
  };

  const loadTemplate = (name: string) => {
    const header = `<p style="text-align: center;"><strong><span style="font-size: 16px;">GOVERNMENT OF KHYBER PAKHTUNKHWA</span><br>ELEMENTARY & SECONDARY EDUCATION DEPARTMENT<br>GOVERNMENT GIRLS HIGH SCHOOL ZAREEN ABAD, NOGRAM, ALLAI</strong></p><hr>`;
    const templates: Record<string, string> = {
      'Relieving Order': header + `<p><strong>Subject: RELIEVING ORDER</strong></p><p>Consequent upon his/her transfer...</p>`,
      'Charge Handover': header + `<p><strong>Subject: CHARGE HANDOVER</strong></p><p>I hereby hand over the charge of...</p>`,
      'Show Cause Notice': header + `<p><strong>Subject: SHOW CAUSE NOTICE</strong></p><p>You are hereby directed to explain...</p>`,
      'Office Order': header + `<p><strong>Subject: OFFICE ORDER</strong></p><p>It is notified for information that...</p>`,
      'Urdu Notification': header + `<p dir="rtl" style="text-align: right; font-family: 'Jameel Noori Nastaleeq', Arial;"><strong>حکومت خیبر پختونخوا<br>محکمہ ابتدائی و ثانوی تعلیم<br>نوٹیفکیشن</strong></p><p dir="rtl" style="text-align: right;">تمام متعلقین کو مطلع کیا جاتا ہے کہ...</p>`,
    };
    
    setField("body", templates[name] || "");
    if (editor) {
      editor.commands.setContent(templates[name] || "");
    }
    showToast(`${name} template loaded`, "success");
  };


  // Local state
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');
  const [marginTop, setMarginTop] = useState(12); // mm
  const [marginBottom, setMarginBottom] = useState(12); // mm
  const [marginLeft, setMarginLeft] = useState(15); // mm
  const [marginRight, setMarginRight] = useState(20); // mm
  const [watermark, setWatermark] = useState(''); // e.g. "DRAFT"

  const [focusMode, setFocusMode] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useLocalStorage(STORAGE_KEYS.COMPOSER_MAXIMIZED, false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1280 : true);
  const [viewportHeight, setViewportHeight] = useState(typeof window !== 'undefined' ? window.visualViewport?.height || window.innerHeight : 800);
  const [mobileToolbarExpanded, setMobileToolbarExpanded] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRefining, setAiRefining] = useState(false);
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiStatus, setAiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [letterSearch, setLetterSearch] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [selectedLetters, setSelectedLetters] = useState<Set<string>>(new Set());
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mobileSidebarType, setMobileSidebarType] = useState<'details' | 'history' | 'copilot' | null>(null);
  // Removed duplicate state declarations at the bottom of the component

  const [a4Scale, setA4Scale] = useState(1);

  // Fullscreen Logic
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        if (isMobile) {
          window.scrollTo(0, 1);
        }
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error("Fullscreen failed", err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, [isMobile]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Responsive and Viewport Handling
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setViewportHeight(window.visualViewport?.height || window.innerHeight);
    };

    const handleViewportChange = () => {
      setViewportHeight(window.visualViewport?.height || window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleViewportChange);
    window.visualViewport?.addEventListener('scroll', handleViewportChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // Body Scroll Lock
  useEffect(() => {
    if (isMaximized || isFullscreen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isMaximized, isFullscreen]);

  useEffect(() => {
    if (isMobile) {
      const padding = 16;
      const availableWidth = window.innerWidth - padding;
      const a4Width = 794;
      setA4Scale(Math.min(1, availableWidth / a4Width));
    } else {
      setA4Scale(1);
    }
  }, [isMobile]);

  // Load office profile from localStorage (same source as Letterhead.tsx)
  const [officeProfile, setOfficeProfile] = useState<Partial<OfficeProfile>>({
    office_title: 'OFFICE OF THE SUB DIVISIONAL EDUCATION OFFICER (M) ALLAI',
    district_line: 'Department of Elementary & Secondary Education, Battagram',
    govt_line: 'Govt. of Khyber Pakhtunkhwa.',
    tel: '0343-2900419',
  });

  // Determine if this is a higher office for official opening statements
  const isHigherOffice = useMemo(() => {
    const info = getDepartmentInfo(formState.institutionName || 'Office');
    const org = info.organizationType;
    return org === 'directorate' || org === 'education_office' || org === 'police_office' || org === 'finance_office';
  }, [formState.institutionName]);

  const openingStatement = useMemo(() => {
    if (isHigherOffice) {
      return "I am directed to refer to the subject noted above and to state that";
    } else {
      return "I have the honor to refer to the subject cited above and to state that";
    }
  }, [isHigherOffice]);
  // Auto-detect institution details 
  useEffect(() => { 
    if (formState.institutionName) { 
       const info = getDepartmentInfo(formState.institutionName); 
       setMultipleFields({ 
         letterheadLines: info.letterhead.line1, 
         fromOffice: info.letterhead.line2, 
         signatureTitle: info.signatureTitle 
       }); 
    } 
  }, [formState.institutionName, setMultipleFields]);

  useEffect(() => {
    const saved = localStorage.getItem('clerk_pro_clerk_office_profiles');
    if (saved) {
      try { 
        const profiles = JSON.parse(saved);
        if (Array.isArray(profiles) && profiles.length > 0) {
          setOfficeProfile(profiles[0]);
        }
      } catch { /* ignored: stored value may be absent or corrupt; fall back to the default below */ }
    }
  }, []);

  // Check AI status on mount
  React.useEffect(() => {
    AIService.checkHealth().then(setAiStatus);
  }, []);

  // Smart paste detection state
  const [smartPasteDetected, setSmartPasteDetected] = useState(false);
  const [smartPasteData, setSmartPasteData] = useState<any>(null);

  // Apply smart paste extracted data
  const applySmartPaste = useCallback(() => {
    if (!smartPasteData) return;

    const updates: any = {};
    if (smartPasteData.officeName) updates.institutionName = smartPasteData.officeName;
    if (smartPasteData.recipient) updates.to = smartPasteData.recipient;
    if (smartPasteData.subject) updates.subject = smartPasteData.subject;
    if (smartPasteData.refNo) updates.reference = smartPasteData.refNo;
    if (smartPasteData.date) updates.letterDate = smartPasteData.date;
    if (smartPasteData.copyTo) {
      updates.forwardedTo = Array.isArray(smartPasteData.copyTo)
        ? smartPasteData.copyTo.join('\n')
        : smartPasteData.copyTo;
    }
    if (smartPasteData.enclosures) {
      updates.enclosures = Array.isArray(smartPasteData.enclosures)
        ? smartPasteData.enclosures.join('\n')
        : smartPasteData.enclosures;
    }
    if (smartPasteData.signatoryArea) updates.signatureName = smartPasteData.signatoryArea;
    if (smartPasteData.signatoryTitle) updates.signatureTitle = smartPasteData.signatoryTitle;

    updates.body = smartPasteData.bodyHtml || '';

    setMultipleFields(updates);

    // Set the cleaned body
    setTimeout(() => {
       editor?.commands.setContent(updates.body);
    }, 50);

    setSmartPasteDetected(false);
    setSmartPasteData(null);
    showToast('Letter fields extracted successfully', 'success');
  }, [smartPasteData, setMultipleFields, showToast, editor]);
  const handleAIExtract = useCallback(async () => {
    // 1. Get raw text from the current body
    const tmp = document.createElement('div');
    tmp.innerHTML = formState.body;
    const text = tmp.innerText || tmp.textContent || '';
    
    if (text.length < 30) {
      showToast('Please paste or type the full letter content into the editor first.', 'error');
      return;
    }

    setAiExtracting(true);
    try {
      const parsed = await AIService.extractLetterData(text);
      if (parsed.error) {
        showToast(parsed.error, 'error');
        return;
      }

      setSmartPasteData(parsed);
      setSmartPasteDetected(true);
      showToast('AI analysis complete. Click "Fill Now" to update fields.', 'success');
    } catch (error) {
      showToast('AI extraction failed', 'error');
    } finally {
      setAiExtracting(false);
    }
  }, [formState.body, showToast]);

  // Keyboard shortcuts
  useClerkDeskShortcuts({
    onSaveDraft: () => handleSave('draft'),
    onFinalize: () => handleSave('final'),
    onNewLetter: resetForm,
    onPrint: handlePrint,
  });

  // Handlers
  const handleSave = useCallback(async (status: 'draft' | 'final') => {
    const validation = validateLetter({
      to: formState.to,
      subject: formState.subject,
      body: formState.body,
      letterDate: formState.letterDate,
      toEmail: formState.toEmail,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      showToast('Please fix the validation errors', 'error');
      return;
    }

    setValidationErrors({});
    const saved = saveLetter(status);
    
    if (saved) {
      showToast(
        status === 'draft' ? 'Draft saved successfully' : 'Letter finalized',
        'success'
      );
    } else {
      showToast('Failed to save letter', 'error');
    }
  }, [formState, saveLetter, showToast]);

  const handleDelete = useCallback(async (letterId: string) => {
    const confirmed = await confirm({
      title: 'Delete Letter',
      message: 'Are you sure you want to delete this letter? This action cannot be undone.',
      variant: 'danger',
    });

    if (confirmed) {
      deleteLetter(letterId);
      showToast('Letter deleted', 'success');
    }
  }, [confirm, deleteLetter, showToast]);

  const handleDuplicate = useCallback((letterId: string) => {
    const duplicate = duplicateLetter(letterId);
    if (duplicate) {
      showToast('Letter duplicated', 'success');
    }
  }, [duplicateLetter, showToast]);

  const handleAISmartAction = useCallback(async () => {
    const isRefining = formState.body.trim().length > 10;
    const isDrafting = !isRefining && formState.subject.trim().length > 3;

    if (!isRefining && !isDrafting) {
      showToast('Please enter a subject or type some notes in the body first', 'error');
      return;
    }

    if (isRefining) setAiRefining(true); else setAiLoading(true);

    try {
      const request = AIService.buildLetterRequest({
        prompt: isRefining 
          ? "Refine this content into 100% official language" 
          : `Draft a full letter about: ${formState.subject}`,
        recipient: formState.to,
        subject: formState.subject,
        salutation: resolvedValues.salutation,
        senderName: formState.signatureName,
        senderTitle: resolvedValues.signatureTitle,
        fromOffice: resolvedValues.lhLine1 || resolvedValues.fromOffice,
        letterhead: [resolvedValues.lhLine1, resolvedValues.lhLine2, resolvedValues.lhLine3].filter(Boolean).join(', '),
        forwardedTo: formState.forwardedTo.split('\n').filter(Boolean),
        tone: `100% formal Pakistani government office language. Office: ${resolvedValues.lhLine1 || formState.institutionName}. Writing to: ${formState.to}.`,
      });

      const response = isRefining 
        ? await AIService.refineLetter(request, formState.body)
        : await AIService.generateLetter(request);

      if (response.error) {
        showToast(response.error, 'error');
        return;
      }

      // Format response as paragraphs if not already
      let result = response.text;
      if (!result.includes('<p>')) {
        result = result
          .split(/\n{1,}/)
          .map((p: string) => p.trim())
          .filter(Boolean)
          .map((p: string) => `<p>${p}</p>`)
          .join('');
      }

      setField('body', result);
      showToast(isRefining ? 'Letter refined with official tone' : 'Official draft generated', 'success');
    } catch (error) {
      showToast('AI smart action failed', 'error');
    } finally {
      setAiRefining(false);
      setAiLoading(false);
    }
  }, [formState, resolvedValues, setField, showToast]);

  async function handlePrint() {
    console.log("handlePrint triggered", { subject: formState.subject, hasBody: !!formState.body });
    
    if (!formState.subject || !formState.body) {
      showToast('Please complete the letter before printing', 'error');
      return;
    }
    
    // Save as draft first to ensure the printed version has latest changes.
    const saved = saveLetter('draft', false);
    console.log("Letter saved for printing:", saved?.id);
    
    if (!saved || !saved.id) {
      showToast('Could not save letter for printing', 'error');
      return;
    }

    // FORCE SAVE: Physically write to localStorage immediately before opening print window
    try {
      const currentLettersStr = localStorage.getItem('clerk_pro_clerk_letters') || '[]';
      const currentLetters = JSON.parse(currentLettersStr);
      const exists = currentLetters.findIndex((l: any) => l.id === saved.id);
      if (exists !== -1) {
        currentLetters[exists] = saved;
      } else {
        currentLetters.unshift(saved);
      }
      localStorage.setItem('clerk_pro_clerk_letters', JSON.stringify(currentLetters));

      // Save custom print settings dynamically
      localStorage.setItem('clerk_pro_current_letter_print_settings', JSON.stringify({
        paperSize,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        watermark
      }));
      console.log("Force save and settings saved to localStorage");
    } catch (e) {
      console.error("Force save failed", e);
    }

    // Use standard project print route which uses PrintLayout
    const printUrl = `#/print/letter/${saved.id}`;
    console.log("Opening print window:", printUrl);
    
    const newWindow = window.open(printUrl, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      console.warn("Pop-up blocked or window could not be opened");
      showToast('Pop-up blocked! Please allow pop-ups for this site.', 'error');
    }
  }

  const handleCopyPreview = async () => {
    const success = await ExportService.copyToClipboard(formattedLetter);
    showToast(
      success ? 'Letter copied to clipboard' : 'Failed to copy',
      success ? 'success' : 'error'
    );
  };

  const handleDownloadPreview = () => {
    const blob = new Blob([formattedLetter], { type: 'text/plain' });
    ExportService.downloadBlob(
      blob,
      `${formState.subject.replace(/[^a-z0-9]/gi, '_') || 'letter'}.txt`
    );
  };

  const handleReplace = (findText: string, replaceText: string, options: any) => {
    if (!editor) return;
    const html = editor.getHTML();
    const flags = options.caseSensitive ? "g" : "gi";
    let pattern = findText;
    if (options.wholeWord) {
      pattern = `\\b${findText}\\b`;
    }
    const regex = new RegExp(pattern, flags);
    
    const newHtml = html.replace(/>([^<]+)</g, (match: string, text: string) => {
      const replacedText = options.replaceAll 
        ? text.replace(regex, replaceText)
        : text.replace(new RegExp(pattern, options.caseSensitive ? "" : "i"), replaceText);
      return `>${replacedText}<`;
    });
    
    editor.commands.setContent(newHtml);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!e.ctrlKey && !e.metaKey) return
    switch(e.key) {
      case 's': e.preventDefault(); handleSave('draft'); break
      case 'p': e.preventDefault(); handlePrint(); break
      case 'f': e.preventDefault(); setFindReplaceOpen(true); break
      case 'a': e.preventDefault(); editor?.commands.selectAll(); break
      case 'z': e.preventDefault(); editor?.commands.undo(); break
      case 'y': e.preventDefault(); editor?.commands.redo(); break
      case 'b': e.preventDefault(); editor?.chain().focus().toggleBold().run(); break
      case 'i': e.preventDefault(); editor?.chain().focus().toggleItalic().run(); break
      case 'u': e.preventDefault(); editor?.chain().focus().toggleUnderline().run(); break
      case ']': e.preventDefault(); editor?.commands.sinkListItem('listItem'); break
      case '[': e.preventDefault(); editor?.commands.liftListItem('listItem'); break
    }
  }, [editor, handleSave, handlePrint]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setA4Scale(prev => {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        return Math.min(2.0, Math.max(0.4, prev + delta));
      });
    }
  };

  // Filter letters
  const filteredLetters = useMemo(() => letters.filter(letter => {
    if (!letterSearch) return true;
    const searchLower = letterSearch.toLowerCase();
    return (
      letter.subject.toLowerCase().includes(searchLower) ||
      letter.to.toLowerCase().includes(searchLower) ||
      letter.reference.toLowerCase().includes(searchLower) ||
      letter.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }), [letters, letterSearch]);

  const rootClasses = `
    ${isFullscreen || isMaximized ? 'composer-fullscreen' : 'space-y-6'} 
    fullscreen-transition flex flex-col
  `.trim();

  const renderSidebar = () => (
    <div className="space-y-6 p-4">
      {/* ── Block 1: Origin & Metadata ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary/70 text-[18px]">domain</span>
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Letter Details</span>
          <div className="flex gap-1 ml-auto">
             <Button variant="text" size="sm" icon={showMetadata ? 'visibility_off' : 'visibility'} label="" onClick={() => setShowMetadata(!showMetadata)} title={showMetadata ? 'Hide Metadata' : 'Show Metadata'} />
             {showMetadata && <Button variant="text" size="sm" icon="edit" label="Edit" onClick={() => setIsEditing(true)} />}
          </div>
        </div>
        
        {showMetadata ? (
          <div className="text-sm p-3 bg-surface-variant/30 rounded-lg border border-outline-variant space-y-1">
              <div className="font-bold truncate">{formState.institutionName || 'No Institution'}</div>
              <div className="text-xs text-on-surface-variant truncate">Ref: {formState.reference || 'N/A'}</div>
              <div className="text-xs text-on-surface-variant truncate">To: {formState.to || 'N/A'}</div>
              <div className="text-xs font-semibold mt-1 truncate">{formState.subject || 'No Subject'}</div>
          </div>
        ) : (
          <div className="text-xs text-on-surface-variant italic p-2">Official letter metadata is hidden.</div>
        )}

        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Letter Metadata</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <TextField
                label="Institution / Office Name"
                value={formState.institutionName}
                onChange={e => setField('institutionName', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  label="Reference No"
                  value={formState.reference}
                  onChange={e => setField('reference', e.target.value)}
                />
                <TextField
                  label="Date"
                  type="date"
                  value={formState.letterDate}
                  onChange={e => setField('letterDate', e.target.value)}
                />
              </div>
              <TextArea
                label="To (Recipient)"
                value={formState.to}
                onChange={e => setField('to', e.target.value)}
                rows={3}
              />
              <TextField
                label="Subject"
                value={formState.subject}
                onChange={e => setField('subject', e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="tonal" onClick={() => setIsEditing(false)}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* AI Actions */}
      <div className="pt-4 border-t border-outline/10">
        <Button
          variant="tonal"
          className="w-full justify-start"
          icon={Sparkles}
          label="AI Smart Actions"
          onClick={handleAISmartAction}
          disabled={aiLoading || aiRefining}
        />
      </div>

      {/* Templates Quick Select */}
      <div className="pt-4 border-t border-outline/10">
        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">Quick Templates</label>
        <div className="grid grid-cols-1 gap-2">
          {['Relieving Order', 'Charge Handover', 'Office Order'].map(t => (
            <Button key={t} variant="text" label={t} onClick={() => loadTemplate(t)} className="justify-start px-2 h-8 text-xs" />
          ))}
        </div>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div
      className="bg-white official-preview min-h-[1123px] w-[794px] mx-auto print:shadow-none print:border-none print:m-0 relative overflow-hidden"
      style={{ 
        padding: `${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm`, 
        fontFamily: "'Times New Roman', serif", 
        color: '#000', 
        fontSize: '11pt', 
        lineHeight: 1.6
      }}
    >
      {watermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
          <div 
            className="text-slate-300/10 font-black uppercase text-center"
            style={{ 
              transform: 'rotate(-45deg)', 
              fontSize: '6.5rem',
              whiteSpace: 'nowrap',
              letterSpacing: '4px'
            }}
          >
            {watermark}
          </div>
        </div>
      )}
      {/* Letterhead */}
      {showMetadata && (() => {
        const line1 = resolvedValues.lhLine1;
        const line2 = resolvedValues.lhLine2 || officeProfile.district_line || '';

        return (
          <>
            <div className="flex justify-between items-start mb-2 w-full text-black">
              {/* Logo */}
              <div className="w-[70px] flex-shrink-0 pt-1 flex justify-start">
                <OfficialLogo className="w-[60px] h-[60px]" departmentType={(resolvedValues as any).departmentType} />
              </div>

              {/* Centre title block */}
              <div className="flex-grow text-center px-4 pt-1">
                <h1 className="text-[14pt] font-black uppercase leading-tight tracking-tight whitespace-pre-line">
                  {line1}
                </h1>
                {line2 && (
                  <h2 className="text-[9.5pt] font-bold mt-1 leading-tight">
                    {line2}
                  </h2>
                )}
                <h3 className="text-[9pt] font-semibold mt-0.5">
                  Govt. of Khyber Pakhtunkhwa.
                </h3>
              </div>

              {/* Right contact + QR */}
              <div className="text-[8.5pt] w-[100px] pt-2 font-serif leading-snug text-right">
                {officeProfile.tel && <p><strong>Tel:</strong> {officeProfile.tel}</p>}
                <div className="flex justify-end mt-2">
                  <QRCode value={formState.reference || 'draft'} size={64} />
                </div>
              </div>
            </div>
            <div style={{ borderTop: '4px double #000', margin: '8px 0 20px 0' }} />

            {/* Ref / Date */}
            {(formState.reference || formState.letterDate) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '11pt', marginBottom: 20 }}>
                <div>
                  {formState.reference && (
                    <>
                      <span>No. </span>
                      <span style={{ borderBottom: '1px solid #000', minWidth: 80, display: 'inline-block', textAlign: 'center', padding: '0 8px' }}>{formState.reference}</span>
                    </>
                  )}
                </div>
                <div>
                  Dated: {formatLetterDate(formState.letterDate)}
                </div>
              </div>
            )}

            {/* To & Subject Vertically Stacked (Image 2 style) */}
            <div className="mb-6" style={{ fontSize: '11.5pt', fontFamily: "'Times New Roman', serif" }}>
              {/* To Row */}
              <div style={{ display: 'flex', marginBottom: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '90px', fontWeight: 'bold', flexShrink: 0 }}>To:</div>
                <div style={{ flexGrow: 1, paddingLeft: '8px' }}>
                  {(formState.to || '')
                    .split('\n')
                    .filter(l => l.trim())
                    .map((line, i) => (
                      <div 
                        key={i} 
                        className="font-bold" 
                        style={{ lineHeight: 1.5 }}
                      >
                        {line.trim()}
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Subject Row */}
              {formState.subject && (
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ width: '90px', flexShrink: 0 }}>Subject:</div>
                  <div 
                    style={{ 
                      flexGrow: 1, 
                      paddingLeft: '8px',
                      fontWeight: 'bold', 
                      textDecoration: 'underline', 
                      textUnderlineOffset: '4px',
                      textTransform: 'uppercase',
                      lineHeight: 1.4
                    }}
                  >
                    {formState.subject}
                  </div>
                </div>
              )}
            </div>

            {/* Salutation Resolved via Smart Salutation Engine (omits for MEMO/ORDER) */}
            {(() => {
               const sal = getSmartSalutation(
                 formState.to || '',
                 formState.institutionName || '',
                 (formState as any).letterType || 'Letter'
               );
               if (!sal || sal === 'MEMO') return null;
               // Replace trailing comma with colon to match Image 2
               const formattedSalText = sal.endsWith(',') ? sal.slice(0, -1) + ':' : sal;
               return (
                 <div style={{ fontWeight: 700, fontSize: '11.5pt', marginBottom: 12 }}>
                   {formattedSalText}
                 </div>
               );
            })()}
            
            {/* Body */}
            <div className="official-body text-black text-justify" style={{ fontSize: '11pt' }}>
              {(() => {
                const html = formState.body || '';
                // Simple cleanup: remove standard salutations from the body if they appear
                const cleanHtml = html.replace(/<p>(Respected Sir|Dear Sir\/Madam),?<\/p>/gi, '');

                // Use regex-based HTML stripping instead of DOM allocation in render path
                const rawParagraphs = cleanHtml
                  .split(/<\/p>|<br\s*\/?>/i)
                  .map(p => p.replace(/<[^>]*>/g, '').trim())
                  .filter(p => p.length > 1);

                if (rawParagraphs.length === 0) return null;

                return (
                  <div className="space-y-5">
                    {rawParagraphs.map((text, i) => {
                      return (
                        <div key={i} className="text-justify leading-relaxed" style={{ textIndent: '4em' }}>
                          {text}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </>
        );
      })()}

      {/* Enclosures & Signature */}
      <div className="flex justify-between items-end pt-10" style={{ pageBreakInside: 'avoid' }}>
        <div className="flex-1 pr-4">
          {(() => {
            const encItems = (formState.enclosures || '').split('\n').map(l => l.trim()).filter(Boolean);
            if (encItems.length === 0) return null;
            return (
              <div className="text-[10.5pt]">
                <div className="font-bold underline mb-1">Enclosures:</div>
                {encItems.map((item, i) => (
                  <div key={i} className="font-semibold">
                    {encItems.length > 1 ? `${i + 1}. ${item}` : item}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
        <div style={{ width: 240, textAlign: 'center', fontSize: '10.5pt', flexShrink: 0 }}>
          <div style={{ height: 60 }} />
          <div style={{ borderTop: '1px solid #000', width: 200, margin: '0 auto 6px' }} />
          <div style={{ fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            {formState.signatureName ? formState.signatureName + '\n' : ''}
            {resolvedValues.signatureTitle}
          </div>
        </div>
      </div>


      {/* Forwarded */}
      {formState.forwardedTo.split('\n').filter(Boolean).length > 0 && (
        <div style={{ marginTop: 30, paddingTop: 15, borderTop: '1px solid #eee', fontSize: '10pt' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Copy Forwarded To:</div>
          {formState.forwardedTo.split('\n').filter(Boolean).map((f, i) => (
            <div key={i} style={{ marginLeft: 20, marginBottom: 4 }}>{i + 1}. {f.trim()}</div>
          ))}
        </div>
      )}
    </div>
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const searchResults = useMemo(() => {
    if (searchTerm.length < 3) return [];
    const q = searchTerm.toLowerCase();
    return employees.filter(e => 
      e.employees.name.toLowerCase().includes(q) || 
      e.employees.personal_no?.includes(q) ||
      (e.employees as any).cnic?.includes(q)
    ).slice(0, 10);
  }, [searchTerm, employees]);

  const selectEmployee = (emp: EmployeeRecord) => {
     setMultipleFields({
       to: `${emp.employees.name}\n${emp.employees.designation}\n${emp.employees.school_full_name}`,
       institutionName: emp.employees.school_full_name,
     });
     setSearchTerm('');
     setShowResults(false);
     showToast(`Loaded details for ${emp.employees.name}`, 'success');
  };

  const letterDataObj = useMemo(() => ({
    institutionName: formState.institutionName,
    officeTitle: officeProfile.office_title,
    districtLine: officeProfile.district_line,
    reference: formState.reference,
    letterDate: formState.letterDate,
    to: formState.to,
    subject: formState.subject,
    salutation: resolvedValues.salutation,
    signatureName: formState.signatureName,
    signatureTitle: resolvedValues.signatureTitle,
    tel: officeProfile.tel,
    enclosures: formState.enclosures,
    forwardedTo: formState.forwardedTo,
    departmentType: (resolvedValues as any).departmentType,
  }), [formState, officeProfile, resolvedValues]);

  return (
    <EditorProvider editorInstance={editor}>
      <EditorStateBridge value={formState.body} />
      <SettingsBridge 
        sidebarOpen={sidebarOpen}
        viewMode={viewMode}
        onNavPaneToggle={(show) => setSidebarOpen(show)}
        onViewModeChange={(mode) => {
          if (mode === 'split') {
            setViewMode('split' as any);
          } else if (mode === 'fluid') {
            setViewMode('fluid' as any);
          } else {
            setViewMode('form' as any);
          }
        }}
      />
      <div className={rootClasses}
 style={(isMaximized || isFullscreen) ? { height: viewportHeight, background: '#f8fafc' } : undefined}>
        <ConfirmDialogComponent />

        {isFullscreen && isMobile && (
          <style>{`
            /* Hide parent ClerkDesk elements */
            .max-w-7xl > .flex.items-center.justify-between, 
            .max-w-7xl > .flex.flex-wrap.gap-2 {
              display: none !important;
            }
            /* Ensure container takes full width/height */
            .max-w-7xl {
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          `}</style>
        )}

        {/* ── ENHANCED TOOLBAR ── */}
        {!focusMode && (
          <div className={`
            bg-[#2b579a] text-white shadow-md z-[40] transition-all
            ${(isMaximized || isFullscreen) ? 'shrink-0' : 'rounded-2xl border border-white/10'}
          `}>
            {/* Row 1 */}
            <div className="px-4 py-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white border border-white/20">
                  <span className="material-symbols-outlined text-xl">edit_document</span>
                </div>
              {!isMobile && (
                <div>
                  <h1 className="text-sm font-black uppercase tracking-tight">Letter Composer Pro</h1>
                  <p className="text-[10px] text-blue-100/70 font-bold uppercase tracking-wider">
                    {formState.editingId ? 'Editing Letter' : 'New Official Letter'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
               <div className="hidden md:flex items-center gap-1 mr-4">
                  <Button variant="text" size="sm" icon="save" label="Save" onClick={() => handleSave('draft')} className="text-white hover:bg-white/10" />
                  <Button variant="text" size="sm" icon="print" label="Print" onClick={handlePrint} className="text-white hover:bg-white/10" />
                  <Button 
                    variant="text" 
                    size="sm" 
                    icon="auto_awesome" 
                    label="AI Assistant" 
                    onClick={() => setShowCopilot(!showCopilot)} 
                    className={cn("text-white hover:bg-white/10", showCopilot && "bg-white/20")} 
                  />
               </div>
               
               <div className="h-6 w-px bg-white/10 mx-1 hidden md:block" />

               <Button
                  variant={viewMode === 'form' ? 'filled' : 'text'}
                  size="sm"
                  icon="edit_note"
                  label={!isMobile ? "Editor" : ""}
                  onClick={() => setViewMode('form')}
                  className={viewMode === 'form' ? 'bg-white text-primary' : 'text-white hover:bg-white/10'}
               />
               <Button
                  variant={viewMode === 'preview' ? 'filled' : 'text'}
                  size="sm"
                  icon="visibility"
                  label={!isMobile ? "Preview" : ""}
                  onClick={() => setViewMode('preview')}
                  className={viewMode === 'preview' ? 'bg-white text-primary' : 'text-white hover:bg-white/10'}
               />
               
               <div className="h-6 w-px bg-white/10 mx-1" />

               <Button
                  variant="text"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/10 p-2"
                  title="Toggle Fullscreen"
               >
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
               </Button>

               <Button
                  variant="text"
                  size="sm"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="text-white hover:bg-white/10 p-2"
                  title="Toggle Maximize"
               >
                  {isMaximized ? <X size={20} /> : <LayoutIcon size={20} />}
               </Button>

               {isMobile && (
                 <Button
                    variant="text"
                    size="sm"
                    onClick={() => setIsDrawerOpen(true)}
                    className="text-white hover:bg-white/10 p-2"
                 >
                    <MoreHorizontal size={20} />
                 </Button>
               )}
            </div>
          </div>
        </div>
       )}


        {/* Unified Ribbon */}
        {!focusMode && (
          <div className="bg-white border-b flex items-center overflow-x-auto shadow-sm">
             <div className="px-4 py-2 border-r flex items-center gap-2">
               <span className="material-symbols-outlined text-primary">edit_document</span>
               <span className="text-sm font-bold text-on-surface-variant">Letter</span>
             </div>
             
             <div className="px-4 py-2 border-r flex items-center gap-2 hover:bg-surface-variant/50 cursor-pointer" onClick={() => editor?.chain().focus().toggleBold().run()}>
               <span className="material-symbols-outlined text-sm">format_bold</span>
             </div>
             <div className="px-4 py-2 border-r flex items-center gap-2 hover:bg-surface-variant/50 cursor-pointer" onClick={() => editor?.chain().focus().toggleItalic().run()}>
               <span className="material-symbols-outlined text-sm">format_italic</span>
             </div>
             <div className="px-4 py-2 border-r flex items-center gap-2 hover:bg-surface-variant/50 cursor-pointer" onClick={() => editor?.chain().focus().toggleUnderline().run()}>
               <span className="material-symbols-outlined text-sm">format_underlined</span>
             </div>

             <div className="px-4 py-2 border-r flex items-center gap-2 hover:bg-surface-variant/50 cursor-pointer" onClick={() => editor?.chain().focus().setTextAlign('left').run()}>
               <span className="material-symbols-outlined text-sm">format_align_left</span>
             </div>
             <div className="px-4 py-2 border-r flex items-center gap-2 hover:bg-surface-variant/50 cursor-pointer" onClick={() => editor?.chain().focus().setTextAlign('center').run()}>
               <span className="material-symbols-outlined text-sm">format_align_center</span>
             </div>
             <div className="px-4 py-2 border-r flex items-center gap-2 hover:bg-surface-variant/50 cursor-pointer" onClick={() => editor?.chain().focus().setTextAlign('right').run()}>
               <span className="material-symbols-outlined text-sm">format_align_right</span>
             </div>
             
             <div className="px-4 py-2 border-r flex items-center gap-2 hover:bg-surface-variant/50 cursor-pointer" onClick={() => setFindReplaceOpen(true)}>
               <span className="material-symbols-outlined text-sm">find_replace</span>
               <span className="text-sm font-medium">Find & Replace</span>
             </div>
             
             <div className="px-4 py-2 border-r flex items-center gap-2 hover:bg-surface-variant/50 cursor-pointer" onClick={() => handleSave('draft')}>
               <span className="material-symbols-outlined text-sm">save</span>
               <span className="text-sm font-medium">Save</span>
             </div>

             <div className="px-4 py-2 border-r flex items-center gap-2 hover:bg-surface-variant/50 cursor-pointer" onClick={handlePrint}>
               <span className="material-symbols-outlined text-sm">print</span>
               <span className="text-sm font-medium">Print</span>
             </div>

             <div className="px-4 py-2 border-r flex items-center gap-2 hover:bg-surface-variant/50 cursor-pointer" onClick={() => setShowCopilot(!showCopilot)}>
               <span className="material-symbols-outlined text-sm">auto_awesome</span>
               <span className="text-sm font-medium">AI</span>
             </div>

             {/* Find/Replace Dialog Integration */}
             <FindReplace 
                content={editor?.getText() || ""}
                onReplace={handleReplace}
             />
          </div>
        )}

        {/* Smart Paste Banner */}
        {smartPasteDetected && smartPasteData && (
           <div className="bg-emerald-50 border-b border-emerald-200 p-3 text-sm text-emerald-900 flex flex-col gap-2">
              <div className="flex items-center justify-between font-bold text-emerald-800">
                 <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                    Parsed from pasted text
                 </div>
                 <div className="flex items-center gap-2">
                    <Button variant="text" size="sm" label="Refill Fields" onClick={applySmartPaste} className="text-emerald-700 hover:bg-emerald-100/50 mr-2" />
                    <button onClick={() => setSmartPasteDetected(false)} className="text-emerald-600 hover:text-emerald-800">
                       <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                 </div>
              </div>
              <div className="flex flex-wrap gap-4 text-xs">
                 <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald-500">{smartPasteData.letterType !== 'Unknown' ? 'check' : 'help_outline'}</span>
                    Type: {smartPasteData.letterType}
                 </span>
                 <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald-500">{smartPasteData.officeName ? 'check' : 'remove'}</span>
                    From: {smartPasteData.officeName || 'N/A'}
                 </span>
                 <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald-500">{smartPasteData.refNo || smartPasteData.refNoSuffix ? 'check' : 'remove'}</span>
                    Ref: {smartPasteData.refNo || '___'}{smartPasteData.refNoSuffix ? `/${smartPasteData.refNoSuffix}` : ''}
                 </span>
                 <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald-500">{smartPasteData.date ? 'check' : 'remove'}</span>
                    Date: {smartPasteData.date || 'N/A'}
                 </span>
                 <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald-500">{smartPasteData.recipients?.length ? 'check' : 'remove'}</span>
                    {smartPasteData.recipients?.length || 0} Recipients
                 </span>
                 <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald-500">{smartPasteData.copyTo?.length ? 'check' : 'remove'}</span>
                    {smartPasteData.copyTo?.length || 0} Copy To
                 </span>
              </div>
           </div>
        )}
        {/* Floating Letter Details Button — opens metadata dialog */}
        <button
          onClick={() => setMetadataDialogOpen(true)}
          className="fixed z-[40] bg-[#2b579a] text-white shadow-lg hover:shadow-xl hover:bg-[#1e3f73] transition-all duration-200 flex items-center gap-2 group"
          style={{
            top: isMobile ? '10px' : '72px',
            left: isMobile ? '10px' : (isMaximized || isFullscreen ? '16px' : '260px'),
            borderRadius: '20px',
            padding: isMobile ? '8px 14px' : '8px 16px',
            fontSize: '12px',
            fontWeight: 700,
          }}
          title="Edit Letter Details"
        >
          <span className="material-symbols-outlined text-[18px]">edit_document</span>
          <span className={isMobile ? 'hidden' : ''}>Letter Details</span>
          {(formState.subject || formState.to) && (
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          )}
        </button>

        {/* Metadata Dialog */}
        <Dialog open={metadataDialogOpen} onOpenChange={setMetadataDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_document</span>
                Letter Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              {/* Search Employee */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Search Employee</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-primary/60 text-[20px] z-10">person_search</span>
                  <input
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                    placeholder="Search by name or P.No..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setShowResults(true); }}
                  />
                </div>
                {showResults && searchResults.length > 0 && (
                  <div className="mt-1 bg-white border border-gray-200 shadow-xl rounded-xl max-h-48 overflow-y-auto z-[300] relative">
                    {searchResults.map(emp => (
                      <div
                        key={emp.id}
                        className="p-3 hover:bg-primary/5 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                        onClick={() => { selectEmployee(emp); setShowResults(false); }}
                      >
                        <div className="font-bold text-sm">{emp.employees.name}</div>
                        <div className="text-xs text-gray-500">{emp.employees.designation} • {emp.employees.school_full_name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* From Office */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">From (Office / Institution)</label>
                <input
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                  value={formState.institutionName}
                  onChange={e => setField('institutionName', e.target.value)}
                  placeholder="e.g. SDEO (M) ALLAI BATTAGRAM"
                />
              </div>

              {/* To + Subject (side by side on desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">To (Recipient)</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all resize-none"
                    value={formState.to}
                    onChange={e => setField('to', e.target.value)}
                    placeholder="Enter recipient title and office..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Subject</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold uppercase focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all resize-none"
                    value={formState.subject}
                    onChange={e => setField('subject', e.target.value)}
                    placeholder="Enter letter subject..."
                  />
                </div>
              </div>

              {/* Ref No + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Reference No.</label>
                  <input
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                    value={formState.reference}
                    onChange={e => setField('reference', e.target.value)}
                    placeholder="e.g. 1024/ESE/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Dated</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                    value={formState.letterDate}
                    onChange={e => setField('letterDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Forwarded To */}
              <InteractiveListManager 
                label="Copy Forwarded To (Endorsements)"
                value={formState.forwardedTo}
                onChange={newValue => setField('forwardedTo', newValue)}
                placeholder="e.g. ADEO Allai Battagram"
                addButtonLabel="Add Router"
                iconName="forward_to_inbox"
              />

              {/* Enclosures */}
              <InteractiveListManager 
                label="Enclosures"
                value={formState.enclosures}
                onChange={newValue => setField('enclosures', newValue)}
                placeholder="e.g. Copy of relieving order"
                addButtonLabel="Add Encl."
                iconName="attach_file"
              />

              {/* Signature */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Signatory Name</label>
                  <input
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                    value={formState.signatureName}
                    onChange={e => setField('signatureName', e.target.value)}
                    placeholder="e.g. Fazal Ali"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Signatory Title</label>
                  <input
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                    value={formState.signatureTitle || resolvedValues.signatureTitle || ''}
                    onChange={e => setField('signatureTitle', e.target.value)}
                    placeholder="e.g. SDEO (M) ALLAI"
                  />
                </div>
              </div>

              {/* Print Layout & Watermark Customization */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">print</span>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Print & Watermark Settings</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Paper Size</label>
                    <select
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                      value={paperSize}
                      onChange={e => setPaperSize(e.target.value as any)}
                    >
                      <option value="A4">A4 (Standard)</option>
                      <option value="Letter">Letter</option>
                      <option value="Legal">Legal</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Watermark Text (Diagonal)</label>
                    <input
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all font-bold uppercase tracking-wider"
                      value={watermark}
                      onChange={e => setWatermark(e.target.value)}
                      placeholder="e.g. DRAFT, CONFIDENTIAL, APPROVED"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Custom Print Margins (mm)</label>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold block mb-0.5">Top</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                        value={marginTop}
                        onChange={e => setMarginTop(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold block mb-0.5">Bottom</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                        value={marginBottom}
                        onChange={e => setMarginBottom(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold block mb-0.5">Left</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                        value={marginLeft}
                        onChange={e => setMarginLeft(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold block mb-0.5">Right</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                        value={marginRight}
                        onChange={e => setMarginRight(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="text"
                label="Cancel"
                onClick={() => setMetadataDialogOpen(false)}
              />
              <Button
                variant="tonal"
                icon="save"
                label="Save & Close"
                onClick={() => {
                  setMetadataDialogOpen(false);
                  showToast('Letter details updated', 'success');
                }}
              />
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── MAIN CONTENT AREA ── */}
        <div 
          className="flex-1 flex overflow-hidden relative"
          style={{
            height: (isFullscreen && isMobile) ? `${viewportHeight}px` : undefined,
            transition: 'height 0.2s ease'
          }}
        >
          {/* Left Sidebar (Desktop/Maximized) */}
          {!isMobile && (isMaximized || isFullscreen) && sidebarOpen && (
            <div className="w-80 bg-surface border-r overflow-y-auto shrink-0 animate-in slide-in-from-left duration-300">
               {renderSidebar()}
            </div>
          )}

          {/* Toggle Sidebar Button */}
          {!isMobile && (isMaximized || isFullscreen) && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-white border shadow-md rounded-r-xl p-1 hover:bg-primary/5 transition-colors"
              style={{ left: sidebarOpen ? '320px' : '0' }}
            >
              {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          )}

          {/* Center Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 relative">
            {!focusMode && (
              <div className="bg-white border-b shrink-0 z-40 no-print">
                 <Ribbon isMobile={isMobile} onFocusModeToggle={() => setFocusMode(!focusMode)} isFocusMode={focusMode} />
              </div>
            )}

            {/* Exit Focus Mode Floating Button */}
            {focusMode && (
              <div className="absolute top-4 right-4 z-50 no-print">
                 <Button 
                     variant="tonal" 
                     icon="close_fullscreen" 
                     label="Exit Focus Mode" 
                     onClick={() => setFocusMode(false)} 
                     className="shadow-lg border-2 border-emerald-600 bg-white text-emerald-800 font-bold"
                 />
              </div>
            )}

            {/* Zoom Controls Bar */}
            {!focusMode && (
              <div className="flex items-center justify-center gap-2 py-1 bg-gray-200 border-b text-xs sticky top-0 z-50 w-full no-print">
                <button
                  onClick={() => setA4Scale(s => Math.max(0.5, s - 0.1))}
                  className="w-6 h-6 rounded bg-white border flex items-center justify-center font-bold"
                >−</button>
                <span className="w-12 text-center font-mono">
                  {Math.round(a4Scale * 100)}%
                </span>
                <button
                  onClick={() => setA4Scale(s => Math.min(2.0, s + 0.1))}
                  className="w-6 h-6 rounded bg-white border flex items-center justify-center font-bold"
                >+</button>
                <button
                  onClick={() => setA4Scale(1)}
                  className="px-2 h-6 rounded bg-white border text-xs"
                >Reset</button>
                <span className="text-gray-500 ml-2 hidden sm:inline">
                  {isMobile ? 'Pinch to zoom' : 'Ctrl+scroll'}
                </span>
              </div>
            )}

            <div 
              className={cn(
                "flex-1 overflow-y-auto editor-canvas",
                isMobile ? "overflow-x-hidden p-2 pb-32" : "overflow-x-auto p-12",
                "flex flex-col items-center relative",
                "custom-scrollbar"
              )}
              style={{ minWidth: '100%' }}
              onWheel={handleWheel}
            >
               {viewMode === 'split' ? (
                 /* Split View Layout (Editor & Live Preview side-by-side) */
                 <div className="flex w-full gap-8 max-w-7xl justify-center items-start">
                   {/* Left Column: Editor */}
                   <div className="flex-1 bg-white shadow-2xl rounded-xl border border-gray-200/50 overflow-hidden min-h-[1123px]" style={{ width: '48%' }}>
                     <WordEditor 
                       className="min-h-[1123px]" 
                       onChangeField={(field, value) => setField(field as any, value)}
                       letterData={letterDataObj}
                     />
                   </div>
                   {/* Right Column: Live A4 Preview */}
                   <div className="flex-1 bg-white shadow-2xl rounded-xl border border-gray-200/50 overflow-hidden min-h-[1123px] official-preview" style={{ width: '48%' }}>
                     {renderPreview()}
                   </div>
                 </div>
               ) : (
                 /* Standard Single Page Layout */
                 <div 
                    className={cn(
                      "bg-white shadow-2xl origin-top transition-all duration-300",
                      viewMode === 'preview' && "official-preview"
                    )}
                    style={{ 
                      width: '794px',
                      minHeight: '1123px',
                      transform: `scale(${a4Scale})`,
                      transformOrigin: 'top center',
                      marginBottom: `${(1 - a4Scale) * 1123 * -1 + 40}px`
                    }}
                 >
                    {viewMode === 'form' ? (
                      <WordEditor 
                        className="min-h-[1123px]" 
                        onChangeField={(field, value) => setField(field as any, value)}
                        letterData={letterDataObj}
                      />
                    ) : (
                      renderPreview()
                    )}
                 </div>
               )}
            </div>
          </div>

          {/* Right Sidebar (History/Templates/Copilot) */}
          {!isMobile && (isMaximized || isFullscreen) && (
            <div className="w-80 bg-surface border-l flex flex-col shrink-0 overflow-hidden">
               {showCopilot ? (
                 <CopilotSidebar />
               ) : (
                 <>
                   <div className="p-4 border-b font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">history</span>
                      History
                   </div>
                   <div className="flex-1 overflow-y-auto p-2">
                      {/* Render Filtered Letters */}
                      {filteredLetters.slice(0, 10).map(l => (
                        <div key={l.id} className="p-3 hover:bg-surface-variant/20 rounded-lg cursor-pointer border border-transparent hover:border-outline/10 mb-1" onClick={() => loadLetter(l.id)}>
                          <div className="text-xs font-bold truncate">{l.subject}</div>
                          <div className="text-[10px] text-on-surface-variant">{formatDate(l.updatedAt, 'relative')}</div>
                        </div>
                      ))}
                   </div>
                 </>
               )}
            </div>
          )}
        </div>


        {/* ── STATUS BAR ── */}
        <div className={cn("shrink-0 bg-surface border-t pb-safe", isMobile && "mb-24")}>
          <StatusBar />
        </div>

        {/* ── PREMIUM MOBILE BOTTOM NAVIGATION ── */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-[150] bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] pb-safe">
            <div className="grid grid-cols-5 h-[64px] items-center text-center">
              
              {/* Tab 1: Editor */}
              <button
                type="button"
                onClick={() => { setViewMode('form'); setMobileSidebarType(null); }}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-primary transition-all duration-200",
                  viewMode === 'form' && !mobileSidebarType && "text-primary font-bold"
                )}
              >
                <div className={cn(
                  "w-12 h-7 rounded-full flex items-center justify-center transition-all duration-200",
                  viewMode === 'form' && !mobileSidebarType && "bg-[#2b579a]/10"
                )}>
                  <span className="material-symbols-outlined text-[22px]">edit_document</span>
                </div>
                <span className="text-[10px] tracking-tight">Editor</span>
              </button>

              {/* Tab 2: Preview */}
              <button
                type="button"
                onClick={() => { setViewMode('preview'); setMobileSidebarType(null); }}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-primary transition-all duration-200",
                  viewMode === 'preview' && !mobileSidebarType && "text-primary font-bold"
                )}
              >
                <div className={cn(
                  "w-12 h-7 rounded-full flex items-center justify-center transition-all duration-200",
                  viewMode === 'preview' && !mobileSidebarType && "bg-[#2b579a]/10"
                )}>
                  <span className="material-symbols-outlined text-[22px]">visibility</span>
                </div>
                <span className="text-[10px] tracking-tight">Preview</span>
              </button>

              {/* Tab 3: Details */}
              <button
                type="button"
                onClick={() => setMetadataDialogOpen(true)}
                className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-primary transition-all duration-200"
              >
                <div className="w-12 h-7 rounded-full flex items-center justify-center transition-all duration-200">
                  <span className="material-symbols-outlined text-[22px]">settings_applications</span>
                </div>
                <span className="text-[10px] tracking-tight">Details</span>
              </button>

              {/* Tab 4: History */}
              <button
                type="button"
                onClick={() => setMobileSidebarType('history')}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-primary transition-all duration-200",
                  mobileSidebarType === 'history' && "text-primary font-bold"
                )}
              >
                <div className={cn(
                  "w-12 h-7 rounded-full flex items-center justify-center transition-all duration-200",
                  mobileSidebarType === 'history' && "bg-[#2b579a]/10"
                )}>
                  <span className="material-symbols-outlined text-[22px]">history</span>
                </div>
                <span className="text-[10px] tracking-tight">History</span>
              </button>

              {/* Tab 5: AI Copilot */}
              <button
                type="button"
                onClick={() => setMobileSidebarType('copilot')}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-primary transition-all duration-200",
                  mobileSidebarType === 'copilot' && "text-primary font-bold"
                )}
              >
                <div className={cn(
                  "w-12 h-7 rounded-full flex items-center justify-center transition-all duration-200",
                  mobileSidebarType === 'copilot' && "bg-[#2b579a]/10"
                )}>
                  <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
                </div>
                <span className="text-[10px] tracking-tight">AI Copilot</span>
              </button>

            </div>
          </div>
        )}

        {/* ── MOBILE SIDEBAR OVERLAYS ── */}
        <Drawer.Root open={!!mobileSidebarType} onOpenChange={(open) => !open && setMobileSidebarType(null)}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[200]" />
            <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-[201] outline-none max-h-[90vh] flex flex-col shadow-2xl border-t border-white/20">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-4 mb-2 shrink-0" />
              
              <div className="flex-1 overflow-y-auto px-4 pb-12">
                {mobileSidebarType === 'details' && (
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight mb-6 mt-2">Letter Details</h2>
                    {renderSidebar()}
                  </div>
                )}
                
                {mobileSidebarType === 'history' && (
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight mb-6 mt-2">Letter History</h2>
                    <div className="space-y-3">
                      {letters.map(l => (
                        <div 
                          key={l.id} 
                          className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                          onClick={() => { loadLetter(l.id); setMobileSidebarType(null); }}
                        >
                          <div className="font-bold text-gray-900">{l.subject || '(No Subject)'}</div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                             <span>To: {l.to.split('\n')[0]}</span>
                             <span className="w-1 h-1 rounded-full bg-gray-300" />
                             <span>{formatDate(l.updatedAt, 'relative')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {mobileSidebarType === 'copilot' && (
                  <div className="h-full">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-6 mt-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500 text-2xl">auto_awesome</span>
                      AI Assistant
                    </h2>
                    <CopilotSidebar />
                  </div>
                )}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        {/* ── MOBILE DRAWER ── */}
        <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
           <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[200]" />
              <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 z-[201] outline-none max-h-[85vh] overflow-y-auto">
                 <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
                 <Drawer.Title className="text-lg font-bold mb-4">Letter Options</Drawer.Title>
                 
                 <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                       <Button variant="tonal" icon="save" label="Save Draft" className="w-full" onClick={() => { handleSave('draft'); setIsDrawerOpen(false); }} />
                       <Button variant="tonal" icon="print" label="Print" className="w-full" onClick={() => { handlePrint(); setIsDrawerOpen(false); }} />
                       <Button variant="tonal" icon="picture_as_pdf" label="Export PDF" className="w-full" onClick={() => { handleExportPDF(); setIsDrawerOpen(false); }} />
                       <Button variant="tonal" icon="description" label="Export DOCX" className="w-full" onClick={() => { handleExportDOCX(); setIsDrawerOpen(false); }} />
                    </div>

                    <div className="pt-4 border-t border-outline/10">
                       <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-3">Templates</h3>
                       <div className="grid grid-cols-1 gap-2">
                          {['Relieving Order', 'Charge Handover', 'Office Order', 'Show Cause Notice', 'Urdu Notification'].map(t => (
                             <Button key={t} variant="outlined" label={t} className="w-full justify-start" onClick={() => { loadTemplate(t); setIsDrawerOpen(false); }} />
                          ))}
                       </div>
                    </div>

                    <div className="pt-4 border-t border-outline/10">
                       <Button variant="text" label={isMaximized ? "Restore View" : "Maximize View"} icon={isMaximized ? "close_fullscreen" : "open_in_full"} className="w-full justify-start" onClick={() => { setIsMaximized(!isMaximized); setIsDrawerOpen(false); }} />
                       <Button variant="text" label="Close Editor" icon="close" className="w-full justify-start text-error" onClick={() => { resetForm(); setIsDrawerOpen(false); }} />
                    </div>
                 </div>

              </Drawer.Content>
           </Drawer.Portal>
        </Drawer.Root>

        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="fixed top-3 right-3 z-[9999] 
                       rounded-full bg-white shadow-lg 
                       border border-gray-200 p-2.5
                       flex items-center justify-center
                       min-w-[44px] min-h-[44px]"
            title="Exit Fullscreen"
            aria-label="Exit Fullscreen"
          >
            <Minimize2 className="h-5 w-5 text-gray-600" />
          </button>
        )}
      </div>
    </EditorProvider>
  );
};

export default LetterComposer;