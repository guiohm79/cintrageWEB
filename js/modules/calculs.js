/**
 * @class ParametresTube
 * @description Classe représentant les paramètres d'un tube
 */
window.ParametresTube = class ParametresTube {
    /**
     * @param {number} diametre - Diamètre extérieur du tube en mm
     * @param {number} epaisseur - Épaisseur de la paroi du tube en mm
     * @param {number} longueur - Longueur totale du tube en mm
     */
    constructor(diametre, epaisseur, longueur) {
        this.diametre = diametre;
        this.epaisseur = epaisseur;
        this.longueur = longueur;
    }
};

/**
 * @class ParametresCintrage
 * @description Classe représentant les paramètres d'un cintrage
 */
window.ParametresCintrage = class ParametresCintrage {
    /**
     * @param {number} angle - L'angle de cintrage en degrés
     * @param {number} rayon - Le rayon de cintrage intérieur en mm
     * @param {number} position - Distance depuis le début du tube jusqu'au point de cintrage en mm
     */
    constructor(angle, rayon, position) {
        this.angle = angle;
        this.rayon = rayon;
        this.position = position;
    }
};

/**
 * @class CalculMultiCintrage
 * @description Gère les multiples cintrages sur un tube
 */
window.CalculMultiCintrage = class CalculMultiCintrage {
    constructor() {
        this.cintrages = [];
    }

    /**
     * Ajoute un nouveau cintrage à la liste
     * @param {ParametresCintrage} params - Paramètres du cintrage à ajouter
     * @throws {Error} Si les cintrages sont trop proches
     */
    ajouterCintrage(params) {
        // Vérifier que la nouvelle position est valide par rapport aux cintrages existants
        for (const cintrage of this.cintrages) {
            if (Math.abs(cintrage.position - params.position) < 10) { // minimum 10mm entre les cintrages
                throw new Error("Les cintrages sont trop proches");
            }
        }
        this.cintrages.push(params);
        // Trier par position
        this.cintrages.sort((a, b) => a.position - b.position);
    }

    /**
     * Supprime un cintrage de la liste
     * @param {number} index - Index du cintrage à supprimer
     */
    supprimerCintrage(index) {
        if (index >= 0 && index < this.cintrages.length) {
            this.cintrages.splice(index, 1);
        }
    }
};

/**
 * @class CalculateurCintrage
 * @description Classe principale pour calculer les paramètres et points d'un tube cintré
 */
