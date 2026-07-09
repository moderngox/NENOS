import { useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useBookDraft, MAX_SECONDARY_CHARACTERS, type SecondaryCharacter } from '../../context/BookDraftContext';

type Mode = 'list' | 'role' | 'details';

interface CharacterDraft {
  role: string;
  name: string;
  age: number | null;
  photo: File | null;
  hairColor: string | null;
  eyeColor: string | null;
  description: string;
}

const emptyCharacterDraft: CharacterDraft = {
  role: '',
  name: '',
  age: null,
  photo: null,
  hairColor: null,
  eyeColor: null,
  description: '',
};

function SwatchRow({
  options,
  selected,
  onSelect,
}: {
  options: { id: string; label: string; swatch: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {options.map((opt) => {
        const isSelected = selected === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            aria-pressed={isSelected}
            style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 44 }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: opt.swatch,
                border: isSelected ? '2.5px solid var(--cyan)' : '1px solid rgba(0,0,0,.08)',
                boxShadow: isSelected ? '0 2px 6px rgba(10,102,255,.25)' : '0 1px 2px rgba(0,0,0,.06)',
              }}
            />
            <span style={{ font: '600 9.5px Geist', color: isSelected ? 'var(--ink)' : 'var(--muted)', textAlign: 'center', lineHeight: 1.2 }}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function StepSecondaryCharacters({ heroName }: { heroName: string }) {
  const { t } = useLanguage();
  const { draft, addCharacter, removeCharacter } = useBookDraft();
  const [mode, setMode] = useState<Mode>('list');
  const [charDraft, setCharDraft] = useState<CharacterDraft>(emptyCharacterDraft);
  const fileRef = useRef<HTMLInputElement>(null);

  const characters = draft.secondaryCharacters;
  const canAddMore = characters.length < MAX_SECONDARY_CHARACTERS;

  const startAdd = () => {
    setCharDraft(emptyCharacterDraft);
    setMode('role');
  };

  const pickRole = (roleId: string) => {
    const roleLabel = t.wizard.step7.roles.find((r) => r.id === roleId)?.label ?? '';
    setCharDraft((prev) => ({ ...prev, role: roleId, name: prev.name || roleLabel }));
    setMode('details');
  };

  const cancelAdd = () => {
    setCharDraft(emptyCharacterDraft);
    setMode('list');
  };

  const confirmAdd = () => {
    if (!charDraft.name.trim()) return;
    const character: SecondaryCharacter = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role: charDraft.role,
      name: charDraft.name.trim(),
      age: charDraft.age,
      photo: charDraft.photo,
      hairColor: charDraft.hairColor,
      eyeColor: charDraft.eyeColor,
      description: charDraft.description,
    };
    addCharacter(character);
    setCharDraft(emptyCharacterDraft);
    setMode('list');
  };

  const selectedRole = t.wizard.step7.roles.find((r) => r.id === charDraft.role);

  return (
    <div style={{ width: '100%', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 24, color: 'var(--ink)', marginBottom: 6 }}>
        {t.wizard.step7.title(heroName || '—')}
      </div>
      <p style={{ font: '600 13px/1.5 Geist', color: 'var(--ink-soft)', margin: '0 0 12px' }}>{t.wizard.step7.subtitle}</p>
      <span
        style={{
          display: 'inline-block',
          font: '700 11px Geist',
          color: 'var(--cyan)',
          background: 'rgba(10,102,255,.1)',
          borderRadius: 999,
          padding: '4px 12px',
          marginBottom: 16,
        }}
      >
        {t.wizard.step7.badge}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
        {Array.from({ length: MAX_SECONDARY_CHARACTERS }, (_, i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: i < characters.length ? 'var(--cyan)' : 'var(--border)',
            }}
          />
        ))}
        <span style={{ font: '600 11px Geist', color: 'var(--muted)', marginLeft: 6 }}>
          {t.wizard.step7.counter(characters.length, MAX_SECONDARY_CHARACTERS)}
        </span>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 14, background: '#fff', textAlign: 'left', overflow: 'hidden' }}>
        {mode === 'list' && characters.length === 0 && (
          <button
            type="button"
            onClick={startAdd}
            style={{
              width: '100%',
              background: 'none',
              border: '1.5px dashed #C7C7CC',
              borderRadius: 14,
              padding: '36px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(10,102,255,.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              👥
            </div>
            <span style={{ font: '800 14px Geist', color: 'var(--ink)' }}>{t.wizard.step7.addTitle}</span>
            <span style={{ font: '600 12px Geist', color: 'var(--muted)', textAlign: 'center' }}>{t.wizard.step7.addHelper}</span>
          </button>
        )}

        {mode === 'list' && characters.length > 0 && (
          <div>
            {characters.map((c) => {
              const role = t.wizard.step7.roles.find((r) => r.id === c.role);
              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(10,102,255,.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flex: 'none',
                    }}
                  >
                    {role?.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: '700 14px Geist', color: 'var(--ink)' }}>{c.name}</div>
                    <div style={{ font: '600 11.5px Geist', color: 'var(--muted)' }}>{role?.label}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCharacter(c.id)}
                    aria-label="remove"
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 16, cursor: 'pointer', padding: 4 }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            {canAddMore && (
              <button
                type="button"
                onClick={startAdd}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  borderTop: characters.length > 0 ? '1px dashed var(--border)' : 'none',
                  padding: '14px 16px',
                  font: '700 13px Geist',
                  color: 'var(--ink-soft)',
                  textAlign: 'center',
                }}
              >
                {t.wizard.step7.addTitle}
              </button>
            )}
          </div>
        )}

        {mode === 'role' && (
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ font: '800 14px Geist', color: 'var(--ink)' }}>{t.wizard.step7.roleStepTitle}</span>
              <button type="button" onClick={cancelAdd} style={{ background: 'none', border: 'none', font: '700 12px Geist', color: 'var(--muted)' }}>
                {t.wizard.step7.cancel}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {t.wizard.step7.roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => pickRole(role.id)}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '14px 8px',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{role.emoji}</span>
                  <span style={{ font: '600 11px Geist', color: 'var(--ink)', textAlign: 'center', lineHeight: 1.2 }}>{role.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'details' && (
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(10,102,255,.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  flex: 'none',
                }}
              >
                {selectedRole?.emoji}
              </span>
              <div>
                <div style={{ font: '800 14px Geist', color: 'var(--ink)' }}>{selectedRole?.label}</div>
                <button
                  type="button"
                  onClick={() => setMode('role')}
                  style={{ background: 'none', border: 'none', font: '700 11.5px Geist', color: 'var(--cyan)', padding: 0 }}
                >
                  {t.wizard.step7.changeRole}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', font: '700 11.5px Geist', color: 'var(--ink)', marginBottom: 6 }}>
                  {t.wizard.step7.nameLabel}
                </label>
                <input
                  type="text"
                  value={charDraft.name}
                  onChange={(e) => setCharDraft((p) => ({ ...p, name: e.target.value }))}
                  style={{ width: '100%', font: '600 14px Geist', color: 'var(--ink)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', font: '700 11.5px Geist', color: 'var(--ink)', marginBottom: 6 }}>
                  {t.wizard.step7.ageLabel}
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={charDraft.age ?? ''}
                  onChange={(e) => setCharDraft((p) => ({ ...p, age: e.target.value ? Number(e.target.value) : null }))}
                  style={{ width: '100%', font: '600 14px Geist', color: 'var(--ink)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', font: '700 11.5px Geist', color: 'var(--ink)', marginBottom: 6 }}>
                {t.wizard.step7.photoLabel} <span style={{ color: 'var(--muted)', fontWeight: 600 }}>({t.wizard.step7.photoOptional})</span>
              </label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  border: '1.5px dashed #C7C7CC',
                  borderRadius: 10,
                  padding: '10px 12px',
                  background: '#fff',
                  font: '600 12.5px Geist',
                  color: 'var(--ink-soft)',
                }}
              >
                {charDraft.photo ? (
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundImage: `url(${URL.createObjectURL(charDraft.photo)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      flex: 'none',
                    }}
                  />
                ) : (
                  <span aria-hidden style={{ fontSize: 16 }}>
                    📷
                  </span>
                )}
                {t.wizard.step7.addPhoto}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg"
                hidden
                onChange={(e) => e.target.files?.[0] && setCharDraft((p) => ({ ...p, photo: e.target.files![0] }))}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', font: '700 11.5px Geist', color: 'var(--ink)', marginBottom: 8 }}>
                {t.wizard.step7.hairLabel}
              </label>
              <SwatchRow
                options={t.wizard.step7.hairColors}
                selected={charDraft.hairColor}
                onSelect={(id) => setCharDraft((p) => ({ ...p, hairColor: id }))}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', font: '700 11.5px Geist', color: 'var(--ink)', marginBottom: 8 }}>
                {t.wizard.step7.eyeLabel}
              </label>
              <SwatchRow
                options={t.wizard.step7.eyeColors}
                selected={charDraft.eyeColor}
                onSelect={(id) => setCharDraft((p) => ({ ...p, eyeColor: id }))}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', font: '700 11.5px Geist', color: 'var(--ink)', marginBottom: 6 }}>
                {t.wizard.step7.descriptionLabel} <span style={{ color: 'var(--muted)', fontWeight: 600 }}>({t.wizard.step7.descriptionOptional})</span>
              </label>
              <textarea
                value={charDraft.description}
                onChange={(e) => setCharDraft((p) => ({ ...p, description: e.target.value }))}
                placeholder={t.wizard.step7.descriptionPlaceholder}
                rows={2}
                style={{
                  width: '100%',
                  font: '500 13.5px/1.5 Geist',
                  color: 'var(--ink)',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
              <button type="button" onClick={cancelAdd} style={{ background: 'none', border: 'none', font: '700 13px Geist', color: 'var(--muted)' }}>
                {t.wizard.step7.cancelCta}
              </button>
              <button
                type="button"
                onClick={confirmAdd}
                disabled={!charDraft.name.trim()}
                className="cta"
                style={{ width: 'auto', padding: '10px 22px', fontSize: 14 }}
              >
                {t.wizard.step7.addCta}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
