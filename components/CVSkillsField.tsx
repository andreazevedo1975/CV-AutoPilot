import React, { useState } from 'react';
import { 
  Cpu, 
  Users, 
  Sparkles, 
  Plus, 
  X, 
  Loader2, 
  Tag, 
  Check, 
  Lightbulb, 
  Trash2, 
  RotateCcw,
  Code2,
  HeartHandshake
} from 'lucide-react';

interface CVSkillsFieldProps {
  technicalSkills: string[];
  softSkills: string[];
  onUpdateTechnicalSkills: (skills: string[]) => void;
  onUpdateSoftSkills: (skills: string[]) => void;
  cvText?: string;
  onExtractSkills?: () => Promise<void> | void;
  isExtracting?: boolean;
  colors: any;
  compact?: boolean;
  title?: string;
  allowExtraction?: boolean;
}

export const CVSkillsField: React.FC<CVSkillsFieldProps> = ({
  technicalSkills,
  softSkills,
  onUpdateTechnicalSkills,
  onUpdateSoftSkills,
  cvText = '',
  onExtractSkills,
  isExtracting = false,
  colors,
  compact = false,
  title = 'Competências & Habilidades (Hard Skills & Soft Skills)',
  allowExtraction = true,
}) => {
  const [newSkillText, setNewSkillText] = useState('');
  const [selectedType, setSelectedType] = useState<'technical' | 'soft'>('technical');
  const [activeTab, setActiveTab] = useState<'all' | 'technical' | 'soft'>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Suggestions for fast 1-click addition
  const quickSuggestions = [
    { name: 'TypeScript', type: 'technical' as const },
    { name: 'React', type: 'technical' as const },
    { name: 'Node.js', type: 'technical' as const },
    { name: 'Python', type: 'technical' as const },
    { name: 'AWS / Cloud', type: 'technical' as const },
    { name: 'Docker', type: 'technical' as const },
    { name: 'SQL / Bancos de Dados', type: 'technical' as const },
    { name: 'CI/CD Pipelines', type: 'technical' as const },
    { name: 'Liderança Técnica', type: 'soft' as const },
    { name: 'Comunicação Assertiva', type: 'soft' as const },
    { name: 'Resolução de Problemas', type: 'soft' as const },
    { name: 'Metodologias Ágeis (Scrum)', type: 'soft' as const },
  ];

  const totalSkillsCount = technicalSkills.length + softSkills.length;

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleAddSkill = (textToAdd?: string, typeOverride?: 'technical' | 'soft') => {
    const raw = (textToAdd ?? newSkillText).trim();
    if (!raw) return;

    const targetType = typeOverride || selectedType;

    if (targetType === 'technical') {
      const exists = technicalSkills.some(s => s.toLowerCase() === raw.toLowerCase());
      if (exists) {
        showFeedback(`A competência "${raw}" já está na lista técnica.`);
        return;
      }
      onUpdateTechnicalSkills([...technicalSkills, raw]);
      showFeedback(`Competência técnica "${raw}" adicionada!`);
    } else {
      const exists = softSkills.some(s => s.toLowerCase() === raw.toLowerCase());
      if (exists) {
        showFeedback(`A soft skill "${raw}" já está na lista.`);
        return;
      }
      onUpdateSoftSkills([...softSkills, raw]);
      showFeedback(`Soft skill "${raw}" adicionada!`);
    }

    if (!textToAdd) {
      setNewSkillText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveTechnicalSkill = (skillToRemove: string) => {
    onUpdateTechnicalSkills(technicalSkills.filter(s => s !== skillToRemove));
  };

  const handleRemoveSoftSkill = (skillToRemove: string) => {
    onUpdateSoftSkills(softSkills.filter(s => s !== skillToRemove));
  };

  const handleClearAll = () => {
    onUpdateTechnicalSkills([]);
    onUpdateSoftSkills([]);
    showFeedback('Todas as tags de competências foram removidas.');
  };

  return (
    <div style={{
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: compact ? '14px' : '20px',
      boxShadow: colors.shadowSm || '0 1px 3px rgba(0,0,0,0.05)',
      marginTop: '10px',
      marginBottom: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      {/* Header with Title, Badges & AI Extract Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: `${colors.primary}18`,
            color: colors.primary
          }}>
            <Tag size={18} />
          </div>
          <div>
            <h3 style={{
              fontSize: compact ? '14px' : '16px',
              fontWeight: 700,
              color: colors.textPrimary,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{title}</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: totalSkillsCount > 0 ? `${colors.primary}20` : '#e2e8f0',
                color: totalSkillsCount > 0 ? colors.primary : colors.textSecondary
              }}>
                {totalSkillsCount} tags
              </span>
            </h3>
            {!compact && (
              <p style={{
                fontSize: '12px',
                color: colors.textSecondary,
                margin: '2px 0 0 0'
              }}>
                Extraia automaticamente do texto do currículo com IA ou personalize suas hard skills e soft skills
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons: Auto Extract with AI & Clear */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {totalSkillsCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: 'transparent',
                color: colors.textSecondary,
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600
              }}
              title="Remover todas as tags de competências"
            >
              <Trash2 size={13} />
              <span>Limpar</span>
            </button>
          )}

          {allowExtraction && onExtractSkills && (
            <button
              type="button"
              onClick={onExtractSkills}
              disabled={isExtracting || !cvText || cvText.trim().length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: compact ? '7px 12px' : '8px 16px',
                borderRadius: '8px',
                backgroundColor: (!cvText || cvText.trim().length === 0) 
                  ? '#cbd5e1' 
                  : (isExtracting ? `${colors.primary}90` : colors.primary),
                color: '#ffffff',
                border: 'none',
                cursor: (!cvText || cvText.trim().length === 0 || isExtracting) ? 'not-allowed' : 'pointer',
                fontSize: compact ? '12px' : '13px',
                fontWeight: 700,
                boxShadow: colors.shadowSm || '0 1px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.15s ease'
              }}
              title={
                !cvText || cvText.trim().length === 0
                  ? "Cole ou carregue o texto do currículo primeiro para extrair as competências com IA"
                  : "Extrair automaticamente hard skills e soft skills do texto usando inteligência artificial"
              }
            >
              {isExtracting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Extraindo Skills com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>{totalSkillsCount > 0 ? 'Re-extrair com IA' : 'Extrair Competências (IA)'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Inline Feedback Banner if any */}
      {feedbackMsg && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          color: '#1d4ed8',
          fontSize: '12px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Check size={14} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Interactive Input to Add New Skill Tags */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        backgroundColor: colors.background || '#f8fafc',
        padding: '12px',
        borderRadius: '10px',
        border: `1px solid ${colors.border}`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary }}>
            Adicionar Nova Competência Interativa:
          </span>

          {/* Type Selector (Technical vs Soft) */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#e2e8f0', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setSelectedType('technical')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: selectedType === 'technical' ? '#ffffff' : 'transparent',
                color: selectedType === 'technical' ? '#2563eb' : colors.textSecondary,
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: selectedType === 'technical' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Cpu size={12} />
              <span>Hard Skill (Técnica)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('soft')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: selectedType === 'soft' ? '#ffffff' : 'transparent',
                color: selectedType === 'soft' ? '#059669' : colors.textSecondary,
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: selectedType === 'soft' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Users size={12} />
              <span>Soft Skill (Comportamental)</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder={
                selectedType === 'technical'
                  ? "Digite uma competência técnica (ex: Docker, Kubernetes, React, Python, AWS...)"
                  : "Digite uma soft skill (ex: Liderança, Comunicação, Resolução de Problemas...)"
              }
              value={newSkillText}
              onChange={(e) => setNewSkillText(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => handleAddSkill()}
            disabled={!newSkillText.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: !newSkillText.trim() ? '#cbd5e1' : (selectedType === 'technical' ? '#2563eb' : '#059669'),
              color: '#ffffff',
              border: 'none',
              cursor: !newSkillText.trim() ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={15} />
            <span>Adicionar Tag</span>
          </button>
        </div>

        {/* Quick Suggestion Chips (if not compact) */}
        {!compact && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: colors.textSecondary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lightbulb size={12} color="#f59e0b" />
              Sugestões rápidas:
            </span>
            {quickSuggestions.map((item, idx) => {
              const list = item.type === 'technical' ? technicalSkills : softSkills;
              const isAlreadyAdded = list.some(s => s.toLowerCase() === item.name.toLowerCase());
              if (isAlreadyAdded) return null;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddSkill(item.name, item.type)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    border: '1px dashed #cbd5e1',
                    backgroundColor: colors.surface,
                    color: item.type === 'technical' ? '#1d4ed8' : '#047857',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.15s ease'
                  }}
                  title={`Adicionar ${item.name} como ${item.type === 'technical' ? 'Hard Skill' : 'Soft Skill'}`}
                >
                  <Plus size={10} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter Tabs between All, Technical and Soft */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: '8px'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'all' ? `${colors.primary}18` : 'transparent',
            color: activeTab === 'all' ? colors.primary : colors.textSecondary,
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Todas ({totalSkillsCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('technical')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'technical' ? '#eff6ff' : 'transparent',
            color: activeTab === 'technical' ? '#2563eb' : colors.textSecondary,
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Cpu size={13} />
          <span>Competências Técnicas ({technicalSkills.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('soft')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'soft' ? '#ecfdf5' : 'transparent',
            color: activeTab === 'soft' ? '#059669' : colors.textSecondary,
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Users size={13} />
          <span>Soft Skills ({softSkills.length})</span>
        </button>
      </div>

      {/* Display Interactive Skills Tags */}
      {totalSkillsCount === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '24px 16px',
          border: `1px dashed ${colors.border}`,
          borderRadius: '10px',
          backgroundColor: `${colors.surface}`
        }}>
          <Tag size={28} color={colors.textSecondary} style={{ margin: '0 auto 8px auto', opacity: 0.6 }} />
          <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
            Nenhuma competência extraída ou vinculada ainda.
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: colors.textSecondary }}>
            {cvText && cvText.trim().length > 0 
              ? "Clique em 'Extrair Competências (IA)' acima para identificar automaticamente hard skills e soft skills do texto."
              : "Cole ou envie um currículo e use a IA para extrair as principais tecnologias e competências comportamentais."}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Section 1: Hard Skills (Technical) */}
          {(activeTab === 'all' || activeTab === 'technical') && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#1d4ed8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Code2 size={14} />
                  Competências Técnicas / Hard Skills ({technicalSkills.length})
                </span>
                <span style={{ fontSize: '11px', color: colors.textSecondary }}>
                  Clique no ✕ para remover
                </span>
              </div>

              {technicalSkills.length === 0 ? (
                <p style={{ fontSize: '12px', color: colors.textSecondary, fontStyle: 'italic', margin: '4px 0' }}>
                  Nenhuma competência técnica adicionada.
                </p>
              ) : (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {technicalSkills.map((skill, index) => (
                    <span
                      key={`tech-${index}-${skill}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 10px',
                        backgroundColor: '#eff6ff',
                        color: '#1e40af',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        boxShadow: '0 1px 2px rgba(37,99,235,0.06)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Cpu size={12} color="#3b82f6" />
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTechnicalSkill(skill)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#60a5fa',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '1px',
                          borderRadius: '50%',
                          marginLeft: '2px'
                        }}
                        title={`Remover competência técnica "${skill}"`}
                        aria-label={`Remover ${skill}`}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 2: Soft Skills */}
          {(activeTab === 'all' || activeTab === 'soft') && (
            <div style={{ marginTop: activeTab === 'all' ? '6px' : '0' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#047857',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <HeartHandshake size={14} />
                  Soft Skills & Habilidades Comportamentais ({softSkills.length})
                </span>
                <span style={{ fontSize: '11px', color: colors.textSecondary }}>
                  Clique no ✕ para remover
                </span>
              </div>

              {softSkills.length === 0 ? (
                <p style={{ fontSize: '12px', color: colors.textSecondary, fontStyle: 'italic', margin: '4px 0' }}>
                  Nenhuma soft skill adicionada.
                </p>
              ) : (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {softSkills.map((skill, index) => (
                    <span
                      key={`soft-${index}-${skill}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 10px',
                        backgroundColor: '#ecfdf5',
                        color: '#065f46',
                        border: '1px solid #a7f3d0',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        boxShadow: '0 1px 2px rgba(5,150,105,0.06)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Users size={12} color="#10b981" />
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSoftSkill(skill)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#34d399',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '1px',
                          borderRadius: '50%',
                          marginLeft: '2px'
                        }}
                        title={`Remover soft skill "${skill}"`}
                        aria-label={`Remover ${skill}`}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
