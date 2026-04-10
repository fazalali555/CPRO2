import React from 'react';
import { Button, Card, Badge } from '../../../../components/M3';
import { AppIcon } from '../../../../components/AppIcon';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface ApplicationField {
  label: string;
  value: string | number;
  type?: 'text' | 'number' | 'date' | 'currency' | 'badge';
  variant?: 'default' | 'success' | 'warning' | 'error';
}

interface ApplicationSection {
  title: string;
  icon?: string;
  fields: ApplicationField[];
}

interface ApplicationViewerProps {
  title: string;
  applicationNumber: string;
  sections: ApplicationSection[];
  status: string;
  statusVariant?: 'default' | 'success' | 'warning' | 'error';
  onPrint: () => void;
  onEdit?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onClose: () => void;
  attachments?: string[];
}

export const ApplicationViewer: React.FC<ApplicationViewerProps> = ({
  title,
  applicationNumber,
  sections,
  status,
  statusVariant = 'default',
  onPrint,
  onEdit,
  onApprove,
  onReject,
  onClose,
  attachments = [],
}) => {
  const { isUrdu } = useLanguage();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card variant="filled" className="bg-surface w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`sticky top-0 bg-surface border-b border-outline-variant/30 p-4 flex justify-between items-start ${isUrdu ? 'flex-row-reverse' : ''}`}>
          <div className={isUrdu ? 'text-right' : ''}>
            <h2 className="text-xl font-bold text-on-surface">{title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-on-surface-variant font-mono">
                {applicationNumber}
              </span>
              <Badge variant={statusVariant} label={status} />
            </div>
          </div>
          <Button
            variant="text"
            icon="close"
            onClick={onClose}
            className="h-8 w-8 min-w-0"
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {sections.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              <div className={`flex items-center gap-2 mb-3 ${isUrdu ? 'flex-row-reverse' : ''}`}>
                {section.icon && <AppIcon name={section.icon} size={20} className="text-primary" />}
                <h3 className="font-bold text-on-surface">{section.title}</h3>
              </div>
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isUrdu ? 'dir-rtl' : ''}`}>
                {section.fields.map((field, fieldIdx) => (
                  <div key={fieldIdx} className={`${field.type === 'text' && field.value.toString().length > 50 ? 'md:col-span-2' : ''}`}>
                    <div className={`text-xs text-on-surface-variant mb-1 ${isUrdu ? 'text-right' : ''}`}>
                      {field.label}
                    </div>
                    {field.type === 'badge' ? (
                      <Badge variant={field.variant || 'default'} label={field.value.toString()} />
                    ) : field.type === 'currency' ? (
                      <div className="font-mono font-bold text-on-surface">
                        PKR {Number(field.value).toLocaleString()}
                      </div>
                    ) : field.type === 'date' ? (
                      <div className="font-medium text-on-surface">
                        {new Date(field.value).toLocaleDateString()}
                      </div>
                    ) : (
                      <div className="font-medium text-on-surface break-words">
                        {field.value}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div>
              <h3 className="font-bold text-on-surface mb-3 flex items-center gap-2">
                <AppIcon name="attach_file" size={20} className="text-primary" />
                {isUrdu ? 'منسلکات' : 'Attachments'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {attachments.map((attachment, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-outline-variant rounded-lg flex items-center gap-2 hover:bg-surface-variant/20 cursor-pointer"
                  >
                    <AppIcon name="description" size={20} className="text-primary" />
                    <span className="text-xs truncate">{attachment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`sticky bottom-0 bg-surface border-t border-outline-variant/30 p-4 flex gap-2 ${isUrdu ? 'flex-row-reverse' : 'justify-end'}`}>
          {onReject && (
            <Button
              variant="outlined"
              label={isUrdu ? 'مسترد' : 'Reject'}
              icon="close"
              onClick={onReject}
            />
          )}
          {onApprove && (
            <Button
              variant="tonal"
              label={isUrdu ? 'منظور' : 'Approve'}
              icon="check"
              onClick={onApprove}
            />
          )}
          {onEdit && (
            <Button
              variant="tonal"
              label={isUrdu ? 'ترمیم' : 'Edit'}
              icon="edit"
              onClick={onEdit}
            />
          )}
          <Button
            variant="filled"
            label={isUrdu ? 'پرنٹ' : 'Print'}
            icon="print"
            onClick={onPrint}
          />
        </div>
      </Card>
    </div>
  );
};
