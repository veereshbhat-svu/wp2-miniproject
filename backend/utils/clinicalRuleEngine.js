/**
 * Clinical Decision Support & Multi-Condition Risk Scoring Engine
 * Evaluates multi-analyte cross-interactions and patient triage symptoms.
 */

export function evaluateClinicalRisk(analytes = [], triageData = null) {
  // Helper to extract analyte value
  const getAnalyte = (name) => analytes.find((a) => a.name.toLowerCase().includes(name.toLowerCase())) || null;

  const nit = getAnalyte('nitrite');
  const leu = getAnalyte('leucocyte');
  const bld = getAnalyte('blood');
  const pro = getAnalyte('protein');
  const glu = getAnalyte('glucose');
  const ket = getAnalyte('ketone');
  const phVal = getAnalyte('ph');
  const sgVal = getAnalyte('specific gravity');
  const bil = getAnalyte('bilirubin');
  const uro = getAnalyte('urobilinogen');

  const symptoms = (triageData?.symptoms || []).map((s) => s.toLowerCase());
  const triageNotes = (triageData?.notes || '').toLowerCase();

  const hasSymptom = (term) =>
    symptoms.some((s) => s.includes(term.toLowerCase())) || triageNotes.includes(term.toLowerCase());

  const findings = [];
  const recommendations = [];

  // ================= 1. UTI PROBABILITY SCORE =================
  let utiScore = 0;
  if (nit && nit.exact.toLowerCase().includes('pos')) {
    utiScore += 40;
    findings.push('Bacterial nitrate-reductase activity confirmed (Positive Nitrite).');
  }
  if (leu) {
    if (leu.status === 'abnormal') {
      utiScore += 35;
      findings.push('Significant pyuria / leukocyturia (>25 Leu/μL) indicates active immune response.');
    } else if (leu.status === 'warning') {
      utiScore += 15;
    }
  }
  if (bld && bld.status !== 'normal') {
    utiScore += 10;
    findings.push('Microscopic hematuria co-present, consistent with urothelial inflammation.');
  }
  if (phVal && parseFloat(phVal.exact) > 7.4) {
    utiScore += 10;
    findings.push('Alkaline urine pH (>7.4) characteristic of urease-producing bacterial flora (e.g. Proteus mirabilis).');
  }
  if (hasSymptom('burn') || hasSymptom('dysuria')) utiScore += 10;
  if (hasSymptom('urgency') || hasSymptom('frequent')) utiScore += 5;
  if (hasSymptom('cloudy')) utiScore += 5;
  if (hasSymptom('fever')) utiScore += 10;

  utiScore = Math.min(100, Math.max(0, utiScore));
  const utiRiskLevel = utiScore >= 60 ? 'High' : utiScore >= 25 ? 'Moderate' : 'Low';

  if (utiScore >= 60) {
    recommendations.push('Immediate midstream urine culture (U/C) & antibiotic sensitivity test advised.');
    recommendations.push('Consider first-line empirical antibiotic regimen (Nitrofurantoin 100mg BID or Fosfomycin 3g PO).');
  }

  // ================= 2. RENAL GLOMERULAR STRAIN SCORE =================
  let renalScore = 0;
  if (pro) {
    if (pro.status === 'abnormal') {
      renalScore += 50;
      findings.push('Marked proteinuria detected, pointing toward altered glomerular capillary permeability.');
    } else if (pro.status === 'warning') {
      renalScore += 25;
      findings.push('Trace to mild proteinuria observed.');
    }
  }
  if (sgVal && parseFloat(sgVal.exact) >= 1.028) {
    renalScore += 15;
    findings.push('High Specific Gravity indicates elevated urinary osmolality and tubular concentration.');
  }
  if (bld && bld.status === 'abnormal') {
    renalScore += 20;
    findings.push('Concomitant hematuria suggests nephritic or glomerulonephritic involvement.');
  }
  if (hasSymptom('flank') || hasSymptom('back pain')) renalScore += 15;
  if (hasSymptom('pelvic')) renalScore += 5;

  renalScore = Math.min(100, Math.max(0, renalScore));
  const renalRiskLevel = renalScore >= 55 ? 'High' : renalScore >= 25 ? 'Moderate' : 'Low';

  if (renalScore >= 55) {
    recommendations.push('Renal Function Test (Serum Creatinine, eGFR, Blood Urea Nitrogen) strongly recommended.');
    recommendations.push('24-Hour Urine Protein & Albumin-to-Creatinine Ratio (uACR) quantification indicated.');
  }

  // ================= 3. DIABETIC KETOACIDOSIS / GLYCOSURIA RISK =================
  let dkaScore = 0;
  if (glu) {
    if (glu.status === 'abnormal') {
      dkaScore += 50;
      findings.push('Marked glycosuria (>100 mg/dL): renal reabsorption threshold (~180 mg/dL) exceeded.');
    } else if (glu.status === 'warning') {
      dkaScore += 20;
    }
  }
  if (ket) {
    if (ket.status === 'abnormal') {
      dkaScore += 40;
      findings.push('Ketonuria confirmed: active lipolysis and circulating ketone body accumulation.');
    } else if (ket.status === 'warning') {
      dkaScore += 20;
    }
  }
  if (hasSymptom('thirst') || hasSymptom('polyuria')) dkaScore += 15;

  dkaScore = Math.min(100, Math.max(0, dkaScore));
  const dkaRiskLevel = dkaScore >= 60 ? 'High' : dkaScore >= 25 ? 'Moderate' : 'Low';

  if (dkaScore >= 60) {
    recommendations.push('STAT Blood Glucose & Serum Beta-Hydroxybutyrate assessment required.');
    recommendations.push('Review patient glycemic regimen (HbA1c & endocrinology evaluation recommended).');
  }

  // ================= 4. HEPATO-BILIARY CHECK =================
  if (bil && bil.status !== 'normal') {
    findings.push('Bilirubinuria detected: correlates with conjugated hyperbilirubinemia or cholestasis.');
    recommendations.push('Liver Function Panel (Total/Direct Bilirubin, ALT, AST, ALP) advised.');
  }
  if (uro && uro.status !== 'normal') {
    findings.push('Elevated Urobilinogen: consider hemolytic anemia or impaired hepatic clearance.');
  }

  // Baseline if normal
  if (findings.length === 0) {
    findings.push('All 10 colorimetric test pads conform to reference intervals.');
    recommendations.push('Routine clinical monitoring; no urgent diagnostic intervention required.');
  }

  return {
    utiScore,
    utiRiskLevel,
    renalRiskScore: renalScore,
    renalRiskLevel,
    dkaScore,
    dkaRiskLevel,
    findings,
    recommendations,
  };
}

export default {
  evaluateClinicalRisk,
};
