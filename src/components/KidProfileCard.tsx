import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import unknownAvatar from '../assets/unknownAvatar.svg';

function findLabel(list: { id: string; label: string }[], id: string | null): string | null {
  if (!id) return null;
  return list.find((o) => o.id === id)?.label ?? null;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        font: '700 12px Geist',
        color: '#fff',
        background: 'rgba(255,255,255,.14)',
        border: '1px solid rgba(255,255,255,.22)',
        borderRadius: 999,
        padding: '6px 13px',
      }}
    >
      {children}
    </span>
  );
}

export function KidProfileCard() {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const cardBase: React.CSSProperties = {
    borderRadius: 20,
    padding: '28px 24px',
    marginBottom: 28,
    background: 'linear-gradient(135deg, var(--ink) 0%, #2a2350 100%)',
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
  };

  // Blank/new-account state — no committed books yet, per product spec:
  // show the default placeholder avatar and push the user to create one.
  if (!profile || !profile.hasBooks) {
    return (
      <div style={{ ...cardBase, textAlign: 'center' }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            margin: '0 auto 18px',
            backgroundImage: `url(${unknownAvatar})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '3px solid rgba(255,255,255,.25)',
          }}
        />
        <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 20, marginBottom: 10 }}>
          {t.kidProfile.emptyTitle}
        </div>
        <p style={{ font: '600 14px/1.6 Geist', color: 'rgba(255,255,255,.75)', maxWidth: 420, margin: '0 auto 20px' }}>
          {t.kidProfile.emptyMessage}
        </p>
        <Link to="/creer" className="cta" style={{ display: 'inline-block', width: 'auto', padding: '13px 26px' }}>
          {t.kidProfile.emptyCta}
        </Link>
      </div>
    );
  }

  const universeLabels = profile.favoriteUniverses.map((id) => findLabel(t.wizard.step3.universes, id) ?? id);
  const skinLabel = findLabel(t.wizard.step6.skinColors, profile.skinColor);
  const hairLabel = findLabel(t.wizard.step6.hairColors, profile.hairColor);
  const eyeLabel = findLabel(t.wizard.step6.eyeColors, profile.eyeColor);
  const featureChips = [...profile.traits, skinLabel, hairLabel, eyeLabel].filter(Boolean) as string[];

  return (
    <div style={cardBase}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 22 }}>
        <div
          style={{
            width: 88,
            height: 88,
            flex: 'none',
            borderRadius: '50%',
            backgroundImage: `url(${profile.avatarUrl || unknownAvatar})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '3px solid rgba(255,255,255,.3)',
            boxShadow: '0 4px 16px rgba(0,0,0,.3)',
          }}
        />
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 24 }}>
            {profile.name}
            {profile.age != null && (
              <span style={{ fontWeight: 600, fontSize: 15, color: 'rgba(255,255,255,.7)', marginLeft: 8 }}>
                · {t.kidProfile.ageValue(profile.age)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 16 }} aria-hidden="true">
              ⭐
            </span>
            <span style={{ font: '800 15px Geist', color: 'var(--yellow)' }}>{profile.points}</span>
            <span style={{ font: '600 12px Geist', color: 'rgba(255,255,255,.65)' }}>{t.kidProfile.pointsLabel}</span>
            <span style={{ font: '600 12px Geist', color: 'rgba(255,255,255,.5)', marginLeft: 6 }}>
              · {t.kidProfile.booksGeneratedLabel(profile.booksGenerated)}
            </span>
          </div>
        </div>
      </div>

      {universeLabels.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ font: '700 11px Geist', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            {t.kidProfile.favoriteUniversesTitle}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {universeLabels.map((label) => (
              <Chip key={label}>{label}</Chip>
            ))}
          </div>
        </div>
      )}

      {featureChips.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ font: '700 11px Geist', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            {t.kidProfile.featuresTitle}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {featureChips.map((label, i) => (
              <Chip key={`${label}-${i}`}>{label}</Chip>
            ))}
          </div>
        </div>
      )}

      {profile.secondaryCharacters.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ font: '700 11px Geist', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            {t.kidProfile.secondaryCharactersTitle}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {profile.secondaryCharacters.map((c) => {
              const role = t.wizard.step7.roles.find((r) => r.id === c.role);
              return (
                <span
                  key={c.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    font: '700 12px Geist',
                    color: '#fff',
                    background: 'rgba(255,255,255,.1)',
                    border: '1px solid rgba(255,255,255,.18)',
                    borderRadius: 999,
                    padding: '6px 13px 6px 9px',
                  }}
                >
                  <span aria-hidden="true">{role?.emoji ?? '👤'}</span>
                  {c.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          borderRadius: 14,
          padding: '14px 16px',
          background: 'rgba(255,255,255,.06)',
          border: '1px dashed rgba(255,255,255,.25)',
        }}
      >
        <span style={{ fontSize: 24, flex: 'none' }} aria-hidden="true">
          🗺️
        </span>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 800, fontSize: 14 }}>{t.kidProfile.mapsTitle}</span>
            <span
              style={{
                font: '700 10px Geist',
                color: 'var(--ink)',
                background: 'var(--yellow)',
                borderRadius: 999,
                padding: '2px 9px',
                textTransform: 'uppercase',
                letterSpacing: 0.4,
              }}
            >
              {t.kidProfile.mapsBadge}
            </span>
          </div>
          <p style={{ font: '600 12px/1.5 Geist', color: 'rgba(255,255,255,.6)', margin: '4px 0 0' }}>{t.kidProfile.mapsDescription}</p>
        </div>
      </div>
    </div>
  );
}
