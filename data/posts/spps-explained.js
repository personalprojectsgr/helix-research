module.exports = {
  slug: 'spps-explained',
  title: 'Solid-phase peptide synthesis: how every Helix compound is made',
  tag: 'Chemistry',
  read: '10 min',
  date: 'Apr 22, 2026',
  sortKey: '2026-04-22',
  excerpt:
    'A walkthrough of the chemistry that underpins the entire Helix catalogue — from the resin bead through Fmoc deprotection, coupling, cleavage, and preparative HPLC.',
  body: `
<p>Every peptide in the Helix catalogue is made by the same fundamental chemistry: solid-phase peptide synthesis, or SPPS. The technique is one of the great engineering achievements of 20th-century chemistry — Bruce Merrifield received the 1984 Nobel Prize for inventing it — and the modern automated form of the synthesis is what makes it commercially viable to produce dozens of complex peptides from a single facility.</p>

<p>This article walks through the chemistry from resin to vial. It is the technical companion to our <a href="/about" class="link-underline">About</a> and <a href="/quality" class="link-underline">Quality</a> pages, written for researchers who want to understand exactly what was done to the molecule before it hit their bench.</p>

<h2>The core idea</h2>

<p>The conceptual breakthrough of SPPS is anchoring the growing peptide chain to an insoluble polymer resin. The resin is suspended in solvent in a reaction vessel; the chain grows attached to the resin; at every step, reagents are added in solution and washed away when the step is complete. The growing peptide stays anchored to the resin throughout, only coming off at the very end.</p>

<p>This makes purification at every intermediate step trivial — you wash. It makes the chemistry suitable for automation — you cycle through deprotection, coupling, washing for every residue. And it makes long peptide synthesis possible at all — without the resin, soluble-phase synthesis loses too much yield at every step to reach lengths beyond a handful of residues.</p>

<h2>The resin</h2>

<p>The synthesis starts with a polystyrene-based resin bead, typically functionalised with a linker chemistry chosen to match the C-terminal of the target peptide. Common linkers include:</p>

<ul>
  <li><strong>Wang resin</strong> — gives a free carboxylic acid C-terminal after cleavage.</li>
  <li><strong>Rink amide resin</strong> — gives an amidated C-terminal after cleavage. Most natural peptides are amidated.</li>
  <li><strong>2-chlorotrityl chloride resin</strong> — mild cleavage chemistry that preserves side-chain protecting groups, used for protected fragment synthesis.</li>
</ul>

<p>The choice of resin determines the C-terminal chemistry of the final peptide. Helix's fulfilment partner uses Rink amide for amidated peptides and Wang for free-acid peptides; the COA declares the salt and the C-terminal form for every release lot.</p>

<h2>Fmoc-SPPS: the protecting-group strategy</h2>

<p>Modern SPPS almost universally uses the Fmoc (9-fluorenylmethoxycarbonyl) strategy for the alpha-amino protecting group, paired with side-chain protecting groups that are stable under the Fmoc deprotection conditions. The cycle for every residue is:</p>

<ol>
  <li><strong>Deprotection</strong> — the Fmoc group on the N-terminus of the resin-bound peptide is removed by a base (typically 20% piperidine in DMF). The Fmoc group is cleaved by beta-elimination; the N-terminus is now a free amine ready to react.</li>
  <li><strong>Coupling</strong> — the next amino acid, with its alpha-amino still Fmoc-protected and its side chain protected as needed, is activated as an active ester (using HBTU, HATU, COMU, or similar coupling reagents) and added to the reaction vessel. The active ester reacts with the free amine on the resin, forming the amide bond and growing the peptide by one residue.</li>
  <li><strong>Wash</strong> — DMF or NMP washes remove unreacted reagents, byproducts, and residual coupling agents.</li>
  <li><strong>Repeat</strong> — back to step 1 for the next residue.</li>
</ol>

<p>This three-step cycle is repeated until the full sequence is assembled. For a 30-residue peptide that is 30 cycles, each typically taking 30 minutes to an hour, depending on coupling difficulty.</p>

<h2>Difficult sequences</h2>

<p>Not all sequences are equally easy. Several factors make synthesis harder and require extra optimisation:</p>

<ul>
  <li><strong>Aggregation-prone sequences</strong> — long stretches of hydrophobic residues, or sequences known to form beta-sheets on-resin, can cause incomplete coupling. Pseudoproline dipeptides, backbone-protected residues, or chaotropic additives are used to disrupt aggregation.</li>
  <li><strong>Steric hindrance</strong> — coupling near sterically hindered residues (e.g. valine-valine, isoleucine-isoleucine) can slow significantly. Double couplings with extended reaction times are common in these positions.</li>
  <li><strong>Aspartimide formation</strong> — Asp-Gly and Asp-Ser sequences can rearrange during base-mediated Fmoc removal. Backbone-protected building blocks suppress this side reaction.</li>
  <li><strong>Disulfide-containing peptides</strong> — peptides with two or more cysteines require oxidative folding after cleavage, with conditions tuned to favour the correct disulfide topology.</li>
</ul>

<p>These are not exotic problems; they are the bread-and-butter of an experienced SPPS chemist's day. Recognising them and designing around them is the difference between a synthesis that crashes at residue 15 and one that delivers ≥98% pure crude at residue 30.</p>

<h2>Cleavage from the resin</h2>

<p>Once the full sequence is assembled, the peptide must be cleaved from the resin and the side-chain protecting groups removed. The standard cleavage cocktail for Fmoc-SPPS is "TFA + scavengers" — typically 95% trifluoroacetic acid plus a mix of scavengers (water, triisopropylsilane, ethanedithiol) that quench reactive cations released during deprotection.</p>

<p>The cleavage reaction simultaneously: cleaves the peptide-resin linker (giving the C-terminal acid or amide), removes most side-chain protecting groups, and releases the fully deprotected peptide into solution. The resin beads are filtered off, the TFA is evaporated, and the peptide is precipitated from cold ether.</p>

<h2>Purification: preparative HPLC</h2>

<p>The crude peptide precipitate from cleavage is rarely pure enough for release. Even a near-perfect synthesis produces deletion products (peptides missing one or more residues from incomplete couplings), truncation products, oxidation products, and counter-ion adducts.</p>

<p>Preparative reverse-phase HPLC is the workhorse purification step. The crude peptide is dissolved, loaded onto a preparative C18 column, and eluted with a water-acetonitrile gradient containing 0.1% trifluoroacetic acid as ion-pairing agent. The target peptide elutes as a sharp peak; impurities elute earlier or later. Fractions are collected, analysed by analytical HPLC and LC-MS, and the clean fractions are pooled.</p>

<h2>Counter-ion exchange (where relevant)</h2>

<p>Preparative HPLC with TFA gives the peptide as a trifluoroacetate salt. For some applications — particularly cell-culture and in-vitro biological assays — TFA is undesirable because it can affect sensitive cell systems at higher peptide concentrations. Counter-ion exchange to acetate is performed by repeated lyophilisation from dilute acetic acid, or by ion-exchange chromatography. The COA declares the final salt form.</p>

<h2>Lyophilisation and release</h2>

<p>The purified peptide solution is frozen and lyophilised under vacuum, leaving a dry porous cake. The cake is weighed, vialled, sealed under nitrogen, and labelled with the lot number. From there it goes to QC: HPLC purity, LC-MS identity, sterility, endotoxin, water content. When it passes, it is released, the COA is generated, and the lot is available for shipment.</p>

<h2>Why this matters at the bench</h2>

<p>Every step of SPPS is a place where a careless or under-resourced facility can introduce problems that show up only at the bench. Incomplete couplings give deletion products that may be hard to separate from the target by HPLC. Aggressive cleavage can damage sensitive residues. Inadequate purification can let a 95% pure preparation get sold as 99% by area through choice of integration limits.</p>

<p>The COA on every Helix lot is the artefact of all of this. It is the contract that says: this is the molecule, this is how pure it is, this is what is and is not in the vial. It is the only thing that survives once the parcel is opened.</p>
`,
};
