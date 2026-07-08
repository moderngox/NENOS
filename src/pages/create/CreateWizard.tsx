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
import { LivePreview } from './LivePreview';

const TOTAL_STEPS = 5;

export function CreateWizard() {
  const { t } = useLanguage();
  const { draft } = useBookDraft();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const canAdvance = (() => {
    if (step === 1) return draft.name.trim().length > 0;
    if (step === 2) return draft.age !== null;
    return true;
  })();

  const goNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
    else navigate('/revelation');
  };
  const goBack = () => {
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
        <button type="button" className="cta-secondary" style={{ flex: 1 }} onClick={goBack}>
          {t.wizard.back}
        </button>
        {step === TOTAL_STEPS ? (
          <button type="button" className="cta" style={{ flex: 2 }} onClick={goNext}>
            {t.wizard.step5.cta}
          </button>
        ) : (
          <button type="button" className="cta" style={{ flex: 2 }} onClick={goNext} disabled={!canAdvance}>
            {t.wizard.next}
          </button>
        )}
      </div>
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
