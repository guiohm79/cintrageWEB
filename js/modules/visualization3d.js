/**
 * @class Visualization3D
 * @description Gère la visualisation 3D du tube cintré avec Three.js
 */
window.Visualization3D = class Visualization3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Conteneur ${containerId} non trouvé`);
            return;
        }

        // Vérifier que Three.js est chargé
        if (typeof THREE === 'undefined') {
            console.error('Three.js n\'est pas chargé');
            return;
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.tubeMesh = null;
        this.animationId = null;

        this.initialiserScene();
        this.demarrerAnimation();

        // Gérer le redimensionnement
        window.addEventListener('resize', () => this.gererRedimensionnement());
    }

    /**
     * Initialise la scène 3D, la caméra, le renderer et les contrôles
     */
    initialiserScene() {
        // Créer la scène
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Bleu ciel

        // Créer la caméra
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(50, width / height, 1, 10000);
        this.camera.position.set(500, 400, 500);
        this.camera.lookAt(0, 0, 0);

        // Créer le renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Ajouter les contrôles OrbitControls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.minDistance = 100;
            this.controls.maxDistance = 2000;
        }

        // Ajouter les lumières
        this.ajouterLumieres();

        // Ajouter une grille de sol
        const gridHelper = new THREE.GridHelper(2000, 40, 0x888888, 0xcccccc);
        gridHelper.position.y = -100;
        this.scene.add(gridHelper);

        // Ajouter des axes de référence
        const axesHelper = new THREE.AxesHelper(200);
        this.scene.add(axesHelper);
    }

    /**
     * Ajoute les lumières à la scène
     */
    ajouterLumieres() {
        // Lumière ambiante
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Lumière directionnelle (soleil)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(500, 800, 300);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Lumière d'appoint
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-500, 200, -300);
        this.scene.add(fillLight);
    }

    /**
     * Génère et affiche le tube 3D à partir des cintrages
     * @param {Array} cintrages - Liste des cintrages
     * @param {number} diametre - Diamètre du tube
     * @param {number} longueur - Longueur totale du tube
     */
    afficherTube(cintrages, diametre, longueur) {
        // Supprimer le tube précédent s'il existe
        if (this.tubeMesh) {
            this.scene.remove(this.tubeMesh);
            this.tubeMesh.geometry.dispose();
            this.tubeMesh.material.dispose();
        }

        if (!cintrages || cintrages.length === 0) {
            // Tube droit simple
            this.creerTubeDroit(longueur, diametre);
            return;
        }

        // Créer le chemin 3D du tube
        const path = this.creerCheminTube(cintrages, longueur);

        // Créer la géométrie du tube
        const tubeGeometry = new THREE.TubeGeometry(
            path,
            200,  // segments le long du chemin
            diametre / 2,  // rayon du tube
            16,   // segments radiaux
            false // non fermé
        );

        // Créer le matériau
        const material = new THREE.MeshPhongMaterial({
            color: 0x888888,
            shininess: 80,
            specular: 0x333333,
            side: THREE.DoubleSide
        });

        // Créer le mesh
        this.tubeMesh = new THREE.Mesh(tubeGeometry, material);
        this.tubeMesh.castShadow = true;
        this.tubeMesh.receiveShadow = true;
        this.scene.add(this.tubeMesh);

        // Centrer la caméra sur le tube
        this.centrerCamera(path);
    }

    /**
     * Crée un tube droit simple
     * @param {number} longueur - Longueur du tube
     * @param {number} diametre - Diamètre du tube
     */
    creerTubeDroit(longueur, diametre) {
        const geometry = new THREE.CylinderGeometry(
            diametre / 2,
            diametre / 2,
            longueur,
            32
        );

        const material = new THREE.MeshPhongMaterial({
            color: 0x888888,
            shininess: 80,
            specular: 0x333333
        });

        this.tubeMesh = new THREE.Mesh(geometry, material);
        this.tubeMesh.rotation.z = Math.PI / 2;
        this.tubeMesh.castShadow = true;
        this.tubeMesh.receiveShadow = true;
        this.scene.add(this.tubeMesh);

        // Ajuster la caméra
        this.camera.position.set(longueur * 0.7, longueur * 0.5, longueur * 0.7);
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * Crée le chemin 3D du tube à partir des cintrages
     * @param {Array} cintrages - Liste des cintrages
     * @param {number} longueur - Longueur totale du tube
     * @returns {THREE.CatmullRomCurve3} Le chemin 3D
     */
    creerCheminTube(cintrages, longueur) {
        const points = [];

        // Position et direction actuelles
        let position = new THREE.Vector3(0, 0, 0);
        let direction = new THREE.Vector3(1, 0, 0); // Direction initiale: axe X

        // Trier les cintrages par position
        const cintragesTries = [...cintrages].sort((a, b) => a.position - b.position);

        let positionCourante = 0;

        cintragesTries.forEach(cintrage => {
            // Ajouter un segment droit jusqu'au cintrage
            if (cintrage.position > positionCourante) {
                const distanceDroite = cintrage.position - positionCourante;
                const deplacement = direction.clone().multiplyScalar(distanceDroite);
                position.add(deplacement);
                points.push(position.clone());
            }

            // Ajouter le cintrage (arc)
            const angleRad = cintrage.angle * Math.PI / 180;
            const rayon = cintrage.rayon;

            // Calculer le centre du cercle de cintrage
            const perpendiculaire = new THREE.Vector3(-direction.y, direction.x, direction.z).normalize();
            const centre = position.clone().add(perpendiculaire.multiplyScalar(rayon));

            // Générer des points le long de l'arc
            const nbPointsArc = Math.max(10, Math.floor(Math.abs(angleRad) * 20));
            for (let i = 1; i <= nbPointsArc; i++) {
                const angleCourant = (angleRad * i) / nbPointsArc;
                const cos = Math.cos(angleCourant);
                const sin = Math.sin(angleCourant);

                const pointArc = new THREE.Vector3(
                    centre.x + rayon * (cos * -perpendiculaire.x + sin * direction.x),
                    centre.y + rayon * (cos * -perpendiculaire.y + sin * direction.y),
                    centre.z + rayon * sin
                );

                points.push(pointArc);
            }

            // Mettre à jour la position et la direction
            position = points[points.length - 1].clone();

            // Rotation de la direction selon l'angle de cintrage
            const oldDirection = direction.clone();
            direction.x = oldDirection.x * Math.cos(angleRad) - oldDirection.y * Math.sin(angleRad);
            direction.y = oldDirection.x * Math.sin(angleRad) + oldDirection.y * Math.cos(angleRad);
            direction.normalize();

            positionCourante = cintrage.position;
        });

        // Ajouter le segment final droit jusqu'à la fin du tube
        if (positionCourante < longueur) {
            const distanceFinale = longueur - positionCourante;
            const deplacement = direction.clone().multiplyScalar(distanceFinale);
            position.add(deplacement);
            points.push(position.clone());
        }

        // Créer une courbe à partir des points
        return new THREE.CatmullRomCurve3(points, false, 'centripetal');
    }

    /**
     * Centre la caméra sur le chemin du tube
     * @param {THREE.CatmullRomCurve3} path - Le chemin du tube
     */
    centrerCamera(path) {
        if (!path) return;

        // Obtenir les points du chemin
        const points = path.getPoints(50);

        // Calculer la boîte englobante
        const box = new THREE.Box3().setFromPoints(points);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Positionner la caméra
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.5; // Zoom out un peu

        this.camera.position.set(
            center.x + cameraZ,
            center.y + cameraZ * 0.7,
            center.z + cameraZ
        );

        this.camera.lookAt(center);

        if (this.controls) {
            this.controls.target.copy(center);
            this.controls.update();
        }
    }

    /**
     * Démarre la boucle d'animation
     */
    demarrerAnimation() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);

            if (this.controls) {
                this.controls.update();
            }

            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        };

        animate();
    }

    /**
     * Arrête la boucle d'animation
     */
    arreterAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Réinitialise la caméra à sa position par défaut
     */
    reinitialiserCamera() {
        if (!this.camera || !this.controls) return;

        this.camera.position.set(500, 400, 500);
        this.camera.lookAt(0, 0, 0);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    /**
     * Gère le redimensionnement de la fenêtre
     */
    gererRedimensionnement() {
        if (!this.container || !this.camera || !this.renderer) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    /**
     * Nettoie et libère les ressources
     */
    dispose() {
        this.arreterAnimation();

        if (this.tubeMesh) {
            this.scene.remove(this.tubeMesh);
            this.tubeMesh.geometry.dispose();
            this.tubeMesh.material.dispose();
        }

        if (this.renderer) {
            this.renderer.dispose();
            if (this.container && this.renderer.domElement) {
                this.container.removeChild(this.renderer.domElement);
            }
        }

        if (this.controls) {
            this.controls.dispose();
        }
    }
};

// Indiquer que le module est chargé
console.log('Module visualization3d.js chargé');
