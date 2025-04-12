/**
 * @class ExportConfig
 * @description Configuration pour l'export de fichiers
 */
window.ExportConfig = class ExportConfig {
    /**
     * @param {number} [echelle=1.0] - Échelle d'export
     * @param {number} [marge=10.0] - Marge autour du dessin en mm
     * @param {string} [couleurLigne="#000000"] - Couleur des lignes
     * @param {number} [epaisseurLigne=1.0] - Épaisseur des lignes
     */
    constructor(echelle = 1.0, marge = 10.0, couleurLigne = "#000000", epaisseurLigne = 1.0) {
        this.echelle = echelle;
        this.marge = marge;
        this.couleurLigne = couleurLigne;
        this.epaisseurLigne = epaisseurLigne;
    }
};

/**
 * @class ExporteurPlans
 * @description Classe pour exporter le dessin du tube en différents formats
 */
window.ExporteurPlans = class ExporteurPlans {
    constructor() {
        this.config = new ExportConfig();
    }

    /**
     * Exporte le dessin du tube en format SVG
     * @param {Array<Array<number>>} points - Liste de points [x, y] représentant le tube
     * @param {string} nomFichier - Nom du fichier SVG à créer
     * @returns {string} Le contenu SVG
     */
    exporterSVG(points, nomFichier) {
        // Calcul des dimensions
        const xValues = points.map(p => p[0]);
        const yValues = points.map(p => p[1]);
        
        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);
        
        const largeur = (xMax - xMin) * this.config.echelle + 2 * this.config.marge;
        const hauteur = (yMax - yMin) * this.config.echelle + 2 * this.config.marge;
        
        // Création du contenu SVG
        let svgContent = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n';
        svgContent += `<svg width="${largeur}" height="${hauteur}" xmlns="http://www.w3.org/2000/svg">\n`;
        
        // Création du chemin
        let pathData = `M ${this.config.marge},${this.config.marge}`;
        
        for (const [x, y] of points) {
            const xScaled = x * this.config.echelle + this.config.marge;
            const yScaled = y * this.config.echelle + this.config.marge;
            pathData += ` L ${xScaled},${yScaled}`;
        }
        
        svgContent += `  <path d="${pathData}" stroke="${this.config.couleurLigne}" stroke-width="${this.config.epaisseurLigne}" fill="none" />\n`;
        svgContent += '</svg>';
        
        // Enregistrement du fichier (dans le navigateur en utilisant FileSaver.js)
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        saveAs(blob, nomFichier);
        
        return svgContent;
    }
    
    /**
     * Exporte le dessin du tube en format DXF
     * @param {Array<Array<number>>} points - Liste de points [x, y] représentant le tube
     * @param {string} nomFichier - Nom du fichier DXF à créer
     * @returns {string} Le contenu DXF
     */
    exporterDXF(points, nomFichier) {
        // Création du contenu DXF
        let dxfContent = "0\nSECTION\n2\nENTITIES\n";
        
        // Écriture des lignes
        for (let i = 0; i < points.length - 1; i++) {
            const [x1, y1] = points[i];
            const [x2, y2] = points[i + 1];
            
            // Ligne DXF
            dxfContent += "0\nLINE\n";
            dxfContent += "8\n0\n";  // Calque 0
            dxfContent += `10\n${x1}\n`;  // Point de départ X
            dxfContent += `20\n${y1}\n`;  // Point de départ Y
            dxfContent += "30\n0\n";      // Point de départ Z
            dxfContent += `11\n${x2}\n`;  // Point d'arrivée X
            dxfContent += `21\n${y2}\n`;  // Point d'arrivée Y
            dxfContent += "31\n0\n";      // Point d'arrivée Z
        }
        
        // Fin du fichier DXF
        dxfContent += "0\nENDSEC\n0\nEOF\n";
        
        // Enregistrement du fichier (dans le navigateur en utilisant FileSaver.js)
        const blob = new Blob([dxfContent], { type: 'application/dxf' });
        saveAs(blob, nomFichier);
        
        return dxfContent;
    }
    
    /**
     * Exporte le dessin du tube en format PDF
     * @param {Array<Array<number>>} points - Liste de points [x, y] représentant le tube
     * @param {string} nomFichier - Nom du fichier PDF à créer
     * @param {ParametresTube} paramsTube - Paramètres du tube
     * @param {Array<ParametresCintrage>} cintrages - Liste des paramètres de cintrage
     * @returns {Object} L'objet jsPDF créé
     */
    exporterPDF(points, nomFichier, paramsTube, cintrages = []) {
        // Calcul des dimensions
        const xValues = points.map(p => p[0]);
        const yValues = points.map(p => p[1]);
        
        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);
        
        // Déterminer l'orientation du document en fonction des dimensions
        const largeur = xMax - xMin;
        const hauteur = yMax - yMin;
        const orientation = largeur > hauteur ? 'landscape' : 'portrait';
        
        // Création du document PDF
        const pdf = new jspdf.jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: 'a4'
        });
        
        // Obtenir les dimensions de la page
        const pageWidth = orientation === 'landscape' ? 297 : 210;
        const pageHeight = orientation === 'landscape' ? 210 : 297;
        
        // Calculer l'échelle pour adapter le dessin à la page avec des marges
        const marge = this.config.marge;
        const maxLargeur = pageWidth - 2 * marge;
        const maxHauteur = pageHeight - 2 * marge - 80; // Réserver de l'espace pour les détails techniques
        
        const echelleLargeur = maxLargeur / largeur;
        const echelleHauteur = maxHauteur / hauteur;
        const echelle = Math.min(echelleLargeur, echelleHauteur) * this.config.echelle;
        
        // Calculer le décalage pour centrer le dessin
        const decalageX = marge + (maxLargeur - largeur * echelle) / 2;
        const decalageY = marge + (maxHauteur - hauteur * echelle) / 2;
        
        // Ajouter un titre
        pdf.setFontSize(16);
        pdf.text('Plan de cintrage de tube', pageWidth / 2, 15, { align: 'center' });
        
        // Ajouter les informations sur le tube
        pdf.setFontSize(12);
        pdf.text(`Dimensions du profilé: Ø${paramsTube.diametre}×${paramsTube.epaisseur} mm - Longueur: ${paramsTube.longueur} mm`, pageWidth / 2, 25, { align: 'center' });
        
        // Configurer le style de ligne
        pdf.setDrawColor(this.config.couleurLigne.replace('#', ''));
        pdf.setLineWidth(this.config.epaisseurLigne * 0.3); // Ajuster l'épaisseur pour PDF
        
        // Dessiner les lignes du tube
        for (let i = 0; i < points.length - 1; i++) {
            const [x1, y1] = points[i];
            const [x2, y2] = points[i + 1];
            
            // Transformer les coordonnées pour le PDF
            const x1Pdf = (x1 - xMin) * echelle + decalageX;
            const y1Pdf = (y1 - yMin) * echelle + decalageY;
            const x2Pdf = (x2 - xMin) * echelle + decalageX;
            const y2Pdf = (y2 - yMin) * echelle + decalageY;
            
            pdf.line(x1Pdf, y1Pdf, x2Pdf, y2Pdf);
        }
        
        // Ajouter les cotations principales
        pdf.setFontSize(8);
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.1);
        
        // Longueur totale
        const startX = (points[0][0] - xMin) * echelle + decalageX;
        const startY = (points[0][1] - yMin) * echelle + decalageY;
        const endX = (points[points.length-1][0] - xMin) * echelle + decalageX;
        const endY = (points[points.length-1][1] - yMin) * echelle + decalageY;
        
        // Calculer la distance réelle entre le premier et le dernier point
        const distanceTotale = Math.sqrt(
            Math.pow(points[points.length-1][0] - points[0][0], 2) + 
            Math.pow(points[points.length-1][1] - points[0][1], 2)
        ).toFixed(1);
        
        // Dessiner une ligne de cote pour la longueur totale
        const offsetCote = 10;
        pdf.line(startX, startY - offsetCote, endX, endY - offsetCote);
        pdf.line(startX, startY, startX, startY - offsetCote);
        pdf.line(endX, endY, endX, endY - offsetCote);
        pdf.text(`${distanceTotale} mm`, (startX + endX) / 2, ((startY - offsetCote) + (endY - offsetCote)) / 2 - 2, { align: 'center' });
        
        // Ajouter un tableau des cintrages
        if (cintrages && cintrages.length > 0) {
            // Position du tableau
            const tableY = pageHeight - 70;
            const tableX = marge;
            const colWidth = (pageWidth - 2 * marge) / 4;
            
            // Titre du tableau
            pdf.setFontSize(12);
            pdf.text('Détails des cintrages', pageWidth / 2, tableY - 10, { align: 'center' });
            
            // En-têtes du tableau
            pdf.setFontSize(10);
            pdf.setDrawColor(0);
            pdf.setFillColor(240, 240, 240);
            
            // Dessiner l'en-tête du tableau
            pdf.rect(tableX, tableY, pageWidth - 2 * marge, 8, 'F');
            pdf.text('Position (mm)', tableX + colWidth * 0.5, tableY + 5, { align: 'center' });
            pdf.text('Angle (°)', tableX + colWidth * 1.5, tableY + 5, { align: 'center' });
            pdf.text('Rayon (mm)', tableX + colWidth * 2.5, tableY + 5, { align: 'center' });
            pdf.text('Valeur A (mm)', tableX + colWidth * 3.5, tableY + 5, { align: 'center' });
            
            // Lignes du tableau
            cintrages.forEach((cintrage, index) => {
                const rowY = tableY + 8 + (index * 7);
                
                // Calculer la valeur A (retrait)
                const angleRad = cintrage.angle * Math.PI / 180;
                const valeurA = (cintrage.rayon * (1 - Math.cos(angleRad))).toFixed(1);
                
                // Alternance de couleur pour les lignes
                if (index % 2 === 0) {
                    pdf.setFillColor(250, 250, 250);
                    pdf.rect(tableX, rowY, pageWidth - 2 * marge, 7, 'F');
                }
                
                // Dessiner les cellules
                pdf.text(`${cintrage.position}`, tableX + colWidth * 0.5, rowY + 5, { align: 'center' });
                pdf.text(`${cintrage.angle}°`, tableX + colWidth * 1.5, rowY + 5, { align: 'center' });
                pdf.text(`${cintrage.rayon}`, tableX + colWidth * 2.5, rowY + 5, { align: 'center' });
                pdf.text(`${valeurA}`, tableX + colWidth * 3.5, rowY + 5, { align: 'center' });
            });
            
            // Bordure du tableau
            pdf.setLineWidth(0.3);
            pdf.rect(tableX, tableY, pageWidth - 2 * marge, 8 + (cintrages.length * 7));
            
            // Lignes verticales du tableau
            for (let i = 1; i < 4; i++) {
                pdf.line(
                    tableX + colWidth * i, 
                    tableY, 
                    tableX + colWidth * i, 
                    tableY + 8 + (cintrages.length * 7)
                );
            }
            
            // Ligne horizontale sous l'en-tête
            pdf.line(tableX, tableY + 8, tableX + (pageWidth - 2 * marge), tableY + 8);
        }
        
        // Ajouter des informations en bas de page
        pdf.setFontSize(8);
        const date = new Date().toLocaleDateString();
        pdf.text(`Généré le ${date} - Échelle: ${this.config.echelle.toFixed(2)}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        
        // Enregistrer le PDF
        pdf.save(nomFichier);
        
        return pdf;
    }
};

// Indiquer que le module est chargé
console.log('Module export.js chargé');