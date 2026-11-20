/* ============================================================
   POLARIS CARE DESK · HELPLINE MODULE (call center)
   Omnichannel inbox · board · ticket workspace with Member 360 ·
   supervisor wallboard · KPIs (2 layers) · knowledge & macros ·
   quality (QA) · admin. Fake demo data only (no real PII).
   Depends on Care Desk globals: $, view, render, go, toast, MEMBERS, CASES,
   PROVIDERS, openModal, memberPreview, openCase, createCase.
   ============================================================ */
const HL = (() => {
  // ───────── settings (Admin edits these in memory) ─────────
  const S = {
    companies: [
      { n: 'AEGEAN CREWING', m: 2400, dom: 'aegeancrewing.example' },
      { n: 'HELLAS MARINE MANNING', m: 1850, dom: 'hellasmarine.example' },
      { n: 'PACIFIC STAR SHIPPING', m: 1200, dom: 'pacificstar.example' },
      { n: 'IONIAN BULK CARRIERS', m: 900, dom: 'ionianbulk.example' },
      { n: 'CYCLADES TANKERS', m: 650, dom: 'cycladestankers.example' },
    ],
    categories: [
      { n: 'LOA / Approval', kw: 'loa|letter of auth|approv|authori|clearance' },
      { n: 'Reimbursement', kw: 'reimburs|refund|claim|official receipt' },
      { n: 'Mobile App & Login', kw: 'username|password|mobile app|login|log in|credential|otp' },
      { n: 'Coverage & Benefits', kw: 'cover|benefit|limit|ambl|package|vaccin|maternity|check-up|checkup' },
      { n: 'Card & Documents', kw: 'card|declaration|consent|certificat|member number' },
      { n: 'Enrollment & Members', kw: 'enrol|dependent|activat|correct|spelling|expir|still active' },
      { n: 'Emergency / Admission', kw: 'emergenc|\\ber\\b|rushed|urgent|accident|admitted|admission|discharg|confined|icu' },
      { n: 'Network & Providers', kw: 'accredit|provider|hospital|clinic|dentist|nearest' },
      { n: 'Other', kw: '' },
    ],
    channels: [
      { k: 'Phone', ic: '📞', on: true, auto: '' },
      { k: 'Email', ic: '✉️', on: true, auto: 'Thank you for contacting the Polaris Helpline. Your ticket number is {id}. Our team will reply shortly.' },
      { k: 'WhatsApp', ic: '🟢', on: true, auto: 'Hi {name}, we received your message. Ticket {id}. An agent will reply within {sla}.' },
      { k: 'Viber', ic: '🟣', on: true, auto: 'Hi {name}, we received your message. Ticket {id}. An agent will reply within {sla}.' },
      { k: 'Messenger', ic: '💬', on: true, auto: 'Hi {name}, thanks for your message. Ticket {id}.' },
      { k: 'SMS', ic: '📱', on: true, auto: 'Polaris Helpline: we received your request, ticket {id}.' },
      { k: 'Walk-in', ic: '🚶', on: true, auto: '' },
    ],
    statuses: ['New', 'In Progress', 'Waiting AMAPHIL', 'Waiting Member', 'Escalated', 'Resolved', 'Not Resolved'],
    sla: { Urgent: { first: 0.25, resolve: 1 }, High: { first: 1, resolve: 8 }, Normal: { first: 4, resolve: 48 } },
    staff: [
      { id: 'JK', n: 'Jinky', role: 'Agent', shift: '07:00–16:00', on: true },
      { id: 'ST', n: 'Stella', role: 'Agent', shift: '09:00–18:00', on: true },
      { id: 'JP', n: 'Japheth', role: 'Agent', shift: '13:00–22:00', on: true },
      { id: 'SV', n: 'Ops Supervisor', role: 'Supervisor', shift: '08:00–17:00', on: true },
    ],
    hours: 'Mon–Sat 07:00–22:00 · Sunday on-call for Urgent',
  };
  const MACROS = [
    { t: 'LOA received, checking with AMAPHIL', c: 'LOA / Approval', x: 'Hi {name}, we received your LOA request and we are coordinating with AMAPHIL now. We will update you within {sla}.' },
    { t: 'Reimbursement documents list', c: 'Reimbursement', x: 'Hi {name}, for reimbursement please send: 1) official receipts, 2) medical certificate / abstract, 3) doctor\'s request, 4) claim form signed by the principal. Originals go to AMAPHIL.' },
    { t: 'App credentials re-sent', c: 'Mobile App & Login', x: 'Hi {name}, we re-sent the username and password to the registered mobile number. Please log in and change the password.' },
    { t: 'Emergency: tell the hospital HMO desk', c: 'Emergency / Admission', x: 'Hi {name}, please inform the hospital HMO desk that you are a Polaris / AMAPHIL member. We are calling AMAPHIL now so the hospital gets the approval.' },
    { t: 'HMO declaration issued', c: 'Card & Documents', x: 'Hi {name}, your HMO declaration is attached. Let us know if you need anything else.' },
    { t: 'Accredited providers near you', c: 'Network & Providers', x: 'Hi {name}, these accredited providers are near you: {providers}. Please bring your member card or ID.' },
    { t: 'Waiting for your documents', c: 'Other', x: 'Hi {name}, we are waiting for the documents to continue. Reply to this message with a photo of each page.' },
    { t: 'Case closed · survey', c: 'Other', x: 'Hi {name}, your request {id} is now resolved. How did we do? Reply 1 (poor) to 5 (excellent).' },
  ];
  const KB = [
    { t: 'How to request an LOA', c: 'LOA / Approval', b: 'Outpatient: member sends the doctor\'s request; we coordinate with AMAPHIL. Non-ER outpatient up to Php 5,000 is auto-approved. Inpatient or over the limit goes to admin control.\nEmergency: no preliminary LOA. The hospital calls AMAPHIL; approval is the Final LOA after discharge.', u: 48 },
    { t: 'Reimbursement: documents and timeline', c: 'Reimbursement', b: 'Official receipts, medical certificate or abstract, doctor\'s request, signed claim form. Originals to AMAPHIL by courier. Typical processing 15–30 days after complete documents.', u: 41 },
    { t: 'Mobile app login problems', c: 'Mobile App & Login', b: 'Check the member is active in CBMS. Re-send credentials by SMS. If the date of birth is wrong the login fails: endorse a correction to AMAPHIL.', u: 63 },
    { t: 'Emergency admission checklist', c: 'Emergency / Admission', b: '1) Verify membership in CBMS. 2) Check AMBL left (Member 360). 3) Call AMAPHIL MO. 4) If availment is low: inform the principal and proceed. 5) Open a Care Desk case.', u: 29 },
    { t: 'Which benefits are covered', c: 'Coverage & Benefits', b: 'Annual check-up needs a doctor\'s request. Vaccines: only if in the plan rider. Maternity: per plan inner limit. Always confirm the remaining limit in Member 360.', u: 22 },
    { t: 'Correcting member data', c: 'Enrollment & Members', b: 'Name spelling, date of birth and dependents: collect a copy of the ID or birth certificate and endorse to AMAPHIL. Changes of dependents apply at renewal.', u: 17 },
    { t: 'Finding an accredited provider', c: 'Network & Providers', b: 'Use the Network tab: filter by region and type. Prefer providers with an active MOA. Send the member 2 or 3 options with address.', u: 26 },
    { t: 'Handling a complaint', c: 'Other', b: 'Apologise, log as complaint, assign High priority, give the member a time for the next update, close within 7 days. The supervisor reviews every complaint.', u: 9 },
  ];
  const QA_CRIT = [
    { k: 'Greeting & member verification', w: 15 }, { k: 'Understood the need', w: 20 }, { k: 'Correct information', w: 25 },
    { k: 'Ownership & follow-up', w: 20 }, { k: 'Ticket logged completely', w: 10 }, { k: 'Tone & empathy', w: 10 },
  ];

  // ───────── state ─────────
  let T = [];             // tickets
  let seq = 4200;
  let tab = 'inbox', queue = 'open', q = '', fCompany = '', fChannel = '', current = null;
  let composeMode = 'reply', kpiYear = null, kpiCompany = '', draftHL = {};
  let QA = [];            // evaluations
  let wallTimer = null, pendingLink = null;
  const ME = 'JK';

  // ───────── helpers ─────────
  const H = 3600e3, D = 24 * H;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const now = () => Date.now();
  const chIc = k => (S.channels.find(c => c.k === k) || { ic: '•' }).ic;
  const staff = id => S.staff.find(s => s.id === id);
  const stCls = s => s.replace(/\s+/g, '-');
  const isOpen = t => !['Resolved', 'Not Resolved'].includes(t.status);
  const fmtT = ms => { const d = new Date(ms); return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); };
  const dur = h => h < 1 ? Math.max(1, Math.round(h * 60)) + 'm' : h < 48 ? (Math.round(h * 10) / 10) + 'h' : Math.round(h / 24) + 'd';
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let rs = 20261121; const rnd = () => (rs = (rs * 1103515245 + 12345) % 2147483648) / 2147483648;
  const pick = a => a[Math.floor(rnd() * a.length)];

  function triage(text) {
    const s = String(text || '').toLowerCase();
    let category = 'Other';
    const em = S.categories.find(c => c.n.startsWith('Emergency'));
    if (em && new RegExp(em.kw, 'i').test(s)) category = em.n;
    else for (const c of S.categories) { if (c.kw && new RegExp(c.kw, 'i').test(s)) { category = c.n; break; } }
    const complaint = /complain|dissatisf|frustrat|disappoint|upset|angry|rude|not honou?red|refused|no response|still no|poor service|why .*not (approved|covered)/i.test(s);
    const priority = category.startsWith('Emergency') ? 'Urgent' : complaint ? 'High' : 'Normal';
    const sentiment = complaint ? 'negative' : /thank|great|salamat|appreciate/i.test(s) ? 'positive' : 'neutral';
    return { category, priority, complaint, sentiment };
  }
  function slaInfo(t) {
    const p = S.sla[t.priority] || S.sla.Normal, due = t.created + p.resolve * H;
    if (!isOpen(t)) return (t.resolvedAt || now()) <= due ? { cls: 'met', txt: '✓ Met', met: true } : { cls: 'miss', txt: '✗ Missed', met: false };
    const left = due - now();
    if (left < 0) return { cls: 'over', txt: dur(-left / H) + ' over', over: true };
    return left < p.resolve * H * 0.25 ? { cls: 'risk', txt: dur(left / H) + ' left', risk: true } : { cls: 'ok', txt: dur(left / H) + ' left' };
  }
  const resH = t => ((t.resolvedAt || now()) - t.created) / H;
  const firstH = t => t.firstReply ? (t.firstReply - t.created) / H : null;
  const companyOf = memberId => (MEMBERS[memberId] || {}).corporate || '';

  // ───────── demo data ─────────
  function seed() {
    const subj = {
      'LOA / Approval': ['Follow-up on LOA for laboratory tests', 'LOA request for MRI', 'Why were some labs not approved in the LOA?', 'LOA for consultation tomorrow'],
      'Reimbursement': ['Status of reimbursement claim', 'Which documents for reimbursement?', 'Reimbursement still not received'],
      'Mobile App & Login': ['Cannot log in to the mobile app', 'Username and password for my son', 'App shows wrong date of birth'],
      'Coverage & Benefits': ['Is the annual check-up covered?', 'Remaining outpatient limit', 'Are infant vaccines covered?'],
      'Card & Documents': ['Request HMO declaration', 'Physical card not yet received', 'Consent e-mail not received'],
      'Enrollment & Members': ['Add newborn as dependent', 'Correct spelling of daughter name', 'Is my HMO still active?'],
      'Emergency / Admission': ['Wife admitted to ER, hospital waiting approval', 'Discharge approval pending', 'Son rushed to hospital'],
      'Network & Providers': ['Accredited dentist near Batangas', 'Hospital says it is not accredited', 'Nearest accredited clinic in Cebu'],
      'Other': ['General question', 'Change of contact number'],
    };
    const names = ['Juan Dela Cruz', 'Maria Santos', 'Jose Reyes', 'Ana Garcia', 'Mark Bautista', 'Liza Mendoza', 'Paolo Ramos', 'Grace Torres', 'Ramon Aquino', 'Joy Villanueva', 'Carlo Navarro', 'Bea Castillo', 'Rico Lim', 'Nina Flores'];
    const catW = ['LOA / Approval', 'LOA / Approval', 'LOA / Approval', 'Reimbursement', 'Reimbursement', 'Mobile App & Login', 'Mobile App & Login', 'Mobile App & Login', 'Coverage & Benefits', 'Card & Documents', 'Card & Documents', 'Enrollment & Members', 'Emergency / Admission', 'Network & Providers', 'Other'];
    const chW = ['Phone', 'Phone', 'Phone', 'Phone', 'Viber', 'Viber', 'WhatsApp', 'WhatsApp', 'Email', 'Email', 'Messenger', 'SMS'];
    const compW = [0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 4];
    const start = new Date(); start.setDate(1); start.setMonth(start.getMonth() - 12); start.setHours(0, 0, 0, 0);
    // 12 closed months of history (+ this month so far)
    for (let mi = 0; mi <= 12; mi++) {
      const m0 = new Date(start); m0.setMonth(start.getMonth() + mi);
      const m1 = new Date(m0); m1.setMonth(m0.getMonth() + 1);
      const end = Math.min(m1.getTime(), now() - 3 * H);
      if (end <= m0.getTime()) continue;
      const n = Math.round(50 * (end - m0.getTime()) / (m1.getTime() - m0.getTime()) * (0.85 + rnd() * 0.3) * (1 - mi * 0.025));
      for (let i = 0; i < n; i++) {
        const created = m0.getTime() + rnd() * (end - m0.getTime());
        const cat = pick(catW), pr = cat.startsWith('Emergency') ? 'Urgent' : rnd() < 0.18 ? 'High' : 'Normal';
        const res = pr === 'Urgent' ? 0.3 + rnd() * 0.9 : pr === 'High' ? 0.5 + rnd() * 9 : rnd() < 0.55 ? 0.1 + rnd() * 1.5 : 2 + rnd() * 50;
        const cmp = rnd() < 0.006;
        const fcr = res < 4 ? rnd() < 0.93 : rnd() < 0.4;
        const nm = pick(names);
        T.push({
          id: 'HL-' + (++seq), created, channel: pick(chW), company: S.companies[pick(compW)].n, member: null, name: nm, contact: '09XX XXX XX' + String(10 + Math.floor(rnd() * 89)),
          subject: pick(subj[cat]), category: cat, priority: cmp ? 'High' : pr, complaint: cmp, sentiment: cmp ? 'negative' : 'neutral',
          status: rnd() < 0.985 ? 'Resolved' : 'Not Resolved', assignee: pick(['JK', 'ST', 'JP']), firstReply: created + Math.min(res, 0.05 + rnd() * 0.6) * H,
          resolvedAt: Math.min(created + res * H, now() - 10 * 60e3), fcr, csat: rnd() < 0.62 ? (rnd() < 0.82 ? 5 : rnd() < 0.7 ? 4 : 3) : null, caseRef: null, history: true,
          msgs: [{ w: 'member', ch: '', t: created, x: pick(subj[cat]) + ' (sample)' }, { w: 'system', t: Math.min(created + res * H, now() - 10 * 60e3), x: 'Resolved' }],
        });
      }
    }
    // live tickets linked to Care Desk members
    const live = [
      { m: 'PRS-100482', ch: 'Phone', ago: 0.3, pr: 'Urgent', st: 'In Progress', as: 'JK', s: 'Chest trauma, still at Manila Doctors ER, family asks for approval', x: 'Wife calling: husband fell on deck, now at Manila Doctors ER. Hospital waiting for AMAPHIL approval.', link: 'PC-2606-016' },
      { m: 'PRS-100958', ch: 'Viber', ago: 1.7, pr: 'Urgent', st: 'New', as: null, s: 'Discharge approval pending at Cebu Doctors', x: 'Good evening, my husband is ready for discharge but the hospital says no approval yet. Please help.', link: 'PC-2606-014' },
      { m: 'PRS-100482-D1', ch: 'WhatsApp', ago: 3.5, pr: 'Normal', st: 'Waiting AMAPHIL', as: 'ST', s: 'LOA for prenatal labs', x: 'Hi, follow-up on the LOA for my prenatal labs at Makati Med.', link: 'PC-2606-011' },
      { m: 'PRS-100731', ch: 'Email', ago: 26, pr: 'High', st: 'In Progress', as: 'JP', s: 'Why was my reimbursement reduced? Still no response', x: 'I sent all receipts 3 weeks ago and the amount is lower. Still no response from AMAPHIL. I am very disappointed.', cmp: true },
      { m: 'PRS-100731-D2', ch: 'Messenger', ago: 5, pr: 'Normal', st: 'Waiting Member', as: 'ST', s: 'Dental: send photo of the restoration invoice', x: 'Hello po, I already had the dental procedure. What do you need from me?' },
      { m: 'PRS-100204', ch: 'Phone', ago: 0.9, pr: 'Normal', st: 'New', as: null, s: 'Cannot log in to the mobile app', x: 'Captain Navarro cannot log in to the app, says wrong password.' },
      { m: null, n: 'Rico Lim', co: 'IONIAN BULK CARRIERS', ch: 'SMS', ago: 6.5, pr: 'Normal', st: 'New', as: null, s: 'Is my HMO still active?', x: 'Is my HMO still active? My contract ended last month.' },
      { m: null, n: 'Nina Flores', co: 'CYCLADES TANKERS', ch: 'WhatsApp', ago: 52, pr: 'Normal', st: 'In Progress', as: 'JK', s: 'Add newborn as dependent', x: 'Hi, we had a baby last week. How do we add her to the HMO?' },
      { m: null, n: 'Joy Villanueva', co: 'AEGEAN CREWING', ch: 'Viber', ago: 7.4, pr: 'High', st: 'Escalated', as: 'SV', s: 'Hospital refused the card', x: 'The clinic in Batangas refused my card even if it is on your list. Very upset.', cmp: true },
      { m: null, n: 'Carlo Navarro', co: 'PACIFIC STAR SHIPPING', ch: 'Email', ago: 0.2, pr: 'Normal', st: 'New', as: null, s: 'Request HMO declaration for visa', x: 'Good day, I need an HMO declaration for my wife for her visa application.' },
      { m: null, n: 'Bea Castillo', co: 'HELLAS MARINE MANNING', ch: 'Phone', ago: 2.2, pr: 'Normal', st: 'Resolved', as: 'JK', res: 0.2, s: 'Username and password for my son', x: 'Asking for the app username and password of her son.', sol: 'Credentials re-sent by SMS; member logged in.', csat: 5 },
      { m: null, n: 'Mark Bautista', co: 'AEGEAN CREWING', ch: 'Viber', ago: 4.1, pr: 'Normal', st: 'Resolved', as: 'ST', res: 0.6, s: 'Accredited dentist near Batangas', x: 'Looking for an accredited dentist near Batangas.', sol: 'Sent 3 accredited dentists near Batangas.', csat: 5 },
      { m: null, n: 'Grace Torres', co: 'CYCLADES TANKERS', ch: 'Phone', ago: 1.4, pr: 'Urgent', st: 'Resolved', as: 'JP', res: 0.7, s: 'Son rushed to hospital, ER asks approval', x: 'Son rushed to the ER, hospital asks for approval.', sol: 'Called AMAPHIL MO, approval sent to the hospital in 40 minutes.', csat: 5 },
      { m: null, n: 'Paolo Ramos', co: 'IONIAN BULK CARRIERS', ch: 'WhatsApp', ago: 5.5, pr: 'Normal', st: 'Resolved', as: 'ST', res: 3.2, s: 'Is the annual check-up covered?', x: 'Is the annual check-up covered for me and my wife?', sol: 'Explained: covered with doctor request, sent the steps.', csat: 4 },
    ];
    live.forEach(l => {
      const created = now() - l.ago * H, mem = l.m ? MEMBERS[l.m] : null, tri = triage(l.s + ' ' + l.x);
      const t = {
        id: 'HL-' + (++seq), created, channel: l.ch, company: mem ? mem.corporate : l.co, member: l.m, name: mem ? mem.name : l.n,
        contact: l.ch === 'Email' ? 'member' + seq + '@mail.example' : '09XX XXX XX' + (seq % 90 + 10), subject: l.s, category: tri.category,
        priority: l.pr, complaint: !!l.cmp, sentiment: l.cmp ? 'negative' : 'neutral', status: l.st, assignee: l.as,
        firstReply: l.st === 'New' ? null : created + 0.08 * H, resolvedAt: l.res ? created + l.res * H : null, fcr: !!l.res && l.res < 1, csat: l.csat || null, caseRef: l.link || null,
        msgs: [{ w: 'member', ch: l.ch, t: created, x: l.x }],
      };
      const auto = (S.channels.find(c => c.k === l.ch) || {}).auto;
      if (auto) t.msgs.push({ w: 'system', t: created + 60e3, x: 'Auto-reply sent: ' + fill(auto, t) });
      if (l.st !== 'New') t.msgs.push({ w: 'agent', ch: l.ch, by: l.as, t: created + 0.08 * H, x: fill(MACROS.find(mm => mm.c === t.category)?.x || MACROS[6].x, t) });
      if (l.st === 'Waiting AMAPHIL') t.msgs.push({ w: 'note', by: l.as, t: created + 0.2 * H, x: 'Called AMAPHIL MO. They will issue within the hour.' });
      if (l.sol) { t.msgs.push({ w: 'agent', ch: l.ch, by: l.as, t: t.resolvedAt, x: 'Solution: ' + l.sol }, { w: 'system', t: t.resolvedAt, x: 'Status: In Progress → Resolved · CSAT ' + l.csat + '/5' }); }
      if (l.cmp) t.msgs.push({ w: 'note', by: 'SV', t: created + 0.5 * H, x: 'Complaint flagged. Supervisor following. Promise update by tomorrow 10:00.' });
      T.push(t);
    });
    T.sort((a, b) => b.created - a.created);
    // QA sample evaluations
    T.filter(t => t.history && t.status === 'Resolved').slice(0, 60).forEach((t, i) => {
      if (i % 4) return;
      const sc = QA_CRIT.map(c => ({ k: c.k, w: c.w, v: rnd() < 0.85 ? 1 : rnd() < 0.6 ? 0.5 : 0 }));
      QA.push({ id: t.id, agent: t.assignee, at: t.resolvedAt + D, by: 'SV', scores: sc, total: Math.round(sc.reduce((a, s) => a + s.w * s.v, 0)) });
    });
  }
  function fill(x, t) {
    const sla = S.sla[t.priority] || S.sla.Normal;
    const prov = (typeof PROVIDERS !== 'undefined' ? PROVIDERS.slice(0, 3).map(p => p.name).join(', ') : '');
    return String(x).replace(/{name}/g, String(t.name || '').split(/[ ,]/).filter(Boolean).pop() || 'there')
      .replace(/{id}/g, t.id).replace(/{sla}/g, dur(sla.first)).replace(/{providers}/g, prov);
  }

  // ───────── queues ─────────
  const QUEUES = [
    { k: 'open', n: 'All open', f: t => isOpen(t) },
    { k: 'mine', n: 'My tickets', f: t => isOpen(t) && t.assignee === ME },
    { k: 'unassigned', n: 'Unassigned', f: t => isOpen(t) && !t.assignee, hot: true },
    { k: 'urgent', n: 'Urgent', f: t => isOpen(t) && t.priority === 'Urgent', hot: true },
    { k: 'sla', n: 'SLA at risk / overdue', f: t => isOpen(t) && (slaInfo(t).risk || slaInfo(t).over), hot: true },
    { k: 'amaphil', n: 'Waiting AMAPHIL', f: t => t.status === 'Waiting AMAPHIL' },
    { k: 'member', n: 'Waiting member', f: t => t.status === 'Waiting Member' },
    { k: 'complaints', n: 'Complaints (open)', f: t => isOpen(t) && t.complaint, hot: true },
    { k: 'today', n: 'Resolved today', f: t => t.resolvedAt && new Date(t.resolvedAt).toDateString() === new Date().toDateString() },
    { k: 'all', n: 'All tickets', f: () => true },
  ];

  // ───────── navigation ─────────
  const TABS = [
    { k: 'inbox', n: 'Inbox', ic: '📥' }, { k: 'board', n: 'Board', ic: '🗂️' }, { k: 'wall', n: 'Supervisor', ic: '📡' },
    { k: 'kpi', n: 'KPIs & Reports', ic: '📊' }, { k: 'kb', n: 'Knowledge & Macros', ic: '📚' }, { k: 'qa', n: 'Quality', ic: '🎯' }, { k: 'admin', n: 'Admin', ic: '⚙️' },
  ];
  function nav(k) { tab = k; current = null; view = 'hl'; document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('active', a.dataset.view === 'hl-' + k || (k === 'inbox' && a.dataset.view === 'hl'))); render(); window.scrollTo(0, 0); }
  function open(id) { current = id; tab = 'ticket'; view = 'hl'; render(); window.scrollTo(0, 0); }
  function tabsBar() {
    const openN = T.filter(isOpen).length;
    return `<div class="hl-tabs">${TABS.map(x => `<button class="${tab === x.k ? 'on' : ''}" onclick="HL.nav('${x.k}')">${x.ic} ${x.n}${x.k === 'inbox' ? ` <span class="n">${openN}</span>` : ''}</button>`).join('')}
      <span style="flex:1"></span><button class="on" style="background:var(--teal);border-color:var(--teal)" onclick="HL.newTicket()">＋ New request</button></div>`;
  }
  function setTitle(crumb, title) { $('#crumb').textContent = 'Helpline / ' + crumb; $('#title').textContent = title; }
  function navCount() { const el = document.getElementById('nav-hl'); if (el) el.textContent = T.filter(isOpen).length; }

  function renderAll() {
    navCount();
    if (wallTimer) { clearInterval(wallTimer); wallTimer = null; }
    const map = { inbox: renderInbox, board: renderBoard, wall: renderWall, kpi: renderKpi, kb: renderKb, qa: renderQa, admin: renderAdmin, ticket: renderTicket };
    (map[tab] || renderInbox)();
  }

  // ───────── INBOX ─────────
  function statsStrip() {
    const op = T.filter(isOpen), today = new Date().toDateString();
    const tin = T.filter(t => new Date(t.created).toDateString() === today).length;
    const tres = T.filter(t => t.resolvedAt && new Date(t.resolvedAt).toDateString() === today).length;
    const risk = op.filter(t => slaInfo(t).risk).length, over = op.filter(t => slaInfo(t).over).length;
    const card = (k, v, m, a) => `<div class="stat card"><div class="k">${k}</div><div class="v">${v}</div><div class="meta">${m}</div><div class="stat-accent ${a}"></div></div>`;
    return `<div class="hl-stats">${card('Open now', op.length, 'all channels', 'teal')}${card('Urgent open', op.filter(t => t.priority === 'Urgent').length, 'target: action in 15 min', 'coral')}
      ${card('SLA at risk', risk, 'less than 25% time left', 'gold')}${card('Overdue', over, '<b class="alert">past SLA</b>', 'coral')}
      ${card('In today', tin, 'new requests', 'teal')}${card('Resolved today', tres, 'closed tickets', 'green')}</div>`;
  }
  function rowsFor(list) {
    if (!list.length) return `<tr><td colspan="9" class="hl-empty">Nothing here 🎉</td></tr>`;
    return list.slice(0, 120).map(t => {
      const sl = slaInfo(t), a = staff(t.assignee);
      return `<tr class="row" onclick="HL.open('${t.id}')">
        <td><span class="hl-dot ${t.priority}"></span><span class="hl-id">${t.id}</span></td>
        <td class="hl-ch" title="${t.channel}">${chIc(t.channel)}</td>
        <td><b>${esc(t.name)}</b><div class="sub">${esc(t.company)}</div></td>
        <td><b>${esc(t.subject)}</b>${t.complaint ? '<span class="hl-cmp">COMPLAINT</span>' : ''}<div class="sub">${esc(t.category)}${t.caseRef ? ' · 🔗 ' + t.caseRef : ''}</div></td>
        <td><span class="hl-st ${stCls(t.status)}">${t.status}</span></td>
        <td>${a ? `<span class="hl-av" title="${a.n}">${a.id}</span>` : '<span class="hl-av none">—</span>'}</td>
        <td><span class="hl-sla ${sl.cls}">${sl.txt}</span></td>
        <td style="white-space:nowrap;color:var(--slate-2)">${dur((now() - t.created) / H)} ago</td></tr>`;
    }).join('');
  }
  function filtered() {
    const Q = QUEUES.find(x => x.k === queue) || QUEUES[0], s = q.toLowerCase();
    return T.filter(Q.f).filter(t => (!fCompany || t.company === fCompany) && (!fChannel || t.channel === fChannel) &&
      (!s || [t.id, t.name, t.subject, t.company, t.contact, t.category, t.caseRef].join(' ').toLowerCase().includes(s)))
      .sort((a, b) => isOpen(a) && isOpen(b) ? (({ Urgent: 0, High: 1, Normal: 2 })[a.priority] - ({ Urgent: 0, High: 1, Normal: 2 })[b.priority]) || (a.created + (S.sla[a.priority].resolve * H) - (b.created + S.sla[b.priority].resolve * H)) : b.created - a.created);
  }
  function renderInbox() {
    setTitle('Inbox', 'Helpline · Omnichannel Inbox');
    const list = filtered();
    let h = tabsBar() + statsStrip();
    h += `<div class="hl-grid"><div class="card hl-queues"><div class="lab">Queues</div>${QUEUES.map(x => {
      const n = T.filter(x.f).length; return `<a class="${queue === x.k ? 'on' : ''} ${x.hot && n ? 'hot' : ''}" onclick="HL.setQueue('${x.k}')">${x.n}<span class="c">${n}</span></a>`;
    }).join('')}<div class="lab">Channels</div>${S.channels.filter(c => c.on).map(c => {
      const n = T.filter(t => isOpen(t) && t.channel === c.k).length; return `<a class="${fChannel === c.k ? 'on' : ''}" onclick="HL.setChannel('${c.k}')">${c.ic} ${c.k}<span class="c">${n}</span></a>`;
    }).join('')}</div>
    <div class="card"><div class="hl-filter"><input id="hl-q" placeholder="Search ticket, member, phone, company, case…" value="${esc(q)}" oninput="HL.search(this.value)">
      <select onchange="HL.setCompany(this.value)"><option value="">All companies</option>${S.companies.map(c => `<option ${fCompany === c.n ? 'selected' : ''}>${c.n}</option>`).join('')}</select>
      ${fChannel ? `<button class="btn ghost sm" onclick="HL.setChannel('')">✕ ${fChannel}</button>` : ''}
      <span style="color:var(--slate-2);font-size:12px">${list.length} ticket(s)</span></div>
      <div style="overflow:auto"><table class="hl-table"><thead><tr><th>Ticket</th><th>Ch.</th><th>Member</th><th>Subject</th><th>Status</th><th>Agent</th><th>SLA</th><th>Age</th></tr></thead>
      <tbody id="hl-rows">${rowsFor(list)}</tbody></table></div></div></div>`;
    $('#content').innerHTML = h;
  }
  function search(v) { q = v; const b = document.getElementById('hl-rows'); if (b) b.innerHTML = rowsFor(filtered()); }

  // ───────── BOARD ─────────
  function renderBoard() {
    setTitle('Board', 'Helpline · Ticket Board');
    const cols = ['New', 'In Progress', 'Waiting AMAPHIL', 'Waiting Member', 'Escalated', 'Resolved'];
    const today = new Date().toDateString();
    let h = tabsBar() + `<div class="section-head"><h3>Drag a card to change its status</h3><span class="hint">Resolved shows today's closures</span></div><div class="hl-board">`;
    cols.forEach(c => {
      const list = T.filter(t => t.status === c && (c !== 'Resolved' || (t.resolvedAt && new Date(t.resolvedAt).toDateString() === today)));
      h += `<div class="hl-col" data-st="${c}" ondragover="event.preventDefault();this.classList.add('drop')" ondragleave="this.classList.remove('drop')" ondrop="HL.drop(event,'${c}')">
        <h4><span class="hl-st ${stCls(c)}">${c}</span><span style="font-family:var(--mono);font-size:11px;color:var(--slate-2)">${list.length}</span></h4>
        ${list.map(t => { const sl = slaInfo(t); return `<div class="hl-card" draggable="true" ondragstart="event.dataTransfer.setData('text/plain','${t.id}')" onclick="HL.open('${t.id}')">
          <div class="m"><span><span class="hl-dot ${t.priority}"></span><span class="hl-id">${t.id}</span></span><span>${chIc(t.channel)}</span></div>
          <div class="t">${esc(t.subject)}${t.complaint ? '<span class="hl-cmp">!</span>' : ''}</div>
          <div class="m"><span>${esc(t.name)}</span><span class="hl-sla ${sl.cls}">${sl.txt}</span></div></div>`; }).join('') || '<div class="hl-empty" style="padding:16px">—</div>'}</div>`;
    });
    $('#content').innerHTML = h + '</div>';
  }
  function drop(e, st) {
    e.preventDefault(); const id = e.dataTransfer.getData('text/plain'), t = T.find(x => x.id === id); if (!t || t.status === st) return render();
    if (st === 'Resolved') { const sol = prompt('Solution for ' + id + ' (what we did for the member):'); if (!sol) return render(); resolve(t, sol, false); }
    else setStatus(t, st);
    render();
  }

  // ───────── TICKET WORKSPACE ─────────
  function setStatus(t, st) {
    const was = t.status; t.status = st;
    if (st === 'Resolved' || st === 'Not Resolved') t.resolvedAt = t.resolvedAt || now(); else t.resolvedAt = null;
    t.msgs.push({ w: 'system', t: now(), x: `Status: ${was} → ${st}` });
    toast(t.id + ' · ' + st);
  }
  function resolve(t, sol, fcr) {
    t.msgs.push({ w: 'agent', ch: t.channel, by: ME, t: now(), x: 'Solution: ' + sol });
    t.fcr = !!fcr; setStatus(t, 'Resolved');
    t.msgs.push({ w: 'system', t: now() + 1000, x: 'CSAT survey sent to the member (1–5).' });
  }
  function renderTicket() {
    const t = T.find(x => x.id === current); if (!t) return nav('inbox');
    setTitle('Inbox / ' + t.id, t.id + ' · ' + t.subject);
    const sl = slaInfo(t), mem = t.member ? MEMBERS[t.member] : null;
    const cases = t.member ? CASES.filter(c => c.member === t.member) : [];
    const past = T.filter(x => x.id !== t.id && ((t.member && x.member === t.member) || (x.contact && x.contact === t.contact))).slice(0, 5);
    const kb = KB.filter(k => k.c === t.category).concat(KB.filter(k => k.c === 'Other')).slice(0, 3);
    const macros = MACROS.filter(m => m.c === t.category || m.c === 'Other');
    let h = tabsBar() + `<div class="card hl-head"><span class="hl-dot ${t.priority}"></span><h3>${esc(t.subject)}</h3>${t.complaint ? '<span class="hl-cmp">COMPLAINT</span>' : ''}
      <span class="hl-sla ${sl.cls}">${sl.txt}</span><span class="spacer"></span>
      <select onchange="HL.set('status',this.value)">${S.statuses.map(s => `<option ${s === t.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
      <select onchange="HL.set('priority',this.value)">${['Urgent', 'High', 'Normal'].map(s => `<option ${s === t.priority ? 'selected' : ''}>${s}</option>`).join('')}</select>
      <select onchange="HL.set('assignee',this.value)"><option value="">Unassigned</option>${S.staff.map(s => `<option value="${s.id}" ${s.id === t.assignee ? 'selected' : ''}>${s.n}</option>`).join('')}</select>
      ${!t.assignee ? `<button class="btn sm" onclick="HL.set('assignee','${ME}')">Take it</button>` : ''}
      <button class="btn ghost sm" onclick="HL.set('status','Escalated');HL.set('assignee','SV')">⤴ Escalate</button>
      ${t.caseRef ? `<button class="btn gold sm" onclick="openCase('${t.caseRef}')">🔗 Open case ${t.caseRef}</button>` : `<button class="btn gold sm" onclick="HL.toCase()">＋ Care Desk case</button>`}
      ${isOpen(t) ? `<button class="btn green sm" onclick="HL.resolvePrompt()">✓ Resolve</button>` : ''}</div>
      <div class="hl-ws" style="margin-top:14px"><div class="card">
      <div class="hl-thread" id="hl-thread">${t.msgs.map(m => {
        const who = m.w === 'member' ? esc(t.name) + ' · ' + (m.ch || t.channel) : m.w === 'agent' ? (staff(m.by) || { n: 'Agent' }).n + ' · ' + (m.ch || t.channel) : m.w === 'note' ? '🔒 Internal note · ' + (staff(m.by) || { n: '' }).n : '';
        return `<div class="hl-msg ${m.w}">${who ? `<div class="w">${who} · ${fmtT(m.t)}</div>` : ''}${m.w === 'system' ? '— ' + esc(m.x) + ' · ' + fmtT(m.t) + ' —' : esc(m.x)}</div>`;
      }).join('')}</div>
      <div class="hl-compose ${composeMode === 'note' ? 'note' : ''}"><div class="bar">
        <div class="hl-seg"><button class="${composeMode === 'reply' ? 'on' : ''}" onclick="HL.mode('reply')">Reply to member</button><button class="${composeMode === 'note' ? 'on' : ''}" onclick="HL.mode('note')">🔒 Internal note</button></div>
        <select id="hl-macro" onchange="HL.macro(this.value)" style="padding:6px 8px;border:1px solid var(--line);border-radius:8px;font-size:12px"><option value="">⚡ Quick reply…</option>${macros.map(m => `<option value="${MACROS.indexOf(m)}">${esc(m.t)}</option>`).join('')}</select>
        <span style="font-size:11.5px;color:var(--slate-2)">via ${chIc(t.channel)} ${t.channel}</span></div>
        <textarea id="hl-text" placeholder="${composeMode === 'note' ? 'Only the team sees this note…' : 'Write to the member…'}"></textarea>
        <div class="bar" style="margin:8px 0 0"><span style="flex:1"></span>
        ${composeMode === 'reply' && isOpen(t) ? `<label style="font-size:12px;display:flex;gap:6px;align-items:center"><input type="checkbox" id="hl-solve"> Send & resolve (solved on first contact)</label>` : ''}
        <button class="btn primary sm" onclick="HL.send()">${composeMode === 'note' ? 'Add note' : 'Send'}</button></div></div></div>
      <div class="hl-side">
        <div class="hl-ai"><b>✨ Smart summary</b><br>${esc(t.name)} (${esc(t.company)}) contacted us by ${t.channel} about <b>${esc(t.category)}</b>. ${t.msgs.filter(m => m.w === 'agent').length} reply(ies) so far. Status: ${t.status}.${t.complaint ? ' <b style="color:var(--coral)">Unhappy member: keep the promised update time.</b>' : ''}${t.priority === 'Urgent' ? ' <b style="color:var(--coral)">Urgent: act within 15 minutes.</b>' : ''}</div>
        <div class="card"><div class="box"><h5>Member 360</h5>${mem ? `<div style="font-weight:700;font-size:14px">${esc(mem.name)}</div><div style="font-size:12px;color:var(--slate-2);margin-bottom:10px">${esc(mem.role)} · ${esc(mem.relation)}</div>
          <dl class="hl-kv"><dt>Member ID</dt><dd>${mem.amaphilId}</dd><dt>Company</dt><dd>${esc(mem.corporate)}</dd></dl>
          <div style="font-size:11.5px;margin-top:10px">AMBL left · Php ${mem.amblLeft.toLocaleString()} of ${mem.amblTotal.toLocaleString()}</div><div class="hl-meter"><i class="${mem.amblLeft / mem.amblTotal < 0.15 ? 'low' : ''}" style="width:${pct(mem.amblLeft, mem.amblTotal)}%"></i></div>
          <div style="font-size:11.5px">Outpatient left · Php ${mem.oamblLeft.toLocaleString()} of ${mem.oamblTotal.toLocaleString()}</div><div class="hl-meter"><i class="${mem.oamblLeft / mem.oamblTotal < 0.15 ? 'low' : ''}" style="width:${pct(mem.oamblLeft, mem.oamblTotal)}%"></i></div>`
          : `<div style="font-weight:700">${esc(t.name)}</div><div style="font-size:12px;color:var(--slate-2)">Not matched to a CBMS member yet</div>`}
          <dl class="hl-kv" style="margin-top:8px"><dt>Contact</dt><dd>${esc(t.contact)}</dd><dt>Channel</dt><dd>${chIc(t.channel)} ${t.channel}</dd><dt>Created</dt><dd>${fmtT(t.created)}</dd>
          <dt>First reply</dt><dd>${firstH(t) == null ? '<span style="color:var(--coral)">waiting</span>' : dur(firstH(t))}</dd><dt>Category</dt><dd>${esc(t.category)}</dd>${t.csat ? `<dt>CSAT</dt><dd>${'★'.repeat(t.csat)}</dd>` : ''}</dl></div></div>
        <div class="card"><div class="box"><h5>Care Desk cases (${cases.length})</h5>${cases.map(c => `<a class="hl-link" onclick="openCase('${c.ref}')"><b>${c.ref}</b> · ${esc(c.dx)}<br><span style="color:var(--slate-2)">stage: ${c.stage}</span></a>`).join('') || '<div style="font-size:12px;color:var(--slate-2)">No cases.</div>'}</div></div>
        <div class="card"><div class="box"><h5>Earlier tickets (${past.length})</h5>${past.map(x => `<a class="hl-link" onclick="HL.open('${x.id}')"><b>${x.id}</b> · ${esc(x.subject)}<br><span style="color:var(--slate-2)">${fmtT(x.created)} · ${x.status}</span></a>`).join('') || '<div style="font-size:12px;color:var(--slate-2)">First contact.</div>'}</div></div>
        <div class="card"><div class="box"><h5>Suggested answers</h5>${kb.map(k => `<a class="hl-link" onclick="HL.insertKb(${KB.indexOf(k)})"><b>📚 ${esc(k.t)}</b><br><span style="color:var(--slate-2)">click to insert</span></a>`).join('')}</div></div>
      </div></div>`;
    $('#content').innerHTML = h;
    const th = document.getElementById('hl-thread'); if (th) th.scrollTop = th.scrollHeight;
  }
  function cur() { return T.find(x => x.id === current); }
  function set(k, v) {
    const t = cur(); if (!t) return;
    if (k === 'status') { if (v === 'Resolved') return resolvePrompt(); setStatus(t, v); }
    else { t[k] = v || null; t.msgs.push({ w: 'system', t: now(), x: k === 'assignee' ? 'Assigned to ' + ((staff(v) || {}).n || 'nobody') : 'Priority: ' + v }); }
    render();
  }
  function resolvePrompt() {
    const t = cur(); if (!t) return;
    const sol = prompt('Solution (what we did for the member):'); if (!sol) return render();
    resolve(t, sol, confirm('Solved on first contact? (OK = yes)')); render();
  }
  function mode(m) { composeMode = m; render(); }
  function macro(i) { if (i === '') return; const t = cur(), a = document.getElementById('hl-text'); a.value = fill(MACROS[+i].x, t); a.focus(); }
  function insertKb(i) { const a = document.getElementById('hl-text'); if (!a) return; a.value = (a.value ? a.value + '\n' : '') + KB[i].b; KB[i].u++; a.focus(); }
  function send() {
    const t = cur(), a = document.getElementById('hl-text'), x = (a.value || '').trim(); if (!x) return toast('Write something first');
    if (composeMode === 'note') t.msgs.push({ w: 'note', by: ME, t: now(), x });
    else {
      t.msgs.push({ w: 'agent', ch: t.channel, by: ME, t: now(), x });
      if (!t.firstReply) t.firstReply = now();
      if (!t.assignee) t.assignee = ME;
      if (t.status === 'New') t.status = 'In Progress';
      const solve = document.getElementById('hl-solve'); if (solve && solve.checked) resolve(t, x.slice(0, 160), true);
    }
    render();
  }
  function toCase() {
    const t = cur(); if (!t) return;
    pendingLink = t.id; openModal();
    if (t.member) { const ms = $('#m-member'); ms.value = t.member; if (typeof memberPreview === 'function') memberPreview(); }
    $('#m-dx').value = t.subject;
    toast('Fill the case form · it will be linked to ' + t.id);
  }
  function afterCaseCreated(ref) {
    if (!pendingLink) return; const t = T.find(x => x.id === pendingLink); pendingLink = null; if (!t) return;
    t.caseRef = ref; t.msgs.push({ w: 'system', t: now(), x: 'Care Desk case ' + ref + ' opened from this ticket' });
  }

  // ───────── NEW TICKET ─────────
  function ensureModal() {
    if (document.getElementById('hlModal')) return;
    const d = document.createElement('div'); d.className = 'modal-scrim'; d.id = 'hlModal';
    d.onclick = e => { if (e.target === d) closeNew(); };
    d.innerHTML = `<div class="modal hl-modal"><div class="modal-head"><h3>＋ New helpline request</h3><button class="x" onclick="HL.closeNew()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>
      <div class="modal-body" id="hl-new-body"></div><div class="modal-foot"><span id="hl-miss" style="flex:1;font-size:12px;color:var(--coral)"></span><button class="btn ghost" onclick="HL.closeNew()">Cancel</button><button class="btn primary" onclick="HL.saveNew()">Save request</button></div></div>`;
    document.body.appendChild(d);
  }
  function newTicket() {
    ensureModal(); draftHL = { channel: 'Phone', priority: 'Normal', status: 'New', assignee: ME };
    const mopts = Object.entries(MEMBERS).map(([id, m]) => `<option value="${id}">${esc(m.name)} · ${esc(m.corporate)}</option>`).join('');
    document.getElementById('hl-new-body').innerHTML = `<div class="hl-form">
      <div class="full"><label>Channel <b>*</b></label><div class="hl-chips" id="hl-n-ch">${S.channels.filter(c => c.on).map(c => `<button class="${c.k === 'Phone' ? 'on' : ''}" onclick="HL.chip('channel','${c.k}',this)">${c.ic} ${c.k}</button>`).join('')}</div></div>
      <div><label>Member (CBMS)</label><select id="hl-n-mem" onchange="HL.memPick(this.value)"><option value="">— not found / new caller —</option>${mopts}</select></div>
      <div><label>Name <b>*</b></label><input id="hl-n-name" placeholder="Caller name"></div>
      <div><label>Company <b>*</b></label><select id="hl-n-co"><option value="">— choose —</option>${S.companies.map(c => `<option>${c.n}</option>`).join('')}<option>UNKNOWN</option></select></div>
      <div><label>Contact (phone / email)</label><input id="hl-n-contact" onblur="HL.hint()"></div>
      <div class="full"><label>Subject <b>*</b></label><input id="hl-n-subj" placeholder="Short title" oninput="HL.hint()"></div>
      <div class="full"><label>Request details <b>*</b></label><textarea id="hl-n-det" placeholder="What does the member need?" oninput="HL.hint()"></textarea><div class="hl-hint" id="hl-n-hint"></div></div>
      <div><label>Category <b>*</b></label><select id="hl-n-cat"><option value="">— choose —</option>${S.categories.map(c => `<option>${c.n}</option>`).join('')}</select></div>
      <div><label>Assign to</label><select id="hl-n-as">${S.staff.map(s => `<option value="${s.id}" ${s.id === ME ? 'selected' : ''}>${s.n}</option>`).join('')}<option value="">Unassigned</option></select></div>
      <div><label>Priority <b>*</b></label><div class="hl-chips" id="hl-n-pr">${['Urgent', 'High', 'Normal'].map(p => `<button class="${p === 'Normal' ? 'on' : ''} ${p}" onclick="HL.chip('priority','${p}',this)">${p}</button>`).join('')}</div></div>
      <div><label>&nbsp;</label><label style="text-transform:none;font-size:13px;color:var(--ink);display:flex;gap:8px;align-items:center"><input type="checkbox" id="hl-n-cmp" style="width:auto"> ⚠️ This is a complaint</label></div>
      <div class="full"><label style="text-transform:none;font-size:13px;color:var(--ink);display:flex;gap:8px;align-items:center"><input type="checkbox" id="hl-n-done" style="width:auto" onchange="document.getElementById('hl-n-solbox').style.display=this.checked?'block':'none'"> ✅ Solved during this contact</label>
        <div id="hl-n-solbox" style="display:none;margin-top:8px"><label>Solution <b>*</b></label><textarea id="hl-n-sol" style="min-height:60px"></textarea></div></div>
    </div>`;
    document.getElementById('hl-miss').textContent = '';
    document.getElementById('hlModal').classList.add('open');
  }
  function closeNew() { const m = document.getElementById('hlModal'); if (m) m.classList.remove('open'); }
  function chip(k, v, el) { draftHL[k] = v; el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); }
  function memPick(id) {
    const m = MEMBERS[id]; if (!m) return;
    document.getElementById('hl-n-name').value = m.name;
    const co = document.getElementById('hl-n-co'); if ([...co.options].some(o => o.value === m.corporate)) co.value = m.corporate;
    hint();
  }
  function hint() {
    const txt = (document.getElementById('hl-n-subj').value + ' ' + document.getElementById('hl-n-det').value).trim(); if (!txt) return;
    const tr = triage(txt), cat = document.getElementById('hl-n-cat'), out = [];
    if (!cat.value) { cat.value = tr.category; out.push('✨ Category: ' + tr.category); }
    if (tr.priority !== 'Normal') { chip('priority', tr.priority, [...document.querySelectorAll('#hl-n-pr button')].find(b => b.textContent === tr.priority)); out.push((tr.priority === 'Urgent' ? '🔴 ' : '🟠 ') + 'Priority ' + tr.priority); }
    if (tr.complaint) { document.getElementById('hl-n-cmp').checked = true; out.push('⚠️ Looks like a complaint'); }
    const c = document.getElementById('hl-n-contact').value.trim();
    if (c) { const prev = T.filter(t => t.contact === c); if (prev.length) { out.push('🔎 ' + prev.length + ' earlier ticket(s) for this contact'); const co = document.getElementById('hl-n-co'); if (!co.value) co.value = prev[0].company; } }
    document.getElementById('hl-n-hint').textContent = out.join('   ');
  }
  function saveNew() {
    const g = id => document.getElementById(id), v = id => (g(id).value || '').trim();
    const miss = [];
    if (!draftHL.channel) miss.push('Channel'); if (!v('hl-n-name')) miss.push('Name'); if (!v('hl-n-co')) miss.push('Company');
    if (!v('hl-n-subj')) miss.push('Subject'); if (!v('hl-n-det')) miss.push('Details'); if (!v('hl-n-cat')) miss.push('Category');
    const done = g('hl-n-done').checked; if (done && !v('hl-n-sol')) miss.push('Solution');
    if (miss.length) { g('hl-miss').textContent = '⚠ Missing: ' + miss.join(', '); return; }
    const t = {
      id: 'HL-' + (++seq), created: now(), channel: draftHL.channel, company: v('hl-n-co'), member: v('hl-n-mem') || null, name: v('hl-n-name'),
      contact: v('hl-n-contact'), subject: v('hl-n-subj'), category: v('hl-n-cat'), priority: draftHL.priority, complaint: g('hl-n-cmp').checked,
      sentiment: g('hl-n-cmp').checked ? 'negative' : 'neutral', status: 'New', assignee: v('hl-n-as') || null, firstReply: null, resolvedAt: null,
      fcr: false, csat: null, caseRef: null, msgs: [{ w: 'member', ch: draftHL.channel, t: now(), x: v('hl-n-det') }],
    };
    T.unshift(t);
    if (done) { t.firstReply = now(); t.assignee = t.assignee || ME; resolve(t, v('hl-n-sol'), true); }
    else if (t.assignee) t.status = 'In Progress';
    closeNew(); toast('✓ ' + t.id + ' saved'); open(t.id);
  }

  // ───────── SUPERVISOR WALLBOARD ─────────
  function renderWall() {
    setTitle('Supervisor', 'Helpline · Live Wallboard');
    const op = T.filter(isOpen), today = new Date().toDateString();
    const todayClosed = T.filter(t => t.resolvedAt && new Date(t.resolvedAt).toDateString() === today);
    const met = todayClosed.filter(t => slaInfo(t).met).length;
    const oldest = op.reduce((m, t) => Math.max(m, now() - t.created), 0) / H;
    const unass = op.filter(t => !t.assignee).length;
    const big = (k, v, c) => `<div class="card hl-big ${c || ''}"><div class="k">${k}</div><div class="v">${v}</div></div>`;
    let h = tabsBar() + `<div class="section-head"><h3>Live · refreshes every 30 seconds</h3><span class="hint">${new Date().toLocaleTimeString('en-GB')}</span></div>
      <div class="hl-wall">${big('Open now', op.length)}${big('Unassigned', unass, unass ? 'red' : 'green')}${big('Overdue', op.filter(t => slaInfo(t).over).length, 'red')}${big('Urgent open', op.filter(t => t.priority === 'Urgent').length, 'red')}
      ${big('Resolved today', todayClosed.length, 'green')}${big('SLA met today', todayClosed.length ? pct(met, todayClosed.length) + '%' : '—', 'green')}${big('Oldest open', dur(oldest), oldest > 48 ? 'red' : 'gold')}${big('Open complaints', op.filter(t => t.complaint).length, 'red')}</div>`;
    const ag = S.staff.map(s => {
      const mine = op.filter(t => t.assignee === s.id), rt = todayClosed.filter(t => t.assignee === s.id);
      const last30 = T.filter(t => t.assignee === s.id && t.resolvedAt && t.resolvedAt > now() - 30 * D);
      const fcr = pct(last30.filter(t => t.fcr).length, last30.length), cs = last30.filter(t => t.csat);
      return `<tr><td><span class="hl-av">${s.id}</span> <b>${s.n}</b><div class="sub">${s.role} · ${s.shift}</div></td><td>${s.on ? '<span class="hl-on">● On duty</span>' : '<span class="hl-off">○ Off</span>'}</td>
        <td><b>${mine.length}</b>${mine.filter(t => slaInfo(t).over).length ? ` <span class="hl-sla over">${mine.filter(t => slaInfo(t).over).length} over</span>` : ''}</td><td>${rt.length}</td><td>${last30.length}</td><td>${fcr}%</td><td>${cs.length ? (cs.reduce((a, t) => a + t.csat, 0) / cs.length).toFixed(1) + ' ★' : '—'}</td></tr>`;
    }).join('');
    const byCh = S.channels.map(c => ({ c, n: op.filter(t => t.channel === c.k).length })).filter(x => x.n), mx = Math.max(1, ...byCh.map(x => x.n));
    h += `<div class="hl-two" style="margin-top:16px"><div class="card"><div class="box" style="padding:14px 16px"><h5 style="font-family:var(--mono);font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--slate-2)">Team</h5>
      <table class="hl-table"><thead><tr><th>Agent</th><th>Status</th><th>Open</th><th>Closed today</th><th>Closed 30d</th><th>FCR 30d</th><th>CSAT 30d</th></tr></thead><tbody>${ag}</tbody></table></div></div>
      <div class="card"><div class="box" style="padding:14px 16px"><h5 style="font-family:var(--mono);font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--slate-2)">Open by channel</h5><div class="hl-bars">${byCh.map(x => `<div class="r"><span>${x.c.ic} ${x.c.k}</span><div class="b"><i style="width:${pct(x.n, mx)}%"></i></div><b>${x.n}</b></div>`).join('') || '—'}</div>
      <h5 style="font-family:var(--mono);font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--slate-2);margin-top:16px">Needs attention</h5>${op.filter(t => slaInfo(t).over || slaInfo(t).risk || !t.assignee).slice(0, 6).map(t => `<a class="hl-link" onclick="HL.open('${t.id}')"><span class="hl-dot ${t.priority}"></span><b>${t.id}</b> · ${esc(t.subject)} <span class="hl-sla ${slaInfo(t).cls}">${slaInfo(t).txt}</span>${!t.assignee ? ' <span class="hl-cmp">UNASSIGNED</span>' : ''}</a>`).join('') || '<div class="hl-empty">All under control ✅</div>'}</div></div></div>`;
    $('#content').innerHTML = h;
    wallTimer = setInterval(() => { if (view === 'hl' && tab === 'wall') renderWall(); }, 30000);
  }

  // ───────── KPIs & REPORTS (2 layers) ─────────
  function members(co) { return co ? (S.companies.find(c => c.n === co) || { m: 0 }).m : S.companies.reduce((a, c) => a + c.m, 0); }
  function kpiSet(list, co) {
    const res = list.filter(t => t.status === 'Resolved'), cmp = list.filter(t => t.complaint);
    const fr = list.map(firstH).filter(x => x != null), rh = res.map(resH);
    const closed = list.filter(t => !isOpen(t)), met = closed.filter(t => slaInfo(t).met).length, cs = list.filter(t => t.csat);
    const mem = members(co);
    return {
      n: list.length, res: res.length, rate: pct(res.length, list.length), fcr: pct(res.filter(t => t.fcr).length, res.length),
      first: fr.length ? fr.reduce((a, b) => a + b, 0) / fr.length : 0, resolve: rh.length ? rh.sort((a, b) => a - b)[Math.floor(rh.length / 2)] : 0,
      sla: pct(met, closed.length), cmp: cmp.length, cmpRes: cmp.filter(t => t.status === 'Resolved').length, mem,
      cmpPct: mem ? cmp.length / mem * 100 : 0, per1k: mem ? list.length / mem * 1000 : 0, csat: cs.length ? cs.reduce((a, t) => a + t.csat, 0) / cs.length : 0,
    };
  }
  function renderKpi() {
    setTitle('KPIs & Reports', 'Helpline · KPIs & Client Reports');
    const years = [...new Set(T.map(t => new Date(t.created).getFullYear()))].sort();
    if (!kpiYear) kpiYear = years[years.length - 1];
    const inY = t => new Date(t.created).getFullYear() === kpiYear;
    const list = T.filter(t => inY(t) && (!kpiCompany || t.company === kpiCompany));
    const prev = T.filter(t => new Date(t.created).getFullYear() === kpiYear - 1 && (!kpiCompany || t.company === kpiCompany));
    const k = kpiSet(list, kpiCompany), p = prev.length ? kpiSet(prev, kpiCompany) : null;
    const tgt = (v, ok, txt) => `<b class="${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'}</b> ${txt}`;
    const delta = (a, b, better) => b == null ? '' : ` · <b class="${(better === 'up' ? a >= b : a <= b) ? 'ok' : 'no'}">${a >= b ? '▲' : '▼'} vs ${kpiYear - 1}</b>`;
    let h = tabsBar() + `<div class="hl-filter card" style="margin-bottom:16px;border:1px solid var(--line)"><b style="font-family:var(--disp)">Report for</b>
      <select onchange="HL.kpiSet('company',this.value)"><option value="">All companies</option>${S.companies.map(c => `<option ${kpiCompany === c.n ? 'selected' : ''}>${c.n}</option>`).join('')}</select>
      <select onchange="HL.kpiSet('year',this.value)">${years.map(y => `<option ${y === kpiYear ? 'selected' : ''}>${y}</option>`).join('')}</select>
      <span style="flex:1"></span><button class="btn ghost sm" onclick="HL.exportCsv()">⬇ Export CSV (presentations)</button></div>`;
    const oneIn = k.cmp ? Math.round(k.mem / k.cmp).toLocaleString() : null;
    h += `<div class="hl-proof"><div style="font-size:38px">🛡️</div><div class="big">${kpiCompany || 'Polaris'} · ${kpiYear}: we answered <em>${k.n.toLocaleString()}</em> requests from <em>${k.mem.toLocaleString()}</em> members and resolved <em>${k.rate}%</em>. ${k.cmp ? `Only <em>${k.cmpPct.toFixed(2)}%</em> of members complained (1 in ${oneIn}) and we resolved <em>${pct(k.cmpRes, k.cmp)}%</em> of those complaints.` : `<em>Zero complaints.</em>`}</div></div>`;
    const card = (kk, v, t) => `<div class="card hl-kpi"><div class="k">${kk}</div><div class="v">${v}</div><div class="t">${t}</div></div>`;
    h += `<div class="section-head"><h3>Layer 1 · The year at a glance</h3><span class="hint">targets from the Polaris SLA policy</span></div><div class="hl-kgrid">
      ${card('Requests answered', k.n.toLocaleString(), `${k.per1k.toFixed(0)} per 1,000 members${delta(k.n, p && p.n, 'up')}`)}
      ${card('Resolution rate', k.rate + '%', tgt(k.rate, k.rate >= 95, 'target ≥ 95%') + delta(k.rate, p && p.rate, 'up'))}
      ${card('Solved on first contact', k.fcr + '%', tgt(k.fcr, k.fcr >= 75, 'target ≥ 75% · industry ~70%'))}
      ${card('SLA met', k.sla + '%', tgt(k.sla, k.sla >= 90, 'target ≥ 90%'))}
      ${card('Avg first response', dur(k.first), tgt(k.first, k.first <= 1, 'target ≤ 1h'))}
      ${card('Median resolution time', dur(k.resolve), 'received → resolved' + delta(k.resolve, p && p.resolve, 'down'))}
      ${card('Complaints', k.cmp + ' · ' + k.cmpPct.toFixed(2) + '%', tgt(k.cmpPct, k.cmp / Math.max(1, k.mem) * 1000 <= 1, '≤ 1 per 1,000 members') + (oneIn ? ' · 1 in ' + oneIn : ''))}
      ${card('Member satisfaction', k.csat ? k.csat.toFixed(1) + ' / 5' : '—', tgt(k.csat, k.csat >= 4.5, 'target ≥ 4.5 (CSAT)'))}</div>`;
    // monthly chart
    const mon = MONTHS.map((m, i) => { const l = list.filter(t => new Date(t.created).getMonth() === i); return { m, n: l.length, r: l.filter(t => t.status === 'Resolved').length }; });
    const mx = Math.max(1, ...mon.map(x => x.n)), W = 900, Hh = 220, bw = W / 12;
    h += `<div class="card hl-chart"><div class="section-head" style="margin:0 0 8px"><h3>Requests received vs resolved · ${kpiYear}</h3><span class="hint"><span style="color:var(--ink-2)">■</span> received <span style="color:var(--teal)">■</span> resolved</span></div>
      <svg viewBox="0 0 ${W} ${Hh + 30}">${mon.map((x, i) => {
        const h1 = x.n / mx * Hh, h2 = x.r / mx * Hh, X = i * bw + bw * 0.18;
        return `<rect x="${X}" y="${Hh - h1}" width="${bw * 0.3}" height="${h1}" rx="3" fill="#102A38"/><rect x="${X + bw * 0.33}" y="${Hh - h2}" width="${bw * 0.3}" height="${h2}" rx="3" fill="#0E8C92"/>
        ${x.n ? `<text x="${X + bw * 0.31}" y="${Hh - h1 - 5}" font-size="11" text-anchor="middle" fill="#3A4A52" font-family="IBM Plex Mono">${x.n}</text>` : ''}<text x="${X + bw * 0.31}" y="${Hh + 18}" font-size="11" text-anchor="middle" fill="#6B7980">${x.m}</text>`;
      }).join('')}</svg></div>`;
    // layer 2 matrix
    const cos = kpiCompany ? S.companies.filter(c => c.n === kpiCompany) : S.companies;
    const cell = (l) => { const r = l.filter(t => t.status === 'Resolved').length; return l.length ? `<td class="cell"><b>${l.length}</b><span>${r} ✓</span></td>` : '<td class="z">·</td>'; };
    h += `<div class="section-head"><h3>Layer 2 · Month by month, per company</h3><span class="hint">each cell: answered / resolved</span></div><div class="card" style="overflow:auto;margin-bottom:18px"><table class="hl-mtx"><thead><tr><th>Company</th>${MONTHS.map(m => `<th>${m}</th>`).join('')}<th>Year</th><th>Resolved</th><th>Complaints</th></tr></thead><tbody>
      ${cos.map(c => { const l = list.filter(t => t.company === c.n); return `<tr><td>${c.n}<div class="sub">${c.m.toLocaleString()} members</div></td>${MONTHS.map((m, i) => cell(l.filter(t => new Date(t.created).getMonth() === i))).join('')}${cell(l)}<td><b>${pct(l.filter(t => t.status === 'Resolved').length, l.length)}%</b></td><td>${l.filter(t => t.complaint).length}</td></tr>`; }).join('')}
      <tr class="tot"><td>TOTAL</td>${MONTHS.map((m, i) => cell(list.filter(t => new Date(t.created).getMonth() === i))).join('')}${cell(list)}<td><b>${k.rate}%</b></td><td>${k.cmp}</td></tr></tbody></table></div>`;
    // categories + channels
    const bars = (arr) => { const m = Math.max(1, ...arr.map(x => x[1])); return `<div class="hl-bars">${arr.map(x => `<div class="r"><span>${x[0]}</span><div class="b"><i style="width:${pct(x[1], m)}%"></i></div><b>${x[1]}</b></div>`).join('')}</div>`; };
    const cats = S.categories.map(c => [c.n, list.filter(t => t.category === c.n).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
    const chs = S.channels.map(c => [c.ic + ' ' + c.k, list.filter(t => t.channel === c.k).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
    h += `<div class="hl-two"><div class="card"><div style="padding:14px 16px"><h3 style="font-family:var(--disp);font-size:14px;margin:0 0 8px">What members ask about</h3>${bars(cats)}</div></div>
      <div class="card"><div style="padding:14px 16px"><h3 style="font-family:var(--disp);font-size:14px;margin:0 0 8px">How members reach us</h3>${bars(chs)}</div></div></div>`;
    $('#content').innerHTML = h;
  }
  function kpiSetFilter(k, v) { if (k === 'year') kpiYear = +v; else kpiCompany = v; render(); }
  function exportCsv() {
    const list = T.filter(t => new Date(t.created).getFullYear() === kpiYear);
    const rows = [['Company', 'Members', ...MONTHS.flatMap(m => [m + ' answered', m + ' resolved']), 'Year answered', 'Year resolved', 'Complaints']];
    S.companies.forEach(c => {
      const l = list.filter(t => t.company === c.n);
      rows.push([c.n, c.m, ...MONTHS.flatMap((m, i) => { const x = l.filter(t => new Date(t.created).getMonth() === i); return [x.length, x.filter(t => t.status === 'Resolved').length]; }), l.length, l.filter(t => t.status === 'Resolved').length, l.filter(t => t.complaint).length]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `helpline-kpis-${kpiYear}.csv`; a.click();
    toast('CSV exported');
  }

  // ───────── KNOWLEDGE & MACROS ─────────
  function renderKb() {
    setTitle('Knowledge & Macros', 'Helpline · Knowledge Base & Quick Replies');
    let h = tabsBar() + `<div class="hl-kb"><div class="card"><div class="hl-filter"><b style="font-family:var(--disp)">📚 Knowledge base</b><span style="flex:1"></span><button class="btn sm" onclick="HL.addKb()">＋ Article</button></div>
      ${KB.slice().sort((a, b) => b.u - a.u).map(k => `<div class="hl-art"><h6>${esc(k.t)}</h6><p>${esc(k.b)}</p><div class="m">${esc(k.c)} · used ${k.u} times</div></div>`).join('')}</div>
      <div class="card"><div class="hl-filter"><b style="font-family:var(--disp)">⚡ Quick replies (macros)</b><span style="flex:1"></span><button class="btn sm" onclick="HL.addMacro()">＋ Quick reply</button></div>
      ${MACROS.map(m => `<div class="hl-art"><h6>${esc(m.t)}</h6><p>${esc(m.x)}</p><div class="m">${esc(m.c)} · placeholders: {name} {id} {sla} {providers}</div></div>`).join('')}</div></div>`;
    $('#content').innerHTML = h;
  }
  function addKb() { const t = prompt('Article title:'); if (!t) return; const b = prompt('Answer text:') || ''; KB.push({ t, c: 'Other', b, u: 0 }); render(); }
  function addMacro() { const t = prompt('Quick reply title:'); if (!t) return; const x = prompt('Text (use {name}, {id}, {sla}):') || ''; MACROS.push({ t, c: 'Other', x }); render(); }

  // ───────── QUALITY (QA) ─────────
  let qaPick = null;
  function renderQa() {
    setTitle('Quality', 'Helpline · Quality Assurance');
    const pool = T.filter(t => t.status === 'Resolved' && !QA.find(e => e.id === t.id)).slice(0, 8);
    const cls = v => v >= 85 ? 'g' : v >= 70 ? 'a' : 'r';
    const lead = S.staff.filter(s => s.role === 'Agent').map(s => {
      const ev = QA.filter(e => e.agent === s.id), l = T.filter(t => t.assignee === s.id && t.resolvedAt && t.resolvedAt > now() - 90 * D), cs = l.filter(t => t.csat);
      return { s, qa: ev.length ? Math.round(ev.reduce((a, e) => a + e.total, 0) / ev.length) : 0, n: ev.length, fcr: pct(l.filter(t => t.fcr).length, l.length), csat: cs.length ? cs.reduce((a, t) => a + t.csat, 0) / cs.length : 0, closed: l.length };
    }).sort((a, b) => b.qa - a.qa);
    let h = tabsBar() + `<div class="hl-two"><div class="card"><div style="padding:14px 16px"><h3 style="font-family:var(--disp);font-size:14px;margin:0 0 8px">🏆 Agent scorecard · last 90 days</h3>
      <table class="hl-table"><thead><tr><th>Agent</th><th>QA score</th><th>Evaluations</th><th>FCR</th><th>CSAT</th><th>Closed</th></tr></thead><tbody>${lead.map(x => `<tr><td><span class="hl-av">${x.s.id}</span> <b>${x.s.n}</b></td><td><span class="hl-score ${cls(x.qa)}">${x.qa}</span>/100</td><td>${x.n}</td><td>${x.fcr}%</td><td>${x.csat ? x.csat.toFixed(1) + ' ★' : '—'}</td><td>${x.closed}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="card"><div style="padding:14px 16px"><h3 style="font-family:var(--disp);font-size:14px;margin:0 0 8px">🎯 Evaluate a ticket</h3>
      <select onchange="HL.qaPick(this.value)" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:8px;margin-bottom:10px"><option value="">— pick a resolved ticket —</option>${pool.map(t => `<option value="${t.id}" ${qaPick === t.id ? 'selected' : ''}>${t.id} · ${esc(t.subject)} · ${(staff(t.assignee) || {}).n || ''}</option>`).join('')}</select>
      ${qaPick ? `${QA_CRIT.map((c, i) => `<div class="hl-int"><span>${c.k} <span style="color:var(--slate-2);font-size:11px">(${c.w} pts)</span></span><select id="qa-${i}" style="padding:5px;border:1px solid var(--line);border-radius:6px"><option value="1">Yes</option><option value="0.5">Partly</option><option value="0">No</option></select></div>`).join('')}
        <button class="btn primary sm" style="margin-top:10px" onclick="HL.qaSave()">Save evaluation</button>` : '<div style="font-size:12px;color:var(--slate-2)">The supervisor reviews a sample of tickets every week. Criteria and weights are set here.</div>'}</div></div></div>
      <div class="card"><div style="padding:14px 16px"><h3 style="font-family:var(--disp);font-size:14px;margin:0 0 8px">Recent evaluations</h3><table class="hl-table"><thead><tr><th>Ticket</th><th>Agent</th><th>Date</th><th>Score</th><th>Weakest point</th></tr></thead><tbody>
      ${QA.slice().sort((a, b) => b.at - a.at).slice(0, 12).map(e => { const w = e.scores.slice().sort((a, b) => a.v - b.v)[0]; return `<tr class="row" onclick="HL.open('${e.id}')"><td class="hl-id">${e.id}</td><td>${(staff(e.agent) || {}).n || ''}</td><td>${fmtT(e.at)}</td><td><span class="hl-score ${cls(e.total)}">${e.total}</span></td><td>${w.v < 1 ? esc(w.k) : '—'}</td></tr>`; }).join('')}</tbody></table></div></div>`;
    $('#content').innerHTML = h;
  }
  function qaPickFn(id) { qaPick = id || null; render(); }
  function qaSave() {
    const t = T.find(x => x.id === qaPick); if (!t) return;
    const sc = QA_CRIT.map((c, i) => ({ k: c.k, w: c.w, v: +document.getElementById('qa-' + i).value }));
    QA.push({ id: t.id, agent: t.assignee, at: now(), by: 'SV', scores: sc, total: Math.round(sc.reduce((a, s) => a + s.w * s.v, 0)) });
    qaPick = null; toast('Evaluation saved'); render();
  }

  // ───────── ADMIN ─────────
  function renderAdmin() {
    setTitle('Admin', 'Helpline · Administration');
    let h = tabsBar() + `<div class="hl-admin">
      <div class="card"><h3 style="font-family:var(--disp);font-size:14px;margin:0 0 4px">🏢 Companies</h3><div style="font-size:11.5px;color:var(--slate-2);margin-bottom:8px">In production this list comes from CBMS (Active Members by Contract). Same names everywhere: helpline, KPIs, presentations.</div>
        <table><thead><tr><th>Company</th><th>Members</th><th>E-mail domain (auto-match)</th></tr></thead><tbody>${S.companies.map((c, i) => `<tr><td><b>${c.n}</b></td><td><input type="number" value="${c.m}" onchange="HL.adm('co',${i},'m',+this.value)"></td><td><input type="text" value="${c.dom}" onchange="HL.adm('co',${i},'dom',this.value)"></td></tr>`).join('')}</tbody></table></div>
      <div class="card"><h3 style="font-family:var(--disp);font-size:14px;margin:0 0 8px">⏱ SLA policy</h3><table><thead><tr><th>Priority</th><th>First reply (h)</th><th>Resolve (h)</th></tr></thead><tbody>${Object.keys(S.sla).map(p => `<tr><td><span class="hl-dot ${p}"></span><b>${p}</b></td><td><input type="number" step="0.25" value="${S.sla[p].first}" onchange="HL.adm('sla','${p}','first',+this.value)"></td><td><input type="number" step="0.5" value="${S.sla[p].resolve}" onchange="HL.adm('sla','${p}','resolve',+this.value)"></td></tr>`).join('')}</tbody></table>
        <div style="font-size:11.5px;color:var(--slate-2);margin-top:8px">Business hours: ${esc(S.hours)}. Complaints: High priority, close within 7 days, supervisor review.</div></div>
      <div class="card"><h3 style="font-family:var(--disp);font-size:14px;margin:0 0 8px">🏷 Categories & auto-tagging words</h3><table><thead><tr><th>Category</th><th>Words that trigger it</th></tr></thead><tbody>${S.categories.map((c, i) => `<tr><td><b>${c.n}</b></td><td><input type="text" value="${esc(c.kw)}" onchange="HL.adm('cat',${i},'kw',this.value)"></td></tr>`).join('')}</tbody></table></div>
      <div class="card"><h3 style="font-family:var(--disp);font-size:14px;margin:0 0 8px">📡 Channels & automatic replies</h3><table><thead><tr><th>On</th><th>Channel</th><th>Auto-reply</th></tr></thead><tbody>${S.channels.map((c, i) => `<tr><td><input type="checkbox" ${c.on ? 'checked' : ''} onchange="HL.adm('ch',${i},'on',this.checked)"></td><td>${c.ic} <b>${c.k}</b></td><td><input type="text" value="${esc(c.auto)}" placeholder="no auto-reply" onchange="HL.adm('ch',${i},'auto',this.value)"></td></tr>`).join('')}</tbody></table></div>
      <div class="card"><h3 style="font-family:var(--disp);font-size:14px;margin:0 0 8px">👥 Team & shifts</h3><table><thead><tr><th>Name</th><th>Role</th><th>Shift</th><th>On duty</th></tr></thead><tbody>${S.staff.map((s, i) => `<tr><td><span class="hl-av">${s.id}</span> <b>${s.n}</b></td><td>${s.role}</td><td><input type="text" value="${s.shift}" onchange="HL.adm('st',${i},'shift',this.value)"></td><td><input type="checkbox" ${s.on ? 'checked' : ''} onchange="HL.adm('st',${i},'on',this.checked)"></td></tr>`).join('')}</tbody></table></div>
      <div class="card"><h3 style="font-family:var(--disp);font-size:14px;margin:0 0 8px">🔌 Integrations</h3>
        ${[['✉️ Helpline e-mail inbox', 'Every 5 min · new e-mail = ticket + auto-reply', 1], ['🟢 WhatsApp Business Platform', 'Needs business number (Meta)', 0], ['🟣 Viber Business', 'Needs Viber business account', 0], ['💬 Facebook Messenger', 'Page inbox webhook', 0], ['📱 SMS gateway', 'Inbound SMS to ticket', 0], ['🗄 CBMS', 'Members, companies, AMBL nightly sync', 1], ['🏥 Care Desk cases', 'Ticket → case with one click', 1], ['📊 CBMS dashboard & presentations', 'KPIs feed nightly', 1]].map(x => `<div class="hl-int"><span><b>${x[0]}</b><br><span style="font-size:11.5px;color:var(--slate-2)">${x[1]}</span></span>${x[2] ? '<span class="hl-on">● Connected (demo)</span>' : '<span class="hl-off">○ Not connected</span>'}</div>`).join('')}</div>
    </div>`;
    $('#content').innerHTML = h;
  }
  function adm(sec, i, k, v) {
    if (sec === 'co') S.companies[i][k] = v; else if (sec === 'sla') S.sla[i][k] = v; else if (sec === 'cat') S.categories[i][k] = v;
    else if (sec === 'ch') S.channels[i][k] = v; else if (sec === 'st') S.staff[i][k] = v;
    toast('Saved');
  }

  // ───────── public API ─────────
  seed();
  return {
    render: renderAll, nav, open, setQueue: k => { queue = k; render(); }, setChannel: c => { fChannel = c; render(); }, setCompany: c => { fCompany = c; render(); },
    search, drop, set, resolvePrompt, mode, macro, insertKb, send, toCase, afterCaseCreated, newTicket, closeNew, chip, memPick, hint, saveNew,
    kpiSet: kpiSetFilter, exportCsv, addKb, addMacro, qaPick: qaPickFn, qaSave, adm, tickets: () => T, triage, navCount,
  };
})();

/* ───────── hooks into the Care Desk shell ───────── */
(function () {
  const origCreate = window.createCase;
  if (typeof origCreate === 'function') {
    window.createCase = function () {
      const before = CASES.length; origCreate.apply(this, arguments);
      if (CASES.length > before) HL.afterCaseCreated(CASES[0].ref);
    };
  }
  HL.navCount();
})();
