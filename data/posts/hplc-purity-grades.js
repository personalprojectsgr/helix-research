module.exports = {
  slug: 'hplc-purity-grades',
  title: 'HPLC purity grades: ≥98%, ≥99%, and what each one means at the bench',
  tag: 'Quality',
  read: '6 min',
  date: 'Apr 25, 2026',
  sortKey: '2026-04-25',
  excerpt:
    'Purity numbers on a COA look simple. The story behind a ≥99% release is more interesting — and more useful — than the headline figure suggests.',
  body: `
<p>"≥98% by HPLC" or "≥99% by HPLC" is the most-quoted line on any peptide Certificate of Analysis. It is also one of the most-misread. This article walks through what the number actually represents, what differences between grades mean at the bench, and how to read a chromatogram alongside the headline figure.</p>

<h2>What "purity" actually means in this context</h2>

<p>HPLC purity in peptide QC is reported as the area-under-the-target-peak divided by the total integrated area in the chromatogram, expressed as a percentage. The detector is typically UV at 220 nm (which detects the amide bond of every residue, giving signal roughly proportional to peptide mass) or 280 nm (which detects aromatic residues — tryptophan, tyrosine, phenylalanine — and is less universal).</p>

<p>So a ≥99% purity figure means: when the lot was injected onto the analytical HPLC column under the COA's stated method, the target peptide peak accounted for 99% or more of the total absorbance integrated over the run.</p>

<p>This is a real, useful number. It is also a number with several known limitations.</p>

<h2>What the number does not tell you</h2>

<ul>
  <li><strong>Counter-ion content.</strong> If the peptide is isolated as a TFA salt, a meaningful fraction of the total weight in the vial is trifluoroacetate, not peptide. The HPLC purity number describes the peptide-fraction's purity, not the proportion of the powder weight that is peptide. The "net peptide content" line on the COA — sometimes called peptide content — is the corresponding number for that question.</li>
  <li><strong>Water content.</strong> Lyophilised peptides retain a few percent residual water. Karl Fischer titration on the COA is the source for that number.</li>
  <li><strong>Counter-ion-bound peptide variants.</strong> Acetate, sodium, ammonium adducts that elute under the main peak are part of the "main peak" by area but are technically distinct chemical species.</li>
  <li><strong>UV-silent impurities.</strong> Anything that does not absorb at the detection wavelength (some inorganic salts, some buffer components) will not register in an integrated trace.</li>
</ul>

<p>None of these are reasons to distrust the purity number — they are reasons to read it alongside the rest of the COA.</p>

<h2>≥98% vs ≥99%: what is the practical difference?</h2>

<p>The 1% difference between a ≥98% release and a ≥99% release sounds small. In practice, it can represent a meaningful difference for some applications.</p>

<p>The 1–2% impurity in a peptide release is rarely a single contaminant. It is typically a distribution of:</p>

<ul>
  <li><strong>Deletion products</strong> — peptides missing one residue from an incomplete coupling. These are sequence-similar to the target and can have similar biological activity (or no activity).</li>
  <li><strong>Truncation products</strong> — peptides terminated early at some residue.</li>
  <li><strong>Oxidation products</strong> — particularly methionine sulfoxide, tryptophan oxidation products, cysteine disulfide variants.</li>
  <li><strong>Aspartimide and rearrangement products</strong> — for sequences containing aspartic acid in vulnerable positions.</li>
  <li><strong>Counter-ion adducts</strong> — minor counter-ion variants that elute close to the main peak.</li>
</ul>

<p>The relevance of these impurities at the bench depends on the assay. For most receptor-binding work, deletion products and truncations are inert. For inflammation- or immune-cell assays, oxidation products can be relevant. For structural biology where sub-percent contamination shows up in the data, ≥99% may genuinely be required.</p>

<h2>Why we publish ≥98% and release at higher</h2>

<p>The Helix release specification is ≥98% by HPLC area. Most lots release at higher than 99% by area; the lowest-purity lot we ship in any given month typically tests at 98.4% or above. The reason for the lower published spec is conservative: it is the floor we commit to, not the average we hit.</p>

<p>For specific high-purity applications, we can release lots with explicit ≥99.5% specifications — these are flagged on the COA and require additional fraction selection during preparative HPLC. Contact the team if your protocol requires this.</p>

<h2>Reading the chromatogram, not just the number</h2>

<p>The single most useful skill for reading peptide quality is learning to read the chromatogram printed on the COA, not just the headline number.</p>

<ul>
  <li><strong>One dominant, sharp, symmetric peak</strong> — the gold standard. Indicates a clean release with well-resolved purification.</li>
  <li><strong>One dominant peak with shoulders</strong> — a counter-ion variant or a closely-eluting deletion product. Acceptable for many applications, worth understanding for others.</li>
  <li><strong>Two peaks of comparable height</strong> — a co-eluting impurity, or a peptide that has separated into two charge or salt forms. The integration logic that turned this into a "98% by area" number is doing a lot of work and worth scrutiny.</li>
  <li><strong>Many small peaks under a dominant peak</strong> — typical for any synthesised peptide. As long as the dominant peak is well-resolved and the small peaks integrate below the spec, the lot is releasable.</li>
</ul>

<h2>Method matters</h2>

<p>The HPLC method on the COA — column, gradient, detection wavelength — is part of the purity number. The same lot run on a different method can give a different number. A reputable COA documents the method explicitly so the result is reproducible.</p>

<p>If you are comparing lots across vendors, be sceptical of comparisons where the methods differ significantly. A "99.5% purity" claim against a 5-minute isocratic method is not comparable to a "99.0% purity" against a 30-minute gradient with two-wavelength detection.</p>

<h2>Bottom line</h2>

<p>Treat the headline purity number as one input among several. The chromatogram, the LC-MS identity confirmation, the sterility and endotoxin results, the salt form, and the water content together describe the lot. Any single number can be hit by accident; the full COA is harder to fake and gives the bench-level confidence that a single percentage cannot.</p>
`,
};
