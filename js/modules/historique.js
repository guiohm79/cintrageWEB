/**
 * @class ActionHistorique
 * @description Représente une action dans l'historique
 */
window.ActionHistorique = class ActionHistorique {
    /**
     * @param {string} type - Type d'action ('ajouter', 'supprimer', 'modifier_tube', 'reinitialiser')
     * @param {Object} avant - État avant l'action
     * @param {Object} apres - État après l'action
     */
    constructor(type, avant, apres) {
        this.type = type;
        this.avant = avant;
        this.apres = apres;
        this.timestamp = Date.now();
    }
};

/**
 * @class GestionnaireHistorique
 * @description Gère l'historique des actions avec annuler/refaire
 */
window.GestionnaireHistorique = class GestionnaireHistorique {
    constructor(tailleMax = 50) {
        this.pile = []; // Pile des actions
        this.indexCourant = -1; // Index de l'action courante
        this.tailleMax = tailleMax; // Taille maximale de l'historique
        this.enCoursDApplication = false; // Flag pour éviter de créer des actions pendant annuler/refaire
    }

    /**
     * Ajoute une action à l'historique
     * @param {ActionHistorique} action - L'action à ajouter
     */
    ajouterAction(action) {
        // Ne pas ajouter si on est en train d'appliquer une action (annuler/refaire)
        if (this.enCoursDApplication) {
            return;
        }

        // Supprimer toutes les actions après l'index courant
        this.pile = this.pile.slice(0, this.indexCourant + 1);

        // Ajouter la nouvelle action
        this.pile.push(action);

        // Limiter la taille de la pile
        if (this.pile.length > this.tailleMax) {
            this.pile.shift(); // Retirer la plus ancienne
        } else {
            this.indexCourant++;
        }

        console.log(`Action ajoutée: ${action.type}, index: ${this.indexCourant}`);
    }

    /**
     * Vérifie s'il est possible d'annuler
     * @returns {boolean} true si annulation possible
     */
    peutAnnuler() {
        return this.indexCourant >= 0;
    }

    /**
     * Vérifie s'il est possible de refaire
     * @returns {boolean} true si refaire possible
     */
    peutRefaire() {
        return this.indexCourant < this.pile.length - 1;
    }

    /**
     * Annule la dernière action
     * @returns {ActionHistorique|null} L'action annulée ou null
     */
    annuler() {
        if (!this.peutAnnuler()) {
            console.log('Aucune action à annuler');
            return null;
        }

        const action = this.pile[this.indexCourant];
        this.indexCourant--;

        console.log(`Annulation de l'action: ${action.type}`);
        return action;
    }

    /**
     * Refait la dernière action annulée
     * @returns {ActionHistorique|null} L'action refaite ou null
     */
    refaire() {
        if (!this.peutRefaire()) {
            console.log('Aucune action à refaire');
            return null;
        }

        this.indexCourant++;
        const action = this.pile[this.indexCourant];

        console.log(`Refaire l'action: ${action.type}`);
        return action;
    }

    /**
     * Réinitialise l'historique
     */
    reinitialiser() {
        this.pile = [];
        this.indexCourant = -1;
        console.log('Historique réinitialisé');
    }

    /**
     * Active le mode application (pour éviter de créer des actions pendant annuler/refaire)
     */
    activerModeApplication() {
        this.enCoursDApplication = true;
    }

    /**
     * Désactive le mode application
     */
    desactiverModeApplication() {
        this.enCoursDApplication = false;
    }

    /**
     * Obtient une description de l'historique
     * @returns {string} Description de l'historique
     */
    getDescription() {
        if (this.pile.length === 0) {
            return 'Historique vide';
        }

        let desc = `Historique (${this.pile.length} actions, position: ${this.indexCourant + 1}):\n`;
        this.pile.forEach((action, index) => {
            const prefix = index === this.indexCourant ? '→ ' : '  ';
            desc += `${prefix}${index + 1}. ${action.type}\n`;
        });

        return desc;
    }
};

// Indiquer que le module est chargé
console.log('Module historique.js chargé');
