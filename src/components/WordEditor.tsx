import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { FontFamily } from '@tiptap/extension-font-family';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Link } from '@tiptap/extension-link';
import { Extension } from '@tiptap/core';
import {
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Palette, FileText, Printer, FileDown, Undo, Redo,
  Table as TableIcon, Image as ImageIcon, Search, Settings, Menu, X,
  Highlighter, Eraser, Type, Code, Quote, ChevronDown, Strikethrough,
  Link as LinkIcon, Indent as IndentIcon, Outdent, Minus, Plus, BookOpen, Maximize2,
  Check, AlignVerticalJustifyCenter, Pilcrow, Copy, Scissors, Save, RotateCcw, 
  Sparkles, Wand2, Smartphone, Monitor, Trash2, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AIService } from '../features/clerk-desk/services/AIService';
import { useToast } from '../contexts/ToastContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==================== TIPTAP EXTENSIONS ====================

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize?.replace(/['"]+/g, '').replace('pt', '') || null,
          renderHTML: attrs => {
            if (!attrs.fontSize) return {};
            return { style: `font-size: ${attrs.fontSize}pt` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions() { return { types: ['paragraph', 'heading'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        lineHeight: {
          default: null,
          parseHTML: el => el.style.lineHeight || null,
          renderHTML: attrs => {
            if (!attrs.lineHeight) return {};
            return { style: `line-height: ${attrs.lineHeight}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ commands }: any) => {
        return this.options.types.every((type: string) =>
          commands.updateAttributes(type, { lineHeight })
        );
      },
      unsetLineHeight: () => ({ commands }: any) => {
        return this.options.types.every((type: string) =>
          commands.resetAttributes(type, 'lineHeight')
        );
      },
    };
  },
});

const IndentExtension = Extension.create({
  name: 'indent',
  addOptions() {
    return {
      types: ['paragraph', 'heading', 'listItem'],
      minIndent: 0,
      maxIndent: 10,
    };
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        indent: {
          default: 0,
          parseHTML: el => {
            const padding = el.style.paddingLeft;
            return padding ? parseInt(padding) / 30 : 0;
          },
          renderHTML: attrs => {
            if (!attrs.indent || attrs.indent === 0) return {};
            return { style: `padding-left: ${attrs.indent * 30}px` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      indent: () => ({ state, dispatch, tr }: any) => {
        const { selection } = state;
        tr = tr.setSelection(selection);
        state.doc.nodesBetween(selection.from, selection.to, (node: any, pos: number) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0;
            if (currentIndent < this.options.maxIndent) {
              tr = tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: currentIndent + 1 });
            }
          }
        });
        if (dispatch) dispatch(tr);
        return true;
      },
      outdent: () => ({ state, dispatch, tr }: any) => {
        const { selection } = state;
        tr = tr.setSelection(selection);
        state.doc.nodesBetween(selection.from, selection.to, (node: any, pos: number) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0;
            if (currentIndent > this.options.minIndent) {
              tr = tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: currentIndent - 1 });
            }
          }
        });
        if (dispatch) dispatch(tr);
        return true;
      },
    };
  },
});

// ==================== CONSTANTS ====================

const FONTS = ['Calibri', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Trebuchet MS', 'Tahoma', 'Palatino', 'Comic Sans MS'];
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
const LINE_SPACINGS = [
  { label: '1.0', value: '1' }, { label: '1.15', value: '1.15' }, { label: '1.5', value: '1.5' },
  { label: '2.0', value: '2' }, { label: '2.5', value: '2.5' }, { label: '3.0', value: '3' },
];
const HEADING_STYLES = [
  { label: 'Normal', tag: 'paragraph', level: null },
  { label: 'Title', tag: 'heading', level: 1 },
  { label: 'Heading 1', tag: 'heading', level: 1 },
  { label: 'Heading 2', tag: 'heading', level: 2 },
  { label: 'Heading 3', tag: 'heading', level: 3 },
  { label: 'Quote', tag: 'blockquote', level: null },
];
const COLORS = ['#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#ffffff', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff', '#ff00ff'];
const HIGHLIGHT_COLORS = ['transparent', '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#0000ff', '#ff0000', '#ffa500'];

type ActiveTab = 'File' | 'Home' | 'Insert' | 'Layout' | 'Review' | 'View' | 'AI';
type MarginType = 'Normal' | 'Narrow' | 'Moderate' | 'Wide';
type ViewMode = 'print' | 'fluid';

export interface WordEditorProps {
  value: string;
  onChange: (html: string, text?: string) => void;
  onPaste?: (text: string) => void;
  label?: string;
  error?: string;
  className?: string;
  minHeight?: string;
  readOnly?: boolean;
}

export const WordEditor: React.FC<WordEditorProps> = ({
  value,
  onChange,
  onPaste,
  label,
  error,
  className,
  minHeight = '600px',
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('Home');
  const [zoom, setZoom] = useState(100);
  const [marginType, setMarginType] = useState<MarginType>('Normal');
  const [viewMode, setViewMode] = useState<ViewMode>('fluid');
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [currentFont, setCurrentFont] = useState('Calibri');
  const [currentSize, setCurrentSize] = useState('12');
  const [sizeInput, setSizeInput] = useState('12');
  
  const [showFontDD, setShowFontDD] = useState(false);
  const [showSizeDD, setShowSizeDD] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showLineSpacing, setShowLineSpacing] = useState(false);
  const [showStyleDD, setShowStyleDD] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [linkUrl, setLinkUrl] = useState('');
  
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  
  const [showRuler, setShowRuler] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentHeadingStyle, setCurrentHeadingStyle] = useState('Normal');
  const [activeColor, setActiveColor] = useState('#000000');
  const [activeHighlight, setActiveHighlight] = useState('transparent');
  const [isMobile, setIsMobile] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const { showToast } = useToast();
  
  const ribbonRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
      BubbleMenuExtension,
      Underline, TextStyle, FontFamily, FontSize, LineHeight, IndentExtension, Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'] }),
      Table.configure({ resizable: true, HTMLAttributes: { class: 'word-table' } }),
      TableRow, TableHeader, TableCell,
      Image.configure({ allowBase64: true }),
      Link.configure({ openOnClick: false }),
      CharacterCount,
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      setWordCount(editor.storage.characterCount.words());
      setCharCount(editor.storage.characterCount.characters());
      onChange(html, text);
      if (contentRef.current) {
        const height = contentRef.current.scrollHeight;
        setPageCount(Math.max(1, Math.ceil(height / 1123)));
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const attrs = editor.getAttributes('textStyle');
      if (attrs.fontFamily) setCurrentFont(attrs.fontFamily);
      if (attrs.fontSize) { setCurrentSize(attrs.fontSize); setSizeInput(attrs.fontSize); }
      if (attrs.color) setActiveColor(attrs.color);
    },
    editorProps: {
      attributes: { class: 'focus:outline-none tiptap-editor-content', spellcheck: 'true' },
      handlePaste: (view, event) => {
        if (onPaste) {
          const text = event.clipboardData?.getData('text/plain') || '';
          onPaste(text);
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  useEffect(() => {
    const checkMobile = () => {
      const isMob = window.innerWidth < 768;
      setIsMobile(isMob);
      if (isMob) setViewMode('fluid');
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ribbonRef.current?.contains(e.target as Node)) {
        setShowFontDD(false); setShowSizeDD(false); setShowColorPicker(false);
        setShowHighlightPicker(false); setShowLineSpacing(false); setShowStyleDD(false);
        setShowTableMenu(false); setShowLinkDialog(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // --- Actions ---
  const applyFont = useCallback((font: string) => {
    setCurrentFont(font);
    editor?.chain().focus().setFontFamily(font).run();
    setShowFontDD(false);
  }, [editor]);

  const applySize = useCallback((size: string) => {
    const numSize = Math.max(6, Math.min(96, parseInt(size) || 12));
    setCurrentSize(String(numSize)); setSizeInput(String(numSize));
    (editor?.chain().focus() as any).setFontSize(String(numSize)).run();
    setShowSizeDD(false);
  }, [editor]);

  const applyColor = useCallback((color: string) => {
    setActiveColor(color);
    editor?.chain().focus().setColor(color).run();
    setShowColorPicker(false);
  }, [editor]);

  const applyHighlight = useCallback((color: string) => {
    setActiveHighlight(color);
    if (color === 'transparent') editor?.chain().focus().unsetHighlight().run();
    else editor?.chain().focus().setHighlight({ color }).run();
    setShowHighlightPicker(false);
  }, [editor]);

  const applyLineSpacing = useCallback((val: string) => {
    (editor?.chain().focus() as any).setLineHeight(val).run();
    setShowLineSpacing(false);
  }, [editor]);

  const applyHeadingStyle = useCallback((style: any) => {
    if (!editor) return;
    if (style.tag === 'paragraph') editor.chain().focus().setParagraph().run();
    else if (style.level) editor.chain().focus().toggleHeading({ level: style.level as any }).run();
    else if (style.tag === 'blockquote') editor.chain().focus().toggleBlockquote().run();
    setCurrentHeadingStyle(style.label); setShowStyleDD(false);
  }, [editor]);

  const handleFind = useCallback(() => {
    if (!findText || !editor) return;
    const text = editor.state.doc.textContent;
    const index = text.toLowerCase().indexOf(findText.toLowerCase());
    if (index !== -1) {
      editor.commands.setTextSelection({ from: index, to: index + findText.length });
      editor.commands.scrollIntoView();
    }
  }, [findText, editor]);

  const handleReplace = useCallback(() => {
    if (!findText || !editor) return;
    const html = editor.getHTML();
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    editor.commands.setContent(html.replace(regex, replaceText));
  }, [findText, replaceText, editor]);

  const exportPDF = useCallback(async () => {
    if (!contentRef.current) return;
    showToast('Preparing PDF export...', 'info');
    try {
      const canvas = await html2canvas(contentRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pw) / canvas.width;
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pw, imgH);
      heightLeft -= ph;
      while (heightLeft > 0) { position = heightLeft - imgH; pdf.addPage(); pdf.addImage(imgData, 'PNG', 0, position, pw, imgH); heightLeft -= ph; }
      pdf.save('document.pdf');
      showToast('PDF exported successfully', 'success');
    } catch (err) { 
      console.error(err);
      showToast('PDF export failed', 'error');
    }
  }, [showToast]);

  const handleAiRefinement = useCallback(async () => {
    if (!editor || isAiProcessing) return;
    
    const { from, to } = editor.state.selection;
    let selectedText = editor.state.doc.textBetween(from, to, ' ');
    
    // If no selection, use current paragraph or whole document
    if (!selectedText || selectedText.trim().length < 5) {
       selectedText = editor.getText();
    }

    if (!selectedText.trim()) {
      showToast('No text to refine', 'error');
      return;
    }

    setIsAiProcessing(true);
    showToast('AI is refining your text...', 'info');

    try {
      const response = await AIService.refineText(selectedText);
      if (response.error) {
        showToast(response.error, 'error');
      } else if (response.text) {
        if (from !== to) {
          editor.chain().focus().insertContent(response.text).run();
        } else {
          // Replace content if was whole doc or just append
          editor.chain().focus().setContent(response.text).run();
        }
        showToast('Text refined to official standard', 'success');
      }
    } catch (err) {
      showToast('AI refinement failed', 'error');
    } finally {
      setIsAiProcessing(false);
    }
  }, [editor, isAiProcessing, showToast]);

  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && editor) {
        const reader = new FileReader();
        reader.onload = ev => editor.chain().focus().setImage({ src: ev.target?.result as string }).run();
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [editor]);

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
    setShowTableMenu(false);
  }, [editor, tableRows, tableCols]);

  const paddingStyle = useMemo(() => {
    if (viewMode === 'fluid') return isMobile ? '1rem' : '2rem';
    switch (marginType) {
      case 'Narrow': return '12.7mm';
      case 'Wide': return '38.1mm';
      default: return '25.4mm';
    }
  }, [marginType, viewMode, isMobile]);

  const containerWidth = viewMode === 'fluid' ? '100%' : '210mm';

  const RibbonBtn = ({ icon: Icon, onClick, active = false, label, disabled = false, small = false, className = '' }: any) => (
    <button type="button" onClick={onClick} disabled={disabled} title={label}
      className={cn('flex flex-col items-center justify-center rounded transition-all select-none shrink-0',
        small ? 'p-1 min-w-[32px] h-[32px]' : 'p-2 min-w-[44px] h-[44px]',
        active ? 'bg-[#d4e7f4] text-[#0078d4] ring-1 ring-[#0078d4]/30' : 'text-gray-700 hover:bg-gray-200/80',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95', className)}>
      <Icon size={small ? 14 : 18} strokeWidth={active ? 2.5 : 2} />
      {label && !small && <span className="text-[9px] mt-0.5 font-medium leading-none whitespace-nowrap">{label}</span>}
    </button>
  );

  const HomeRibbon = () => (
    <div className="flex items-stretch gap-1 px-2 py-1 overflow-x-auto no-scrollbar">
      {/* Styles */}
      <div className="flex flex-col shrink-0 relative justify-center">
        <button type="button" onClick={() => setShowStyleDD(!showStyleDD)} className="flex items-center gap-1.5 px-2 py-1 text-xs rounded border border-gray-300 bg-white min-w-[100px] h-9 justify-between shadow-sm">
          <span className="font-medium truncate">{currentHeadingStyle}</span><ChevronDown size={14} /></button>
        {showStyleDD && <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-2xl z-50 w-48 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {HEADING_STYLES.map(s => <button key={s.label} type="button" onClick={() => applyHeadingStyle(s)} className={cn('w-full text-left px-3 py-2.5 hover:bg-blue-50 flex items-center justify-between transition-colors text-sm', currentHeadingStyle===s.label&&'bg-blue-50 text-blue-600 font-semibold')}>
            {s.label}{currentHeadingStyle===s.label&&<Check size={14} />}</button>)}
        </div>}
      </div>
      <Divider />
      {/* Font & Size */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="relative">
          <button type="button" onClick={() => setShowFontDD(!showFontDD)} className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-300 bg-white min-w-[90px] h-9 justify-between shadow-sm">
            <span style={{ fontFamily: currentFont }} className="truncate">{currentFont}</span><ChevronDown size={12} /></button>
          {showFontDD && <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl z-50 w-52 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            {FONTS.map(f => <button key={f} type="button" onClick={() => applyFont(f)} className={cn('w-full text-left px-3 py-2.5 hover:bg-blue-50 text-sm', currentFont===f&&'bg-blue-50 text-blue-600 font-semibold')} style={{ fontFamily: f }}>{f}</button>)}
          </div>}
        </div>
        <div className="relative border border-gray-300 rounded bg-white h-9 flex items-center overflow-hidden shadow-sm">
          <button type="button" onClick={() => applySize(String(Math.max(6, parseInt(currentSize) - 1)))} className="px-2 py-1 hover:bg-gray-50 border-r h-full"><Minus size={12} /></button>
          <input type="text" value={sizeInput} onChange={e => setSizeInput(e.target.value)} onBlur={() => applySize(sizeInput)} className="w-10 text-center text-xs focus:outline-none bg-white font-bold" />
          <button type="button" onClick={() => applySize(String(Math.min(96, parseInt(currentSize) + 1)))} className="px-2 py-1 hover:bg-gray-50 border-l h-full"><Plus size={12} /></button>
        </div>
      </div>
      <Divider />
      {/* Formatting */}
      <div className="flex items-center gap-0.5 shrink-0">
        <RibbonBtn icon={Bold} onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} />
        <RibbonBtn icon={Italic} onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} />
        <RibbonBtn icon={UnderlineIcon} onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')} />
        <RibbonBtn icon={Strikethrough} onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive('strike')} />
        <div className="relative">
          <button type="button" onClick={() => setShowColorPicker(!showColorPicker)} className="flex flex-col items-center justify-center w-11 h-11 rounded hover:bg-gray-200/80">
            <Palette size={18}/><div className="w-4 h-1 mt-0.5 rounded-sm" style={{ backgroundColor: activeColor }}/></button>
          {showColorPicker && <div className="absolute top-full left-0 mt-1 bg-white border rounded-xl shadow-2xl p-4 z-50 w-64 animate-in fade-in zoom-in-95 duration-100">
            <div className="grid grid-cols-8 gap-1.5">{COLORS.map(c => <button key={c} type="button" onClick={() => applyColor(c)} className="w-6 h-6 rounded-md border border-gray-200 hover:scale-125 transition-transform" style={{ backgroundColor: c }}/>)}</div>
          </div>}
        </div>
      </div>
      <Divider />
      {/* Alignment & Lists */}
      <div className="flex items-center gap-0.5 shrink-0">
        <RibbonBtn icon={AlignLeft} onClick={() => editor?.chain().focus().setTextAlign('left').run()} active={editor?.isActive({ textAlign: 'left' })} />
        <RibbonBtn icon={AlignCenter} onClick={() => editor?.chain().focus().setTextAlign('center').run()} active={editor?.isActive({ textAlign: 'center' })} />
        <RibbonBtn icon={AlignRight} onClick={() => editor?.chain().focus().setTextAlign('right').run()} active={editor?.isActive({ textAlign: 'right' })} />
        <RibbonBtn icon={AlignJustify} onClick={() => editor?.chain().focus().setTextAlign('justify').run()} active={editor?.isActive({ textAlign: 'justify' })} />
        <Divider />
        <RibbonBtn icon={List} onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} />
        <RibbonBtn icon={ListOrdered} onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} />
      </div>
    </div>
  );

  const AiRibbon = () => (
    <div className="flex items-center gap-3 px-3 py-1 overflow-x-auto no-scrollbar">
       <button type="button" disabled={isAiProcessing} onClick={handleAiRefinement} 
         className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95",
           isAiProcessing ? "bg-purple-100 text-purple-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-purple-200")}>
         {isAiProcessing ? <RotateCcw size={16} className="animate-spin" /> : <Sparkles size={16} />}
         Official Refine
       </button>
       <div className="w-px h-8 bg-gray-300" />
       <p className="text-[10px] text-gray-500 font-medium max-w-[200px] leading-tight">
         Select text and click <span className="text-purple-600 font-bold">Official Refine</span> to polish into Pakistani Government English.
       </p>
    </div>
  );

  const Divider = () => <div className="h-10 w-px bg-gray-300 mx-1.5 self-center shrink-0" />;

  return (
    <div className={cn('flex flex-col rounded-xl border bg-white overflow-hidden shadow-2xl transition-all duration-300', 
      isFullscreen && 'fixed inset-0 z-[100] rounded-none', 
      error ? 'border-red-400' : 'border-gray-200', className)}>
      
      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200 flex items-center px-2 z-40 overflow-x-auto no-scrollbar scroll-smooth">
        {(['Home', 'AI', 'Insert', 'Layout', 'View', 'File'] as ActiveTab[]).map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} 
            className={cn('px-5 py-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap uppercase tracking-widest', 
              activeTab === tab ? 'border-[#0078d4] text-[#0078d4] bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50')}>
            {tab}
          </button>
        ))}
      </nav>

      {/* Ribbon Bar */}
      <div ref={ribbonRef} className="bg-[#f8f9fa] border-b border-gray-200 shrink-0 min-h-[60px] flex items-center relative overflow-hidden">
        {activeTab === 'Home' && <HomeRibbon />}
        {activeTab === 'AI' && <AiRibbon />}
        {activeTab === 'Insert' && (
          <div className="flex items-center gap-2 px-3 h-full">
            <RibbonBtn icon={TableIcon} onClick={() => setShowTableMenu(!showTableMenu)} label="Table" />
            <RibbonBtn icon={ImageIcon} onClick={addImage} label="Image" />
            <RibbonBtn icon={LinkIcon} onClick={() => setShowLinkDialog(!showLinkDialog)} label="Link" />
          </div>
        )}
        {activeTab === 'Layout' && (
           <div className="flex items-center gap-3 px-4">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Margins</span>
              {(['Normal', 'Narrow', 'Wide'] as MarginType[]).map(m => (
                <button key={m} type="button" onClick={() => setMarginType(m)} 
                  className={cn('px-4 py-1.5 text-[10px] font-black uppercase border rounded-lg transition-all', 
                    marginType===m ? 'bg-[#0078d4] text-white border-[#0078d4]' : 'border-gray-300 bg-white hover:bg-gray-100')}>{m}</button>
              ))}
           </div>
        )}
        {activeTab === 'View' && (
           <div className="flex items-center gap-3 px-4">
              <RibbonBtn icon={Monitor} onClick={() => setViewMode('print')} active={viewMode === 'print'} label="Page View" />
              <RibbonBtn icon={Smartphone} onClick={() => setViewMode('fluid')} active={viewMode === 'fluid'} label="Mobile View" />
              <Divider />
              <RibbonBtn icon={Maximize2} onClick={() => setIsFullscreen(!isFullscreen)} active={isFullscreen} label="Full" />
           </div>
        )}
        {activeTab === 'File' && (
           <div className="flex items-center gap-2 px-4">
              <button type="button" onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-[#0078d4] text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-blue-200 transition-all">
                <FileDown size={16}/> Export PDF
              </button>
              <button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all">
                <Printer size={16}/> Print
              </button>
           </div>
        )}
      </div>

      {/* Editor Content Area */}
      <main className={cn('flex-1 overflow-auto flex flex-col items-center scrollbar-thin scroll-smooth', 
        viewMode === 'print' ? 'bg-[#525659] py-8' : 'bg-white p-0')}>
        
        <div className={cn('transition-all duration-500 ease-in-out', 
          viewMode === 'print' ? 'bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)]' : 'w-full max-w-4xl min-h-full')} 
          style={{ width: viewMode === 'print' ? containerWidth : '100%', minHeight: viewMode === 'print' ? '297mm' : 'auto' }}>
          
          <div ref={contentRef} className="h-full relative" style={{ padding: paddingStyle }}>
            {editor && (
              <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
                <div className="flex items-center gap-0.5 bg-white border border-gray-200 shadow-2xl rounded-xl p-1 animate-in zoom-in-95">
                  <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={cn("p-2 rounded-lg hover:bg-gray-100", editor.isActive('bold') && "text-blue-600 bg-blue-50")}><Bold size={16}/></button>
                  <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={cn("p-2 rounded-lg hover:bg-gray-100", editor.isActive('italic') && "text-blue-600 bg-blue-50")}><Italic size={16}/></button>
                  <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={cn("p-2 rounded-lg hover:bg-gray-100", editor.isActive('underline') && "text-blue-600 bg-blue-50")}><UnderlineIcon size={16}/></button>
                  <div className="w-px h-4 bg-gray-200 mx-1" />
                  <button type="button" onClick={handleAiRefinement} className="p-2 rounded-lg hover:bg-purple-50 text-purple-600"><Wand2 size={16}/></button>
                </div>
              </BubbleMenu>
            )}
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>

      {/* Modern Status Bar */}
      <footer className="bg-white border-t border-gray-100 h-10 flex items-center justify-between px-4 text-[10px] text-gray-500 shrink-0 z-50 font-bold uppercase tracking-tighter">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><FileText size={12}/> {wordCount} Words</span>
          <span className="flex items-center gap-1.5"><Type size={12}/> {charCount} Characters</span>
          <span className="hidden sm:inline-block border-l pl-4">Mode: {viewMode === 'fluid' ? 'Mobile Optimized' : 'Print Standard (A4)'}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <button type="button" onClick={() => setZoom(z => Math.max(25, z-10))} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ZoomOutIcon size={14}/></button>
             <span className="w-8 text-center">{zoom}%</span>
             <button type="button" onClick={() => setZoom(z => Math.min(200, z+10))} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ZoomInIcon size={14}/></button>
          </div>
          <button type="button" onClick={() => editor?.chain().focus().setContent('')} className="text-red-400 hover:text-red-600 transition-colors" title="Clear All"><Trash2 size={14}/></button>
        </div>
      </footer>

      {/* Overlays */}
      {showFindReplace && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 z-[100] w-80 animate-in zoom-in-95">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-xs font-black uppercase tracking-widest">Find & Replace</h3>
             <button onClick={() => setShowFindReplace(false)}><X size={16}/></button>
          </div>
          <div className="space-y-3">
            <input value={findText} onChange={e=>setFindText(e.target.value)} placeholder="Find..." className="w-full border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"/>
            <input value={replaceText} onChange={e=>setReplaceText(e.target.value)} placeholder="Replace..." className="w-full border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"/>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={handleFind} className="flex-1 bg-gray-100 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-gray-200 transition-all">Next</button>
              <button type="button" onClick={handleReplace} className="flex-1 bg-[#0078d4] text-white py-2.5 rounded-xl text-[10px] font-black uppercase hover:shadow-lg transition-all">Replace All</button>
            </div>
          </div>
        </div>
      )}

      {/* Global Editor Styles */}
      <style>{`
        .tiptap { outline: none; font-family: Calibri, sans-serif; font-size: 12pt; line-height: 1.6; color: #1a1c1e; min-height: 200px; }
        .tiptap p { margin: 0 0 1em 0; text-align: justify; }
        .tiptap h1 { font-size: 2.5em; font-weight: 800; margin-bottom: 0.5em; color: #000; line-height: 1.2; }
        .tiptap h2 { font-size: 1.8em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; color: #202124; }
        .tiptap blockquote { border-left: 4px solid #0078d4; padding: 0.5rem 0 0.5rem 1.5rem; margin: 1.5rem 0; font-style: italic; color: #444746; background: #f8f9fa; border-radius: 0 8px 8px 0; }
        .tiptap table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 2rem 0; border: 1.5px solid #dadce0; border-radius: 8px; overflow: hidden; }
        .tiptap td, .tiptap th { border: 1px solid #dadce0; padding: 12px 16px; vertical-align: top; }
        .tiptap th { font-weight: 700; background: #f8f9fa; text-align: left; }
        .tiptap-editor-content img { max-width: 100%; height: auto; border-radius: 12px; shadow: 0 10px 30px rgba(0,0,0,0.1); margin: 2rem 0; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: #f1f1f1; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
        @media print {
          @page { size: A4; margin: 0; }
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default WordEditor;
