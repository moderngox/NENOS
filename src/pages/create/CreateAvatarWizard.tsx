import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Stepper } from '../../components/Stepper';
import { useLanguage } from '../../context/LanguageContext';
import { useBookDraft } from '../../context/BookDraftContext';
import { StepName } from './StepName';
import { StepAge } from './StepAge';
import { StepTraits } from './StepTraits';
import { StepPhoto } from './StepPhoto';
import { StepAppearance } from './StepAppearance';
import { StepSecondaryCharacters } from './StepSecondaryCharacters';

const TOTAL_STEPS = 6;

// A shorter alternative to the full book wizard — same draft fields, minus
// the story prompt (steps here: Name, Age, Traits/Universe/Style, Photo,
// Appearance, Secondary characters) — for creating just the hero's avatar,
// free and without an account, for a new user not ready to commit to a book.
export function CreateAvatarWizard() {
  const { t } = useLanguage();
  const { draft, submitAvatar } = useBookDraft();
  const navigate = useNavigate();
  const { step: stepParam } = useParams();
  const requestedStep = Number(stepParam);
  const step = Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= TOTAL_STEPS ? requestedStep : 1;
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (String(step) !== stepParam) navigate(`/creer-avatar/${step}`, { replace: true });
  }, [step, stepParam, navigate]);

  const canAdvance = (() => {
    if (step === 1) return draft.name.trim().length > 0;
    if (step === 2) return draft.age !== null;
    return true;
  })();

  const goNext = async () => {
    if (step < TOTAL_STEPS) {
      navigate(`/creer-avatar/${step + 1}`);
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const { bookId } = await submitAvatar();
      navigate(`/avatar-pret/${bookId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };
  const goBack = () => {
    if (submitting) return;
    if (step > 1) navigate(`/creer-avatar/${step - 1}`);
    else navigate('/');
  };

  // Maps onto the full wizard's step titles (Prénom, Âge, Traits, Photo,
  // Apparence, Personnages secondaires), skipping the story-context one.
  const stepShortTitles = [
    t.wizard.stepShortTitles[0],
    t.wizard.stepShortTitles[1],
    t.wizard.stepShortTitles[2],
    t.wizard.stepShortTitles[4],
    t.wizard.stepShortTitles[5],
    t.wizard.stepShortTitles[6],
  ];

  return (
    <div className="screen">
      <Header variant="light" />
      <Stepper step={step} total={TOTAL_STEPS} title={stepShortTitles[step - 1]} />

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '24px 22px 20px', width: '100%' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          {step === 1 && <StepName />}
          {step === 2 && <StepAge />}
          {step === 3 && <StepTraits />}
          {step === 4 && <StepPhoto />}
          {step === 5 && <StepAppearance />}
          {step === 6 && <StepSecondaryCharacters heroName={draft.name} />}
        </div>
      </div>

      <div style={{ padding: '10px 22px 26px', display: 'flex', gap: 10, maxWidth: 520, margin: '0 auto', width: '100%' }}>
        <button type="button" className="cta-secondary" style={{ flex: 1 }} onClick={goBack} disabled={submitting}>
          {t.wizard.back}
        </button>
        {step === TOTAL_STEPS ? (
          <button type="button" className="cta" style={{ flex: 2 }} onClick={goNext} disabled={submitting}>
            {submitting ? t.avatarWizard.generating : t.avatarWizard.cta}
          </button>
        ) : (
          <button type="button" className="cta" style={{ flex: 2 }} onClick={goNext} disabled={!canAdvance}>
            {step === 4 ? t.wizard.step5.cta : t.wizard.next}
          </button>
        )}
      </div>
      {submitError && <p style={{ textAlign: 'center', margin: '-14px 0 20px', color: 'var(--red, #d33)' }}>{submitError}</p>}
      {step === 4 && (
        <p style={{ textAlign: 'center', margin: '-14px 0 20px' }}>
          <button
            type="button"
            onClick={goNext}
            style={{ background: 'none', border: 'none', font: '800 13px Geist', color: 'var(--cyan)', textDecoration: 'underline' }}
          >
            {t.wizard.step5.skip}
          </button>
        </p>
      )}
    </div>
  );
}
