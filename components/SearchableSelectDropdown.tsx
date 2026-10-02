// components/SearchableSelectDropdown.tsx - Componente Executivo de Seleção com Lista Suspensa Imediata ao Clicar
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X, Globe, MapPin } from 'lucide-react';

interface SearchableSelectDropdownProps {
  value: string;
  options: string[];
  onChange: (newValue: string) => void;
  placeholder?: string;
  countLabel?: string;
  colors: any;
  disabled?: boolean;
  id?: string;
  allowCustom?: boolean;
}

export const SearchableSelectDropdown: React.FC<SearchableSelectDropdownProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Clique para selecionar...',
  countLabel,
  colors,
  disabled = false,
  id,
  allowCustom = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fecha a lista suspensa ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtra as opções conforme o usuário digita
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) {
      return options;
    }
    const query = searchTerm.toLowerCase().trim();
    return options.filter(opt => opt.toLowerCase().includes(query));
  }, [options, searchTerm]);

  const handleSelectOption = (option: string) => {
    onChange(option);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setSearchTerm(val);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Ao clicar no campo, a lista suspensa aparece imediatamente
  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      if (filteredOptions.length > 0) {
        handleSelectOption(filteredOptions[0]);
      } else if (allowCustom && value.trim()) {
        setIsOpen(false);
      }
    } else if (e.key === 'ArrowDown' && !isOpen) {
      setIsOpen(true);
    }
  };

  // Rótulo formatado para exibição (caso seja 'Todos', enfatiza que é busca global)
  const isTodosSelected = value.toLowerCase().trim() === 'todos';

  return (
    <div ref={containerRef} className="relative w-full" style={{ position: 'relative' }}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          type="text"
          disabled={disabled}
          value={value}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full text-xs p-2.5 pr-8 rounded-xl border font-medium outline-none transition-all cursor-pointer"
          style={{
            backgroundColor: colors.inputBg || colors.surface,
            borderColor: isOpen ? (colors.borderFocus || colors.primary) : colors.border,
            color: colors.textPrimary,
            boxShadow: isOpen ? `0 0 0 2px ${colors.primaryLight || 'rgba(136,19,55,0.15)'}` : 'none'
          }}
        />

        {/* Indicador visual se 'Todos' está selecionado */}
        {isTodosSelected && (
          <span 
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded pointer-events-none flex items-center gap-1"
            style={{
              backgroundColor: colors.primaryLight || 'rgba(136, 19, 55, 0.12)',
              color: colors.primary
            }}
          >
            <Globe size={11} />
            <span>Todos (Busca Global)</span>
          </span>
        )}

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) {
              setIsOpen(prev => !prev);
              if (!isOpen) {
                inputRef.current?.focus();
              }
            }
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity cursor-pointer p-0.5"
          style={{ color: colors.textSecondary }}
          title="Clique para abrir ou fechar a lista suspensa"
        >
          <ChevronDown 
            size={15} 
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>
      </div>

      {/* Lista Suspensa (Dropdown) */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 rounded-2xl border shadow-2xl overflow-hidden z-50 animate-fadeIn"
          style={{
            backgroundColor: colors.surfaceElevated || colors.surface,
            borderColor: colors.borderFocus || colors.border,
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
            maxHeight: '290px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header da Lista Suspensa com Busca Rápida e Contagem */}
          <div 
            className="p-2 border-b flex items-center justify-between gap-2"
            style={{ 
              borderColor: colors.border,
              backgroundColor: colors.surfaceHover || colors.background 
            }}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Search size={13} style={{ color: colors.textSecondary }} />
              <input
                type="text"
                autoFocus
                placeholder="Filtrar nesta lista suspensa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-[11px] font-medium outline-none"
                style={{ color: colors.textPrimary }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="opacity-60 hover:opacity-100 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <span 
              className="text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 opacity-80"
              style={{ 
                backgroundColor: colors.primaryLight,
                color: colors.primary 
              }}
            >
              {filteredOptions.length} {countLabel || 'opções'}
            </span>
          </div>

          {/* Itens da Lista Suspensa com Rolagem Suave */}
          <div className="overflow-y-auto max-h-56 p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs opacity-75" style={{ color: colors.textSecondary }}>
                Nenhuma opção encontrada com &quot;{searchTerm}&quot;.
                {allowCustom && (
                  <div className="mt-1 font-semibold text-[11px]" style={{ color: colors.primary }}>
                    Pressione Enter para usar o valor digitado.
                  </div>
                )}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value.toLowerCase().trim() === opt.toLowerCase().trim();
                const isOptionTodos = opt.toLowerCase().trim() === 'todos';

                return (
                  <div
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isSelected 
                        ? (colors.primaryLight || 'rgba(136, 19, 55, 0.12)') 
                        : isOptionTodos ? 'rgba(59, 130, 246, 0.06)' : 'transparent',
                      color: isSelected ? colors.primary : colors.textPrimary
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = colors.surfaceHover || 'rgba(0,0,0,0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = isOptionTodos ? 'rgba(59, 130, 246, 0.06)' : 'transparent';
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {isOptionTodos ? (
                        <Globe size={13} className="text-blue-500 shrink-0" />
                      ) : (
                        <MapPin size={12} className="opacity-40 shrink-0" />
                      )}
                      <span className="truncate">
                        {isOptionTodos ? 'Todos (Busca Global em toda a cidade)' : opt}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {isOptionTodos && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          Padrão Global
                        </span>
                      )}
                      {isSelected && (
                        <Check size={14} className="shrink-0 text-emerald-500 font-bold" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelectDropdown;
