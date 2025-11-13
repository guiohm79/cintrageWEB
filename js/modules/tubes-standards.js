/**
 * @class TubeStandard
 * @description Représente un tube standard avec ses dimensions
 */
window.TubeStandard = class TubeStandard {
    /**
     * @param {string} designation - Désignation commerciale (ex: "3/8\"", "DN20")
     * @param {number} diametreExterieur - Diamètre extérieur en mm
     * @param {number} epaisseur - Épaisseur de paroi en mm
     * @param {number} rayonCintrageRecommande - Rayon de cintrage recommandé en mm
     * @param {string} norme - Norme de référence (ex: "NF", "ISO", "VIRAX")
     * @param {string} serie - Série du tube (ex: "Lourde", "Moyenne", "Légère")
     */
    constructor(designation, diametreExterieur, epaisseur, rayonCintrageRecommande, norme, serie) {
        this.designation = designation;
        this.diametreExterieur = diametreExterieur;
        this.epaisseur = epaisseur;
        this.rayonCintrageRecommande = rayonCintrageRecommande;
        this.norme = norme;
        this.serie = serie;
        this.diametreInterieur = diametreExterieur - 2 * epaisseur;
    }

    /**
     * Retourne une description complète du tube
     * @returns {string} Description formatée
     */
    getDescription() {
        return `${this.designation} - Ø${this.diametreExterieur}mm × ${this.epaisseur}mm - ${this.serie} (${this.norme})`;
    }
};

/**
 * @class BibliothequeTubes
 * @description Gère la bibliothèque de tubes standards
 */
