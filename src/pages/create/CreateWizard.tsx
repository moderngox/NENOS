import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Stepper } from '../../components/Stepper';
import { useLanguage } from '../../context/LanguageContext';
import { useBookDraft } from '../../context/BookDraftContext';
import { StepName } from './StepName';
import { StepAge } from './StepAge';
import { StepTraits } from './StepTraits';
import { StepStoryPrompt } from './StepStoryPrompt';
import { StepPhoto } from './StepPhoto';
import { StepAppearance } from './StepAppearance';
import { StepSecondaryCharacters } from './StepSecondaryCharacters';
import { LivePreview } from './LivePreview';

const TOTAL_STEPS = 7;

export function CreateWizard() {
  const { t } = useLanguage();
  const { draft, submit } = useBookDraft();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canAdvance = (() => {
    if (step === 1) return draft.name.trim().length > 0;
    if (step === 2) return draft.age !== null;
    return true;
  })();

  const goNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      await submit();
      navigate('/revelation');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };
  const goBack = () => {
    if (submitting) return;
    if (step > 1) setStep(step - 1);
    else navigate('/');
  };

  const showPreview = step >= 3;

  return (
    <div className="screen">
      <Header variant="light" />
      <Stepper step={step} total={TOTAL_STEPS} title={t.wizard.stepShortTitles[step - 1]} />

      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: 60,
          justifyContent: 'center',
          padding: '24px 22px 20px',
          width: '100%',
        }}
      >
        <div style={{ width: '100%', maxWidth: 520 }}>
          {step === 1 && <StepName />}
          {step === 2 && <StepAge />}
          {step === 3 && <StepTraits />}
          {step === 4 && <StepStoryPrompt />}
          {step === 5 && <StepPhoto />}
          {step === 6 && <StepAppearance />}
          {step === 7 && <StepSecondaryCharacters heroName={draft.name} />}
        </div>
        {showPreview && <LivePreview />}
      </div>

      <div
        style={{
          padding: '10px 22px 26px',
          display: 'flex',
          gap: 10,
          maxWidth: 520 + (showPreview ? 340 : 0),
          margin: '0 auto',
          width: '100%',
        }}
      >
        <button type="button" className="cta-secondary" style={{ flex: 1 }} onClick={goBack} disabled={submitting}>
          {t.wizard.back}
        </button>
        {step === TOTAL_STEPS ? (
          <button type="button" className="cta" style={{ flex: 2 }} onClick={goNext} disabled={submitting}>
            {submitting ? t.wizard.generating : t.wizard.step7.cta}
          </button>
        ) : (
          <button type="button" className="cta" style={{ flex: 2 }} onClick={goNext} disabled={!canAdvance}>
            {step === 5 ? t.wizard.step5.cta : t.wizard.next}
          </button>
        )}
      </div>
      {submitError && (
        <p style={{ textAlign: 'center', margin: '-14px 0 20px', color: 'var(--red, #d33)' }}>{submitError}</p>
      )}
      {step === 4 && (
        <p style={{ textAlign: 'center', margin: '-14px 0 20px' }}>
          <button
            type="button"
            onClick={goNext}
            style={{ background: 'none', border: 'none', font: '800 13px Geist', color: 'var(--cyan)', textDecoration: 'underline' }}
          >
            {t.wizard.step4.skip}
          </button>
        </p>
      )}
      {step === 5 && (
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
