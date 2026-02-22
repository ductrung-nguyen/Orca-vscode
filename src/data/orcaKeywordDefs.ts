/**
 * Static catalog of ORCA keyword definitions for hover provider
 * Sourced from ORCA 6.0 manual with educational simplifications
 */

import { KeywordDefinition, BlockDefinition, BlockAttributeDefinition } from '../orcaHoverProvider';

// ============================================================================
// SIMPLE KEYWORDS (50+ entries)
// ============================================================================

export const simpleKeywords: Record<string, KeywordDefinition> = {
	// DFT Functionals (20+ entries)
	'B3LYP': {
		name: 'B3LYP',
		category: 'Hybrid DFT Functional',
		description: 'Becke 3-parameter Lee-Yang-Parr hybrid functional. One of the most widely used DFT methods, combining exact Hartree-Fock exchange with DFT correlation. Reliable for organic molecules, transition metal complexes, and general-purpose calculations.',
		example: '! B3LYP def2-TZVP',
		relatedKeywords: ['PBE0', 'CAM-B3LYP', 'wB97X-D3', 'M06-2X']
	},
	'B3LYP D3': {
		name: 'B3LYP D3',
		category: 'DFT Functional',
		description: 'B3LYP hybrid functional with Grimme\'s D3 dispersion correction. Adds empirical atom-pair dispersion terms to B3LYP, improving accuracy for non-covalent interactions, van der Waals complexes, and large organic molecules.',
		example: '! B3LYP D3 def2-SVP',
		relatedKeywords: ['B3LYP', 'B3LYP-D3BJ', 'PBE-D3', 'wB97X-D3']
	},
	'PBE': {
		name: 'PBE',
		category: 'GGA DFT Functional',
		description: 'Perdew-Burke-Ernzerhof generalized gradient approximation functional. Pure DFT method without exact exchange. Computationally efficient and suitable for solid-state calculations and extended systems.',
		example: '! PBE def2-SVP',
		relatedKeywords: ['PBE0', 'RPBE', 'revPBE', 'OPBE']
	},
	'PBE0': {
		name: 'PBE0',
		category: 'Hybrid DFT Functional',
		description: 'Hybrid version of PBE with 25% exact exchange. Also known as PBEh. Improved accuracy over pure PBE for thermochemistry and reaction energies while maintaining computational efficiency.',
		example: '! PBE0 def2-TZVP',
		relatedKeywords: ['PBE', 'B3LYP', 'wB97X-D3', 'RIJCOSX']
	},
	'CAM-B3LYP': {
		name: 'CAM-B3LYP',
		category: 'Range-Separated Hybrid DFT',
		description: 'Coulomb-attenuated B3LYP functional. Uses variable Hartree-Fock exchange that increases with inter-electron distance. Particularly good for charge-transfer excitations, long-range interactions, and TDDFT calculations.',
		example: '! CAM-B3LYP def2-TZVP',
		relatedKeywords: ['wB97X-D3', 'B3LYP', 'LC-BLYP']
	},
	'WB97X-D3': {
		name: 'wB97X-D3',
		category: 'Range-Separated Hybrid DFT',
		description: 'Range-separated hybrid functional with D3 dispersion correction. Excellent for non-covalent interactions, organic chemistry, and systems where dispersion is important. Combines long-range correction with empirical dispersion.',
		example: '! wB97X-D3 def2-TZVP',
		relatedKeywords: ['CAM-B3LYP', 'B3LYP-D3BJ', 'PBE0-D3BJ']
	},
	'TPSS': {
		name: 'TPSS',
		category: 'Meta-GGA DFT Functional',
		description: 'Tao-Perdew-Staroverov-Scuseria meta-GGA functional. Uses kinetic energy density for improved accuracy. Good for geometries and energetics of main group and transition metal systems.',
		example: '! TPSS def2-TZVP',
		relatedKeywords: ['TPSSh', 'M06-L', 'SCAN']
	},
	'TPSSh': {
		name: 'TPSSh',
		category: 'Meta-GGA Hybrid DFT',
		description: 'Hybrid version of TPSS with 10% exact exchange. Better performance than TPSS for thermochemistry while maintaining good geometries. Well-suited for transition metal complexes.',
		example: '! TPSSh def2-TZVP',
		relatedKeywords: ['TPSS', 'M06', 'PBE0']
	},
	'M06-2X': {
		name: 'M06-2X',
		category: 'Meta-GGA Hybrid DFT',
		description: 'Minnesota functional with 54% exact exchange. Optimized for main-group thermochemistry, kinetics, and non-covalent interactions. Excellent for organic chemistry and barrier heights.',
		example: '! M06-2X def2-TZVP',
		relatedKeywords: ['M06', 'M06-L', 'wB97X-D3']
	},
	'M06': {
		name: 'M06',
		category: 'Meta-GGA Hybrid DFT',
		description: 'Minnesota functional with 27% exact exchange. Good for transition metals, inorganometallics, and thermochemistry. More suitable for metals than M06-2X.',
		example: '! M06 def2-TZVP',
		relatedKeywords: ['M06-2X', 'M06-L', 'TPSSh']
	},
	'M06-L': {
		name: 'M06-L',
		category: 'Meta-GGA DFT Functional',
		description: 'Local Minnesota functional (no exact exchange). Fast and accurate for transition metal systems, organometallics, and solid-state applications. Good cost-performance ratio.',
		example: '! M06-L def2-SVP',
		relatedKeywords: ['M06', 'TPSS', 'SCAN']
	},
	'BP86': {
		name: 'BP86',
		category: 'GGA DFT Functional',
		description: 'Becke 88 exchange with Perdew 86 correlation. Classic GGA functional, widely used for transition metal complexes and geometry optimizations. Computationally efficient.',
		example: '! BP86 def2-TZVP',
		relatedKeywords: ['BLYP', 'PBE', 'OLYP']
	},
	'BLYP': {
		name: 'BLYP',
		category: 'GGA DFT Functional',
		description: 'Becke 88 exchange with Lee-Yang-Parr correlation. Popular GGA functional for organic systems and hydrogen bonding. Slightly softer than BP86.',
		example: '! BLYP def2-SVP',
		relatedKeywords: ['BP86', 'B3LYP', 'OLYP']
	},
	'OLYP': {
		name: 'OLYP',
		category: 'GGA DFT Functional',
		description: 'OPTX exchange with Lee-Yang-Parr correlation. Good for hydrogen bonds and non-covalent interactions. Often used in biomolecular simulations.',
		example: '! OLYP def2-TZVP',
		relatedKeywords: ['BLYP', 'OPBE', 'PBE']
	},
	'OPBE': {
		name: 'OPBE',
		category: 'GGA DFT Functional',
		description: 'OPTX exchange with PBE correlation. Improved performance over PBE for thermochemistry and barrier heights. Good balance of accuracy and efficiency.',
		example: '! OPBE def2-TZVP',
		relatedKeywords: ['PBE', 'OLYP', 'revPBE']
	},
	'REVPBE': {
		name: 'revPBE',
		category: 'GGA DFT Functional',
		description: 'Revised PBE functional with modified exchange. Better for adsorption energies and surface chemistry. Popular in solid-state and materials science.',
		example: '! revPBE def2-SVP',
		relatedKeywords: ['PBE', 'RPBE', 'PBEsol']
	},
	'RPBE': {
		name: 'RPBE',
		category: 'GGA DFT Functional',
		description: 'Revised PBE for chemisorption. Similar to revPBE but optimized differently. Commonly used in surface science and catalysis studies.',
		example: '! RPBE def2-SVP',
		relatedKeywords: ['revPBE', 'PBE', 'PBEsol']
	},
	'PBESOL': {
		name: 'PBEsol',
		category: 'GGA DFT Functional',
		description: 'PBE functional optimized for solids and surfaces. Better lattice constants and cohesive energies for crystalline materials. Recommended for periodic calculations.',
		example: '! PBEsol def2-SVP',
		relatedKeywords: ['PBE', 'revPBE', 'SCAN']
	},
	'SCAN': {
		name: 'SCAN',
		category: 'Meta-GGA DFT Functional',
		description: 'Strongly Constrained and Appropriately Normed (SCAN) meta-GGA. Modern functional satisfying exact constraints. Excellent for diverse chemical systems including solids.',
		example: '! SCAN def2-TZVP',
		relatedKeywords: ['TPSS', 'M06-L', 'PBEsol']
	},
	'MN15': {
		name: 'MN15',
		category: 'Meta-GGA Hybrid DFT',
		description: 'Minnesota 15 global hybrid meta-GGA. Good for multi-reference systems, transition metals, and non-covalent interactions. Versatile modern functional.',
		example: '! MN15 def2-TZVP',
		relatedKeywords: ['M06-2X', 'TPSSh', 'wB97X-D3']
	},
	'R2SCAN': {
		name: 'r2SCAN',
		category: 'Meta-GGA DFT Functional',
		description: 'Regularized revised SCAN functional. Improved numerical stability and efficiency compared to SCAN while maintaining accuracy. Suitable for large systems and MD simulations.',
		example: '! r2SCAN def2-TZVP',
		relatedKeywords: ['SCAN', 'TPSS', 'M06-L']
	},
	'WB97X-D': {
		name: 'wB97X-D',
		category: 'Range-Separated Hybrid DFT',
		description: 'Chai-Head-Gordon range-separated hybrid functional with D2 empirical dispersion. Released 2008; precursor to wB97X-D3. Range separation parameter ω=0.2 bohr⁻¹. Found extensively in older literature.',
		example: '! wB97X-D def2-TZVP',
		relatedKeywords: ['wB97X-D3', 'wB97X', 'CAM-B3LYP']
	},
	'WB97M-V': {
		name: 'wB97M-V',
		category: 'Range-Separated Meta-Hybrid DFT',
		description: 'Range-separated meta-GGA hybrid functional with VV10 non-local correlation. Head-Gordon group. Excellent broad accuracy for thermochemistry, kinetics, and non-covalent interactions.',
		example: '! wB97M-V def2-TZVP',
		relatedKeywords: ['wB97X-D3', 'wB97X-D', 'M06-2X']
	},
	'HFS': {
		name: 'HFS',
		category: 'LDA Exchange Functional',
		description: 'Hartree-Fock-Slater (Slater X-alpha) exchange-only functional. Simplest DFT approximation using Slater exchange with α=2/3. Historically significant; purely a local exchange with no correlation.',
		example: '! HFS def2-SVP',
		relatedKeywords: ['VWN5', 'SVWN5', 'PBE']
	},
	'VWN5': {
		name: 'VWN5',
		category: 'LDA DFT Functional',
		description: 'Vosko-Wilk-Nusair LDA correlation functional (parametrization V). Standard LDA correlation used in most modern DFT implementations. Often combined with Slater exchange (SVWN5 = HFS+VWN5).',
		example: '! VWN5 def2-SVP',
		relatedKeywords: ['HFS', 'PBE', 'BLYP']
	},
	'B97D': {
		name: 'B97D',
		category: 'GGA DFT Functional with Dispersion',
		description: 'Grimme\'s B97-D GGA functional with D1 empirical dispersion. Optimized for non-covalent interaction energies and geometries. Precursor to later B97-D3 variants; widely used in supramolecular chemistry.',
		example: '! B97D def2-TZVP',
		relatedKeywords: ['B3LYP-D3BJ', 'PBE-D3BJ', 'wB97X-D']
	},
	'M06L': {
		name: 'M06L',
		category: 'Meta-GGA DFT Functional',
		description: 'Local Minnesota meta-GGA functional (no exact exchange); alias for M06-L. Fast and accurate for transition metal systems, organometallics, and solid-state. Good cost-performance ratio.',
		example: '! M06L def2-SVP',
		relatedKeywords: ['M06', 'M06-L', 'TPSS']
	},
	'SCANFUNC': {
		name: 'SCANfunc',
		category: 'Meta-GGA DFT Functional',
		description: 'SCAN meta-GGA functional, invoked as SCANfunc to avoid conflict with the SCAN geometry-scan keyword. Strongly Constrained and Appropriately Normed functional satisfying all 17 exact constraints.',
		example: '! SCANfunc def2-TZVP',
		relatedKeywords: ['R2SCAN', 'RSCAN', 'TPSS']
	},
	'RSCAN': {
		name: 'rSCAN',
		category: 'Meta-GGA DFT Functional',
		description: 'Regularized SCAN (rSCAN) meta-GGA functional. Addresses numerical instabilities in SCAN by regularizing kinetic energy density. Intermediate regularization level between SCAN and r2SCAN.',
		example: '! rSCAN def2-TZVP',
		relatedKeywords: ['R2SCAN', 'SCANFUNC', 'TPSS']
	},
	'B97': {
		name: 'B97',
		category: 'GGA DFT Functional',
		description: 'Handy\'s B97 GGA functional. Parent of the B97 family with fitted exchange and correlation parameters. Good thermochemistry accuracy for a pure GGA. Often used as starting point for dispersion-corrected variants.',
		example: '! B97 def2-TZVP',
		relatedKeywords: ['B97D', 'BLYP', 'BP86']
	},
	'TPSS0': {
		name: 'TPSS0',
		category: 'Meta-GGA Hybrid DFT',
		description: 'Hybrid TPSS functional with 25% exact exchange. Improved thermochemical accuracy over pure TPSS. Good for transition metal chemistry where a moderate amount of exact exchange is beneficial.',
		example: '! TPSS0 def2-TZVP',
		relatedKeywords: ['TPSSh', 'TPSS', 'PBE0']
	},
	'R2SCAN0': {
		name: 'r2SCAN0',
		category: 'Meta-GGA Hybrid DFT',
		description: 'Hybrid r2SCAN functional with 25% exact exchange. Combines the regularized meta-GGA with standard hybrid mixing. Improved accuracy over pure r2SCAN for thermochemistry and reaction energies.',
		example: '! r2SCAN0 def2-TZVP',
		relatedKeywords: ['R2SCAN', 'R2SCAN50', 'PBE0']
	},
	'R2SCAN50': {
		name: 'r2SCAN50',
		category: 'Meta-GGA Hybrid DFT',
		description: 'r2SCAN functional with 50% exact exchange. High exact-exchange content reduces self-interaction error. Suitable for charge-transfer systems and cases requiring strong exchange delocalization correction.',
		example: '! r2SCAN50 def2-TZVP',
		relatedKeywords: ['R2SCAN0', 'R2SCAN', 'M06-2X']
	},
	'WB97': {
		name: 'wB97',
		category: 'Range-Separated DFT Functional',
		description: 'Original wB97 range-separated functional (Chai and Head-Gordon, 2008). Long-range-corrected GGA with 100% long-range HF exchange. Foundation of the wB97 functional family.',
		example: '! wB97 def2-TZVP',
		relatedKeywords: ['WB97X', 'WB97X-D', 'CAM-B3LYP']
	},
	'WB97X': {
		name: 'wB97X',
		category: 'Range-Separated Hybrid DFT',
		description: 'wB97X range-separated hybrid (Chai and Head-Gordon, 2008). Adds a fraction of short-range HF exchange to wB97. Good thermochemistry, kinetics, and non-covalent interaction performance.',
		example: '! wB97X def2-TZVP',
		relatedKeywords: ['WB97', 'WB97X-D', 'WB97X-D3']
	},

	// Wave Function Methods (6 entries)
	'HF': {
		name: 'HF',
		category: 'Hartree-Fock Method',
		description: 'Hartree-Fock (self-consistent field) method. Basic ab initio approach without electron correlation. Fast but less accurate than correlated methods. Often used as a starting point or for comparison.',
		example: '! HF def2-TZVP',
		relatedKeywords: ['MP2', 'CCSD', 'DFT']
	},
	'MP2': {
		name: 'MP2',
		category: 'Post-HF Correlation Method',
		description: 'Second-order Møller-Plesset perturbation theory. Adds electron correlation to Hartree-Fock. Good for dispersion interactions and non-covalent complexes. Moderate computational cost.',
		example: '! MP2 def2-TZVP',
		relatedKeywords: ['RI-MP2', 'SCS-MP2', 'CCSD']
	},
	'RI-MP2': {
		name: 'RI-MP2',
		category: 'Post-HF Correlation Method',
		description: 'Resolution-of-Identity MP2. Uses density fitting to accelerate MP2 calculations significantly with minimal loss of accuracy. Recommended over canonical MP2 for most applications.',
		example: '! RI-MP2 def2-TZVP',
		relatedKeywords: ['MP2', 'SCS-MP2', 'DLPNO-MP2']
	},
	'CCSD': {
		name: 'CCSD',
		category: 'Coupled-Cluster Method',
		description: 'Coupled-cluster singles and doubles. High-accuracy correlated method. Includes both single and double excitations iteratively. Expensive but very accurate for small to medium systems.',
		example: '! CCSD def2-TZVP',
		relatedKeywords: ['CCSD(T)', 'DLPNO-CCSD(T)', 'MP2']
	},
	'CCSD(T)': {
		name: 'CCSD(T)',
		category: 'Coupled-Cluster Method',
		description: 'Coupled-cluster singles, doubles, and perturbative triples. "Gold standard" of quantum chemistry for single-reference systems. Very accurate but computationally demanding. Limited to small molecules.',
		example: '! CCSD(T) def2-TZVP',
		relatedKeywords: ['CCSD', 'DLPNO-CCSD(T)', 'MP2']
	},
	'DLPNO-CCSD(T)': {
		name: 'DLPNO-CCSD(T)',
		category: 'Local Correlation Method',
		description: 'Domain-based Local Pair Natural Orbital CCSD(T). Linear-scaling coupled-cluster approach enabling CCSD(T) accuracy for large systems (100+ atoms). Major breakthrough in computational chemistry.',
		example: '! DLPNO-CCSD(T) def2-TZVP',
		relatedKeywords: ['CCSD(T)', 'DLPNO-MP2', 'LPNO-CEPA']
	},
	'DLPNO-MP2': {
		name: 'DLPNO-MP2',
		category: 'Local Correlation Method',
		description: 'Domain-Based Local Pair Natural Orbital MP2. Near-linear-scaling MP2 for large systems with controllable accuracy. Significantly cheaper than canonical MP2 while retaining most correlation energy.',
		example: '! DLPNO-MP2 def2-TZVP',
		relatedKeywords: ['RI-MP2', 'MP2', 'DLPNO-CCSD(T)']
	},
	'CASSCF': {
		name: 'CASSCF',
		category: 'Multi-Reference Method',
		description: 'Complete Active Space SCF. Variational multi-reference method that optimizes both orbitals and CI coefficients within a user-defined active space. Essential for systems with strong static (multi-reference) correlation. Active space defined in %casscf block.',
		example: '! CASSCF def2-SVP',
		relatedKeywords: ['NEVPT2', 'MRCI', 'NEVPT2']
	},
	'NEVPT2': {
		name: 'NEVPT2',
		category: 'Multi-Reference Perturbation Theory',
		description: 'N-Electron Valence State Perturbation Theory at second order. Post-CASSCF method that adds dynamic correlation. More robust than CASPT2 against intruder states. Recommended for accurate excitation energies and multi-reference systems.',
		example: '! NEVPT2 def2-SVP',
		relatedKeywords: ['CASSCF', 'MRCI', 'DLPNO-NEVPT2']
	},

	// Basis Sets (16 entries)
	'DEF2-SVP': {
		name: 'def2-SVP',
		category: 'Basis Set (Double-Zeta)',
		description: 'Karlsruhe split-valence polarized basis set. Double-zeta quality with polarization functions. Good for initial geometry optimizations and property calculations. Balanced speed and accuracy for routine work.',
		example: '! B3LYP def2-SVP',
		relatedKeywords: ['def2-TZVP', 'def2-TZVPP', 'cc-pVDZ']
	},
	'DEF2-TZVP': {
		name: 'def2-TZVP',
		category: 'Basis Set (Triple-Zeta)',
		description: 'Karlsruhe triple-zeta valence polarized basis set. Higher quality than def2-SVP, suitable for accurate energetics and properties. Recommended for production calculations. Good balance of accuracy and cost.',
		example: '! PBE0 def2-TZVP',
		relatedKeywords: ['def2-SVP', 'def2-TZVPP', 'def2-QZVPP', 'cc-pVTZ']
	},
	'DEF2-TZVPP': {
		name: 'def2-TZVPP',
		category: 'Basis Set (Triple-Zeta)',
		description: 'Triple-zeta valence double-polarization basis. Additional polarization functions compared to def2-TZVP. Better for properties like dipole moments and polarizabilities. Marginally better energies.',
		example: '! PBE0 def2-TZVPP',
		relatedKeywords: ['def2-TZVP', 'def2-QZVPP', 'cc-pVTZ']
	},
	'DEF2-QZVPP': {
		name: 'def2-QZVPP',
		category: 'Basis Set (Quadruple-Zeta)',
		description: 'Quadruple-zeta valence double-polarization basis. Very large and flexible basis approaching basis set limit. Used for benchmark calculations and extrapolations. Very expensive.',
		example: '! CCSD(T) def2-QZVPP',
		relatedKeywords: ['def2-TZVPP', 'cc-pVQZ', 'aug-cc-pVQZ']
	},
	'CC-PVDZ': {
		name: 'cc-pVDZ',
		category: 'Basis Set (Correlation-Consistent)',
		description: 'Correlation-consistent polarized valence double-zeta. Designed for systematic convergence to basis set limit. Popular for correlated calculations. Part of the Dunning basis set family.',
		example: '! MP2 cc-pVDZ',
		relatedKeywords: ['cc-pVTZ', 'cc-pVQZ', 'aug-cc-pVDZ', 'def2-SVP']
	},
	'CC-PVTZ': {
		name: 'cc-pVTZ',
		category: 'Basis Set (Correlation-Consistent)',
		description: 'Correlation-consistent polarized valence triple-zeta. Higher quality than cc-pVDZ. Good for accurate correlated calculations. Enables extrapolation to basis set limit with cc-pVQZ.',
		example: '! CCSD cc-pVTZ',
		relatedKeywords: ['cc-pVDZ', 'cc-pVQZ', 'aug-cc-pVTZ', 'def2-TZVP']
	},
	'CC-PVQZ': {
		name: 'cc-pVQZ',
		category: 'Basis Set (Correlation-Consistent)',
		description: 'Correlation-consistent polarized valence quadruple-zeta. Very large basis for high-accuracy work. Used in basis set extrapolations and benchmark studies. Computationally demanding.',
		example: '! CCSD(T) cc-pVQZ',
		relatedKeywords: ['cc-pVTZ', 'aug-cc-pVQZ', 'def2-QZVPP']
	},
	'AUG-CC-PVDZ': {
		name: 'aug-cc-pVDZ',
		category: 'Basis Set (Augmented)',
		description: 'Augmented correlation-consistent double-zeta. Includes diffuse functions for better description of anions, excited states, and long-range interactions. Essential for electron affinities and Rydberg states.',
		example: '! MP2 aug-cc-pVDZ',
		relatedKeywords: ['cc-pVDZ', 'aug-cc-pVTZ', 'ma-def2-SVP']
	},
	'AUG-CC-PVTZ': {
		name: 'aug-cc-pVTZ',
		category: 'Basis Set (Augmented)',
		description: 'Augmented correlation-consistent triple-zeta. High quality with diffuse functions. Excellent for properties requiring description of electron density far from nuclei. Popular for spectroscopy and electron affinities.',
		example: '! CCSD aug-cc-pVTZ',
		relatedKeywords: ['cc-pVTZ', 'aug-cc-pVQZ', 'ma-def2-TZVP']
	},
	'AUG-CC-PVQZ': {
		name: 'aug-cc-pVQZ',
		category: 'Basis Set (Augmented)',
		description: 'Augmented correlation-consistent quadruple-zeta. Very large augmented basis for benchmark calculations. Combines flexibility of cc-pVQZ with diffuse functions.',
		example: '! CCSD(T) aug-cc-pVQZ',
		relatedKeywords: ['cc-pVQZ', 'aug-cc-pVTZ']
	},
	'6-31G*': {
		name: '6-31G*',
		category: 'Basis Set (Pople)',
		description: 'Pople split-valence basis with d-polarization on heavy atoms. Also written as 6-31G(d). Historic basis set, widely used but now considered dated. def2-SVP recommended instead.',
		example: '! B3LYP 6-31G*',
		relatedKeywords: ['6-311G**', 'def2-SVP'],
		deprecationNote: 'Consider using def2-SVP instead for better balance and auxiliary basis availability.'
	},
	'6-311G**': {
		name: '6-311G**',
		category: 'Basis Set (Pople)',
		description: 'Pople triple-split basis with d,p-polarization. Also written as 6-311G(d,p). Legacy basis set once popular for DFT. Modern alternatives like def2-TZVP generally preferred.',
		example: '! B3LYP 6-311G**',
		relatedKeywords: ['6-31G*', 'def2-TZVP'],
		deprecationNote: 'Consider using def2-TZVP for better performance with RI approximations.'
	},
	'MA-DEF2-SVP': {
		name: 'ma-def2-SVP',
		category: 'Basis Set (Minimally-Augmented)',
		description: 'Minimally-augmented def2-SVP. Adds diffuse functions only on non-hydrogen atoms. Good compromise between standard and fully-augmented bases for anions and weak interactions.',
		example: '! PBE0 ma-def2-SVP',
		relatedKeywords: ['def2-SVP', 'aug-cc-pVDZ', 'ma-def2-TZVP']
	},
	'MA-DEF2-TZVP': {
		name: 'ma-def2-TZVP',
		category: 'Basis Set (Minimally-Augmented)',
		description: 'Minimally-augmented def2-TZVP. Triple-zeta quality with diffuse functions on heavy atoms. Excellent for properties requiring some diffuseness without full augmentation cost.',
		example: '! wB97X-D3 ma-def2-TZVP',
		relatedKeywords: ['def2-TZVP', 'aug-cc-pVTZ', 'ma-def2-SVP']
	},
	'DEF2-TZVP/C': {
		name: 'def2-TZVP/C',
		category: 'Basis Set (Contracted)',
		description: 'Contracted def2-TZVP optimized for RI-MP2 calculations. Reduced computational cost while maintaining accuracy for correlation methods. Use with RI-MP2 or DLPNO methods.',
		example: '! DLPNO-CCSD(T) def2-TZVP/C',
		relatedKeywords: ['def2-TZVP', 'cc-pVTZ/C', 'DLPNO-CCSD(T)']
	},
	'DEF2-QZVP/C': {
		name: 'def2-QZVP/C',
		category: 'Basis Set (Contracted)',
		description: 'Contracted def2-QZVP for coupled-cluster calculations. Improved cost-efficiency for high-level correlated methods. Enables larger systems with DLPNO-CCSD(T).',
		example: '! DLPNO-CCSD(T) def2-QZVP/C',
		relatedKeywords: ['def2-QZVPP', 'def2-TZVP/C']
	},
	'6-31G(D)': {
		name: '6-31G(d)',
		category: 'Basis Set (Pople)',
		description: 'Pople double-zeta split-valence basis with d-polarization on heavy atoms. Parenthetical notation equivalent to 6-31G*. Historic basis set encountered throughout the DFT literature; def2-SVP recommended for new work.',
		example: '! B3LYP 6-31G(d)',
		relatedKeywords: ['6-31G*', 'def2-SVP'],
		deprecationNote: 'Consider using def2-SVP instead for better balance and auxiliary basis availability.'
	},
	'6-311G': {
		name: '6-311G',
		category: 'Basis Set (Pople)',
		description: 'Pople triple-split valence basis without polarization functions. More flexible valence than 6-31G but lacks polarization. Usually extended with * or ** (d/p polarization) or + (diffuse) for practical use.',
		example: '! B3LYP 6-311G',
		relatedKeywords: ['6-311G**', '6-31G*', 'def2-TZVP']
	},
	'6-311+G(D,P)': {
		name: '6-311+G(d,P)',
		category: 'Basis Set (Pople)',
		description: 'Triple-split Pople basis with diffuse functions and d(heavy)/p(H) polarization. Popular for anions, hydrogen-bonded systems, and molecules with lone pairs. Modern alternatives like def2-TZVP generally preferred.',
		example: '! B3LYP 6-311+G(d,P)',
		relatedKeywords: ['6-311G**', 'def2-TZVP', 'aug-cc-pVTZ'],
		deprecationNote: 'Consider using def2-TZVP or ma-def2-TZVP for better RI compatibility.'
	},
	'DEF2-QZVP': {
		name: 'def2-QZVP',
		category: 'Basis Set (Quadruple-Zeta)',
		description: 'Karlsruhe quadruple-zeta valence with one set of polarization functions. Slightly smaller than def2-QZVPP; used for high-accuracy single-point calculations and approaches the basis set limit for most properties.',
		example: '! PBE0 def2-QZVP',
		relatedKeywords: ['def2-QZVPP', 'def2-TZVP', 'cc-pVQZ']
	},
	'LANL2DZ': {
		name: 'LANL2DZ',
		category: 'Basis Set (ECP)',
		description: 'Los Alamos National Laboratory effective core potential with double-zeta valence basis. Replaces core electrons with a pseudopotential for transition metals and heavy main-group elements. Widely used but older; def2 bases with ECPs preferred for modern work.',
		example: '! B3LYP LANL2DZ',
		relatedKeywords: ['SDD', 'def2-SVP', 'def2-TZVP'],
		deprecationNote: 'Consider def2-SVP or def2-TZVP with built-in ECPs for better accuracy.'
	},
	'SDD': {
		name: 'SDD',
		category: 'Basis Set (ECP)',
		description: 'Stuttgart-Dresden effective core potential with double-zeta valence basis. Alternative to LANL2DZ for heavy elements. More modern ECP parametrization; good for transition metals and lanthanides.',
		example: '! B3LYP SDD',
		relatedKeywords: ['LANL2DZ', 'def2-SVP', 'def2-TZVP']
	},
	'PC-1': {
		name: 'pc-1',
		category: 'Basis Set (Polarization-Consistent)',
		description: 'Jensen\'s polarization-consistent basis set at double-zeta quality. Designed for systematic convergence of DFT energies. More efficient than Pople bases for DFT due to optimized exponents.',
		example: '! B3LYP pc-1',
		relatedKeywords: ['PC-2', 'def2-SVP', 'cc-pVDZ']
	},
	'PC-2': {
		name: 'pc-2',
		category: 'Basis Set (Polarization-Consistent)',
		description: 'Jensen\'s polarization-consistent basis set at triple-zeta quality. Higher level in the pc-n series. Systematic convergence of DFT energies; often more efficient than def2-TZVP for pure DFT calculations.',
		example: '! B3LYP pc-2',
		relatedKeywords: ['PC-1', 'def2-TZVP', 'cc-pVTZ']
	},

	// Job Types (8 entries)
	'OPT': {
		name: 'Opt',
		category: 'Job Type',
		description: 'Geometry optimization. Finds the nearest local minimum on the potential energy surface by iteratively adjusting atomic coordinates. Continues until convergence criteria are met.',
		example: '! B3LYP def2-TZVP Opt',
		relatedKeywords: ['OptTS', 'Freq', 'NumFreq', 'COPT']
	},
	'OPTTS': {
		name: 'OptTS',
		category: 'Job Type',
		description: 'Transition state optimization. Searches for a first-order saddle point on the potential energy surface. Requires a reasonable initial guess geometry. Check with frequency calculation after optimization.',
		example: '! B3LYP def2-TZVP OptTS',
		relatedKeywords: ['Opt', 'Freq', 'NEB']
	},
	'FREQ': {
		name: 'Freq',
		category: 'Job Type',
		description: 'Frequency calculation (vibrational analysis). Computes harmonic vibrational frequencies, infrared intensities, and thermochemistry. Uses analytical second derivatives. Must be run at an optimized geometry.',
		example: '! B3LYP def2-TZVP Freq',
		relatedKeywords: ['NumFreq', 'Opt', 'OptTS']
	},
	'NUMFREQ': {
		name: 'NumFreq',
		category: 'Job Type',
		description: 'Numerical frequency calculation. Computes frequencies by finite differences of gradients. More expensive than analytical Freq but available for all methods. Use when analytical Hessian not implemented.',
		example: '! M06-2X def2-TZVP NumFreq',
		relatedKeywords: ['Freq', 'NumHess', 'Opt']
	},
	'SP': {
		name: 'SP',
		category: 'Job Type',
		description: 'Single point energy calculation. Evaluates energy and properties at fixed geometry without optimization. Default if no job type specified. Fast way to get energies at specific geometries.',
		example: '! CCSD(T) def2-QZVPP SP',
		relatedKeywords: ['Opt', 'Gradient']
	},
	'MD': {
		name: 'MD',
		category: 'Job Type',
		description: 'Molecular dynamics simulation. Propagates atomic positions over time using Newton\'s equations. Requires %md block for simulation parameters. Good for exploring conformational space and finite-temperature properties.',
		example: '! B3LYP def2-SVP MD',
		relatedKeywords: ['Opt', 'NEB', 'BOMD']
	},
	'NEB': {
		name: 'NEB',
		category: 'Job Type',
		description: 'Nudged Elastic Band method for reaction path finding. Generates a minimum energy path between reactant and product. Requires initial path guess. Use to find transition states systematically.',
		example: '! B3LYP def2-SVP NEB',
		relatedKeywords: ['OptTS', 'MD', 'NEB-TS']
	},
	'COPT': {
		name: 'COPT',
		category: 'Job Type',
		description: 'Constrained optimization. Performs geometry optimization with constraints on selected coordinates. Requires constraint definitions in %geom block. Useful for scanning potential energy surfaces.',
		example: '! B3LYP def2-TZVP COPT',
		relatedKeywords: ['Opt', 'Scan', 'Surface']
	},
	'NEB-TS': {
		name: 'NEB-TS',
		category: 'Job Type',
		description: 'Nudged Elastic Band with automatic transition state search. Generates a minimum energy path and then refines the transition state from the highest-energy image. More reliable than OptTS when a good TS guess is unavailable.',
		example: '! B3LYP def2-SVP NEB-TS',
		relatedKeywords: ['NEB', 'OptTS', 'Freq']
	},

	// Auxiliary Options (21 entries)
	'TIGHTSCF': {
		name: 'TightSCF',
		category: 'SCF Convergence',
		description: 'Use tight SCF convergence thresholds. Energy convergence to 1e-8 Hartree, density convergence to 1e-7. Recommended for accurate property calculations, frequency analyses, and sensitive applications.',
		example: '! B3LYP def2-TZVP TightSCF',
		relatedKeywords: ['VeryTightSCF', 'SlowConv', 'SCFCONV']
	},
	'VERYTIGHTSCF': {
		name: 'VeryTightSCF',
		category: 'SCF Convergence',
		description: 'Very tight SCF convergence criteria. Energy convergence to 1e-9 Hartree. Needed for very accurate numerical derivatives and sensitive properties. Increases iteration count.',
		example: '! PBE0 def2-TZVP VeryTightSCF',
		relatedKeywords: ['TightSCF', 'ExtremelyTightSCF']
	},
	'TIGHTOPT': {
		name: 'TightOpt',
		category: 'Geometry Convergence',
		description: 'Tight geometry optimization convergence thresholds. More stringent than default Opt convergence criteria. Recommended for accurate thermochemistry, reaction energy calculations, and before frequency analyses.',
		example: '! B3LYP def2-TZVP Opt TightOpt',
		relatedKeywords: ['VeryTightOpt', 'TightSCF', 'Opt']
	},
	'VERYTIGHTOPT': {
		name: 'VeryTightOpt',
		category: 'Geometry Convergence',
		description: 'Very tight geometry optimization convergence thresholds. Maximum practical stringency for geometry optimizations. Use for high-accuracy benchmark reference geometries and numerically sensitive calculations.',
		example: '! B3LYP def2-TZVP Opt VeryTightOpt',
		relatedKeywords: ['TightOpt', 'VeryTightSCF', 'Opt']
	},
	'SLOWCONV': {
		name: 'SlowConv',
		category: 'SCF Convergence',
		description: 'Enable algorithms for slowly converging SCF. Uses level shifting, damping, and SOSCF if needed. Helpful for difficult cases like transition metal complexes or open-shell systems.',
		example: '! B3LYP def2-TZVP SlowConv',
		relatedKeywords: ['TightSCF', 'SOSCF', 'KDIIS']
	},
	'RIJCOSX': {
		name: 'RIJCOSX',
		category: 'Approximation Technique',
		description: 'Resolution of Identity (RI) approximation combined with Chain-of-Spheres Exchange. Significantly accelerates hybrid DFT calculations with minimal loss of accuracy. Automatically selects appropriate auxiliary basis sets.',
		example: '! PBE0 def2-TZVP RIJCOSX',
		relatedKeywords: ['RI', 'RIJONX', 'COSX']
	},
	'RI': {
		name: 'RI',
		category: 'Approximation Technique',
		description: 'Resolution of Identity approximation for Coulomb integrals. Density fitting approach that accelerates DFT calculations. Essential for large systems. Requires auxiliary basis sets.',
		example: '! PBE def2-TZVP RI',
		relatedKeywords: ['RIJCOSX', 'RIJONX', 'AutoAux']
	},
	'D3BJ': {
		name: 'D3BJ',
		category: 'Dispersion Correction',
		description: 'Grimme\'s D3 dispersion correction with Becke-Johnson damping. Adds empirical dispersion to DFT for better description of non-covalent interactions. Recommended for most functionals.',
		example: '! B3LYP def2-TZVP D3BJ',
		relatedKeywords: ['D3ZERO', 'D4', 'vdW']
	},
	'D3ZERO': {
		name: 'D3ZERO',
		category: 'Dispersion Correction',
		description: 'Grimme\'s D3 dispersion with zero-damping. Original D3 damping function. D3BJ generally preferred but some functionals optimized with zero-damping.',
		example: '! PBE def2-TZVP D3ZERO',
		relatedKeywords: ['D3BJ', 'D4']
	},
	'D4': {
		name: 'D4',
		category: 'Dispersion Correction',
		description: 'Grimme\'s D4 dispersion correction. Latest generation with improved accuracy and robustness. Uses atomic partial charges for better transferability. Recommended over D3 when available.',
		example: '! r2SCAN def2-TZVP D4',
		relatedKeywords: ['D3BJ', 'D3ZERO']
	},
	'CPCM': {
		name: 'CPCM',
		category: 'Solvation Model',
		description: 'Conductor-like Polarizable Continuum Model for implicit solvation. Treats solvent as dielectric continuum. Requires solvent specification in %cpcm block. Good for polar solvents.',
		example: '! B3LYP def2-TZVP CPCM',
		relatedKeywords: ['SMD', 'COSMO', 'Solvent']
	},
	'SMD': {
		name: 'SMD',
		category: 'Solvation Model',
		description: 'Solvation Model based on Density. Universal solvation model parameterized for many solvents. Generally more accurate than CPCM for solvation free energies. Includes non-electrostatic terms.',
		example: '! PBE0 def2-TZVP SMD',
		relatedKeywords: ['CPCM', 'COSMO']
	},
	'PAL4': {
		name: 'PAL4',
		category: 'Parallelization',
		description: 'Use 4 CPU cores. Shorthand for %pal nprocs 4 end. Alternative numbers: PAL2, PAL8, PAL16, etc. Adjust based on available hardware.',
		example: '! B3LYP def2-TZVP PAL4',
		relatedKeywords: ['PAL8', 'PAL16', 'nprocs']
	},
	'PAL8': {
		name: 'PAL8',
		category: 'Parallelization',
		description: 'Use 8 CPU cores. Common choice for modern workstations. Scaling efficiency depends on calculation type. DFT scales well to ~8-16 cores.',
		example: '! PBE0 def2-TZVP PAL8',
		relatedKeywords: ['PAL4', 'PAL16', 'nprocs']
	},
	'GRID4': {
		name: 'GRID4',
		category: 'DFT Grid Quality',
		description: 'Medium-quality DFT integration grid. Balanced accuracy and speed. Default for most calculations. Suitable for routine geometry optimizations and single points.',
		example: '! B3LYP def2-TZVP GRID4',
		relatedKeywords: ['GRID5', 'GRID6', 'DefGrid2']
	},
	'GRID5': {
		name: 'GRID5',
		category: 'DFT Grid Quality',
		description: 'Fine DFT integration grid. Higher quality than GRID4 with denser angular points. Good for accurate energies, properties, and numerical derivatives. Recommended for production work.',
		example: '! PBE0 def2-TZVP GRID5',
		relatedKeywords: ['GRID4', 'GRID6', 'FinalGrid5']
	},
	'GRID6': {
		name: 'GRID6',
		category: 'DFT Grid Quality',
		description: 'Very fine DFT integration grid. Approaches grid convergence for most systems. Use for very accurate thermochemistry or grid-sensitive properties. Computationally expensive.',
		example: '! wB97X-D3 def2-TZVP GRID6',
		relatedKeywords: ['GRID5', 'GRID7']
	},
	'PRINTBASIS': {
		name: 'PrintBasis',
		category: 'Output Control',
		description: 'Print basis set information to output file. Shows contracted Gaussian functions, exponents, and coefficients. Useful for verifying basis set assignments.',
		example: '! B3LYP def2-TZVP PrintBasis',
		relatedKeywords: ['PrintMOs', 'LargePrint']
	},
	'PRINTMOS': {
		name: 'PrintMOs',
		category: 'Output Control',
		description: 'Print molecular orbital coefficients and energies. Detailed output of MO composition. Large amount of output for big basis sets. Useful for orbital analysis.',
		example: '! HF def2-SVP PrintMOs',
		relatedKeywords: ['PrintBasis', 'KeepDens']
	},
	'KEEPDENS': {
		name: 'KeepDens',
		category: 'Output Control',
		description: 'Keep density on disk for later use. Allows restart calculations and analysis with external tools. Generates .scfp or .gbw files. Automatically enabled for some job types.',
		example: '! B3LYP def2-TZVP KeepDens',
		relatedKeywords: ['MORead', 'DumpDens']
	},
	'MOREAD': {
		name: 'MORead',
		category: 'SCF Restart',
		description: 'Read molecular orbitals from previous calculation. Speeds up SCF convergence with good initial guess. Requires .gbw file from previous run. Useful for sequential calculations.',
		example: '! B3LYP def2-TZVP MORead',
		relatedKeywords: ['KeepDens', 'NoIter']
	},
	'UNO': {
		name: 'UNO',
		category: 'MO Analysis',
		description: 'Generate Unrestricted Natural Orbitals. Useful for analyzing open-shell systems and multi-reference character. Helps identify static correlation. Check UNO occupation numbers.',
		example: '! B3LYP def2-TZVP UNO',
		relatedKeywords: ['NatOrbs', 'PrintMOs']
	},
	'MINIPRINT': {
		name: 'MiniPrint',
		category: 'Output Control',
		description: 'Minimal output printing. Reduces output file size significantly. Shows only essential information. Good for large batch jobs or optimization trajectories.',
		example: '! B3LYP def2-SVP MiniPrint',
		relatedKeywords: ['PrintBasis', 'NormalPrint', 'LargePrint']
	},
};

