/**
 * @class ApplicationCintrage
 * @description Classe principale de l'application
 */
window.ApplicationCintrage = class ApplicationCintrage {
    constructor() {
        try {
            console.log('Initialisation de l\'application de cintrage...');
            
            // Initialiser le calculateur
            this.calculateur = new CalculateurCintrage();
            console.log('Calculateur initialisé');
            
            // Initialiser l'interface
            this.interface = new Interface(this.calculateur);
            console.log('Interface initialisée');
            
            console.log('Application de cintrage initialisée avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'application:', error);
            this.afficherErreurFatale('Erreur d\'initialisation', 'Une erreur s\'est produite lors de l\'initialisation de l\'application: ' + error.message);
        }
    }
    
    /**
     * Affiche une erreur fatale sur la page
     * @param {string} titre - Titre de l'erreur
     * @param {string} message - Message d'erreur
     */
    afficherErreurFatale(titre, message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '0';
        errorDiv.style.left = '0';
        errorDiv.style.width = '100%';
        errorDiv.style.padding = '20px';
        errorDiv.style.backgroundColor = '#f44336';
        errorDiv.style.color = 'white';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.zIndex = '9999';
        
        errorDiv.innerHTML = `<h3>${titre}</h3><p>${message}</p>
            <p>Vérifiez la console du navigateur pour plus de détails.</p>
            <p>Rafraîchissez la page pour réessayer.</p>`;
        
        document.body.prepend(errorDiv);
    }
};

// Créer un gestionnaire pour initialiser l'application lorsque tous les scripts sont chargés
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé, initialisation de l\'application...');
    
    // Vérifier que toutes les classes nécessaires sont disponibles
    if (typeof CalculateurCintrage === 'undefined' || 
        typeof ExporteurPlans === 'undefined' || 
        typeof Interface === 'undefined') {
        
        console.error('Les classes nécessaires ne sont pas disponibles. Vérifiez l\'ordre de chargement des scripts.');
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.padding = '20px';
        errorDiv.style.backgroundColor = '#f44336';
        errorDiv.style.color = 'white';
        errorDiv.style.borderRadius = '5px';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.zIndex = '9999';
        
        errorDiv.innerHTML = `
            <h3>Erreur de chargement</h3>
            <p>Certains composants de l'application n'ont pas pu être chargés.</p>
            <p>Vérifiez la console du navigateur pour plus de détails (F12).</p>
            <button id="reload-btn" style="margin-top: 10px; padding: 5px 10px;">Recharger la page</button>
        `;
        
        document.body.appendChild(errorDiv);
        
        document.getElementById('reload-btn').addEventListener('click', () => {
            location.reload();
        });
        
        return;
    }
    
    // Initialiser l'application
    window.app = new ApplicationCintrage();
});

// Indiquer que le module est chargé
console.log('Module main.js chargé');