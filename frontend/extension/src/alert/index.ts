/// <reference types="chrome"/>

async function loadAlert() {
  const { vetraPendingAlert } = await chrome.storage.session.get('vetraPendingAlert');
  const alert = vetraPendingAlert || {};

  const titleEl = document.getElementById('title');
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const reasonsEl = document.getElementById('reasons');

  if (titleEl) titleEl.textContent = alert.title || 'Vetra: alto risco detectado';
  if (scoreEl) scoreEl.textContent = String(alert.riskScore ?? '—');
  if (levelEl) {
    levelEl.textContent = `Risk level: ${alert.riskLevel || 'high'}`;
  }
  if (reasonsEl) {
    reasonsEl.innerHTML = '';
    const reasons: string[] = Array.isArray(alert.reasons) ? alert.reasons : [];
    if (reasons.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Revise a transação antes de assinar.';
      reasonsEl.appendChild(li);
    } else {
      for (const reason of reasons.slice(0, 8)) {
        const li = document.createElement('li');
        li.textContent = reason;
        reasonsEl.appendChild(li);
      }
    }
  }

  const decide = async (approved: boolean) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'VETRA_ALERT_DECISION',
        approved,
        requestId: alert.requestId,
        riskLevel: alert.riskLevel,
        riskScore: alert.riskScore,
      });
    } catch (e) {
      console.warn('Alert decision failed', e);
    }
    window.close();
  };

  document.getElementById('btn-block')?.addEventListener('click', () => decide(false));
  document.getElementById('btn-allow')?.addEventListener('click', () => decide(true));
}

loadAlert();