window.BibliothequeTubes = class BibliothequeTubes {
    constructor() {
        this.tubes = this.initialiserTubes();
    }

    /**
     * Initialise la bibliothèque avec les tubes standards VIRAX et normes françaises
     * @returns {Array<TubeStandard>} Liste des tubes standards
     */
    initialiserTubes() {
        const tubes = [];

        // Tubes gaz série moyenne et lourde (selon documentation VIRAX)
        // Source: machines VIRAX 2402 et 2408

        // 3/8" (12mm nominal)
        tubes.push(new TubeStandard(
            '3/8"',
            17.2,   // Diamètre extérieur
            2.35,   // Épaisseur
            82,     // Rayon de cintrage recommandé
            'NF',
            'Moyenne/Lourde'
        ));

        // 1/2" (15mm nominal)
        tubes.push(new TubeStandard(
            '1/2"',
            21.3,
            2.65,
            101,
            'NF',
            'Moyenne/Lourde'
        ));

        // 3/4" (20mm nominal)
        tubes.push(new TubeStandard(
            '3/4"',
            26.9,
            2.65,
            128,
            'NF',
            'Moyenne/Lourde'
        ));

        // 1" (25mm nominal)
        tubes.push(new TubeStandard(
            '1"',
            33.7,
            3.25,
            160,
            'NF',
            'Moyenne/Lourde'
        ));

        // 1"1/4 (32mm nominal)
        tubes.push(new TubeStandard(
            '1"1/4',
            42.4,
            3.25,
            201,
            'NF',
            'Moyenne/Lourde'
        ));

        // 1"1/2 (40mm nominal)
        tubes.push(new TubeStandard(
            '1"1/2',
            48.3,
            3.25,
            229,
            'NF',
            'Moyenne/Lourde'
        ));

        // 2" (50mm nominal)
        tubes.push(new TubeStandard(
            '2"',
            60.3,
            3.65,
            286,
            'NF',
            'Moyenne/Lourde'
        ));

        // 2"1/2 (65mm nominal)
        tubes.push(new TubeStandard(
            '2"1/2',
            76.1,
            3.65,
            361,
            'NF',
            'Moyenne/Lourde'
        ));

        // 3" (80mm nominal)
        tubes.push(new TubeStandard(
            '3"',
            88.9,
            4.05,
            422,
            'NF',
            'Moyenne/Lourde'
        ));

        // 4" (100mm nominal)
        tubes.push(new TubeStandard(
            '4"',
            114.3,
            4.50,
            542,
            'NF',
            'Moyenne/Lourde'
        ));

        // Tubes série légère
        tubes.push(new TubeStandard(
            '3/8" léger',
            17.2,
            1.80,
            82,
            'NF',
            'Légère'
        ));

        tubes.push(new TubeStandard(
            '1/2" léger',
            21.3,
            2.00,
            101,
            'NF',
            'Légère'
        ));

        tubes.push(new TubeStandard(
            '3/4" léger',
            26.9,
            2.00,
            128,
            'NF',
            'Légère'
        ));

        tubes.push(new TubeStandard(
            '1" léger',
            33.7,
            2.50,
            160,
            'NF',
            'Légère'
        ));

        tubes.push(new TubeStandard(
            '1"1/4 léger',
            42.4,
            2.50,
            201,
            'NF',
            'Légère'
        ));

        tubes.push(new TubeStandard(
            '1"1/2 léger',
            48.3,
            2.50,
            229,
            'NF',
            'Légère'
        ));

        // Tubes cuivre (norme européenne)
        tubes.push(new TubeStandard(
            'Cuivre 12mm',
            12,
            1.0,
            60,
            'EN 1057',
            'Recuit'
        ));

        tubes.push(new TubeStandard(
            'Cuivre 14mm',
            14,
            1.0,
            70,
            'EN 1057',
            'Recuit'
        ));

        tubes.push(new TubeStandard(
            'Cuivre 16mm',
            16,
            1.0,
            80,
            'EN 1057',
            'Recuit'
        ));

        tubes.push(new TubeStandard(
            'Cuivre 18mm',
            18,
            1.0,
            90,
            'EN 1057',
            'Recuit'
        ));

        tubes.push(new TubeStandard(
            'Cuivre 22mm',
            22,
            1.0,
            110,
            'EN 1057',
            'Recuit'
        ));

        tubes.push(new TubeStandard(
            'Cuivre 28mm',
            28,
            1.5,
            140,
            'EN 1057',
            'Recuit'
        ));

        tubes.push(new TubeStandard(
            'Cuivre 35mm',
            35,
            1.5,
            175,
            'EN 1057',
            'Recuit'
        ));

        // Tubes PER (Polyéthylène réticulé)
        tubes.push(new TubeStandard(
            'PER 12×1.1',
            12,
            1.1,
            60,
            'NF DTU 65.10',
            'Standard'
        ));

        tubes.push(new TubeStandard(
            'PER 16×1.5',
            16,
            1.5,
            80,
            'NF DTU 65.10',
            'Standard'
        ));

        tubes.push(new TubeStandard(
            'PER 20×1.9',
            20,
            1.9,
            100,
            'NF DTU 65.10',
            'Standard'
        ));

        tubes.push(new TubeStandard(
            'PER 25×2.3',
            25,
            2.3,
            125,
            'NF DTU 65.10',
            'Standard'
        ));

        return tubes;
    }

    /**
     * Récupère tous les tubes standards
     * @returns {Array<TubeStandard>} Liste des tubes
     */
    getTousTubes() {
        return this.tubes;
    }

    /**
     * Filtre les tubes par norme
     * @param {string} norme - La norme à filtrer (ex: "NF", "EN 1057")
     * @returns {Array<TubeStandard>} Liste des tubes filtrés
     */
    getTubesParNorme(norme) {
        return this.tubes.filter(tube => tube.norme === norme);
    }

    /**
     * Filtre les tubes par série
     * @param {string} serie - La série à filtrer (ex: "Légère", "Moyenne/Lourde")
     * @returns {Array<TubeStandard>} Liste des tubes filtrés
     */
    getTubesParSerie(serie) {
        return this.tubes.filter(tube => tube.serie === serie);
    }

    /**
     * Recherche un tube par sa désignation
     * @param {string} designation - La désignation à rechercher (ex: "1/2\"")
     * @returns {TubeStandard|null} Le tube trouvé ou null
     */
    getTubeParDesignation(designation) {
        return this.tubes.find(tube => tube.designation === designation) || null;
    }

    /**
     * Récupère les normes disponibles
     * @returns {Array<string>} Liste des normes
     */
    getNormes() {
        const normes = new Set(this.tubes.map(tube => tube.norme));
        return Array.from(normes);
    }

    /**
     * Récupère les séries disponibles
     * @returns {Array<string>} Liste des séries
     */
    getSeries() {
        const series = new Set(this.tubes.map(tube => tube.serie));
        return Array.from(series);
    }
};

// Indiquer que le module est chargé
console.log('Module tubes-standards.js chargé');
