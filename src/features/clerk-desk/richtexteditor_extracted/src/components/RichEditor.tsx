import React, { useCallback, useRef, useEffect } from 'react';

interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
  onAITextDetected?: (text: string) => void;
}

const FONTS = [
  'Arial', 'Georgia', 'Times New Roman', 'Courier New',
  'Verdana', 'Trebuchet MS', 'Palatino Linotype', 'Garamond',
];
const FONT_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '32', '36'];

// Heuristic: detect if pasted content looks like a structured letter
function looksLikeLetter(text: string): boolean {
  const lower = text.toLowerCase();
  const clues = [
    /\bfrom\s*:/i, /\bto\s*:/i, /\bref(?:erence)?\s*(no)?\.?\s*:/i,
    /\bsubject\s*:/i, /\bdate\s*:/i, /\bdear\s+\w/i,
    /yours\s+(sincerely|faithfully|truly)/i,
  ];
  const matched = clues.filter(c => c.test(lower)).length;
  return matched >= 3;
}

const RichEditor: React.FC<RichEditorProps> = ({
  value,
  onChange,
  placeholder = 'Compose your letter body here...',
  minHeight = '320px',
  onAITextDetected,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const execCmd = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val ?? '');
    editorRef.current?.focus();
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Intercept paste events
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const plain = e.clipboardData.getData('text/plain');
      if (plain && onAITextDetected && looksLikeLetter(plain)) {
        e.preventDefault();
        onAITextDetected(plain);
      }
      // else let default paste happen, then report change
      setTimeout(handleInput, 0);
    },
    [onAITextDetected, handleInput],
  );

  const handleFontFamily = (e: React.ChangeEvent<HTMLSelectElement>) => {
    execCmd('fontName', e.target.value);
    handleInput();
  };

  const handleFontSize = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pt = parseInt(e.target.value);
    const sizeMap: Record<number, string> = {
      8: '1', 9: '1', 10: '2', 11: '2', 12: '3',
      14: '4', 16: '4', 18: '5', 20: '5', 22: '5',
      24: '6', 28: '6', 32: '7', 36: '7',
    };
    const level = sizeMap[pt] ?? '3';
    document.execCommand('fontSize', false, level);
    // Override actual size via style
    const fonts = editorRef.current?.querySelectorAll('font[size]');
    fonts?.forEach(el => {
      (el as HTMLElement).removeAttribute('size');
      (el as HTMLElement).style.fontSize = `${pt}pt`;
    });
    editorRef.current?.focus();
    handleInput();
  };

  const handleColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    execCmd('foreColor', e.target.value);
    handleInput();
  };

  const handleHighlight = (e: React.ChangeEvent<HTMLInputElement>) => {
    execCmd('hiliteColor', e.target.value);
    handleInput();
  };

  /* ── Toolbar button ── */
  const ToolBtn = ({
    cmd,
    title,
    children,
    value: v,
  }: {
    cmd: string;
    title: string;
    children: React.ReactNode;
    value?: string;
  }) => (
    <button
      type="button"
      title={title}
      onMouseDown={e => {
        e.preventDefault();
        execCmd(cmd, v);
        handleInput();
      }}
      className="px-2 py-1 rounded hover:bg-blue-100 hover:text-blue-700 text-gray-700 text-sm transition-colors border border-transparent hover:border-blue-200 focus:outline-none select-none"
    >
      {children}
    </button>
  );

  const Divider = () => (
    <span className="w-px h-5 bg-gray-300 mx-0.5 inline-block self-center" />
  );

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
      {/* ── TOOLBAR ── */}
      <div className="bg-gray-50 border-b border-gray-200 px-2 py-1.5 flex flex-wrap gap-0.5 items-center">

        {/* Font family */}
        <select
          onChange={handleFontFamily}
          defaultValue="Arial"
          className="text-xs border border-gray-300 rounded px-1 py-1 bg-white text-gray-700 max-w-[130px] focus:outline-none focus:border-blue-400 cursor-pointer"
          title="Font Family"
        >
          {FONTS.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        {/* Font size */}
        <select
          onChange={handleFontSize}
          defaultValue="12"
          className="text-xs border border-gray-300 rounded px-1 py-1 bg-white text-gray-700 w-[58px] focus:outline-none focus:border-blue-400 cursor-pointer"
          title="Font Size"
        >
          {FONT_SIZES.map(s => (
            <option key={s} value={s}>{s}pt</option>
          ))}
        </select>

        <Divider />

        {/* Bold / Italic / Underline / Strike */}
        <ToolBtn cmd="bold" title="Bold (Ctrl+B)">
          <strong className="font-black">B</strong>
        </ToolBtn>
        <ToolBtn cmd="italic" title="Italic (Ctrl+I)">
          <em>I</em>
        </ToolBtn>
        <ToolBtn cmd="underline" title="Underline (Ctrl+U)">
          <u>U</u>
        </ToolBtn>
        <ToolBtn cmd="strikeThrough" title="Strikethrough">
          <s className="text-xs">S</s>
        </ToolBtn>

        <Divider />

        {/* Text & Highlight colour */}
        <label className="flex items-center gap-0.5 cursor-pointer" title="Text Colour">
          <span className="text-xs font-bold text-gray-700 select-none">A</span>
          <input
            type="color"
            defaultValue="#000000"
            onChange={handleColor}
            className="w-5 h-5 cursor-pointer rounded border border-gray-300 p-0"
          />
        </label>

        <label className="flex items-center gap-0.5 cursor-pointer" title="Highlight Colour">
          <span className="text-xs font-bold bg-yellow-300 px-0.5 select-none">H</span>
          <input
            type="color"
            defaultValue="#FFFF00"
            onChange={handleHighlight}
            className="w-5 h-5 cursor-pointer rounded border border-gray-300 p-0"
          />
        </label>

        <Divider />

        {/* Alignment */}
        <ToolBtn cmd="justifyLeft" title="Align Left">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>
          </svg>
        </ToolBtn>
        <ToolBtn cmd="justifyCenter" title="Align Centre">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
          </svg>
        </ToolBtn>
        <ToolBtn cmd="justifyRight" title="Align Right">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/>
          </svg>
        </ToolBtn>
        <ToolBtn cmd="justifyFull" title="Justify">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </ToolBtn>

        <Divider />

        {/* Lists */}
        <ToolBtn cmd="insertUnorderedList" title="Bullet List">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/>
            <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
        </ToolBtn>
        <ToolBtn cmd="insertOrderedList" title="Numbered List">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>
            <text x="2" y="8" fontSize="7" fill="currentColor" stroke="none" fontFamily="monospace">1</text>
            <text x="2" y="14" fontSize="7" fill="currentColor" stroke="none" fontFamily="monospace">2</text>
            <text x="2" y="20" fontSize="7" fill="currentColor" stroke="none" fontFamily="monospace">3</text>
          </svg>
        </ToolBtn>

        <Divider />

        {/* Indent */}
        <ToolBtn cmd="outdent" title="Decrease Indent">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            <polyline points="7,9 4,12 7,15"/>
          </svg>
        </ToolBtn>
        <ToolBtn cmd="indent" title="Increase Indent">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            <polyline points="3,9 6,12 3,15"/>
          </svg>
        </ToolBtn>

        <Divider />

        {/* Super / Sub */}
        <ToolBtn cmd="superscript" title="Superscript">
          <span className="text-xs">x<sup>2</sup></span>
        </ToolBtn>
        <ToolBtn cmd="subscript" title="Subscript">
          <span className="text-xs">x<sub>2</sub></span>
        </ToolBtn>

        <Divider />

        {/* Heading shortcuts */}
        <ToolBtn cmd="formatBlock" title="Heading 1" value="H1">
          <span className="text-xs font-bold">H1</span>
        </ToolBtn>
        <ToolBtn cmd="formatBlock" title="Heading 2" value="H2">
          <span className="text-xs font-bold">H2</span>
        </ToolBtn>
        <ToolBtn cmd="formatBlock" title="Paragraph" value="P">
          <span className="text-xs">¶</span>
        </ToolBtn>

        <Divider />

        {/* Horizontal rule */}
        <ToolBtn cmd="insertHorizontalRule" title="Horizontal Rule">
          <span className="text-xs">──</span>
        </ToolBtn>

        {/* Clear format */}
        <button
          type="button"
          title="Clear Formatting"
          onMouseDown={e => {
            e.preventDefault();
            execCmd('removeFormat');
            execCmd('formatBlock', 'P');
            handleInput();
          }}
          className="ml-1 px-2 py-1 rounded text-xs text-red-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition focus:outline-none select-none"
        >
          Clear
        </button>
      </div>

      {/* ── EDITABLE AREA ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="bg-white focus:outline-none p-4 text-gray-800 text-sm leading-relaxed"
        style={{ minHeight, fontFamily: 'Times New Roman, serif', fontSize: '12pt' }}
      />
    </div>
  );
};

export default RichEditor;
