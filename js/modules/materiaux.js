/**
 * @class Materiau
 * @description Représente un matériau avec ses propriétés de cintrage
 */
window.Materiau = class Materiau {
    /**
     * @param {string} nom - Nom du matériau
     * @param {number} coefficientRetourElastique - Coefficient de compensation du retour élastique
     * @param {number} facteurRayonMin - Multiplicateur pour le rayon minimum (× diamètre)
     * @param {string} description - Description du matériau
     */
    constructor(nom, coefficientRetourElastique, facteurRayonMin, description) {
        this.nom = nom;
        this.coefficientRetourElastique = coefficientRetourElastique;
        this.facteurRayonMin = facteurRayonMin;
        this.description = description;
    }
};

/**
 * @class BibliothequeMateriaux
 * @description Gère la bibliothèque de matériaux disponibles
 */
window.BibliothequeMateriaux = class BibliothequeMateriaux {
    constructor() {
        this.materiaux = this.initialiserMateriaux();
    }

    /**
     * Initialise la bibliothèque de matériaux avec des valeurs standards
     * @returns {Map<string, Materiau>} Map des matériaux disponibles
     */
    initialiserMateriaux() {
        const materiaux = new Map();

        // Acier doux / Acier au carbone
        materiaux.set('acier', new Materiau(
            'Acier doux',
            0.975,  // Retour élastique modéré
            20,     // Rayon min = 20× diamètre
            'Acier au carbone standard, bon compromis entre résistance et facilité de cintrage'
        ));

        // Inox 304
        materiaux.set('inox304', new Materiau(
            'Inox 304',
            0.965,  // Retour élastique plus important
            22,     // Rayon min = 22× diamètre
            'Acier inoxydable austénitique, résistant à la corrosion, plus difficile à cintrer'
        ));

        // Inox 316
        materiaux.set('inox316', new Materiau(
            'Inox 316',
            0.960,  // Retour élastique encore plus important
            24,     // Rayon min = 24× diamètre
            'Acier inoxydable avec molybdène, excellente résistance à la corrosion, cintrage délicat'
        ));

        // Cuivre
        materiaux.set('cuivre', new Materiau(
            'Cuivre',
            0.985,  // Faible retour élastique
            15,     // Rayon min = 15× diamètre
            'Métal ductile, facile à cintrer, faible retour élastique'
        ));

        // Aluminium
        materiaux.set('aluminium', new Materiau(
            'Aluminium',
            0.980,  // Retour élastique faible
            18,     // Rayon min = 18× diamètre
            'Léger et ductile, attention aux risques de fissuration sur rayons serrés'
        ));

        // Laiton
        materiaux.set('laiton', new Materiau(
            'Laiton',
            0.982,  // Retour élastique faible
            16,     // Rayon min = 16× diamètre
            'Alliage cuivre-zinc, bonne ductilité, cintrage facile'
        ));

        // PER (Polyéthylène réticulé)
        materiaux.set('per', new Materiau(
            'PER',
            0.995,  // Très faible retour élastique
            10,     // Rayon min = 10× diamètre (très flexible)
            'Tube plastique, très flexible, retour élastique négligeable'
        ));

        // Acier galvanisé
        materiaux.set('acier_galva', new Materiau(
            'Acier galvanisé',
            0.970,  // Retour élastique modéré
            21,     // Rayon min = 21× diamètre
            'Acier avec revêtement zinc, protection contre la corrosion'
        ));

        return materiaux;
    }

    /**
     * Récupère un matériau par son ID
     * @param {string} id - Identifiant du matériau
     * @returns {Materiau|null} Le matériau ou null si non trouvé
     */
    getMateriau(id) {
        return this.materiaux.get(id) || null;
    }

    /**
     * Récupère tous les matériaux disponibles
     * @returns {Array<{id: string, materiau: Materiau}>} Liste des matériaux
     */
    getTousMateriaux() {
        const liste = [];
        for (const [id, materiau] of this.materiaux.entries()) {
            liste.push({ id, materiau });
        }
        return liste;
    }

    /**
     * Récupère le matériau par défaut (acier)
     * @returns {Materiau} Le matériau acier
     */
    getMateriauParDefaut() {
        return this.materiaux.get('acier');
    }
};

// Indiquer que le module est chargé
console.log('Module materiaux.js chargé');
