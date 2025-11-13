/**
 * @class ProjetCintrage
 * @description Représente un projet de cintrage complet
 */
window.ProjetCintrage = class ProjetCintrage {
    /**
     * @param {string} nom - Nom du projet
     * @param {Object} parametresTube - Paramètres du tube {diametre, epaisseur, longueur}
     * @param {string} materiauId - ID du matériau sélectionné
     * @param {Array} cintrages - Liste des cintrages
     * @param {string} dateCreation - Date de création (ISO string)
     * @param {string} dateModification - Date de dernière modification (ISO string)
     */
    constructor(nom, parametresTube, materiauId, cintrages, dateCreation = null, dateModification = null) {
        this.nom = nom;
        this.parametresTube = parametresTube;
        this.materiauId = materiauId;
        this.cintrages = cintrages;
        this.dateCreation = dateCreation || new Date().toISOString();
        this.dateModification = dateModification || new Date().toISOString();
        this.version = '1.0'; // Version du format de sauvegarde
    }

    /**
     * Marque le projet comme modifié
     */
    marquerModifie() {
        this.dateModification = new Date().toISOString();
    }

    /**
     * Convertit le projet en objet sérialisable
     * @returns {Object} Objet JSON
     */
    toJSON() {
        return {
            nom: this.nom,
            parametresTube: this.parametresTube,
            materiauId: this.materiauId,
            cintrages: this.cintrages,
            dateCreation: this.dateCreation,
            dateModification: this.dateModification,
            version: this.version
        };
    }

    /**
     * Crée un projet à partir d'un objet JSON
     * @param {Object} json - Objet JSON
     * @returns {ProjetCintrage} Instance de ProjetCintrage
     */
    static fromJSON(json) {
        return new ProjetCintrage(
            json.nom,
            json.parametresTube,
            json.materiauId,
            json.cintrages,
            json.dateCreation,
            json.dateModification
        );
    }
};

/**
 * @class GestionnaireProjets
 * @description Gère la sauvegarde et le chargement des projets dans localStorage
 */
