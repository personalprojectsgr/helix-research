module.exports = {
  slug: 'reading-a-coa',
  title: 'How to read a peptide Certificate of Analysis',
  tag: 'Quality',
  read: '5 min',
  date: 'Mar 21, 2026',
  sortKey: '2026-03-21',
  excerpt:
    'HPLC purity, LC-MS identity, sterility, endotoxin — what each line of a Certificate of Analysis actually tells you about the release lot in your hand.',
  body: `
<p>A Certificate of Analysis (COA) is the single document that carries the truth about a peptide release lot. Every Helix shipment includes the batch-specific COA for every compound. This guide walks through what each section means and what to verify before you start bench-work.</p>

<h2>Header: lot identity</h2>

<p>The header carries the load-bearing identifiers:</p>

<ul>
  <li><strong>Compound name</strong> — should match exactly the compound you ordered, including any salt form (e.g. acetate, trifluoroacetate).</li>
  <li><strong>Catalogue number / SKU</strong> — vendor-specific identifier; use it for re-orders.</li>
  <li><strong>Lot or batch number</strong> — the unique identifier for this release lot. Different lots of the same compound are different production runs and may have small differences in the QC profile.</li>
  <li><strong>Manufacture date</strong> — date of synthesis completion or release date. Stability data starts from here.</li>
  <li><strong>Recommended retest / expiry date</strong> — the date by which the next QC retest is recommended. Lyophilised peptides at −20 °C are typically stable well beyond this date but the retest defines the documented window.</li>
</ul>

<h2>Identity confirmation: LC-MS</h2>

<p>The mass spectrometry section confirms that the molecule in the vial is in fact the compound on the label.</p>

<ul>
  <li><strong>Theoretical mass</strong> — calculated from the sequence, given as monoisotopic mass and average mass.</li>
  <li><strong>Observed mass</strong> — measured by LC-MS. For a small peptide the observed [M+H]+ should match the theoretical [M+H]+ within 0.1 Da.</li>
  <li><strong>Mass spectrum</strong> — usually shown as a small peak chart. The dominant peak should align with the theoretical [M+H]+ or [M+Na]+ adduct.</li>
</ul>

<p>If the observed and theoretical masses do not match within tolerance, the lot has failed identity verification and should not be released. A COA should never show a mismatch.</p>

<h2>Purity: HPLC</h2>

<p>Reverse-phase HPLC is the workhorse purity assay for peptides. The COA shows:</p>

<ul>
  <li><strong>Method</strong> — column type, mobile phase gradient, and detection wavelength (typically 220 nm for amide bond detection, sometimes 280 nm for aromatic residues).</li>
  <li><strong>Chromatogram</strong> — a small printed trace showing the elution profile. The target peptide should dominate the chromatogram.</li>
  <li><strong>Purity (% area)</strong> — calculated as the area under the target peak divided by the total integrated area, expressed as a percentage. Helix releases require ≥98 %; many lots release at ≥99 %.</li>
</ul>

<p>Purity is the most-quoted COA number but it is not the only quality signal. A clean chromatogram with one major peak is a stronger quality signal than a >99 % number on a noisy trace.</p>

<h2>Sterility: USP &lt;71&gt;</h2>

<p>Sterility testing checks for the presence of viable microorganisms. The COA section typically shows:</p>

<ul>
  <li><strong>Method</strong> — membrane filtration per USP &lt;71&gt; protocol.</li>
  <li><strong>Result</strong> — Pass / No growth observed.</li>
  <li><strong>Incubation period</strong> — typically 14 days across two media (fluid thioglycolate medium and soybean-casein digest medium).</li>
</ul>

<p>For lyophilised peptides intended for cell-culture or in-vitro biological assay work, sterility is critical. A non-sterile lot is unsuitable for any sterile-environment application regardless of purity.</p>

<h2>Endotoxin: LAL assay</h2>

<p>Limulus Amebocyte Lysate (LAL) testing measures bacterial endotoxin contamination. The COA section shows:</p>

<ul>
  <li><strong>Method</strong> — kinetic-chromogenic, kinetic-turbidimetric, or gel-clot LAL.</li>
  <li><strong>Specification</strong> — usually expressed as Endotoxin Units per milligram (EU/mg). Helix specifications are below 0.5 EU/mg.</li>
  <li><strong>Result</strong> — measured value, with a Pass/Fail against the specification.</li>
</ul>

<p>Endotoxin contamination is a significant confounder in any inflammation, immune-cell, or vascular research model. A clean LAL result is non-negotiable for these applications.</p>

<h2>Appearance and water content</h2>

<p>Two physical-quality lines round out the COA:</p>

<ul>
  <li><strong>Appearance</strong> — typically described as "white to off-white lyophilised powder" or similar. Significant discoloration is a quality flag worth raising with the vendor.</li>
  <li><strong>Water content (Karl Fischer)</strong> — moisture in the lyophilised cake, expressed as percentage. Lower is better for long-term storage stability; values below 5 % are typical for well-lyophilised peptide lots.</li>
</ul>

<h2>Counter-ion and salt-form notes</h2>

<p>Synthesised peptides are typically isolated as a salt — most commonly trifluoroacetate (TFA) from preparative HPLC, or acetate after counter-ion exchange. The COA should declare which salt form the lot is in. The salt form affects:</p>

<ul>
  <li><strong>Net peptide content</strong> — the free-base peptide is a fraction of the total weight; the COA may report both gross and net peptide content.</li>
  <li><strong>Solubility</strong> — different salts have different solubility profiles in common research solvents.</li>
  <li><strong>Cell-culture compatibility</strong> — TFA can affect sensitive cell-culture assays at higher concentrations; acetate is preferred for those applications.</li>
</ul>

<h2>Storage and handling</h2>

<p>The footer of the COA carries the manufacturer's storage and handling recommendations:</p>

<ul>
  <li><strong>Storage temperature</strong> — typically −20 °C for long-term lyophilised storage.</li>
  <li><strong>Reconstituted storage</strong> — typically 2–8 °C for short-term, with a note on freezer storage for longer.</li>
  <li><strong>Avoid repeated freeze-thaw cycles</strong> — every cycle costs purity and structural integrity.</li>
</ul>

<h2>What to do if a COA looks wrong</h2>

<p>If something on the COA does not match expectation — purity below specification, mass mismatch, sterility failure, missing sections — contact the vendor before bench-work. A reputable supplier will replace the lot or provide additional QC data on request. A non-replaceable COA discrepancy is itself a quality signal about the supplier.</p>

<p>Every Helix shipment ships with the batch-specific COA, and additional documentation (raw HPLC trace, full mass spectrum, audit-trail batch records) is available for any lot on request.</p>
`,
};
