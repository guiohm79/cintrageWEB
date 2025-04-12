/**
 * @class Interface
 * @description Gère l'interface utilisateur de l'application
 */
window.Interface = class Interface {
    /**
     * @param {CalculateurCintrage} calculateur - Instance du calculateur de cintrage
     */
    constructor(calculateur) {
        console.log('Initialisation de l\'interface...');
        
        try {
            this.calculateur = calculateur;
            
            // Récupération des éléments DOM
            this.canvas = document.getElementById('visualization-canvas');
            if (!this.canvas) {
                throw new Error('Élément canvas non trouvé');
            }
            
            this.ctx = this.canvas.getContext('2d');
            this.statusBar = document.getElementById('status-bar');
            this.cintragesInfo = document.getElementById('cintrages-info');
            
            this.tooltip = document.getElementById('tooltip');
            this.modal = document.getElementById('modal');
            this.modalTitle = document.getElementById('modal-title');
            this.modalMessage = document.getElementById('modal-message');
            
            this.selectedCintrageIndex = -1;
            
            // Mise en place des écouteurs d'événements
            this.setupEventListeners();
            
            // Dessiner la grille initiale
            console.log('Dessin de la grille initiale...');
            this.dessinerGrille();
            
            // Afficher un message de bienvenue
            this.setStatus('Prêt - Entrez les paramètres et cliquez sur Simuler');
            
            console.log('Interface initialisée avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'interface:', error);
            this.afficherErreurInterface(error.message);
        }
    }
    
    /**
     * Affiche une erreur d'interface
     * @param {string} message - Message d'erreur
     */
    afficherErreurInterface(message) {
        console.error('Erreur d\'interface:', message);
        
        // Créer un élément d'erreur visible
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'absolute';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.padding = '20px';
        errorDiv.style.backgroundColor = '#ffdddd';
        errorDiv.style.border = '1px solid #f44336';
        errorDiv.style.borderRadius = '5px';
        errorDiv.style.color = '#333';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.zIndex = '1000';
        errorDiv.style.maxWidth = '80%';
        
        errorDiv.innerHTML = `
            <h3 style="color: #f44336;">Erreur d'interface</h3>
            <p>${message}</p>
            <p>Consultez la console pour plus de détails (F12).</p>
        `;
        
        // Ajouter à la page
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(errorDiv);
        } else {
            document.body.appendChild(errorDiv);
        }
    }
    
    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        console.log('Configuration des écouteurs d\'événements...');
        
        try {
            // Boutons du menu
            const btnNouveauProjet = document.getElementById('nouveau-projet');
            if (btnNouveauProjet) {
                btnNouveauProjet.addEventListener('click', (e) => {
                    console.log('Bouton Nouveau projet cliqué');
                    e.preventDefault();
                    this.reinitialiser();
                });
            } else {
                console.error('Élément nouveau-projet non trouvé');
            }
            
            const btnExporterDXF = document.getElementById('exporter-dxf');
            if (btnExporterDXF) {
                btnExporterDXF.addEventListener('click', (e) => {
                    console.log('Bouton Exporter DXF cliqué');
                    e.preventDefault();
                    this.exporterDXF();
                });
            } else {
                console.error('Élément exporter-dxf non trouvé');
            }
            
            const btnExporterSVG = document.getElementById('exporter-svg');
            if (btnExporterSVG) {
                btnExporterSVG.addEventListener('click', (e) => {
                    console.log('Bouton Exporter SVG cliqué');
                    e.preventDefault();
                    this.exporterSVG();
                });
            } else {
                console.error('Élément exporter-svg non trouvé');
            }
            
            const btnExporterPDF = document.getElementById('exporter-pdf');
            if (btnExporterPDF) {
                btnExporterPDF.addEventListener('click', (e) => {
                    console.log('Bouton Exporter PDF cliqué');
                    e.preventDefault();
                    this.exporterPDF();
                });
            } else {
                console.error('Élément exporter-pdf non trouvé');
            }

            // Boutons de gestion des cintrages
            const btnAjouter = document.getElementById('btn-ajouter');
            if (btnAjouter) {
                btnAjouter.addEventListener('click', () => {
                    console.log('Bouton Ajouter cliqué');
                    this.ajouterCintrage();
                });
            } else {
                console.error('Élément btn-ajouter non trouvé');
            }
            
            const btnSupprimer = document.getElementById('btn-supprimer');
            if (btnSupprimer) {
                btnSupprimer.addEventListener('click', () => {
                    console.log('Bouton Supprimer cliqué');
                    this.supprimerCintrage();
                });
            } else {
                console.error('Élément btn-supprimer non trouvé');
            }
            
            // Boutons d'action
            const btnSimuler = document.getElementById('btn-simuler');
            if (btnSimuler) {
                btnSimuler.addEventListener('click', () => {
                    console.log('Bouton Simuler cliqué');
                    this.simulerCintrage();
                });
            } else {
                console.error('Élément btn-simuler non trouvé');
            }
            
            const btnReinitialiser = document.getElementById('btn-reinitialiser');
            if (btnReinitialiser) {
                btnReinitialiser.addEventListener('click', () => {
                    console.log('Bouton Réinitialiser cliqué');
                    this.reinitialiser();
                });
            } else {
                console.error('Élément btn-reinitialiser non trouvé');
            }

            // Gestion des tooltips
            try {
                document.querySelectorAll('[title]').forEach(el => {
                    el.addEventListener('mouseenter', (e) => {
                        const text = e.target.getAttribute('title');
                        this.showTooltip(text, e.pageX + 10, e.pageY + 10);
                    });
                    
                    el.addEventListener('mouseleave', () => {
                        this.hideTooltip();
                    });
                });
            } catch (e) {
                console.error('Erreur lors de la configuration des tooltips:', e);
            }
            
            // Modal
            try {
                const closeBtn = document.querySelector('.close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        console.log('Bouton fermer modal cliqué');
                        this.modal.style.display = 'none';
                    });
                } else {
                    console.error('Élément .close non trouvé');
                }
            } catch (e) {
                console.error('Erreur lors de la configuration du modal:', e);
            }

            window.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    console.log('Clic en dehors du modal détecté');
                    this.modal.style.display = 'none';
                }
            });
            
            // Gestion de la sélection dans la table des cintrages
            try {
                const cintragesTree = document.getElementById('cintrages-tree');
                if (cintragesTree) {
                    cintragesTree.addEventListener('click', (e) => {
                        console.log('Clic sur la table des cintrages');
                        const tr = e.target.closest('tr');
                        if (tr && tr.parentNode === cintragesTree.querySelector('tbody')) {
                            // Enlever la sélection précédente
                            const selectedRows = cintragesTree.querySelectorAll('tr.selected');
                            selectedRows.forEach(row => row.classList.remove('selected'));
                            
                            // Ajouter la sélection actuelle
                            tr.classList.add('selected');
                            
                            // Récupérer l'index
                            const allRows = Array.from(cintragesTree.querySelectorAll('tbody tr'));
                            this.selectedCintrageIndex = allRows.indexOf(tr);
                            console.log('Cintrage sélectionné à l\'index', this.selectedCintrageIndex);
                        }
                    });
                } else {
                    console.error('Élément cintrages-tree non trouvé');
                }
            } catch (e) {
                console.error('Erreur lors de la configuration de la table des cintrages:', e);
            }
            
            console.log('Configuration des écouteurs d\'événements terminée.');
        } catch (e) {
            console.error('Erreur globale dans setupEventListeners:', e);
        }
    }
    
    /**
     * Affiche un message dans la barre de statut
     * @param {string} message - Message à afficher
     */
    setStatus(message) {
        if (this.statusBar) {
            this.statusBar.textContent = message;
        } else {
            console.error('Barre de statut non disponible');
        }
    }
    
    /**
     * Affiche un tooltip
     * @param {string} text - Texte à afficher
     * @param {number} x - Position X
     * @param {number} y - Position Y
     */
    showTooltip(text, x, y) {
        if (!this.tooltip) return;
        
        this.tooltip.textContent = text;
        this.tooltip.style.display = 'block';
        this.tooltip.style.left = x + 'px';
        this.tooltip.style.top = y + 'px';
    }
    
    /**
     * Cache le tooltip
     */
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }
    
    /**
     * Affiche une boîte de dialogue modale
     * @param {string} title - Titre de la boîte de dialogue
     * @param {string} message - Message à afficher
     */
    showModal(title, message) {
        if (!this.modal || !this.modalTitle || !this.modalMessage) {
            console.error('Éléments du modal non disponibles');
            alert(`${title}: ${message}`);
            return;
        }
        
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = message;
        this.modal.style.display = 'block';
    }
    
    /**
     * Dessine une grille sur le canvas
     */
    dessinerGrille() {
        if (!this.ctx || !this.canvas) {
            console.error('Canvas ou contexte non disponible');
            return;
        }
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.strokeStyle = '#d0d0d0';
        this.ctx.lineWidth = 1;
        
        // Dessiner les lignes verticales
        for (let i = 0; i <= width; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, height);
            this.ctx.stroke();
        }
        
        // Dessiner les lignes horizontales
        for (let i = 0; i <= height; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(width, i);
            this.ctx.stroke();
        }
    }
    
    /**
     * Met à jour la liste des cintrages dans l'interface
     */
    mettreAJourListeCintrages() {
        const tbody = document.querySelector('#cintrages-tree tbody');
        if (!tbody) {
            console.error('Élément tbody non trouvé');
            return;
        }
        
        tbody.innerHTML = '';
        
        this.calculateur.multiCintrage.cintrages.forEach(cintrage => {
            // Calculer la valeur A pour tous les angles
            const valeurA = this.calculateur.calculerValeurA(cintrage.rayon, Math.abs(cintrage.angle)).toFixed(1);
                
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cintrage.position.toFixed(1)}</td>
                <td>${cintrage.angle.toFixed(1)}</td>
                <td>${cintrage.rayon.toFixed(1)}</td>
                <td>${valeurA}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    /**
     * Ajoute un nouveau cintrage à la liste
     */
    ajouterCintrage() {
        try {
            const position = parseFloat(document.getElementById('cintrage-position').value);
            const angle = parseFloat(document.getElementById('cintrage-angle').value);
            const rayon = parseFloat(document.getElementById('cintrage-rayon').value);
            
            if (isNaN(position) || isNaN(angle) || isNaN(rayon)) {
                throw new Error('Veuillez entrer des valeurs numériques valides');
            }
            
            const paramsCintrage = new ParametresCintrage(angle, rayon, position);
            this.calculateur.multiCintrage.ajouterCintrage(paramsCintrage);
            this.mettreAJourListeCintrages();
            
            this.setStatus('Cintrage ajouté');
        } catch (e) {
            console.error('Erreur lors de l\'ajout d\'un cintrage:', e);
            this.showModal('Erreur', e.message);
        }
    }
    
    /**
     * Supprime le cintrage sélectionné
     */
    supprimerCintrage() {
        if (this.selectedCintrageIndex >= 0) {
            this.calculateur.multiCintrage.supprimerCintrage(this.selectedCintrageIndex);
            this.mettreAJourListeCintrages();
            this.selectedCintrageIndex = -1;
            this.setStatus('Cintrage supprimé');
        } else {
            this.showModal('Information', 'Veuillez sélectionner un cintrage à supprimer.');
        }
    }
    
    /**
     * Simule le cintrage avec les paramètres actuels
     */
    simulerCintrage() {
        try {
            this.setStatus('Calcul en cours...');
            
            // Récupération des paramètres du tube
            const diametre = parseFloat(document.getElementById('tube-diametre').value);
            const epaisseur = parseFloat(document.getElementById('tube-epaisseur').value);
            const longueur = parseFloat(document.getElementById('tube-longueur').value);
            
            if (isNaN(diametre) || isNaN(epaisseur) || isNaN(longueur)) {
                throw new Error('Veuillez entrer des valeurs numériques valides pour le tube');
            }
            
            const paramsTube = new ParametresTube(diametre, epaisseur, longueur);
            
            // Calcul des points du tube (mode multi-cintrage)
            const points = this.calculateur.calculerPointsTube(paramsTube);
            
            // Dessin du tube
            this.reinitialiser(false); // false pour ne pas effacer la liste des cintrages
            this.dessinerTube(points);
            
            // Préparation des informations de cintrage
            let info = "Cintrages:\n";
            
            // Informations pour chaque cintrage
            this.calculateur.multiCintrage.cintrages.forEach((cintrage, i) => {
                const angleReel = this.calculateur.calculerRetourElastique(cintrage.angle);
                const valeurA = this.calculateur.calculerValeurA(cintrage.rayon, cintrage.angle);
                
                info += `#${i+1}: pos=${cintrage.position.toFixed(0)}, `;
                info += `angle=${angleReel.toFixed(1)}°`;
                
                if (Math.abs(cintrage.angle - 90) < 0.1) {
                    info += `, A=${valeurA.toFixed(1)}mm`;
                }
                
                info += "\n";
            });
            
            // Ajout de la longueur développée totale
            const longueurDev = this.calculateur.calculerLongueurDeveloppee(paramsTube);
            info += `\nLongueur développée:\n${longueurDev.toFixed(1)} mm`;
            
            // Mise à jour des informations de cintrage
            if (this.cintragesInfo) {
                this.cintragesInfo.textContent = info;
            }
            
            this.setStatus('Simulation terminée');
        } catch (e) {
            console.error('Erreur lors de la simulation:', e);
            this.setStatus('Erreur: valeurs invalides');
            this.showModal('Erreur', 'Veuillez entrer des valeurs numériques valides');
        }
    }
    
    /**
     * Réinitialise l'application
     * @param {boolean} [tout=true] - Si true, efface aussi la liste des cintrages
     */
    reinitialiser(tout = true) {
        console.log('Réinitialisation de l\'application, tout =', tout);
        
        try {
            // Effacer le canvas et redessiner la grille
            this.dessinerGrille();
            
            if (tout) {
                // Réinitialiser les cintrages
                this.calculateur.multiCintrage.cintrages = [];
                this.mettreAJourListeCintrages();
                
                // Réinitialiser les informations
                if (this.cintragesInfo) {
                    this.cintragesInfo.textContent = '';
                }
                
                // Réinitialiser le statut
                this.setStatus('Prêt');
                
                // Réinitialiser l'index de sélection
                this.selectedCintrageIndex = -1;
            }
            
            console.log('Réinitialisation terminée');
        } catch (error) {
            console.error('Erreur lors de la réinitialisation:', error);
            this.setStatus('Erreur lors de la réinitialisation');
        }
    }
    
    /**
     * Dessine le tube sur le canvas
     * @param {Array<Array<number>>} points - Liste de points [x, y] représentant le tube
     */
    dessinerTube(points) {
        if (!points || points.length < 2 || !this.ctx || !this.canvas) {
            console.error('Points invalides ou canvas non disponible');
            return;
        }
        
        this.dessinerGrille();
        
        // Récupérer les dimensions du canvas
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Calculer les limites des points
        const xValues = points.map(p => p[0]);
        const yValues = points.map(p => p[1]);
        
        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);
        
        const largeurDessin = xMax - xMin;
        const hauteurDessin = yMax - yMin;
        
        // Calculer l'échelle pour utiliser 90% de l'espace disponible
        const echelleX = largeurDessin > 0 ? (canvasWidth * 0.9) / largeurDessin : 1;
        const echelleY = hauteurDessin > 0 ? (canvasHeight * 0.9) / hauteurDessin : 1;
        const echelle = Math.min(echelleX, echelleY);
        
        // Décalage pour centrer
        const dx = (canvasWidth - largeurDessin * echelle) / 2 - xMin * echelle;
        const dy = (canvasHeight - hauteurDessin * echelle) / 2 - yMin * echelle;
        
        // Convertir les points en coordonnées canvas
        const pointsCanvas = points.map(([x, y]) => [
            x * echelle + dx,
            y * echelle + dy
        ]);
        
        // Dessiner l'ombre portée
        this.ctx.lineWidth = 10;
        this.ctx.strokeStyle = '#90CAF9';
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(pointsCanvas[0][0] + 4, pointsCanvas[0][1] + 4);
        
        for (let i = 1; i < pointsCanvas.length; i++) {
            this.ctx.lineTo(pointsCanvas[i][0] + 4, pointsCanvas[i][1] + 4);
        }
        
        this.ctx.stroke();
        
        // Dessiner le tube principal - contour
        this.ctx.lineWidth = 10;
        this.ctx.strokeStyle = '#0D47A1';
        
        this.ctx.beginPath();
        this.ctx.moveTo(pointsCanvas[0][0], pointsCanvas[0][1]);
        
        for (let i = 1; i < pointsCanvas.length; i++) {
            this.ctx.lineTo(pointsCanvas[i][0], pointsCanvas[i][1]);
        }
        
        this.ctx.stroke();
        
        // Dessiner le tube principal - effet de brillance
        this.ctx.lineWidth = 6;
        this.ctx.strokeStyle = '#42A5F5';
        
        this.ctx.beginPath();
        this.ctx.moveTo(pointsCanvas[0][0] - 1, pointsCanvas[0][1] - 1);
        
        for (let i = 1; i < pointsCanvas.length; i++) {
            this.ctx.lineTo(pointsCanvas[i][0] - 1, pointsCanvas[i][1] - 1);
        }
        
        this.ctx.stroke();
        
        // Dessiner les points de cintrage
        this.calculateur.multiCintrage.cintrages.forEach(cintrage => {
            for (let i = 0; i < pointsCanvas.length - 1; i++) {
                const [x1, y1] = pointsCanvas[i];
                
                if (Math.abs(x1 - cintrage.position * echelle - dx) < 1) {
                    // Ombre du point
                    this.ctx.fillStyle = '#F57C00';
                    this.ctx.strokeStyle = '#E65100';
                    this.ctx.lineWidth = 2;
                    
                    this.ctx.beginPath();
                    this.ctx.arc(x1, y1, 7, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
                    
                    // Effet de brillance
                    this.ctx.fillStyle = '#FFB74D';
                    this.ctx.beginPath();
                    this.ctx.arc(x1, y1, 5, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Point central
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.beginPath();
                    this.ctx.arc(x1, y1, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    break;
                }
            }
        });
        
        // Afficher les dimensions
        this.afficherDimensions(pointsCanvas, points);
    }
    
    /**
     * Affiche les dimensions sur le dessin
     * @param {Array<Array<number>>} pointsCanvas - Points convertis aux coordonnées du canvas
     * @param {Array<Array<number>>} pointsReels - Points avec les dimensions réelles
     */
    afficherDimensions(pointsCanvas, pointsReels) {
        if (pointsCanvas.length < 2 || !this.ctx) return;
        
        // Style du texte
        this.ctx.font = '8px Arial';
        this.ctx.fillStyle = '#666666';
        
        // Dimensions réelles
        const [x0, y0] = pointsReels[0];
        const [xn, yn] = pointsReels[pointsReels.length - 1];
        const longueurReelle = Math.sqrt(Math.pow(xn - x0, 2) + Math.pow(yn - y0, 2));
        
        // Point de départ
        const [startX, startY] = pointsCanvas[0];
        this.ctx.textAlign = 'end';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText('Début', startX - 10, startY - 10);
        
        // Point final
        const [endX, endY] = pointsCanvas[pointsCanvas.length - 1];
        this.ctx.textAlign = 'start';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`Fin\n${longueurReelle.toFixed(1)}mm`, endX + 10, endY + 10);
    }
    
    /**
     * Exporte le dessin en format SVG
     */
    exporterSVG() {
        try {
            // Récupération des paramètres du tube
            const diametre = parseFloat(document.getElementById('tube-diametre').value);
            const epaisseur = parseFloat(document.getElementById('tube-epaisseur').value);
            const longueur = parseFloat(document.getElementById('tube-longueur').value);
            
            if (isNaN(diametre) || isNaN(epaisseur) || isNaN(longueur)) {
                throw new Error('Veuillez entrer des valeurs numériques valides pour le tube');
            }
            
            const paramsTube = new ParametresTube(diametre, epaisseur, longueur);
            
            // Calcul des points du tube
            const points = this.calculateur.calculerPointsTube(paramsTube);
            
            // Créer l'exporteur
            const exporteur = new ExporteurPlans();
            
            // Exporter en SVG
            exporteur.exporterSVG(points, 'tube_cintre.svg');
            
            this.setStatus('Fichier SVG exporté');
            this.showModal('Succès', 'Le fichier SVG a été créé avec succès');
        } catch (e) {
            console.error('Erreur lors de l\'export SVG:', e);
            this.setStatus('Erreur lors de l\'export SVG');
            this.showModal('Erreur', `Erreur lors de l'export SVG: ${e.message}`);
        }
    }
    
    /**
     * Exporte le dessin en format DXF
     */
    exporterDXF() {
        try {
            // Récupération des paramètres du tube
            const diametre = parseFloat(document.getElementById('tube-diametre').value);
            const epaisseur = parseFloat(document.getElementById('tube-epaisseur').value);
            const longueur = parseFloat(document.getElementById('tube-longueur').value);
            
            if (isNaN(diametre) || isNaN(epaisseur) || isNaN(longueur)) {
                throw new Error('Veuillez entrer des valeurs numériques valides pour le tube');
            }
            
            const paramsTube = new ParametresTube(diametre, epaisseur, longueur);
            
            // Calcul des points du tube
            const points = this.calculateur.calculerPointsTube(paramsTube);
            
            // Créer l'exporteur
            const exporteur = new ExporteurPlans();
            
            // Exporter en DXF
            exporteur.exporterDXF(points, 'tube_cintre.dxf');
            
            this.setStatus('Fichier DXF exporté');
            this.showModal('Succès', 'Le fichier DXF a été créé avec succès');
        } catch (e) {
            console.error('Erreur lors de l\'export DXF:', e);
            this.setStatus('Erreur lors de l\'export DXF');
            this.showModal('Erreur', `Erreur lors de l'export DXF: ${e.message}`);
        }
    }
    
    /**
     * Exporte le dessin en format PDF
     */
    exporterPDF() {
        try {
            // Récupération des paramètres du tube
            const diametre = parseFloat(document.getElementById('tube-diametre').value);
            const epaisseur = parseFloat(document.getElementById('tube-epaisseur').value);
            const longueur = parseFloat(document.getElementById('tube-longueur').value);
            
            if (isNaN(diametre) || isNaN(epaisseur) || isNaN(longueur)) {
                throw new Error('Veuillez entrer des valeurs numériques valides pour le tube');
            }
            
            const paramsTube = new ParametresTube(diametre, epaisseur, longueur);
            
            // Calcul des points du tube
            const points = this.calculateur.calculerPointsTube(paramsTube);
            
            // Créer l'exporteur
            const exporteur = new ExporteurPlans();
            
            // Récupérer la liste des cintrages
            const cintrages = this.calculateur.multiCintrage.cintrages;
            
            // Exporter en PDF avec les détails techniques
            exporteur.exporterPDF(points, 'tube_cintre.pdf', paramsTube, cintrages);
            
            this.setStatus('Fichier PDF exporté avec détails techniques');
            this.showModal('Succès', 'Le fichier PDF a été créé avec succès et inclut les détails techniques');
        } catch (e) {
            console.error('Erreur lors de l\'export PDF:', e);
            this.setStatus('Erreur lors de l\'export PDF');
            this.showModal('Erreur', `Erreur lors de l'export PDF: ${e.message}`);
        }
    }
};

// Indiquer que le module est chargé
console.log('Module interface.js chargé');