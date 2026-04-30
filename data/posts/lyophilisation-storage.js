module.exports = {
  slug: 'lyophilisation-storage',
  title: 'Lyophilisation and storage: why peptides ship as a powder',
  tag: 'Lab notes',
  read: '7 min',
  date: 'Mar 14, 2026',
  sortKey: '2026-03-14',
  excerpt:
    'Why every research peptide arrives as a freeze-dried cake — what lyophilisation does, what it costs, and how to store the result so the stability you paid for is actually there when you need it.',
  body: `
<p>Open any vial of research peptide and you will see a small white cake at the bottom — sometimes uniform and dense, sometimes light and porous. That cake is the lyophilised peptide: a dry, frozen-then-vacuum-sublimed solid that is the canonical shipping and storage form for the entire research-peptide industry. This article walks through why that is the case, what the lyophilisation process actually does to the molecule, and how to handle the result on receipt.</p>

<h2>Why dry?</h2>

<p>Peptides in solution are not particularly stable. Several degradation pathways operate at meaningful rates in aqueous solution at room temperature:</p>

<ul>
  <li><strong>Hydrolysis</strong> — the amide bonds of the peptide backbone are slowly hydrolysed in water; sequence-specific hot-spots accelerate this dramatically.</li>
  <li><strong>Oxidation</strong> — methionine, cysteine, tryptophan, and to a lesser extent tyrosine are oxidised by dissolved oxygen, especially in the presence of trace metal ions.</li>
  <li><strong>Aggregation</strong> — many peptides associate into oligomers and aggregates in solution, with rate constants that depend on concentration, ionic strength, and pH.</li>
  <li><strong>Microbial growth</strong> — most peptide solutions are excellent culture media without preservatives.</li>
</ul>

<p>Removing the water suppresses most of these pathways. Without solvent activity, hydrolysis effectively stops. Without dissolved oxygen, oxidation slows by orders of magnitude. Without conformational mobility, aggregation kinetics drop. And without water, microbial growth becomes impossible.</p>

<p>The result is that a lyophilised peptide cake is dramatically more stable than the same peptide in solution — typically by factors of months-to-years versus days-to-weeks. This is why every reputable vendor ships peptides as a lyophilised solid.</p>

<h2>What lyophilisation actually does</h2>

<p>Lyophilisation, also called freeze-drying, is a three-stage process:</p>

<ol>
  <li><strong>Freezing</strong> — the peptide solution (typically in dilute acetic acid or a buffer chosen to support the lyophilisation) is rapidly frozen to well below its eutectic point, locking the peptide and any solutes in a frozen matrix.</li>
  <li><strong>Primary drying</strong> — the frozen sample is held under vacuum at controlled low temperature. Ice sublimes directly from the frozen matrix to vapour, leaving the peptide and solutes behind as a porous structure where the ice used to be. This is the slow step — it can take 24–72 hours for a production lot.</li>
  <li><strong>Secondary drying</strong> — temperature is raised slightly (still well below ambient), and any residual bound water is desorbed from the dried cake. The endpoint is a residual moisture content typically below 5% by Karl Fischer titration.</li>
  <li><strong>Stoppering</strong> — the vials are stoppered under vacuum or inert gas atmosphere before the chamber is opened, preserving the dry state.</li>
</ol>

<p>The result is a porous, low-moisture cake that retains the chemical integrity of the original peptide solution but with most of the water removed.</p>

<h2>What lyophilisation looks like in the vial</h2>

<p>A well-lyophilised peptide cake has a characteristic appearance:</p>

<ul>
  <li><strong>White to off-white colour.</strong> Significant discoloration is a quality flag — yellow can indicate oxidation, brown can indicate sequence damage during cleavage.</li>
  <li><strong>A coherent, porous structure.</strong> The cake should hold its shape and have visible porosity — that is the texture left behind by sublimed ice crystals.</li>
  <li><strong>Sometimes a "skin" or "collapsed" texture.</strong> Cake collapse during lyophilisation is cosmetically less attractive but does not necessarily affect quality. The COA's water content and HPLC results are the source of truth, not the cake's appearance.</li>
  <li><strong>A residue at the bottom of the vial, not floating particulates.</strong> Anything visibly floating before reconstitution is unusual and worth a query to the vendor.</li>
</ul>

<h2>How to store lyophilised peptides</h2>

<p>The default storage recommendation for lyophilised peptides is straightforward, and it is on every Helix COA:</p>

<ul>
  <li><strong>−20 °C, dry, dark.</strong> A standard lab freezer is fine. Long-term storage at −80 °C is even better but not necessary for most compounds.</li>
  <li><strong>Sealed against atmospheric moisture.</strong> The vial should remain stoppered and capped. If the seal is broken (e.g. for sub-aliquoting), reseal under nitrogen if available.</li>
  <li><strong>Original vial preferred.</strong> The borosilicate glass vial supplied with the lot is moisture-impermeable; transferring to a less-sealed container shortens the shelf life.</li>
  <li><strong>Avoid repeated temperature cycling.</strong> Pulling the vial out for short use and back into the freezer is fine; cycling between freezer and room temperature dozens of times in a day costs stability.</li>
</ul>

<p>Stored this way, lyophilised peptides typically remain in specification for 2–5 years from manufacture, though the vendor's documented shelf life is usually shorter and conservative.</p>

<h2>Reconstituted storage</h2>

<p>Once the peptide has been put into solution for an experiment, the stability clock speeds up dramatically. The default recommendations:</p>

<ul>
  <li><strong>Short-term reconstituted use:</strong> 2–8 °C, sealed, used within 1–2 weeks.</li>
  <li><strong>Longer-term reconstituted storage:</strong> aliquoted into single-use volumes and stored at −20 °C, with each aliquot thawed once and not re-frozen.</li>
  <li><strong>Avoid repeated freeze-thaw cycles.</strong> Every cycle costs purity and structural integrity. Aliquoting at the time of reconstitution is the standard mitigation.</li>
</ul>

<p>Specific compounds may have different reconstituted-storage windows; the COA storage section is the source of truth for any individual lot.</p>

<h2>Compound-specific considerations</h2>

<ul>
  <li><strong>Disulfide-bridged peptides</strong> — the disulfide is the most labile part of the molecule. Avoid reducing agents in the storage buffer. Store reconstituted aliquots cold and dark.</li>
  <li><strong>Methionine-containing peptides</strong> — oxidation-prone. Avoid storage buffers with dissolved oxygen at high temperature; consider degassing or using a low-oxygen environment for sensitive applications.</li>
  <li><strong>Highly hydrophobic peptides</strong> — may require a co-solvent (DMSO, acetonitrile) for full reconstitution. The vendor's reconstitution recommendation is the starting point.</li>
  <li><strong>Salt-form-sensitive applications</strong> — for cell-culture work where TFA is a concern, request the acetate form or perform an in-house ion-exchange before use.</li>
</ul>

<h2>What this article does not cover</h2>

<p>This article is about lyophilisation and storage as bench-research topics. It does not give protocol guidance for any specific in-vivo administration; that is outside the scope of research-supply documentation and outside the scope of what we publish. For protocol design beyond storage and bench handling, the primary literature for the specific compound is the right starting point.</p>
`,
};