window.GestionnaireProjets = class GestionnaireProjets {
    constructor() {
        this.CLE_PROJETS = 'cintrage_projets';
        this.CLE_PROJET_ACTUEL = 'cintrage_projet_actuel';
        this.CLE_AUTOSAVE = 'cintrage_autosave';
    }

    /**
     * Sauvegarde un projet dans localStorage
     * @param {ProjetCintrage} projet - Le projet à sauvegarder
     * @returns {boolean} true si succès, false sinon
     */
    sauvegarderProjet(projet) {
        try {
            projet.marquerModifie();

            const projets = this.listerProjets();
            const index = projets.findIndex(p => p.nom === projet.nom);

            if (index >= 0) {
                // Remplacer le projet existant
                projets[index] = projet;
            } else {
                // Ajouter un nouveau projet
                projets.push(projet);
            }

            // Sauvegarder dans localStorage
            localStorage.setItem(this.CLE_PROJETS, JSON.stringify(projets));

            return true;
        } catch (e) {
            console.error('Erreur lors de la sauvegarde du projet:', e);
            return false;
        }
    }

    /**
     * Charge un projet depuis localStorage
     * @param {string} nomProjet - Nom du projet à charger
     * @returns {ProjetCintrage|null} Le projet chargé ou null
     */
    chargerProjet(nomProjet) {
        try {
            const projets = this.listerProjets();
            const projetData = projets.find(p => p.nom === nomProjet);

            if (projetData) {
                return ProjetCintrage.fromJSON(projetData);
            }

            return null;
        } catch (e) {
            console.error('Erreur lors du chargement du projet:', e);
            return null;
        }
    }

    /**
     * Liste tous les projets sauvegardés
     * @returns {Array<Object>} Liste des projets (format JSON)
     */
    listerProjets() {
        try {
            const data = localStorage.getItem(this.CLE_PROJETS);
            if (data) {
                return JSON.parse(data);
            }
            return [];
        } catch (e) {
            console.error('Erreur lors de la récupération des projets:', e);
            return [];
        }
    }

    /**
     * Supprime un projet
     * @param {string} nomProjet - Nom du projet à supprimer
     * @returns {boolean} true si succès, false sinon
     */
    supprimerProjet(nomProjet) {
        try {
            const projets = this.listerProjets();
            const nouveauxProjets = projets.filter(p => p.nom !== nomProjet);

            localStorage.setItem(this.CLE_PROJETS, JSON.stringify(nouveauxProjets));

            return true;
        } catch (e) {
            console.error('Erreur lors de la suppression du projet:', e);
            return false;
        }
    }

    /**
     * Sauvegarde le projet actuel (projet temporaire en cours d'édition)
     * @param {ProjetCintrage} projet - Le projet actuel
     */
    sauvegarderProjetActuel(projet) {
        try {
            localStorage.setItem(this.CLE_PROJET_ACTUEL, JSON.stringify(projet));
        } catch (e) {
            console.error('Erreur lors de la sauvegarde du projet actuel:', e);
        }
    }

    /**
     * Charge le projet actuel (dernier projet en cours d'édition)
     * @returns {ProjetCintrage|null} Le projet actuel ou null
     */
    chargerProjetActuel() {
        try {
            const data = localStorage.getItem(this.CLE_PROJET_ACTUEL);
            if (data) {
                return ProjetCintrage.fromJSON(JSON.parse(data));
            }
            return null;
        } catch (e) {
            console.error('Erreur lors du chargement du projet actuel:', e);
            return null;
        }
    }

    /**
     * Efface le projet actuel
     */
    effacerProjetActuel() {
        try {
            localStorage.removeItem(this.CLE_PROJET_ACTUEL);
        } catch (e) {
            console.error('Erreur lors de l\'effacement du projet actuel:', e);
        }
    }

    /**
     * Sauvegarde automatique (autosave)
     * @param {ProjetCintrage} projet - Le projet à sauvegarder
     */
    autosave(projet) {
        try {
            localStorage.setItem(this.CLE_AUTOSAVE, JSON.stringify(projet));
        } catch (e) {
            console.error('Erreur lors de l\'autosave:', e);
        }
    }

    /**
     * Charge l'autosave
     * @returns {ProjetCintrage|null} Le projet autosave ou null
     */
    chargerAutosave() {
        try {
            const data = localStorage.getItem(this.CLE_AUTOSAVE);
            if (data) {
                return ProjetCintrage.fromJSON(JSON.parse(data));
            }
            return null;
        } catch (e) {
            console.error('Erreur lors du chargement de l\'autosave:', e);
            return null;
        }
    }

    /**
     * Efface l'autosave
     */
    effacerAutosave() {
        try {
            localStorage.removeItem(this.CLE_AUTOSAVE);
        } catch (e) {
            console.error('Erreur lors de l\'effacement de l\'autosave:', e);
        }
    }

    /**
     * Exporte un projet en fichier JSON téléchargeable
     * @param {ProjetCintrage} projet - Le projet à exporter
     * @param {string} nomFichier - Nom du fichier (sans extension)
     */
    exporterProjetJSON(projet, nomFichier) {
        try {
            const json = JSON.stringify(projet.toJSON(), null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            saveAs(blob, `${nomFichier}.json`);
        } catch (e) {
            console.error('Erreur lors de l\'export JSON:', e);
            throw e;
        }
    }

    /**
     * Importe un projet depuis un fichier JSON
     * @param {File} file - Fichier JSON à importer
     * @returns {Promise<ProjetCintrage>} Promise qui résout avec le projet
     */
    importerProjetJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    const projet = ProjetCintrage.fromJSON(json);
                    resolve(projet);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Erreur lors de la lecture du fichier'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Vérifie si le localStorage est disponible
     * @returns {boolean} true si disponible
     */
    isLocalStorageDisponible() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
};

// Indiquer que le module est chargé
console.log('Module projets.js chargé');