// ============================================================================
// BLOCK DEFINITIONS (13 entries)
// ============================================================================

export const blockDefinitions: Record<string, BlockDefinition> = {
	'scf': {
		name: '%scf',
		description: 'Controls Self-Consistent Field (SCF) convergence parameters. Use this block to adjust iteration limits, convergence thresholds, and DIIS settings when default SCF convergence fails or tighter convergence is needed.',
		commonParams: ['MaxIter', 'TolE', 'Convergence', 'DIISMaxEq', 'directresetfreq'],
		example: `%scf
  MaxIter 500
  TolE 1e-7
end`
	},
	'geom': {
		name: '%geom',
		description: 'Geometry optimization settings. Controls convergence criteria, maximum iterations, and optimization algorithms. Use to customize geometry optimization behavior or resolve convergence issues.',
		commonParams: ['MaxIter', 'TolE', 'TolRMSG', 'TolMaxG', 'TolRMSD', 'TolMaxD'],
		example: `%geom
  MaxIter 200
  TolE 1e-6
  TolRMSG 1e-4
end`
	},
	'pal': {
		name: '%pal',
		description: 'Parallelization settings. Specifies the number of CPU cores to use for the calculation. ORCA uses shared-memory parallelism by default.',
		commonParams: ['nprocs'],
		example: `%pal
  nprocs 8
end`
	},
	'maxcore': {
		name: '%maxcore',
		description: 'Memory allocation per CPU core in megabytes. Controls how much RAM each process can use. Insufficient memory can cause crashes or slow performance; excessive allocation wastes resources.',
		commonParams: ['memory value (MB)'],
		example: `%maxcore 4096`
	},
	'tddft': {
		name: '%tddft',
		description: 'Time-Dependent DFT settings for excited state calculations. Controls number of roots, Davidson algorithm parameters, and TDA approximation. Use for UV-Vis spectra and excited state properties.',
		commonParams: ['NRoots', 'MaxDim', 'TDA', 'triplets'],
		example: `%tddft
  NRoots 10
  MaxDim 5
end`
	},
	'basis': {
		name: '%basis',
		description: 'Custom basis set definitions and per-atom basis assignments. Allows mixing basis sets or defining custom basis functions. Use for specialized calculations requiring non-standard basis combinations.',
		commonParams: ['NewGTO', 'NewECP', 'NewAuxGTO'],
		example: `%basis
  NewGTO C "def2-QZVPP" end
  NewGTO H "def2-TZVP" end
end`
	},
	'method': {
		name: '%method',
		description: 'Method-specific settings and parameters. Controls functional percentages, exchange, correlation, and advanced method options. Use for fine-tuning DFT or wavefunction methods.',
		commonParams: ['ScalHFX', 'ScalDFX', 'RunTyp', 'FrozenCore'],
		example: `%method
  ScalHFX 0.25
end`
	},
	'coords': {
		name: '%coords',
		description: 'Coordinate input and manipulation. Define molecular geometry in various formats (Cartesian, Z-matrix, internal). Supports multiple coordinate sets for scan or NEB calculations.',
		commonParams: ['CTyp', 'Coord', 'Mult', 'Charge'],
		example: `%coords
  CTyp xyz
  Charge 0
  Mult 1
end`
	},
	'casscf': {
		name: '%casscf',
		description: 'Complete Active Space SCF settings. Controls active space definition, orbital selection, and state averaging. Use for multi-reference systems with strong static correlation.',
		commonParams: ['nel', 'norb', 'nroots', 'weights'],
		example: `%casscf
  nel 6
  norb 6
  nroots 3
end`
	},
	'cpcm': {
		name: '%cpcm',
		description: 'Conductor-like Polarizable Continuum Model parameters. Specifies solvent, dielectric constant, and cavity construction. Use for implicit solvation in polar solvents.',
		commonParams: ['epsilon', 'refrac', 'solvent'],
		example: `%cpcm
  epsilon 78.4
  refrac 1.33
end`
	},
	'freq': {
		name: '%freq',
		description: 'Frequency calculation settings. Controls numerical derivatives, temperature for thermochemistry, and Hessian calculation options.',
		commonParams: ['Temp', 'Pressure', 'increment'],
		example: `%freq
  Temp 298.15
  Pressure 1.0
end`
	},
	'neb': {
		name: '%neb',
		description: 'Nudged Elastic Band method parameters. Controls number of images, spring constants, and convergence criteria for reaction path finding.',
		commonParams: ['NImages', 'SpringType', 'Free_End'],
		example: `%neb
  NImages 8
  Free_End true
end`
	},
	'output': {
		name: '%output',
		description: 'Output file control and printing options. Customize what information is written to output file, create additional output files, and control verbosity.',
		commonParams: ['Print', 'PrintLevel', 'xyzfile'],
		example: `%output
  Print[P_Basis] 2
  Print[P_MOs] 1
end`
	},
};

