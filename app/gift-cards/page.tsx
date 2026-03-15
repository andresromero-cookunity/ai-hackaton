'use client';

import { useState } from 'react';
import styles from './gift-cards.module.css';

const AMOUNTS = [50, 75, 100, 150, 200];

const THEMES = [
  { id: 'birthday', label: '🎂 Birthday', bg: '#fef3c7', accent: '#d97706', pattern: 'confetti' },
  { id: 'holiday', label: '🎄 Holiday', bg: '#dcfce7', accent: '#16a34a', pattern: 'snowflakes' },
  { id: 'thanks', label: '💛 Thank You', bg: '#fce7f3', accent: '#db2777', pattern: 'hearts' },
  { id: 'anytime', label: '✨ Just Because', bg: '#ede9fe', accent: '#7c3aed', pattern: 'stars' },
];

const STEPS = ['Personalizar', 'Destinatario', 'Revisar'];

export default function GiftCardsPage() {
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [theme, setTheme] = useState(THEMES[0]);
  const [message, setMessage] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [sendDate, setSendDate] = useState('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const finalAmount = useCustom ? Number(customAmount) || 0 : amount;
  const today = new Date().toISOString().split('T')[0];

  function handleNext() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }
  function handleBack() {
    if (step > 0) setStep(step - 1);
  }
  function handleSubmit() {
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className={styles.successWrapper}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>🎉</div>
          <h2>¡Gift Card enviada!</h2>
          <p>
            <strong>{recipientName || 'Tu amigo'}</strong> recibirá su regalo de{' '}
            <strong>${finalAmount}</strong> en <strong>{recipientEmail}</strong>.
          </p>
          <p className={styles.successSub}>
            Se ha enviado una confirmación a {senderName || 'ti'}.
          </p>
          <button className={styles.btnPrimary} onClick={() => setSubmitted(false)}>
            Enviar otro regalo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <p className={styles.heroKicker}>Regala experiencias deliciosas</p>
        <h1 className={styles.heroTitle}>Gift Cards CooKunity</h1>
        <p className={styles.heroSub}>
          Comidas chef-preparadas, entregadas a casa. El regalo perfecto para quien más querés.
        </p>
      </div>

      <div className={styles.layout}>
        {/* Preview Column */}
        <div className={styles.previewColumn}>
          <p className={styles.sectionLabel}>Vista previa</p>
          <GiftCardPreview
            amount={finalAmount}
            theme={theme}
            message={message}
            recipientName={recipientName}
            senderName={senderName}
          />
          <div className={styles.previewHints}>
            <span>✓ Sin fecha de vencimiento</span>
            <span>✓ Canjeable en cualquier plan</span>
            <span>✓ Entrega instantánea por email</span>
          </div>
        </div>

        {/* Form Column */}
        <div className={styles.formColumn}>
          {/* Stepper */}
          <div className={styles.stepper}>
            {STEPS.map((s, i) => (
              <div key={s} className={`${styles.stepItem} ${i === step ? styles.stepActive : ''} ${i < step ? styles.stepDone : ''}`}>
                <div className={styles.stepDot}>{i < step ? '✓' : i + 1}</div>
                <span>{s}</span>
              </div>
            ))}
          </div>

          <div className={styles.formCard}>
            {step === 0 && (
              <StepPersonalizar
                amount={amount}
                setAmount={setAmount}
                customAmount={customAmount}
                setCustomAmount={setCustomAmount}
                useCustom={useCustom}
                setUseCustom={setUseCustom}
                theme={theme}
                setTheme={setTheme}
                message={message}
                setMessage={setMessage}
                senderName={senderName}
                setSenderName={setSenderName}
              />
            )}
            {step === 1 && (
              <StepDestinatario
                recipientName={recipientName}
                setRecipientName={setRecipientName}
                recipientEmail={recipientEmail}
                setRecipientEmail={setRecipientEmail}
                sendDate={sendDate}
                setSendDate={setSendDate}
                scheduleDate={scheduleDate}
                setScheduleDate={setScheduleDate}
                today={today}
              />
            )}
            {step === 2 && (
              <StepReview
                amount={finalAmount}
                theme={theme}
                message={message}
                recipientName={recipientName}
                recipientEmail={recipientEmail}
                senderName={senderName}
                sendDate={sendDate}
                scheduleDate={scheduleDate}
              />
            )}

            <div className={styles.formActions}>
              {step > 0 && (
                <button className={styles.btnSecondary} onClick={handleBack}>
                  ← Atrás
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button
                  className={styles.btnPrimary}
                  onClick={handleNext}
                  disabled={step === 1 && (!recipientName || !recipientEmail)}
                >
                  Continuar →
                </button>
              ) : (
                <button className={styles.btnPrimary} onClick={handleSubmit}>
                  Enviar regalo 🎁
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 0: Personalizar ──────────────────────────────────────── */
function StepPersonalizar({ amount, setAmount, customAmount, setCustomAmount, useCustom, setUseCustom, theme, setTheme, message, setMessage, senderName, setSenderName }: any) {
  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Elegí el monto y diseño</h2>

      <label className={styles.fieldLabel}>Monto de la Gift Card</label>
      <div className={styles.amountGrid}>
        {AMOUNTS.map((a) => (
          <button
            key={a}
            className={`${styles.amountBtn} ${!useCustom && amount === a ? styles.amountBtnActive : ''}`}
            onClick={() => { setAmount(a); setUseCustom(false); }}
          >
            ${a}
          </button>
        ))}
        <button
          className={`${styles.amountBtn} ${useCustom ? styles.amountBtnActive : ''}`}
          onClick={() => setUseCustom(true)}
        >
          Personalizado
        </button>
      </div>
      {useCustom && (
        <div className={styles.customAmountWrap}>
          <span className={styles.currencySymbol}>$</span>
          <input
            type="number"
            min="25"
            max="500"
            placeholder="ej. 120"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className={styles.customAmountInput}
          />
        </div>
      )}

      <label className={styles.fieldLabel} style={{ marginTop: 24 }}>Tema del diseño</label>
      <div className={styles.themeGrid}>
        {THEMES.map((t) => (
          <button
            key={t.id}
            className={`${styles.themeBtn} ${theme.id === t.id ? styles.themeBtnActive : ''}`}
            style={{ '--theme-bg': t.bg, '--theme-accent': t.accent } as any}
            onClick={() => setTheme(t)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label className={styles.fieldLabel} style={{ marginTop: 24 }}>Tu nombre (opcional)</label>
      <input
        className={styles.input}
        placeholder="ej. María"
        value={senderName}
        onChange={(e) => setSenderName(e.target.value)}
      />

      <label className={styles.fieldLabel} style={{ marginTop: 16 }}>Mensaje personal (opcional)</label>
      <textarea
        className={styles.textarea}
        placeholder="ej. ¡Feliz cumpleaños! Espero que disfrutes cada comida 🎉"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={160}
        rows={3}
      />
      <p className={styles.charCount}>{message.length}/160</p>
    </div>
  );
}

/* ─── Step 1: Destinatario ──────────────────────────────────────── */
function StepDestinatario({ recipientName, setRecipientName, recipientEmail, setRecipientEmail, sendDate, setSendDate, scheduleDate, setScheduleDate, today }: any) {
  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>¿A quién le enviás el regalo?</h2>

      <label className={styles.fieldLabel}>Nombre del destinatario *</label>
      <input
        className={styles.input}
        placeholder="ej. Juan"
        value={recipientName}
        onChange={(e) => setRecipientName(e.target.value)}
        required
      />

      <label className={styles.fieldLabel} style={{ marginTop: 16 }}>Email del destinatario *</label>
      <input
        className={styles.input}
        type="email"
        placeholder="ej. juan@email.com"
        value={recipientEmail}
        onChange={(e) => setRecipientEmail(e.target.value)}
        required
      />

      <label className={styles.fieldLabel} style={{ marginTop: 24 }}>¿Cuándo enviarlo?</label>
      <div className={styles.radioGroup}>
        <label className={`${styles.radioCard} ${sendDate === 'now' ? styles.radioCardActive : ''}`}>
          <input type="radio" value="now" checked={sendDate === 'now'} onChange={() => setSendDate('now')} />
          <div>
            <strong>Ahora mismo</strong>
            <p>El email llega en minutos</p>
          </div>
        </label>
        <label className={`${styles.radioCard} ${sendDate === 'schedule' ? styles.radioCardActive : ''}`}>
          <input type="radio" value="schedule" checked={sendDate === 'schedule'} onChange={() => setSendDate('schedule')} />
          <div>
            <strong>Programar envío</strong>
            <p>Elegí fecha y hora exacta</p>
          </div>
        </label>
      </div>
      {sendDate === 'schedule' && (
        <input
          type="date"
          className={styles.input}
          min={today}
          value={scheduleDate}
          onChange={(e) => setScheduleDate(e.target.value)}
          style={{ marginTop: 12 }}
        />
      )}
    </div>
  );
}

/* ─── Step 2: Review ────────────────────────────────────────────── */
function StepReview({ amount, theme, message, recipientName, recipientEmail, senderName, sendDate, scheduleDate }: any) {
  const rows = [
    { label: 'Monto', value: `$${amount} USD` },
    { label: 'Tema', value: theme.label },
    { label: 'De', value: senderName || '—' },
    { label: 'Para', value: `${recipientName} <${recipientEmail}>` },
    { label: 'Mensaje', value: message || '—' },
    { label: 'Envío', value: sendDate === 'now' ? 'Inmediato' : `Programado: ${scheduleDate}` },
  ];
  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Revisá tu regalo</h2>
      <table className={styles.reviewTable}>
        <tbody>
          {rows.map(({ label, value }) => (
            <tr key={label}>
              <td className={styles.reviewLabel}>{label}</td>
              <td className={styles.reviewValue}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.reviewNotice}>
        Al confirmar, se procesará el cargo de <strong>${amount} USD</strong> y se enviará la gift card por email.
      </div>
    </div>
  );
}

/* ─── Gift Card Preview Component ──────────────────────────────── */
function GiftCardPreview({ amount, theme, message, recipientName, senderName }: {
  amount: number;
  theme: typeof THEMES[0];
  message: string;
  recipientName: string;
  senderName: string;
}) {
  return (
    <div className={styles.cardPreviewOuter}>
      <div
        className={styles.cardPreview}
        style={{ background: theme.bg, borderColor: theme.accent + '44' }}
      >
        <div className={styles.cardPreviewHeader}>
          <span className={styles.cardBrand} style={{ color: theme.accent }}>CooKunity</span>
          <span className={styles.cardTag} style={{ background: theme.accent }}>Gift Card</span>
        </div>

        <div className={styles.cardAmount} style={{ color: theme.accent }}>
          ${amount > 0 ? amount : '—'}
        </div>

        <div className={styles.cardLines}>
          <div className={styles.cardLine} style={{ background: theme.accent + '22' }} />
          <div className={styles.cardLine} style={{ background: theme.accent + '15', width: '60%' }} />
        </div>

        {recipientName && (
          <p className={styles.cardRecipient} style={{ color: theme.accent }}>
            Para <strong>{recipientName}</strong>
          </p>
        )}

        {message && (
          <p className={styles.cardMessage}>"{message}"</p>
        )}

        {senderName && (
          <p className={styles.cardSender} style={{ color: theme.accent + 'aa' }}>
            — {senderName}
          </p>
        )}

        <div className={styles.cardFooter}>
          <span className={styles.cardBarcode}>||||| |||| ||||| ||||</span>
          <span className={styles.cardCode}>CU-XXXX-XXXX</span>
        </div>
      </div>
    </div>
  );
}
