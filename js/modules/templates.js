/**
 * @class TemplateForm e
 * @description Représente un template de forme prédéfini
 */
window.TemplateForme = class TemplateForme {
    /**
     * @param {string} nom - Nom du template
     * @param {string} description - Description du template
     * @param {Function} generer - Fonction qui génère les cintrages
     */
    constructor(nom, description, generer) {
        this.nom = nom;
        this.description = description;
        this.generer = generer;
    }
};

/**
 * @class BibliothequeTemplates
 * @description Gère les templates de formes prédéfinis
 */
window.BibliothequeTemplates = class BibliothequeTemplates {
    constructor() {
        this.templates = this.initialiserTemplates();
    }

    /**
     * Initialise la bibliothèque de templates
     * @returns {Map<string, TemplateForme>} Map des templates
     */
    initialiserTemplates() {
        const templates = new Map();

        // Template en U (2 cintrages à 90°)
        templates.set('u', new TemplateForme(
            'Forme en U',
            'Deux cintrages à 90° pour créer une forme en U',
            (params) => {
                const { longueurBranche = 200, espacementBranches = 100, rayonCintrage = 50 } = params;

                return [
                    { position: longueurBranche, angle: 90, rayon: rayonCintrage },
                    { position: longueurBranche + espacementBranches, angle: 90, rayon: rayonCintrage }
                ];
            }
        ));

        // Template en Z (2 cintrages à 90° opposés)
        templates.set('z', new TemplateForme(
            'Forme en Z',
            'Deux cintrages à 90° en sens opposés pour créer une forme en Z',
            (params) => {
                const { longueurBranche = 200, espacementBranches = 100, rayonCintrage = 50 } = params;

                return [
                    { position: longueurBranche, angle: 90, rayon: rayonCintrage },
                    { position: longueurBranche + espacementBranches, angle: -90, rayon: rayonCintrage }
                ];
            }
        ));

        // Template en S (3 cintrages alternés)
        templates.set('s', new TemplateForme(
            'Forme en S',
            'Trois cintrages alternés pour créer une forme en S',
            (params) => {
                const { longueurSegment = 150, angleCintrage = 60, rayonCintrage = 50 } = params;

                return [
                    { position: longueurSegment, angle: angleCintrage, rayon: rayonCintrage },
                    { position: longueurSegment * 2, angle: -angleCintrage * 2, rayon: rayonCintrage },
                    { position: longueurSegment * 3, angle: angleCintrage, rayon: rayonCintrage }
                ];
            }
        ));

        // Template escalier (4 cintrages pour montée/descente)
        templates.set('escalier', new TemplateForme(
            'Forme escalier',
            'Quatre cintrages alternés pour créer un effet escalier',
            (params) => {
                const { hauteurMarche = 100, profondeurMarche = 80, nombreMarches = 3, rayonCintrage = 40 } = params;
                const cintrages = [];

                for (let i = 0; i < nombreMarches; i++) {
                    const basePos = (hauteurMarche + profondeurMarche) * i;
                    cintrages.push(
                        { position: basePos + hauteurMarche, angle: 90, rayon: rayonCintrage },
                        { position: basePos + hauteurMarche + profondeurMarche, angle: 90, rayon: rayonCintrage }
                    );
                }

                return cintrages;
            }
        ));

        // Template coude simple (1 cintrage)
        templates.set('coude', new TemplateForme(
            'Coude simple',
            'Un seul cintrage pour créer un coude',
            (params) => {
                const { positionCintrage = 200, angleCintrage = 90, rayonCintrage = 50 } = params;

                return [
                    { position: positionCintrage, angle: angleCintrage, rayon: rayonCintrage }
                ];
            }
        ));

        // Template courbe douce (3 petits cintrages)
        templates.set('courbe', new TemplateForme(
            'Courbe douce',
            'Trois petits cintrages pour créer une courbe progressive',
            (params) => {
                const { debut = 150, anglePetit = 20, espacement = 80, rayonCintrage = 80 } = params;

                return [
                    { position: debut, angle: anglePetit, rayon: rayonCintrage },
                    { position: debut + espacement, angle: anglePetit, rayon: rayonCintrage },
                    { position: debut + espacement * 2, angle: anglePetit, rayon: rayonCintrage }
                ];
            }
        ));

        // Template angle droit (1 cintrage à 90°)
        templates.set('angle_droit', new TemplateForme(
            'Angle droit',
            'Un cintrage à 90° pour créer un angle droit',
            (params) => {
                const { positionCintrage = 200, rayonCintrage = 50 } = params;

                return [
                    { position: positionCintrage, angle: 90, rayon: rayonCintrage }
                ];
            }
        ));

        // Template boucle (4 cintrages à 90°)
        templates.set('boucle', new TemplateForme(
            'Boucle fermée',
            'Quatre cintrages à 90° pour créer une boucle rectangulaire',
            (params) => {
                const { cote1 = 150, cote2 = 100, rayonCintrage = 40 } = params;

                return [
                    { position: cote1, angle: 90, rayon: rayonCintrage },
                    { position: cote1 + cote2, angle: 90, rayon: rayonCintrage },
                    { position: cote1 + cote2 + cote1, angle: 90, rayon: rayonCintrage },
                    { position: cote1 + cote2 + cote1 + cote2, angle: 90, rayon: rayonCintrage }
                ];
            }
        ));

        return templates;
    }

    /**
     * Récupère un template par son ID
     * @param {string} id - Identifiant du template
     * @returns {TemplateForme|null} Le template ou null
     */
    getTemplate(id) {
        return this.templates.get(id) || null;
    }

    /**
     * Récupère tous les templates
     * @returns {Array<{id: string, template: TemplateForme}>} Liste des templates
     */
    getTousTemplates() {
        const liste = [];
        for (const [id, template] of this.templates.entries()) {
            liste.push({ id, template });
        }
        return liste;
    }

    /**
     * Applique un template avec des paramètres personnalisés
     * @param {string} id - Identifiant du template
     * @param {Object} params - Paramètres de personnalisation
     * @returns {Array<Object>} Liste des cintrages générés
     */
    appliquerTemplate(id, params = {}) {
        const template = this.getTemplate(id);
        if (!template) {
            throw new Error(`Template "${id}" non trouvé`);
        }

        return template.generer(params);
    }
};

// Indiquer que le module est chargé
console.log('Module templates.js chargé');