// ============================================================================
// BLOCK ATTRIBUTES (35 entries across all blocks)
// ============================================================================

export const blockAttributes: Record<string, Record<string, BlockAttributeDefinition>> = {
	// %scf attributes (7 entries)
	'scf': {
		'MaxIter': {
			name: 'MaxIter',
			blockName: 'scf',
			type: 'integer',
			default: '125',
			description: 'Maximum number of SCF iterations before convergence failure. Increase this value if SCF converges slowly but steadily. Values of 200-500 are common for difficult cases.',
			example: 'MaxIter 500'
		},
		'TolE': {
			name: 'TolE',
			blockName: 'scf',
			type: 'float',
			default: '1e-6',
			unit: 'Hartree',
			description: 'Energy convergence tolerance. SCF is considered converged when the energy change between iterations falls below this threshold. Tighter values (1e-8) needed for accurate frequencies.',
			example: 'TolE 1e-8'
		},
		'Convergence': {
			name: 'Convergence',
			blockName: 'scf',
			type: 'string',
			description: 'Convergence level preset (Loose, Normal, Tight, VeryTight, Extreme). Sets multiple tolerances simultaneously. Convenient alternative to setting individual thresholds.',
			example: 'Convergence Tight'
		},
		'DIISMaxEq': {
			name: 'DIISMaxEq',
			blockName: 'scf',
			type: 'integer',
			default: '5',
			description: 'Maximum number of DIIS vectors stored for extrapolation. Larger values can improve convergence but increase memory usage. Typical range: 5-15.',
			example: 'DIISMaxEq 10'
		},
		'directresetfreq': {
			name: 'directresetfreq',
			blockName: 'scf',
			type: 'integer',
			default: '15',
			description: 'Frequency of resetting DIIS (in iterations). Prevents DIIS from becoming unstable in difficult cases. Lower values more conservative.',
			example: 'directresetfreq 10'
		},
		'SOSCF': {
			name: 'SOSCF',
			blockName: 'scf',
			type: 'boolean',
			default: 'false',
			description: 'Enable Second-Order SCF for difficult convergence cases. Uses approximate orbital Hessian. More expensive per iteration but can converge difficult cases.',
			example: 'SOSCF true'
		},
		'KDIIS': {
			name: 'KDIIS',
			blockName: 'scf',
			type: 'boolean',
			default: 'false',
			description: 'Use Krylov-space DIIS instead of standard DIIS. Can help in metal systems. Try if SCF oscillates.',
			example: 'KDIIS true'
		},
	},

	// %geom attributes (7 entries)
	'geom': {
		'MaxIter': {
			name: 'MaxIter',
			blockName: 'geom',
			type: 'integer',
			default: '50',
			description: 'Maximum number of geometry optimization steps. Increase for slow-converging optimizations or complex potential energy surfaces. Large molecules may need 100-200 steps.',
			example: 'MaxIter 200'
		},
		'TolE': {
			name: 'TolE',
			blockName: 'geom',
			type: 'float',
			default: '5e-6',
			unit: 'Hartree',
			description: 'Energy convergence tolerance for geometry optimization. Optimization stops when energy change falls below this threshold. Default is typically sufficient.',
			example: 'TolE 1e-6'
		},
		'TolRMSG': {
			name: 'TolRMSG',
			blockName: 'geom',
			type: 'float',
			default: '1e-4',
			unit: 'Hartree/Bohr',
			description: 'RMS gradient convergence tolerance. Primary convergence criterion. Optimization converges when RMS gradient is below threshold. Lower values = tighter optimization.',
			example: 'TolRMSG 5e-5'
		},
		'TolMaxG': {
			name: 'TolMaxG',
			blockName: 'geom',
			type: 'float',
			default: '3e-4',
			unit: 'Hartree/Bohr',
			description: 'Maximum gradient element convergence. Ensures no single atom has large force. Prevents almost-converged optimizations with one problematic coordinate.',
			example: 'TolMaxG 1e-4'
		},
		'TolRMSD': {
			name: 'TolRMSD',
			blockName: 'geom',
			type: 'float',
			default: '2e-3',
			unit: 'Bohr',
			description: 'RMS displacement convergence tolerance. Monitors coordinate changes between steps. Secondary convergence criterion.',
			example: 'TolRMSD 1e-3'
		},
		'TolMaxD': {
			name: 'TolMaxD',
			blockName: 'geom',
			type: 'float',
			default: '4e-3',
			unit: 'Bohr',
			description: 'Maximum displacement element tolerance. Ensures no single coordinate changes too much. Prevents oscillations.',
			example: 'TolMaxD 2e-3'
		},
		'Calc_Hess': {
			name: 'Calc_Hess',
			blockName: 'geom',
			type: 'boolean',
			default: 'false',
			description: 'Calculate exact Hessian at start of optimization. Expensive but improves convergence for difficult cases or transition state searches.',
			example: 'Calc_Hess true'
		},
	},

	// %pal attributes (1 entry)
	'pal': {
		'nprocs': {
			name: 'nprocs',
			blockName: 'pal',
			type: 'integer',
			description: 'Number of CPU cores to use for parallel execution. Should not exceed the number of physical cores available. Typical values: 4, 8, 16, 32.',
			example: 'nprocs 8'
		},
	},

	// %tddft attributes (4 entries)
	'tddft': {
		'NRoots': {
			name: 'NRoots',
			blockName: 'tddft',
			type: 'integer',
			default: '10',
			description: 'Number of excited states to calculate. More roots = longer calculation time. Typical values: 10-50 for UV-Vis spectra.',
			example: 'NRoots 20'
		},
		'MaxDim': {
			name: 'MaxDim',
			blockName: 'tddft',
			type: 'integer',
			default: '5',
			description: 'Expansion space dimension multiplier. MaxDim * NRoots vectors stored. Higher values improve convergence but use more memory.',
			example: 'MaxDim 10'
		},
		'TDA': {
			name: 'TDA',
			blockName: 'tddft',
			type: 'boolean',
			default: 'false',
			description: 'Use Tamm-Dancoff Approximation. Cheaper than full TDDFT. Often gives similar results. Good for initial screening.',
			example: 'TDA true'
		},
		'triplets': {
			name: 'triplets',
			blockName: 'tddft',
			type: 'boolean',
			default: 'false',
			description: 'Calculate triplet excited states instead of singlets. Use for phosphorescence or photochemistry involving triplet states.',
			example: 'triplets true'
		},
	},

	// %output attributes (3 entries)
	'output': {
		'Print': {
			name: 'Print',
			blockName: 'output',
			type: 'string',
			description: 'Control printing level for specific output sections. Format: Print[P_SectionName] level. Level 0=minimal, 1=normal, 2=detailed, 3=full.',
			example: 'Print[P_Basis] 2'
		},
		'PrintLevel': {
			name: 'PrintLevel',
			blockName: 'output',
			type: 'string',
			description: 'Global printing verbosity (Mini, Normal, Large). Affects all output sections. Mini=minimal, Normal=default, Large=detailed.',
			example: 'PrintLevel Large'
		},
		'xyzfile': {
			name: 'xyzfile',
			blockName: 'output',
			type: 'boolean',
			default: 'false',
			description: 'Save optimized geometry to .xyz file. Convenient for visualization. Generated automatically for optimization jobs.',
			example: 'xyzfile true'
		},
	},

	// %freq attributes (3 entries)
	'freq': {
		'Temp': {
			name: 'Temp',
			blockName: 'freq',
			type: 'float',
			default: '298.15',
			unit: 'K',
			description: 'Temperature for thermochemistry calculations. Used in partition functions and thermal corrections. Standard: 298.15 K.',
			example: 'Temp 298.15'
		},
		'Pressure': {
			name: 'Pressure',
			blockName: 'freq',
			type: 'float',
			default: '1.0',
			unit: 'atm',
			description: 'Pressure for thermochemistry. Affects entropy contributions. Standard state: 1.0 atm.',
			example: 'Pressure 1.0'
		},
		'increment': {
			name: 'increment',
			blockName: 'freq',
			type: 'float',
			default: '0.005',
			unit: 'Bohr',
			description: 'Step size for numerical differentiation. Smaller values more accurate but amplify numerical noise. Default usually optimal.',
			example: 'increment 0.01'
		},
	},

	// %cpcm attributes (3 entries)
	'cpcm': {
		'epsilon': {
			name: 'epsilon',
			blockName: 'cpcm',
			type: 'float',
			description: 'Dielectric constant of solvent. Higher values = more polar solvents. Water: 78.4, Acetonitrile: 36.6, Chloroform: 4.8.',
			example: 'epsilon 78.4'
		},
		'refrac': {
			name: 'refrac',
			blockName: 'cpcm',
			type: 'float',
			description: 'Refractive index of solvent. Used for non-electrostatic contributions. Water: 1.33, Acetonitrile: 1.34, Chloroform: 1.45.',
			example: 'refrac 1.33'
		},
		'solvent': {
			name: 'solvent',
			blockName: 'cpcm',
			type: 'string',
			description: 'Predefined solvent name. Sets epsilon and refrac automatically. Examples: "water", "acetonitrile", "dmso", "chloroform".',
			example: 'solvent "water"'
		},
	},

	// %casscf attributes (3 entries)
	'casscf': {
		'nel': {
			name: 'nel',
			blockName: 'casscf',
			type: 'integer',
			description: 'Number of active electrons. Should match the electrons in bonds being broken/formed. Typical values: 2-16.',
			example: 'nel 6'
		},
		'norb': {
			name: 'norb',
			blockName: 'casscf',
			type: 'integer',
			description: 'Number of active orbitals. Choose orbitals capturing static correlation. Often equal to nel for bond breaking.',
			example: 'norb 6'
		},
		'nroots': {
			name: 'nroots',
			blockName: 'casscf',
			type: 'integer',
			default: '1',
			description: 'Number of electronic states to calculate. Use for excited states or state-averaging. More roots = longer calculation.',
			example: 'nroots 3'
		},
	},

	// %neb attributes (2 entries)
	'neb': {
		'NImages': {
			name: 'NImages',
			blockName: 'neb',
			type: 'integer',
			default: '8',
			description: 'Number of images along reaction path. More images = better resolution but more expensive. Typical: 8-16.',
			example: 'NImages 12'
		},
		'Free_End': {
			name: 'Free_End',
			blockName: 'neb',
			type: 'boolean',
			default: 'false',
			description: 'Allow endpoints to relax. Useful when reactant/product not fully optimized. Usually keep false if endpoints already optimized.',
			example: 'Free_End true'
		},
	},

	// %method attributes (2 entries)
	'method': {
		'ScalHFX': {
			name: 'ScalHFX',
			blockName: 'method',
			type: 'float',
			description: 'Scale factor for Hartree-Fock exchange percentage. Range: 0.0-1.0. Use to create custom hybrid functionals or tune exchange.',
			example: 'ScalHFX 0.25'
		},
		'FrozenCore': {
			name: 'FrozenCore',
			blockName: 'method',
			type: 'string',
			description: 'Frozen core approximation for correlation methods. Options: "None", "FC_LOOSE", "FC_CHEAP". Reduces cost with minimal accuracy loss.',
			example: 'FrozenCore FC_LOOSE'
		},
	},
};