window.CalculateurCintrage = class CalculateurCintrage {
    constructor() {
        this.coefficientRetourElastique = 0.975; // Facteur de correction pour le retour élastique (valeur par défaut)
        this.facteurRayonMin = 20; // Facteur pour le rayon minimum (par défaut)
        this.multiCintrage = new CalculMultiCintrage();
        this.materiau = null; // Matériau actuellement sélectionné
    }

    /**
     * Définit le matériau et met à jour les coefficients
     * @param {Materiau} materiau - Le matériau à utiliser
     */
    setMateriau(materiau) {
        this.materiau = materiau;
        if (materiau) {
            this.coefficientRetourElastique = materiau.coefficientRetourElastique;
            this.facteurRayonMin = materiau.facteurRayonMin;
        } else {
            // Valeurs par défaut (acier)
            this.coefficientRetourElastique = 0.975;
            this.facteurRayonMin = 20;
        }
    }

    /**
     * Calcule les points de contrôle pour dessiner le tube cintré
     * @param {ParametresTube} paramsTube - Paramètres du tube
     * @param {ParametresCintrage} [paramsCintrage=null] - Paramètres d'un cintrage unique (facultatif)
     * @returns {Array<Array<number>>} Liste de points [x, y] représentant le tube
     */
    calculerPointsTube(paramsTube, paramsCintrage = null) {
        if (paramsCintrage) {
            // Mode cintrage unique
            return this._calculerPointsCintrageUnique(paramsTube, paramsCintrage);
        } else {
            // Mode multi-cintrage
            return this._calculerPointsMultiCintrage(paramsTube);
        }
    }

    /**
     * Calcule les points pour un cintrage unique
     * @private
     * @param {ParametresTube} paramsTube - Paramètres du tube
     * @param {ParametresCintrage} paramsCintrage - Paramètres du cintrage
     * @returns {Array<Array<number>>} Liste de points [x, y]
     */
    _calculerPointsCintrageUnique(paramsTube, paramsCintrage) {
        const points = [];
        let xCourant = 0;
        let yCourant = 0;
        let angleCourant = 0; // en radians, 0 = horizontal vers la droite

        // Point de départ
        points.push([xCourant, yCourant]);

        // Segment droit avant le cintrage
        if (paramsCintrage.position > 0) {
            xCourant = paramsCintrage.position;
            points.push([xCourant, yCourant]);
        }

        // Calcul de l'arc de cintrage
        const angleRad = paramsCintrage.angle * Math.PI / 180;
        const rayonEffectif = paramsCintrage.rayon / this.coefficientRetourElastique;

        // Points de l'arc
        const nbPoints = 40; // Plus de points pour un arc plus lisse

        // Centre de rotation pour l'arc
        const centreX = xCourant - rayonEffectif * Math.sin(angleCourant);
        const centreY = yCourant + rayonEffectif * Math.cos(angleCourant);

        for (let j = 0; j <= nbPoints; j++) {
            const t = j / nbPoints;
            const angleArc = angleRad * t;

            // Rotation autour du centre
            const x = centreX + rayonEffectif * Math.sin(angleCourant + angleArc);
            const y = centreY - rayonEffectif * Math.cos(angleCourant + angleArc);
            points.push([x, y]);
        }

        // Mise à jour de la position finale
        xCourant = points[points.length - 1][0];
        yCourant = points[points.length - 1][1];
        angleCourant += angleRad;

        // Segment final
        const longueurRestante = paramsTube.longueur - paramsCintrage.position;
        if (longueurRestante > 0) {
            const xFinal = xCourant + longueurRestante * Math.cos(angleCourant);
            const yFinal = yCourant + longueurRestante * Math.sin(angleCourant);
            points.push([xFinal, yFinal]);
        }

        return points;
    }

    /**
     * Calcule les points pour des cintrages multiples
     * @private
     * @param {ParametresTube} paramsTube - Paramètres du tube
     * @returns {Array<Array<number>>} Liste de points [x, y]
     */
    _calculerPointsMultiCintrage(paramsTube) {
        if (!this.multiCintrage.cintrages.length) {
            // Si pas de cintrage, retourner un tube droit
            return [[0, 0], [paramsTube.longueur, 0]];
        }

        const points = [];
        let xCourant = 0;
        let yCourant = 0;
        let angleCourant = 0; // en radians, 0 = horizontal vers la droite

        // Point de départ
        points.push([xCourant, yCourant]);

        for (let i = 0; i < this.multiCintrage.cintrages.length; i++) {
            const cintrage = this.multiCintrage.cintrages[i];

            // Segment droit jusqu'au point de cintrage
            const distanceSegment = cintrage.position - (i === 0 ? 0 : this.multiCintrage.cintrages[i - 1].position);
            if (distanceSegment > 0) {
                xCourant += distanceSegment * Math.cos(angleCourant);
                yCourant += distanceSegment * Math.sin(angleCourant);
                points.push([xCourant, yCourant]);
            }

            // Calcul de l'arc de cintrage
            const angleRad = cintrage.angle * Math.PI / 180;
            const rayonEffectif = cintrage.rayon / this.coefficientRetourElastique;
            
            // Points de l'arc
            const nbPoints = 40; // Plus de points pour un arc plus lisse
            
            // Déterminer si le cintrage est vers la gauche (angle négatif) ou vers la droite (angle positif)
            const sensHoraire = angleRad < 0;
            const angleRadAbs = Math.abs(angleRad);
            
            // Centre de rotation pour l'arc - différent selon le sens du cintrage
            let centreX, centreY;
            
            if (sensHoraire) {
                // Cintrage vers la droite (sens horaire) - angle négatif
                centreX = xCourant + rayonEffectif * Math.sin(angleCourant);
                centreY = yCourant - rayonEffectif * Math.cos(angleCourant);
            } else {
                // Cintrage vers la gauche (sens anti-horaire) - angle positif
                centreX = xCourant - rayonEffectif * Math.sin(angleCourant);
                centreY = yCourant + rayonEffectif * Math.cos(angleCourant);
            }
            
            for (let j = 0; j <= nbPoints; j++) {
                const t = j / nbPoints;
                const angleArc = angleRadAbs * t;
                
                // Rotation autour du centre - direction dépend du sens du cintrage
                let x, y;
                
                if (sensHoraire) {
                    // Sens horaire (vers la droite)
                    x = centreX - rayonEffectif * Math.sin(angleCourant - angleArc);
                    y = centreY + rayonEffectif * Math.cos(angleCourant - angleArc);
                } else {
                    // Sens anti-horaire (vers la gauche)
                    x = centreX + rayonEffectif * Math.sin(angleCourant + angleArc);
                    y = centreY - rayonEffectif * Math.cos(angleCourant + angleArc);
                }
                
                points.push([x, y]);
            }

            // Mise à jour de la position et de l'angle
            xCourant = points[points.length - 1][0];
            yCourant = points[points.length - 1][1];
            
            // L'angle courant est toujours mis à jour avec la valeur absolue
            // mais dans la direction appropriée
            if (angleRad < 0) {
                angleCourant -= Math.abs(angleRad); // Rotation dans le sens horaire
            } else {
                angleCourant += angleRad; // Rotation dans le sens anti-horaire
            }
        }

        // Segment final
        const longueurRestante = paramsTube.longueur - (this.multiCintrage.cintrages.length ? this.multiCintrage.cintrages[this.multiCintrage.cintrages.length - 1].position : 0);
        if (longueurRestante > 0) {
            const xFinal = xCourant + longueurRestante * Math.cos(angleCourant);
            const yFinal = yCourant + longueurRestante * Math.sin(angleCourant);
            points.push([xFinal, yFinal]);
        }

        return points;
    }

    /**
     * Calcule la longueur totale développée nécessaire pour le tube
     * @param {ParametresTube} paramsTube - Paramètres du tube
     * @param {ParametresCintrage} [paramsCintrage=null] - Paramètres d'un cintrage unique (facultatif)
     * @returns {number} Longueur développée en mm
     */
    calculerLongueurDeveloppee(paramsTube, paramsCintrage = null) {
        if (paramsCintrage) {
            // Mode cintrage unique
            const angleRad = paramsCintrage.angle * Math.PI / 180;
            const longueurArc = angleRad * paramsCintrage.rayon;
            return paramsTube.longueur + (longueurArc - 2 * paramsCintrage.rayon * Math.sin(angleRad / 2));
        } else {
            // Mode multi-cintrage
            let longueurTotale = paramsTube.longueur;
            for (const cintrage of this.multiCintrage.cintrages) {
                const angleRad = cintrage.angle * Math.PI / 180;
                const longueurArc = angleRad * cintrage.rayon;
                longueurTotale += (longueurArc - 2 * cintrage.rayon * Math.sin(angleRad / 2));
            }
            return longueurTotale;
        }
    }

    /**
     * Calcule l'angle de cintrage nécessaire pour compenser le retour élastique
     * @param {number} angleDesire - Angle de cintrage désiré en degrés
     * @returns {number} Angle de cintrage à appliquer en degrés
     */
    calculerRetourElastique(angleDesire) {
        return angleDesire / this.coefficientRetourElastique;
    }

    /**
     * Calcule la valeur A à retrancher pour obtenir la dimension désirée
     * Formule générale : A = R × tan(α/2)
     * @param {number} rayon - Le rayon de cintrage
     * @param {number} angle - L'angle de cintrage en degrés
     * @returns {number} La valeur A à retrancher
     */
    calculerValeurA(rayon, angle) {
        // Utiliser la formule générale pour tous les angles
        // A = R × tan(α/2)
        const angleRad = Math.abs(angle) * Math.PI / 180;
        return rayon * Math.tan(angleRad / 2);
    }

    /**
     * Calcule le rayon minimum recommandé pour un diamètre donné
     * Formule : Rayon min = facteurRayonMin × Diamètre nominal
     * Le facteur dépend du matériau (défini par setMateriau)
     * @param {number} diametre - Diamètre du tube en mm
     * @returns {number} Rayon minimum en mm
     */
    calculerRayonMinimum(diametre) {
        return this.facteurRayonMin * diametre;
    }

    /**
     * Valide les paramètres de cintrage
     * @param {ParametresTube} paramsTube - Paramètres du tube
     * @param {ParametresCintrage} paramsCintrage - Paramètres du cintrage
     * @returns {Object} Résultat de validation {valide: boolean, avertissements: string[], erreurs: string[]}
     */
    validerCintrage(paramsTube, paramsCintrage) {
        const resultat = {
            valide: true,
            avertissements: [],
            erreurs: []
        };

        // Vérifier le rayon minimum
        const rayonMin = this.calculerRayonMinimum(paramsTube.diametre);
        if (paramsCintrage.rayon < rayonMin) {
            resultat.erreurs.push(
                `Rayon trop petit : ${paramsCintrage.rayon.toFixed(1)}mm. ` +
                `Rayon minimum recommandé : ${rayonMin.toFixed(1)}mm (20 × diamètre)`
            );
            resultat.valide = false;
        } else if (paramsCintrage.rayon < rayonMin * 1.2) {
            // Avertissement si rayon < 24× diamètre (zone limite)
            resultat.avertissements.push(
                `Rayon proche de la limite. Risque d'écrasement ou de plissage. ` +
                `Recommandé : ${(rayonMin * 1.2).toFixed(1)}mm ou plus`
            );
        }

        // Vérifier que la position est dans les limites du tube
        if (paramsCintrage.position < 0 || paramsCintrage.position > paramsTube.longueur) {
            resultat.erreurs.push(
                `Position invalide : ${paramsCintrage.position.toFixed(1)}mm. ` +
                `Doit être entre 0 et ${paramsTube.longueur.toFixed(1)}mm`
            );
            resultat.valide = false;
        }

        // Vérifier que l'angle n'est pas nul
        if (Math.abs(paramsCintrage.angle) < 0.1) {
            resultat.erreurs.push('Angle trop petit. L\'angle doit être supérieur à 0.1°');
            resultat.valide = false;
        }

        // Avertissement pour angles extrêmes
        if (Math.abs(paramsCintrage.angle) > 180) {
            resultat.avertissements.push(
                `Angle très important : ${paramsCintrage.angle.toFixed(1)}°. ` +
                `Vérifiez que c'est bien l'angle souhaité`
            );
        }

        // Vérifier l'épaisseur du tube
        if (paramsTube.epaisseur >= paramsTube.diametre / 2) {
            resultat.erreurs.push(
                `Épaisseur invalide : ${paramsTube.epaisseur.toFixed(1)}mm. ` +
                `Doit être inférieure au rayon du tube (${(paramsTube.diametre / 2).toFixed(1)}mm)`
            );
            resultat.valide = false;
        }

        return resultat;
    }
};

// Indiquer que le module est chargé
console.log('Module calculs.js chargé');