import { forwardRef } from 'react';
import type { LetterData } from '../types/letter';

const LetterPreview = forwardRef<HTMLDivElement, { data: LetterData }>(({ data }, ref) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    } catch {}
    return dateStr;
  };

  const bodyHasContent = data.body && data.body.replace(/<[^>]*>/g, '').trim().length > 0;

  return (
    <div
      ref={ref}
      className="letter-preview bg-white"
      style={{
        fontFamily: 'Times New Roman, Times, serif',
        fontSize: '12pt',
        lineHeight: '1.7',
        color: '#1a1a1a',
        padding: '2.5cm 2.5cm 2.5cm 3cm',
        minHeight: '29.7cm',
        width: '21cm',
        maxWidth: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* ── LETTERHEAD ── */}
      {data.letterhead ? (
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '15pt',
              fontWeight: 'bold',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            {data.letterhead}
          </div>
          {/* Double rule */}
          <div style={{ height: '3px', background: '#1a1a1a', margin: '6px 0 2px' }} />
          <div style={{ height: '1px', background: '#1a1a1a', margin: '0 0 6px' }} />
        </div>
      ) : (
        /* Light divider when no letterhead */
        <div style={{ borderBottom: '1px solid #ccc', marginBottom: '20px' }} />
      )}

      {/* ── REF & DATE ROW ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
        {/* Left: Ref + Sender */}
        <div style={{ maxWidth: '55%' }}>
          {data.no && (
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontWeight: 'bold' }}>Ref. No.:</span>&nbsp;{data.no}
            </div>
          )}
          {data.sender &&
            data.sender.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
        </div>

        {/* Right: Date */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {data.date && (
            <div>{formatDate(data.date)}</div>
          )}
        </div>
      </div>

      {/* ── TO (RECEIVER) ── */}
      {data.receiver && (
        <div style={{ marginBottom: '18px' }}>
          {data.receiver.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      {/* ── SUBJECT ── */}
      {data.subject && (
        <div style={{ marginBottom: '18px' }}>
          <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
            RE:&nbsp;{data.subject.toUpperCase()}
          </span>
        </div>
      )}

      {/* ── SALUTATION ── */}
      <div style={{ marginBottom: '14px' }}>
        Dear Sir/Madam,
      </div>

      {/* ── BODY ── */}
      {bodyHasContent ? (
        <div
          style={{ marginBottom: '24px', textAlign: 'justify' }}
          dangerouslySetInnerHTML={{ __html: data.body }}
        />
      ) : (
        <div style={{ marginBottom: '80px' }} />
      )}

      {/* ── CLOSING ── */}
      <div style={{ marginBottom: '48px' }}>
        Yours faithfully,
      </div>

      {/* ── SIGNATURE BLOCK ── */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            borderBottom: '1px solid #555',
            width: '200px',
            marginBottom: '5px',
          }}
        />
        {data.signatoryName && (
          <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>{data.signatoryName}</div>
        )}
        {data.signatureTitle && (
          <div style={{ fontStyle: 'italic', fontSize: '11pt' }}>{data.signatureTitle}</div>
        )}
      </div>

      {/* ── CC ── */}
      {data.cc && (
        <div
          style={{
            borderTop: '1px solid #bbb',
            paddingTop: '12px',
            marginTop: '16px',
            marginBottom: '12px',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>CC:</div>
          <div style={{ whiteSpace: 'pre-line' }}>{data.cc}</div>
        </div>
      )}

      {/* ── FORWARDINGS ── */}
      {data.forwardings.filter(f => f.trim()).length > 0 && (
        <div
          style={{
            borderTop: data.cc ? 'none' : '1px solid #bbb',
            paddingTop: data.cc ? '0' : '12px',
            marginTop: data.cc ? '8px' : '16px',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
            Distribution / Forwarding:
          </div>
          <ol style={{ margin: 0, paddingLeft: '22px' }}>
            {data.forwardings.filter(f => f.trim()).map((fw, i) => (
              <li key={i} style={{ marginBottom: '3px' }}>{fw}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
});

LetterPreview.displayName = 'LetterPreview';

export default LetterPreview;
