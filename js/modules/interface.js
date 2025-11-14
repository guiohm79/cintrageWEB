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

            // Initialiser les bibliothèques
            this.bibliothequeMateriaux = new BibliothequeMateriaux();
            this.bibliothequeTubes = new BibliothequeTubes();
            this.gestionnaireProjets = new GestionnaireProjets();
            this.historique = new GestionnaireHistorique(50);
            this.bibliothequeTemplates = new BibliothequeTemplates();

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
            this.autosaveTimer = null;

            // Paramètres de tri de la table
            this.triColonne = null; // Colonne actuellement triée
            this.triOrdre = 'asc'; // 'asc' ou 'desc'

            // Visualisation 3D
            this.visualization3D = null;
            this.vueActive = '2d'; // '2d' ou '3d'
            this.initialiserVisualization3D();

            // Mode édition visuelle
            this.modeEdition = false;
            this.cintrageEnDrag = null;
            this.pointSurvol = null; // Position de la souris en mode édition
            this.poignees = []; // Position des poignées de cintrage

            // Peupler les sélecteurs
            this.initialiserSelecteurs();

            // Mise en place des écouteurs d'événements
            this.setupEventListeners();

            // Mettre à jour le rayon minimum initial
            this.mettreAJourRayonMinimum();

            // Dessiner la grille initiale
            console.log('Dessin de la grille initiale...');
            this.dessinerGrille();

            // Afficher un message de bienvenue
            this.setStatus('Prêt - Entrez les paramètres et cliquez sur Simuler');

            // Démarrer l'auto-sauvegarde
            this.demarrerAutosave();

            // Restaurer l'autosave si disponible (après un court délai)
            setTimeout(() => {
                this.restaurerAutosave();
            }, 500);

            console.log('Interface initialisée avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'interface:', error);
            this.afficherErreurInterface(error.message);
        }
    }

    /**
     * Initialise la visualisation 3D
     */
    initialiserVisualization3D() {
        try {
            if (typeof Visualization3D !== 'undefined') {
                this.visualization3D = new Visualization3D('canvas-3d');
                console.log('Visualisation 3D initialisée');
            } else {
                console.warn('Visualization3D non disponible');
            }
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de la visualisation 3D:', error);
        }
    }

    /**
     * Bascule entre les vues 2D et 3D
     * @param {string} vue - 'view-2d' ou 'view-3d'
     */
    basculerVue(vue) {
        this.vueActive = vue;

        // Gérer les onglets
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.view-container').forEach(container => container.classList.remove('active'));

        if (vue === '2d') {
            document.getElementById('tab-2d').classList.add('active');
            document.getElementById('view-2d').classList.add('active');
        } else {
            document.getElementById('tab-3d').classList.add('active');
            document.getElementById('view-3d').classList.add('active');

            // Mettre à jour la vue 3D
            this.mettreAJourVue3D();
        }

        this.setStatus(`Vue ${vue.toUpperCase()} activée`);
    }

    /**
     * Met à jour la visualisation 3D avec les cintrages actuels
     */
    mettreAJourVue3D() {
        if (!this.visualization3D) return;

        const diametre = parseFloat(document.getElementById('tube-diametre').value);
        const longueur = parseFloat(document.getElementById('tube-longueur').value);
        const cintrages = this.calculateur.multiCintrage.cintrages;

        this.visualization3D.afficherTube(cintrages, diametre, longueur);
    }

    /**
     * Initialise les sélecteurs de matériaux et tubes standards
     */
    initialiserSelecteurs() {
        // Peupler le sélecteur de matériaux
        const selectMateriau = document.getElementById('tube-materiau');
        if (selectMateriau) {
            selectMateriau.innerHTML = ''; // Vider

            const materiaux = this.bibliothequeMateriaux.getTousMateriaux();
            materiaux.forEach(({ id, materiau }) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = materiau.nom;
                option.title = materiau.description;
                selectMateriau.appendChild(option);
            });

            // Sélectionner l'acier par défaut
            selectMateriau.value = 'acier';
            this.calculateur.setMateriau(this.bibliothequeMateriaux.getMateriau('acier'));
        }

        // Peupler le sélecteur de tubes standards
        const selectTube = document.getElementById('tube-standard');
        if (selectTube) {
            // L'option "Personnalisé" est déjà présente dans le HTML

            const tubes = this.bibliothequeTubes.getTousTubes();

            // Grouper par norme
            const normes = this.bibliothequeTubes.getNormes();
            normes.forEach(norme => {
                const tubesNorme = tubes.filter(tube => tube.norme === norme);

                if (tubesNorme.length > 0) {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = norme;

                    tubesNorme.forEach((tube, index) => {
                        const option = document.createElement('option');
                        option.value = tubes.indexOf(tube); // Utiliser l'index dans la liste complète
                        option.textContent = tube.getDescription();
                        optgroup.appendChild(option);
                    });

                    selectTube.appendChild(optgroup);
                }
            });
        }
    }

    /**
     * Met à jour l'affichage du rayon minimum
     */
    mettreAJourRayonMinimum() {
        const diametre = parseFloat(document.getElementById('tube-diametre').value);
        const rayonMinInfo = document.getElementById('rayon-min-info');

        if (!isNaN(diametre) && rayonMinInfo) {
            const rayonMin = this.calculateur.calculerRayonMinimum(diametre);
            rayonMinInfo.textContent = `${rayonMin.toFixed(1)} mm`;
            rayonMinInfo.style.color = '#0D47A1';
            rayonMinInfo.style.fontWeight = 'bold';
        } else if (rayonMinInfo) {
            rayonMinInfo.textContent = '-';
        }
    }

    /**
     * Gère le changement de tube standard sélectionné
     * @param {string} value - Valeur du sélecteur (index du tube ou vide pour personnalisé)
     */
    onTubeStandardChange(value) {
        if (value === '' || value === null) {
            // Mode personnalisé - ne rien faire
            this.setStatus('Mode personnalisé activé');
            return;
        }

        try {
            const index = parseInt(value);
            const tubes = this.bibliothequeTubes.getTousTubes();
            const tube = tubes[index];

            if (tube) {
                // Remplir les champs avec les valeurs du tube standard
                document.getElementById('tube-diametre').value = tube.diametreExterieur;
                document.getElementById('tube-epaisseur').value = tube.epaisseur;
                document.getElementById('cintrage-rayon').value = tube.rayonCintrageRecommande;

                // Mettre à jour le rayon minimum
                this.mettreAJourRayonMinimum();

                this.setStatus(`Tube standard sélectionné : ${tube.designation}`);
            }
        } catch (e) {
            console.error('Erreur lors de la sélection du tube standard:', e);
        }
    }

    /**
     * Gère le changement de matériau sélectionné
     * @param {string} materiauId - ID du matériau
     */
    onMateriauChange(materiauId) {
        const materiau = this.bibliothequeMateriaux.getMateriau(materiauId);

        if (materiau) {
            this.calculateur.setMateriau(materiau);
            this.mettreAJourRayonMinimum(); // Le facteur peut changer
            this.setStatus(`Matériau sélectionné : ${materiau.nom}`);

            // Afficher une info sur le matériau
            if (materiau.description) {
                setTimeout(() => {
                    this.setStatus(materiau.description);
                }, 1500);
            }
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
                    this.nouveauProjet();
                });
            } else {
                console.error('Élément nouveau-projet non trouvé');
            }

            const btnSauvegarderProjet = document.getElementById('sauvegarder-projet');
            if (btnSauvegarderProjet) {
                btnSauvegarderProjet.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.sauvegarderProjet();
                });
            }

            const btnChargerProjet = document.getElementById('charger-projet');
            if (btnChargerProjet) {
                btnChargerProjet.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.chargerProjet();
                });
            }

            const btnExporterProjetJSON = document.getElementById('exporter-projet-json');
            if (btnExporterProjetJSON) {
                btnExporterProjetJSON.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.exporterProjetJSON();
                });
            }

            const btnImporterProjetJSON = document.getElementById('importer-projet-json');
            if (btnImporterProjetJSON) {
                btnImporterProjetJSON.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.importerProjetJSON();
                });
            }

            // Boutons du menu Templates
            const templateIds = ['u', 'z', 's', 'coude', 'angle_droit', 'escalier', 'courbe', 'boucle'];
            templateIds.forEach(id => {
                const btn = document.getElementById(`template-${id}`);
                if (btn) {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.appliquerTemplate(id);
                    });
                }
            });

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

            // Gestionnaire pour le changement de tube standard
            const selectTubeStandard = document.getElementById('tube-standard');
            if (selectTubeStandard) {
                selectTubeStandard.addEventListener('change', (e) => {
                    this.onTubeStandardChange(e.target.value);
                });
            }

            // Gestionnaire pour le changement de matériau
            const selectMateriau = document.getElementById('tube-materiau');
            if (selectMateriau) {
                selectMateriau.addEventListener('change', (e) => {
                    this.onMateriauChange(e.target.value);
                });
            }

            // Gestionnaire pour le changement de diamètre (met à jour le rayon min)
            const inputDiametre = document.getElementById('tube-diametre');
            if (inputDiametre) {
                inputDiametre.addEventListener('input', () => {
                    this.mettreAJourRayonMinimum();
                });
            }

            // Onglets 2D/3D
            const tab2D = document.getElementById('tab-2d');
            if (tab2D) {
                tab2D.addEventListener('click', () => {
                    this.basculerVue('2d');
                });
            }

            const tab3D = document.getElementById('tab-3d');
            if (tab3D) {
                tab3D.addEventListener('click', () => {
                    this.basculerVue('3d');
                });
            }

            // Bouton reset caméra 3D
            const btnResetCamera = document.getElementById('btn-3d-reset');
            if (btnResetCamera) {
                btnResetCamera.addEventListener('click', () => {
                    if (this.visualization3D) {
                        this.visualization3D.reinitialiserCamera();
                        this.setStatus('Caméra 3D réinitialisée');
                    }
                });
            }

            // Bouton mode édition
            const btnModeEdition = document.getElementById('btn-mode-edition');
            if (btnModeEdition) {
                btnModeEdition.addEventListener('click', () => {
                    this.toggleModeEdition();
                });
            }

            // Événements de souris sur le canvas pour le mode édition
            this.canvas.addEventListener('mousedown', (e) => this.onCanvasMouseDown(e));
            this.canvas.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
            this.canvas.addEventListener('mouseup', (e) => this.onCanvasMouseUp(e));
            this.canvas.addEventListener('mouseleave', (e) => this.onCanvasMouseUp(e));

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
            
            // Gestion du tri de la table des cintrages
            try {
                const tableHeaders = document.querySelectorAll('#cintrages-tree th');
                tableHeaders.forEach((th, index) => {
                    th.addEventListener('click', () => {
                        this.trierTable(index);
                    });
                    // Initialiser les styles
                    th.style.cursor = 'pointer';
                    th.style.userSelect = 'none';
                });
            } catch (e) {
                console.error('Erreur lors de la configuration du tri de la table:', e);
            }
            
            // Raccourcis clavier globaux
            document.addEventListener('keydown', (e) => {
                // Ctrl+Z : Annuler
                if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    this.annuler();
                }
                // Ctrl+Y ou Ctrl+Shift+Z : Refaire
                else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
                    e.preventDefault();
                    this.refaire();
                }
                // Ctrl+S : Sauvegarder
                else if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    this.sauvegarderProjet();
                }
                // Ctrl+O : Ouvrir/Charger
                else if (e.ctrlKey && e.key === 'o') {
                    e.preventDefault();
                    this.chargerProjet();
                }
                // Ctrl+N : Nouveau projet
                else if (e.ctrlKey && e.key === 'n') {
                    e.preventDefault();
                    this.nouveauProjet();
                }
                // Ctrl+E : Exporter JSON
                else if (e.ctrlKey && e.key === 'e') {
                    e.preventDefault();
                    this.exporterProjetJSON();
                }
                // F1 : Aide
                else if (e.key === 'F1') {
                    e.preventDefault();
                    window.open('aide.html', '_blank');
                }
                // Del ou Suppr : Supprimer le cintrage sélectionné
                else if (e.key === 'Delete' || e.key === 'Del') {
                    if (this.selectedCintrageIndex >= 0) {
                        e.preventDefault();
                        this.supprimerCintrage();
                    }
                }
                // Espace : Simuler
                else if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
                    e.preventDefault();
                    this.simulerCintrage();
                }
                // A : Ajouter (si pas dans un input)
                else if (e.key === 'a' && !e.ctrlKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
                    e.preventDefault();
                    this.ajouterCintrage();
                }
            });

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

        // Créer une copie des cintrages avec leurs indices
        let cintragesToDisplay = this.calculateur.multiCintrage.cintrages.map((cintrage, index) => ({
            index,
            cintrage
        }));

        // Appliquer le tri si une colonne est sélectionnée
        if (this.triColonne !== null) {
            cintragesToDisplay.sort((a, b) => {
                let valA, valB;

                switch (this.triColonne) {
                    case 0: // Position
                        valA = a.cintrage.position;
                        valB = b.cintrage.position;
                        break;
                    case 1: // Angle
                        valA = a.cintrage.angle;
                        valB = b.cintrage.angle;
                        break;
                    case 2: // Rayon
                        valA = a.cintrage.rayon;
                        valB = b.cintrage.rayon;
                        break;
                    case 3: // Valeur A
                        valA = this.calculateur.calculerValeurA(a.cintrage.rayon, Math.abs(a.cintrage.angle));
                        valB = this.calculateur.calculerValeurA(b.cintrage.rayon, Math.abs(b.cintrage.angle));
                        break;
                    default:
                        return 0;
                }

                if (this.triOrdre === 'asc') {
                    return valA - valB;
                } else {
                    return valB - valA;
                }
            });
        }

        cintragesToDisplay.forEach(({ index, cintrage }) => {
            // Calculer la valeur A pour tous les angles
            const valeurA = this.calculateur.calculerValeurA(cintrage.rayon, Math.abs(cintrage.angle)).toFixed(1);

            const tr = document.createElement('tr');
            tr.dataset.index = index; // Stocker l'index original

            // Cellules éditables (position, angle, rayon)
            tr.innerHTML = `
                <td class="editable" data-field="position">${cintrage.position.toFixed(1)}</td>
                <td class="editable" data-field="angle">${cintrage.angle.toFixed(1)}</td>
                <td class="editable" data-field="rayon">${cintrage.rayon.toFixed(1)}</td>
                <td class="readonly">${valeurA}</td>
            `;

            // Ajouter l'événement de sélection
            tr.addEventListener('click', () => {
                // Retirer la sélection des autres lignes
                tbody.querySelectorAll('tr').forEach(row => row.classList.remove('selected'));
                tr.classList.add('selected');
                this.selectedCintrageIndex = index;
            });

            // Ajouter l'événement de double-clic pour édition inline
            tr.querySelectorAll('.editable').forEach(td => {
                td.addEventListener('dblclick', (e) => {
                    this.activerEditionInline(td, index);
                });
            });

            tbody.appendChild(tr);
        });

        // Mettre à jour les indicateurs de tri dans les en-têtes
        this.mettreAJourIndicateursTri();
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

            // Récupérer les paramètres du tube pour validation
            const diametre = parseFloat(document.getElementById('tube-diametre').value);
            const epaisseur = parseFloat(document.getElementById('tube-epaisseur').value);
            const longueur = parseFloat(document.getElementById('tube-longueur').value);

            if (isNaN(diametre) || isNaN(epaisseur) || isNaN(longueur)) {
                throw new Error('Veuillez d\'abord définir les paramètres du tube');
            }

            const paramsTube = new ParametresTube(diametre, epaisseur, longueur);
            const paramsCintrage = new ParametresCintrage(angle, rayon, position);

            // Valider le cintrage
            const validation = this.calculateur.validerCintrage(paramsTube, paramsCintrage);

            if (!validation.valide) {
                const messages = validation.erreurs.join('\n');
                throw new Error(messages);
            }

            // Afficher les avertissements s'il y en a
            if (validation.avertissements.length > 0) {
                const messages = validation.avertissements.join('\n');
                this.showModal('Avertissement', messages + '\n\nLe cintrage a été ajouté mais vérifiez ces points.');
            }

            // Capturer l'état avant
            const avant = {
                cintrages: this.calculateur.multiCintrage.cintrages.map(c => ({...c}))
            };

            this.calculateur.multiCintrage.ajouterCintrage(paramsCintrage);

            // Capturer l'état après
            const apres = {
                cintrages: this.calculateur.multiCintrage.cintrages.map(c => ({...c}))
            };

            // Enregistrer dans l'historique
            const action = new ActionHistorique('ajouter_cintrage', avant, apres);
            this.historique.ajouterAction(action);

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
            // Capturer l'état avant
            const avant = {
                cintrages: this.calculateur.multiCintrage.cintrages.map(c => ({...c})),
                indexSupprime: this.selectedCintrageIndex
            };

            this.calculateur.multiCintrage.supprimerCintrage(this.selectedCintrageIndex);

            // Capturer l'état après
            const apres = {
                cintrages: this.calculateur.multiCintrage.cintrages.map(c => ({...c}))
            };

            // Enregistrer dans l'historique
            const action = new ActionHistorique('supprimer_cintrage', avant, apres);
            this.historique.ajouterAction(action);

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
                info += `, A=${valeurA.toFixed(1)}mm`;
                info += "\n";
            });
            
            // Ajout de la longueur développée totale
            const longueurDev = this.calculateur.calculerLongueurDeveloppee(paramsTube);
            info += `\nLongueur développée:\n${longueurDev.toFixed(1)} mm`;
            
            // Mise à jour des informations de cintrage
            if (this.cintragesInfo) {
                this.cintragesInfo.textContent = info;
            }

            // Mettre à jour la vue 3D
            if (this.vueActive === '3d') {
                this.mettreAJourVue3D();
            }

            // Dessiner les poignées en mode édition
            this.dessinerPoignees();

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

    /**
     * Crée un nouveau projet (réinitialise l'application)
     */
    nouveauProjet() {
        if (this.calculateur.multiCintrage.cintrages.length > 0) {
            if (confirm('Créer un nouveau projet effacera le projet actuel. Voulez-vous continuer ?')) {
                this.reinitialiser();
                this.setStatus('Nouveau projet créé');
            }
        } else {
            this.reinitialiser();
            this.setStatus('Nouveau projet créé');
        }
    }

    /**
     * Sauvegarde le projet actuel
     */
    sauvegarderProjet() {
        try {
            const nomProjet = prompt('Nom du projet :', 'Projet ' + new Date().toLocaleDateString());

            if (!nomProjet) {
                return; // Annulé
            }

            // Récupérer l'état actuel
            const diametre = parseFloat(document.getElementById('tube-diametre').value);
            const epaisseur = parseFloat(document.getElementById('tube-epaisseur').value);
            const longueur = parseFloat(document.getElementById('tube-longueur').value);
            const materiauId = document.getElementById('tube-materiau').value;

            const parametresTube = {
                diametre,
                epaisseur,
                longueur
            };

            const cintrages = this.calculateur.multiCintrage.cintrages.map(c => ({
                angle: c.angle,
                rayon: c.rayon,
                position: c.position
            }));

            const projet = new ProjetCintrage(nomProjet, parametresTube, materiauId, cintrages);

            if (this.gestionnaireProjets.sauvegarderProjet(projet)) {
                this.setStatus(`Projet "${nomProjet}" sauvegardé`);
                this.showModal('Succès', `Le projet "${nomProjet}" a été sauvegardé avec succès.`);
            } else {
                throw new Error('Échec de la sauvegarde');
            }
        } catch (e) {
            console.error('Erreur lors de la sauvegarde:', e);
            this.showModal('Erreur', `Erreur lors de la sauvegarde : ${e.message}`);
        }
    }

    /**
     * Charge un projet sauvegardé
     */
    chargerProjet() {
        try {
            const projets = this.gestionnaireProjets.listerProjets();

            if (projets.length === 0) {
                this.showModal('Information', 'Aucun projet sauvegardé trouvé.');
                return;
            }

            // Créer une liste de choix
            let message = 'Sélectionnez un projet à charger :\n\n';
            projets.forEach((p, index) => {
                const date = new Date(p.dateModification).toLocaleString();
                message += `${index + 1}. ${p.nom} (modifié le ${date})\n`;
            });

            const choix = prompt(message + '\nEntrez le numéro du projet :');

            if (!choix) {
                return; // Annulé
            }

            const index = parseInt(choix) - 1;

            if (index < 0 || index >= projets.length) {
                throw new Error('Numéro de projet invalide');
            }

            const projet = ProjetCintrage.fromJSON(projets[index]);
            this.appliquerProjet(projet);
            this.setStatus(`Projet "${projet.nom}" chargé`);
            this.showModal('Succès', `Le projet "${projet.nom}" a été chargé avec succès.`);
        } catch (e) {
            console.error('Erreur lors du chargement:', e);
            this.showModal('Erreur', `Erreur lors du chargement : ${e.message}`);
        }
    }

    /**
     * Applique un projet chargé à l'interface
     * @param {ProjetCintrage} projet - Le projet à appliquer
     */
    appliquerProjet(projet) {
        // Réinitialiser d'abord
        this.reinitialiser();

        // Appliquer les paramètres du tube
        document.getElementById('tube-diametre').value = projet.parametresTube.diametre;
        document.getElementById('tube-epaisseur').value = projet.parametresTube.epaisseur;
        document.getElementById('tube-longueur').value = projet.parametresTube.longueur;

        // Appliquer le matériau
        document.getElementById('tube-materiau').value = projet.materiauId;
        this.onMateriauChange(projet.materiauId);

        // Appliquer les cintrages
        projet.cintrages.forEach(c => {
            const paramsCintrage = new ParametresCintrage(c.angle, c.rayon, c.position);
            this.calculateur.multiCintrage.ajouterCintrage(paramsCintrage);
        });

        this.mettreAJourListeCintrages();
        this.mettreAJourRayonMinimum();
    }

    /**
     * Exporte le projet actuel en JSON
     */
    exporterProjetJSON() {
        try {
            const nomProjet = prompt('Nom du fichier (sans extension) :', 'projet_cintrage');

            if (!nomProjet) {
                return; // Annulé
            }

            // Récupérer l'état actuel
            const diametre = parseFloat(document.getElementById('tube-diametre').value);
            const epaisseur = parseFloat(document.getElementById('tube-epaisseur').value);
            const longueur = parseFloat(document.getElementById('tube-longueur').value);
            const materiauId = document.getElementById('tube-materiau').value;

            const parametresTube = {
                diametre,
                epaisseur,
                longueur
            };

            const cintrages = this.calculateur.multiCintrage.cintrages.map(c => ({
                angle: c.angle,
                rayon: c.rayon,
                position: c.position
            }));

            const projet = new ProjetCintrage(nomProjet, parametresTube, materiauId, cintrages);
            this.gestionnaireProjets.exporterProjetJSON(projet, nomProjet);

            this.setStatus('Projet exporté en JSON');
            this.showModal('Succès', 'Le projet a été exporté avec succès.');
        } catch (e) {
            console.error('Erreur lors de l\'export JSON:', e);
            this.showModal('Erreur', `Erreur lors de l'export : ${e.message}`);
        }
    }

    /**
     * Importe un projet depuis un fichier JSON
     */
    importerProjetJSON() {
        const fileInput = document.getElementById('file-input-json');

        if (!fileInput) {
            this.showModal('Erreur', 'Élément d\'import de fichier non trouvé');
            return;
        }

        // Déclencher le sélecteur de fichier
        fileInput.click();

        // Gérer la sélection de fichier
        fileInput.onchange = async (e) => {
            try {
                const file = e.target.files[0];

                if (!file) {
                    return; // Annulé
                }

                const projet = await this.gestionnaireProjets.importerProjetJSON(file);
                this.appliquerProjet(projet);

                this.setStatus(`Projet "${projet.nom}" importé`);
                this.showModal('Succès', `Le projet "${projet.nom}" a été importé avec succès.`);

                // Réinitialiser l'input
                fileInput.value = '';
            } catch (e) {
                console.error('Erreur lors de l\'import:', e);
                this.showModal('Erreur', `Erreur lors de l'import : ${e.message}`);
                fileInput.value = '';
            }
        };
    }

    /**
     * Applique un template de forme
     * @param {string} templateId - ID du template à appliquer
     */
    appliquerTemplate(templateId) {
        try {
            const template = this.bibliothequeTemplates.getTemplate(templateId);

            if (!template) {
                throw new Error(`Template "${templateId}" non trouvé`);
            }

            // Demander confirmation si il y a déjà des cintrages
            if (this.calculateur.multiCintrage.cintrages.length > 0) {
                if (!confirm(`Appliquer le template "${template.nom}" va effacer les cintrages actuels. Continuer ?`)) {
                    return;
                }
            }

            // Réinitialiser les cintrages
            this.calculateur.multiCintrage.cintrages = [];

            // Générer les cintrages du template avec paramètres par défaut
            const cintrages = this.bibliothequeTemplates.appliquerTemplate(templateId);

            // Récupérer les paramètres du tube pour validation
            const diametre = parseFloat(document.getElementById('tube-diametre').value);
            const epaisseur = parseFloat(document.getElementById('tube-epaisseur').value);
            const longueur = parseFloat(document.getElementById('tube-longueur').value);
            const paramsTube = new ParametresTube(diametre, epaisseur, longueur);

            // Vérifier la longueur du tube
            const positionMax = Math.max(...cintrages.map(c => c.position));
            if (positionMax > longueur) {
                // Ajuster automatiquement la longueur du tube
                document.getElementById('tube-longueur').value = Math.ceil(positionMax * 1.2);
                this.showModal('Information', `La longueur du tube a été ajustée à ${Math.ceil(positionMax * 1.2)}mm pour accueillir le template.`);
            }

            // Ajouter tous les cintrages
            cintrages.forEach(c => {
                const paramsCintrage = new ParametresCintrage(c.angle, c.rayon, c.position);
                try {
                    this.calculateur.multiCintrage.ajouterCintrage(paramsCintrage);
                } catch (e) {
                    console.error('Erreur lors de l\'ajout du cintrage du template:', e);
                }
            });

            // Réinitialiser l'historique
            this.historique.reinitialiser();

            this.mettreAJourListeCintrages();
            this.setStatus(`Template "${template.nom}" appliqué (${cintrages.length} cintrages)`);

            // Simuler automatiquement pour visualiser
            setTimeout(() => {
                this.simulerCintrage();
            }, 200);
        } catch (e) {
            console.error('Erreur lors de l\'application du template:', e);
            this.showModal('Erreur', `Erreur lors de l'application du template : ${e.message}`);
        }
    }

    /**
     * Annule la dernière action
     */
    annuler() {
        const action = this.historique.annuler();

        if (!action) {
            this.setStatus('Rien à annuler');
            return;
        }

        // Activer le mode application pour éviter de créer une nouvelle action
        this.historique.activerModeApplication();

        try {
            // Restaurer l'état avant
            this.calculateur.multiCintrage.cintrages = action.avant.cintrages.map(c =>
                new ParametresCintrage(c.angle, c.rayon, c.position)
            );

            this.mettreAJourListeCintrages();
            this.setStatus(`Action annulée: ${action.type}`);
        } catch (e) {
            console.error('Erreur lors de l\'annulation:', e);
            this.setStatus('Erreur lors de l\'annulation');
        } finally {
            this.historique.desactiverModeApplication();
        }
    }

    /**
     * Refait la dernière action annulée
     */
    refaire() {
        const action = this.historique.refaire();

        if (!action) {
            this.setStatus('Rien à refaire');
            return;
        }

        // Activer le mode application pour éviter de créer une nouvelle action
        this.historique.activerModeApplication();

        try {
            // Restaurer l'état après
            this.calculateur.multiCintrage.cintrages = action.apres.cintrages.map(c =>
                new ParametresCintrage(c.angle, c.rayon, c.position)
            );

            this.mettreAJourListeCintrages();
            this.setStatus(`Action refaite: ${action.type}`);
        } catch (e) {
            console.error('Erreur lors du refaire:', e);
            this.setStatus('Erreur lors du refaire');
        } finally {
            this.historique.desactiverModeApplication();
        }
    }

    /**
     * Démarre l'auto-sauvegarde toutes les 30 secondes
     */
    demarrerAutosave() {
        // Arrêter l'ancien timer s'il existe
        this.arreterAutosave();

        // Démarrer un nouveau timer (30 secondes)
        this.autosaveTimer = setInterval(() => {
            this.effectuerAutosave();
        }, 30000); // 30 secondes

        console.log('Auto-sauvegarde activée (toutes les 30 secondes)');
    }

    /**
     * Arrête l'auto-sauvegarde
     */
    arreterAutosave() {
        if (this.autosaveTimer) {
            clearInterval(this.autosaveTimer);
            this.autosaveTimer = null;
            console.log('Auto-sauvegarde arrêtée');
        }
    }

    /**
     * Effectue une auto-sauvegarde
     */
    effectuerAutosave() {
        try {
            // Ne sauvegarder que s'il y a des données
            const hasCintrages = this.calculateur.multiCintrage.cintrages.length > 0;
            const diametre = parseFloat(document.getElementById('tube-diametre').value);
            const epaisseur = parseFloat(document.getElementById('tube-epaisseur').value);
            const longueur = parseFloat(document.getElementById('tube-longueur').value);

            // Vérifier qu'il y a au moins quelque chose à sauvegarder
            if (!hasCintrages && diametre === 20 && epaisseur === 1.5 && longueur === 1000) {
                // Valeurs par défaut, rien à sauvegarder
                return;
            }

            const materiauId = document.getElementById('tube-materiau').value;

            const parametresTube = {
                diametre,
                epaisseur,
                longueur
            };

            const cintrages = this.calculateur.multiCintrage.cintrages.map(c => ({
                angle: c.angle,
                rayon: c.rayon,
                position: c.position
            }));

            const projet = new ProjetCintrage('Autosave', parametresTube, materiauId, cintrages);
            this.gestionnaireProjets.autosave(projet);

            console.log('Auto-sauvegarde effectuée');
        } catch (e) {
            console.error('Erreur lors de l\'auto-sauvegarde:', e);
        }
    }

    /**
     * Restaure l'auto-sauvegarde au démarrage
     */
    restaurerAutosave() {
        try {
            const autosave = this.gestionnaireProjets.chargerAutosave();

            if (autosave && autosave.cintrages && autosave.cintrages.length > 0) {
                if (confirm('Un projet non sauvegardé a été trouvé. Voulez-vous le restaurer ?')) {
                    this.appliquerProjet(autosave);
                    this.setStatus('Projet restauré depuis l\'auto-sauvegarde');
                }
            }
        } catch (e) {
            console.error('Erreur lors de la restauration de l\'autosave:', e);
        }
    }

    /**
     * Active l'édition inline d'une cellule de la table
     * @param {HTMLElement} td - La cellule à éditer
     * @param {number} index - L'index du cintrage
     */
    activerEditionInline(td, index) {
        // Empêcher l'édition si déjà en cours
        if (td.querySelector('input')) {
            return;
        }

        const field = td.dataset.field;
        const valeurOriginale = parseFloat(td.textContent);

        // Créer un input pour l'édition
        const input = document.createElement('input');
        input.type = 'number';
        input.value = valeurOriginale;
        input.step = '0.1';
        input.style.width = '100%';
        input.style.border = '2px solid #0D47A1';
        input.style.padding = '4px';

        // Remplacer le contenu par l'input
        td.textContent = '';
        td.appendChild(input);
        input.focus();
        input.select();

        // Fonction pour sauvegarder les changements
        const sauvegarder = () => {
            const nouvelleValeur = parseFloat(input.value);

            if (isNaN(nouvelleValeur)) {
                this.showModal('Erreur', 'Valeur invalide');
                td.textContent = valeurOriginale.toFixed(1);
                return;
            }

            // Vérifier si la valeur a changé
            if (nouvelleValeur === valeurOriginale) {
                td.textContent = valeurOriginale.toFixed(1);
                return;
            }

            try {
                // Capturer l'état avant
                const avant = {
                    cintrages: this.calculateur.multiCintrage.cintrages.map(c => ({...c}))
                };

                // Mettre à jour le cintrage
                const cintrage = this.calculateur.multiCintrage.cintrages[index];
                cintrage[field] = nouvelleValeur;

                // Valider le cintrage modifié
                const diametre = parseFloat(document.getElementById('tube-diametre').value);
                const epaisseur = parseFloat(document.getElementById('tube-epaisseur').value);
                const longueur = parseFloat(document.getElementById('tube-longueur').value);
                const paramsTube = new ParametresTube(diametre, epaisseur, longueur);
                const paramsCintrage = new ParametresCintrage(cintrage.angle, cintrage.rayon, cintrage.position);

                const validation = this.calculateur.validerCintrage(paramsTube, paramsCintrage);

                if (!validation.valide) {
                    // Restaurer la valeur originale
                    cintrage[field] = valeurOriginale;
                    this.showModal('Erreur', validation.erreurs.join('\n'));
                    td.textContent = valeurOriginale.toFixed(1);
                    return;
                }

                // Afficher les avertissements s'il y en a
                if (validation.avertissements.length > 0) {
                    this.showModal('Avertissement', validation.avertissements.join('\n'));
                }

                // Capturer l'état après
                const apres = {
                    cintrages: this.calculateur.multiCintrage.cintrages.map(c => ({...c}))
                };

                // Enregistrer dans l'historique
                const action = new ActionHistorique('modifier_cintrage', avant, apres);
                this.historique.ajouterAction(action);

                // Mettre à jour l'affichage
                this.mettreAJourListeCintrages();
                this.setStatus(`Cintrage #${index + 1} modifié: ${field} = ${nouvelleValeur.toFixed(1)}`);

            } catch (e) {
                console.error('Erreur lors de la modification:', e);
                td.textContent = valeurOriginale.toFixed(1);
                this.showModal('Erreur', e.message);
            }
        };

        // Sauvegarder sur Enter ou perte de focus
        input.addEventListener('blur', sauvegarder);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                sauvegarder();
            } else if (e.key === 'Escape') {
                td.textContent = valeurOriginale.toFixed(1);
            }
        });
    }

    /**
     * Trie la table par une colonne donnée
     * @param {number} colonne - Index de la colonne (0=Position, 1=Angle, 2=Rayon, 3=Valeur A)
     */
    trierTable(colonne) {
        if (this.triColonne === colonne) {
            // Inverser l'ordre si on clique sur la même colonne
            this.triOrdre = this.triOrdre === 'asc' ? 'desc' : 'asc';
        } else {
            // Nouvelle colonne, tri ascendant par défaut
            this.triColonne = colonne;
            this.triOrdre = 'asc';
        }

        this.mettreAJourListeCintrages();
        this.setStatus(`Tri par ${['Position', 'Angle', 'Rayon', 'Valeur A'][colonne]} (${this.triOrdre === 'asc' ? 'croissant' : 'décroissant'})`);
    }

    /**
     * Met à jour les indicateurs de tri dans les en-têtes de table
     */
    mettreAJourIndicateursTri() {
        const headers = document.querySelectorAll('#cintrages-tree th');

        headers.forEach((th, index) => {
            // Retirer les anciennes flèches
            th.innerHTML = th.textContent.replace(' ▲', '').replace(' ▼', '');

            // Ajouter la flèche si c'est la colonne triée
            if (this.triColonne === index) {
                th.innerHTML += this.triOrdre === 'asc' ? ' ▲' : ' ▼';
                th.style.fontWeight = 'bold';
                th.style.color = '#0D47A1';
            } else {
                th.style.fontWeight = 'normal';
                th.style.color = '';
            }

            // Ajouter un curseur pointer pour indiquer que c'est cliquable
            th.style.cursor = 'pointer';
            th.style.userSelect = 'none';
        });
    }

    /**
     * Active/désactive le mode édition visuelle
     */
    toggleModeEdition() {
        this.modeEdition = !this.modeEdition;

        const btn = document.getElementById('btn-mode-edition');
        if (btn) {
            if (this.modeEdition) {
                btn.classList.add('active');
                this.setStatus('Mode édition: Cliquez sur le tube pour ajouter un point de cintrage');
                this.canvas.style.cursor = 'crosshair';
            } else {
                btn.classList.remove('active');
                this.setStatus('Mode édition désactivé');
                this.canvas.style.cursor = 'default';
                this.cintrageEnDrag = null;
                this.pointSurvol = null;
            }
        }

        // Redessiner pour afficher/masquer la règle et les poignées
        if (this.calculateur.multiCintrage.cintrages.length > 0) {
            this.simulerCintrage();
        } else {
            this.dessinerRegleGraduee();
        }
    }

    /**
     * Gestion du mousedown sur le canvas
     */
    onCanvasMouseDown(e) {
        if (!this.modeEdition) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Vérifier si on clique sur une poignée existante (pour drag)
        for (let i = 0; i < this.poignees.length; i++) {
            const poignee = this.poignees[i];
            const distance = Math.sqrt(
                Math.pow(mouseX - poignee.x, 2) +
                Math.pow(mouseY - poignee.y, 2)
            );

            if (distance < 15) {
                // On a cliqué sur cette poignée - mode drag
                this.cintrageEnDrag = {
                    index: i,
                    startX: mouseX,
                    startY: mouseY,
                    cintrageOriginal: {...this.calculateur.multiCintrage.cintrages[i]}
                };
                this.canvas.style.cursor = 'grabbing';
                return;
            }
        }

        // Sinon, on ajoute un nouveau point de cintrage
        const longueur = parseFloat(document.getElementById('tube-longueur').value);
        const echelle = this.canvas.width / longueur;
        const position = mouseX / echelle;

        // Vérifier que la position est valide (dans le tube)
        if (position < 10 || position > longueur - 10) {
            this.showModal('Position invalide', 'Le point de cintrage doit être entre 10mm et ' + (longueur - 10) + 'mm');
            return;
        }

        // Demander angle et rayon via prompt (temporaire, on améliorera avec un modal)
        this.demanderParametresCintrage(position);
    }

    /**
     * Gestion du mousemove sur le canvas
     */
    onCanvasMouseMove(e) {
        if (!this.modeEdition) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Si on est en train de déplacer une poignée
        if (this.cintrageEnDrag) {
            const deltaX = mouseX - this.cintrageEnDrag.startX;

            // Mise à jour de la position du cintrage
            const cintrage = this.calculateur.multiCintrage.cintrages[this.cintrageEnDrag.index];
            const echelle = parseFloat(document.getElementById('tube-longueur').value) / this.canvas.width;
            cintrage.position = Math.max(10, this.cintrageEnDrag.cintrageOriginal.position + deltaX * echelle);

            // Redessiner
            this.simulerCintrage();
            this.mettreAJourListeCintrages();

            return;
        }

        // Calculer la position de la souris sur le tube
        const longueur = parseFloat(document.getElementById('tube-longueur').value);
        const echelle = this.canvas.width / longueur;
        const position = mouseX / echelle;

        // Enregistrer la position pour le dessin
        this.pointSurvol = { x: mouseX, position: Math.round(position) };

        // Vérifier si on survole une poignée existante
        let surPoignee = false;
        for (let poignee of this.poignees) {
            const distance = Math.sqrt(
                Math.pow(mouseX - poignee.x, 2) +
                Math.pow(mouseY - poignee.y, 2)
            );

            if (distance < 15) {
                surPoignee = true;
                break;
            }
        }

        this.canvas.style.cursor = surPoignee ? 'grab' : 'crosshair';

        // Redessiner pour afficher le curseur de position
        if (this.calculateur.multiCintrage.cintrages.length > 0) {
            this.simulerCintrage();
        } else {
            this.dessinerRegleGraduee();
        }
    }

    /**
     * Gestion du mouseup sur le canvas
     */
    onCanvasMouseUp(e) {
        if (!this.modeEdition) return;

        if (this.cintrageEnDrag) {
            // Capturer l'état pour l'historique
            const avant = { cintrages: [this.cintrageEnDrag.cintrageOriginal] };
            const apres = {
                cintrages: [{...this.calculateur.multiCintrage.cintrages[this.cintrageEnDrag.index]}]
            };

            const action = new ActionHistorique('modifier_cintrage', avant, apres);
            this.historique.ajouterAction(action);

            this.cintrageEnDrag = null;
            this.canvas.style.cursor = 'crosshair';
            this.setStatus('Position modifiée');
        }
    }

    /**
     * Dessine les poignées de cintrage en mode édition
     */
    dessinerPoignees() {
        if (!this.modeEdition) {
            this.poignees = [];
            return;
        }

        const longueur = parseFloat(document.getElementById('tube-longueur').value);
        const echelle = this.canvas.width / longueur;

        this.poignees = [];

        // Dessiner les poignées des cintrages existants
        this.calculateur.multiCintrage.cintrages.forEach((cintrage, index) => {
            const x = cintrage.position * echelle;
            const y = this.canvas.height / 2;

            // Dessiner un cercle pour la poignée
            this.ctx.beginPath();
            this.ctx.arc(x, y, 10, 0, 2 * Math.PI);
            this.ctx.fillStyle = '#FF5722';
            this.ctx.fill();
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Ajouter un label avec le numéro
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`${index + 1}`, x, y);

            // Enregistrer la position de la poignée
            this.poignees.push({ x, y, index });
        });

        // Dessiner le curseur de position au survol
        if (this.pointSurvol) {
            this.dessinerCurseurPosition(this.pointSurvol.x, this.pointSurvol.position);
        }

        // Dessiner la règle graduée
        this.dessinerRegleGraduee();
    }

    /**
     * Dessine la règle graduée en bas du canvas
     */
    dessinerRegleGraduee() {
        if (!this.modeEdition) return;

        const longueur = parseFloat(document.getElementById('tube-longueur').value);
        const echelle = this.canvas.width / longueur;
        const y = this.canvas.height - 40;

        // Ligne de base de la règle
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();

        // Graduations tous les 50mm
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#333';
        this.ctx.textAlign = 'center';

        for (let position = 0; position <= longueur; position += 50) {
            const x = position * echelle;

            // Grande graduation tous les 100mm
            if (position % 100 === 0) {
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - 15);
                this.ctx.lineTo(x, y + 15);
                this.ctx.stroke();

                // Label
                this.ctx.fillText(`${position}`, x, y + 28);
            } else {
                // Petite graduation
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - 8);
                this.ctx.lineTo(x, y + 8);
                this.ctx.stroke();
            }
        }

        // Dessiner le curseur de position si on survole
        if (this.pointSurvol) {
            this.dessinerCurseurPosition(this.pointSurvol.x, this.pointSurvol.position);
        }
    }

    /**
     * Dessine un curseur vertical indiquant la position de la souris
     */
    dessinerCurseurPosition(x, position) {
        // Ligne verticale
        this.ctx.strokeStyle = '#2196F3';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height - 40);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Label avec la position
        const label = `${position} mm`;
        const padding = 6;
        const textWidth = this.ctx.measureText(label).width;

        this.ctx.fillStyle = '#2196F3';
        this.ctx.fillRect(x - textWidth / 2 - padding, 10, textWidth + padding * 2, 20);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, x, 20);
    }

    /**
     * Demande les paramètres du cintrage (angle et rayon) via dialog
     */
    demanderParametresCintrage(position) {
        // Pour l'instant, utilisons des prompts simples
        // TODO: Créer un vrai modal avec formulaire

        const angle = prompt(`Entrez l'angle de cintrage (en degrés) pour la position ${Math.round(position)}mm:`, '90');
        if (angle === null) return;

        const angleNum = parseFloat(angle);
        if (isNaN(angleNum) || angleNum === 0) {
            this.showModal('Erreur', 'Veuillez entrer un angle valide (différent de 0)');
            return;
        }

        const rayon = prompt(`Entrez le rayon de cintrage (en mm):`, '50');
        if (rayon === null) return;

        const rayonNum = parseFloat(rayon);
        if (isNaN(rayonNum) || rayonNum <= 0) {
            this.showModal('Erreur', 'Veuillez entrer un rayon valide (> 0)');
            return;
        }

        // Ajouter le cintrage
        try {
            const diametre = parseFloat(document.getElementById('tube-diametre').value);
            const epaisseur = parseFloat(document.getElementById('tube-epaisseur').value);
            const longueur = parseFloat(document.getElementById('tube-longueur').value);

            const paramsTube = new ParametresTube(diametre, epaisseur, longueur);
            const paramsCintrage = new ParametresCintrage(angleNum, rayonNum, position);

            // Valider
            const validation = this.calculateur.validerCintrage(paramsTube, paramsCintrage);

            if (!validation.valide) {
                this.showModal('Erreur de validation', validation.erreurs.join('\n'));
                return;
            }

            if (validation.avertissements.length > 0) {
                this.showModal('Avertissement', validation.avertissements.join('\n'));
            }

            // Ajouter
            this.calculateur.multiCintrage.ajouterCintrage(paramsCintrage);
            this.mettreAJourListeCintrages();
            this.simulerCintrage();

            this.setStatus(`Cintrage ajouté à ${Math.round(position)}mm, ${angleNum}°, rayon ${rayonNum}mm`);

        } catch (e) {
            console.error('Erreur lors de l\'ajout du cintrage:', e);
            this.showModal('Erreur', e.message);
        }
    }
};

// Indiquer que le module est chargé
console.log('Module interface.js chargé');