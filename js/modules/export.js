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
};

// Indiquer que le module est chargé
console.log('Module export.js chargé');