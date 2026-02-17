# Projet d'API de Gestion de Garage - Intentionnellement Vulnérable pour la Formation OWASP ZAP

Ce projet fournit une API Express.js robuste pour la gestion d'un garage, incluant les véhicules, les clients, les services, les factures et les retours clients. Il propose une authentification utilisateur avec une autorisation basée sur les rôles (utilisateur et administrateur), une base de données PostgreSQL avec initialisation automatique via Docker, et une documentation complète de l'interface utilisateur Swagger.

**De manière cruciale, il inclut désormais 20 vulnérabilités OWASP Top 10 intentionnellement introduites, intégrées dans des routes d'apparence normale, afin de servir de plateforme d'apprentissage pratique pour vos étudiants utilisant OWASP ZAP.**

## Fonctionnalités Clés

*   **Backend Express.js**: Structure de serveur de base avec `server.js` comme point d'entrée, connexion centralisée à la base de données.
*   **Base de Données PostgreSQL**: Initialisation automatisée du schéma et des données fictives via Docker. Les utilisateurs `admin` et `user1` ne sont plus créés automatiquement ; les étudiants devront s'enregistrer.
*   **Authentification et Autorisation**: Enregistrement et connexion des utilisateurs avec hachage sécurisé des mots de passe (`bcrypt`) et génération de jetons Web JSON (JWT) (`jsonwebtoken`). Middlewares `authenticateToken` et `authorizeRoles` pour la sécurité.
*   **Points de Terminaison d'API Complets (Opérations CRUD)**: Routes pour l'authentification (`/api/auth`), la gestion des clients (`/api/customers`), des véhicules (`/api/vehicles`), des services (`/api/services`), des factures (`/api/invoices`) et des retours clients (`/api/feedback`), ainsi que des utilisateurs (`/api/users`) et des informations (`/api/info`).
*   **Documentation Swagger/OpenAPI**: Documentation interactive de l'API disponible via Swagger UI à `/api-docs` (si activé).
*   **Dockerisation**: `Dockerfile` pour l'application Node.js Express et `database/Dockerfile.db` pour l'image PostgreSQL personnalisée, orchestrées par `docker-compose.yml`.
*   **Script de Déploiement**: `build_and_push.sh` pour créer et pousser les images Docker vers un registre.

---

## Instructions pour la Mise en Place et l'Utilisation de l'Application

Ce guide détaillera comment configurer et exécuter l'application API de gestion de garage, qui contient des vulnérabilités intentionnelles pour la formation OWASP ZAP.

### 1. Prérequis

Avant de commencer, assurez-vous que les éléments suivants sont installés sur votre système :

*   **Docker**: Assurez-vous que Docker Desktop (pour Windows/macOS) ou le moteur Docker (pour Linux) est installé et en cours d'exécution.
*   **Node.js & npm/yarn**: Non strictement nécessaire pour exécuter le projet via Docker, mais utile pour le développement.
*   **Git**: Pour cloner le dépôt.

### 2. Configuration de l'environnement (`.env`)

Un fichier `.env.example` est fourni dans le répertoire racine du projet. Vous devez le copier et le renommer en `.env`, puis y renseigner les informations nécessaires.

1.  **Copiez le fichier d'exemple**:
    ```bash
    cp .env.example .env
    ```

2.  **Modifiez le fichier `.env`**: Ouvrez le fichier `.env` nouvellement créé et remplacez les valeurs d'espace réservé par vos propres configurations. Voici un exemple avec les valeurs par défaut pour une exécution locale :

    ```properties
    DB_USER=garage_user
    DB_HOST=db # 'db' est le nom du service dans docker-compose.yml
    DB_DATABASE=garage_db
    DB_PASSWORD=password
    DB_PORT=5432
    JWT_SECRET=votre_cle_secrete_jwt_ici # Changez ceci pour une chaîne secrète forte
    ENABLE_SWAGGER=true # Définissez à true pour accéder à l'interface utilisateur Swagger
    ```
    *   **`DB_USER`, `DB_HOST`, `DB_DATABASE`, `DB_PASSWORD`, `DB_PORT`**: Ces informations sont utilisées pour que l'application Node.js puisse se connecter à la base de données PostgreSQL qui sera démarrée par Docker Compose. Le `DB_HOST` doit correspondre au nom du service de base de données défini dans `docker-compose.yml` (par défaut, `db`).
    *   **`JWT_SECRET`**: Une chaîne secrète utilisée pour signer et vérifier les jetons JWT. **C'est une information sensible ; ne l'exposez jamais en production.**
    *   **`ENABLE_SWAGGER`**: Définissez à `true` pour activer l'interface utilisateur Swagger (`/api-docs`) pour la documentation interactive de l'API.

### 3. Démarrer la pile d'applications avec Docker Compose

Ouvrez votre terminal dans le répertoire racine du projet et exécutez la commande suivante :

```bash
docker-compose up --build
```

Cette commande effectuera les actions suivantes :

*   **Construction de l'image de la base de données**: Elle construira l'image PostgreSQL personnalisée en utilisant `database/Dockerfile.db`. Ce Dockerfile configurera PostgreSQL et exécutera le script `database/docker-entrypoint-initdb.d/init.sql` pour créer le schéma de la base de données et y insérer des données fictives.
*   **Construction de l'image de l'application**: Elle construira l'image de l'application Node.js Express à partir du `Dockerfile` principal.
*   **Démarrage des conteneurs**: Elle démarrera les conteneurs `db` (PostgreSQL) et `app` (application Node.js), les connectant via le réseau Docker.

Vous devriez voir les logs de construction et de démarrage des deux services dans votre terminal. L'API sera accessible sur `http://localhost:3000`.

### 4. Accéder à l'API et à la Documentation Swagger

*   **API Express.js**: L'API sera disponible sur `http://localhost:3000`.
*   **Swagger UI**: Si vous avez défini `ENABLE_SWAGGER=true` dans votre fichier `.env`, vous pouvez accéder à la documentation interactive de l'API à l'adresse suivante dans votre navigateur web : `http://localhost:3000/api-docs`.
    *   **Télécharger la définition Swagger JSON**: Vous pouvez télécharger la définition OpenAPI/Swagger complète au format JSON en accédant à `http://localhost:3000/swagger.json`. Ce fichier peut être utilisé par des outils comme Postman, Insomnia ou ZAP pour importer la définition de l'API.

### 5. Créer un Utilisateur

Étant donné que les utilisateurs par défaut (`admin`, `user1`) ont été retirés pour encourager un scénario d'apprentissage plus réaliste, vos étudiants devront créer leurs propres comptes.

*   **Utilisez Swagger UI ou un client API (comme Postman/Insomnia)**:
    1.  Accédez au point de terminaison `POST /api/auth/register`.
    2.  Envoyez une requête `POST` avec un corps JSON pour enregistrer un nouvel utilisateur. Exemple :
        ```json
        {
          "username": "monadmin",
          "password": "monmotdepasse",
          "role": "admin"
        }
        ```
        Ou pour un utilisateur normal :
        ```json
        {
          "username": "monutilisateur",
          "password": "autremotdepasse",
          "role": "user"
        }
        ```
    3.  Une fois l'utilisateur enregistré, utilisez le point de terminaison `POST /api/auth/login` pour vous connecter et obtenir un jeton JWT. Ce jeton sera utilisé pour l'authentification des requêtes aux autres points de terminaison protégés.

### 6. Formation OWASP ZAP

Le but principal de ce projet est de servir de cible pour la formation OWASP ZAP. Un document détaillé des vulnérabilités a été inclus ci-dessous pour guider vos étudiants.

---

## Vulnérabilités Intentionnellement Introduites pour la Formation OWASP ZAP

# Journée OWASP ZAP - Points de terminaison de l'API intentionnellement vulnérables

Ce document décrit plusieurs vulnérabilités intentionnellement introduites dans l'API de gestion de garage, conçues pour un exercice d'apprentissage sur OWASP ZAP et les tests d'intrusion. L'objectif est que les étudiants découvrent ces failles à l'aide de ZAP et de techniques de test manuel.

---

## 1. A01:2021 - Contrôle d'accès défaillant (Broken Access Control - BAC)

*   **Vulnérabilité**: Accès non autorisé aux données sensibles
*   **Point de terminaison**: `GET /api/customers`
*   **Description**: Ce point de terminaison est conçu pour récupérer une liste de tous les clients. Normalement, cela devrait être restreint aux seuls utilisateurs `admin` car cela expose des informations sensibles sur les clients. Cependant, en raison d'une mauvaise configuration du middleware, tout `utilisateur` authentifié (non-administrateur) peut accéder à ce point de terminaison et récupérer tous les détails des clients.
*   **Comment détecter/exploiter**:
    1.  Connectez-vous en tant qu'utilisateur `user` standard (par exemple, `user1` avec le mot de passe `userpass`).
    2.  Obtenez un jeton JWT valide à partir de la réponse de connexion.
    3.  Effectuez une requête `GET` vers `http://localhost:3000/api/customers` en utilisant le jeton JWT obtenu dans l'en-tête `Authorization: Bearer <token>`.
    4.  Observez que les données client sont renvoyées, même si l'utilisateur n'est pas un administrateur.
    *   **Détection ZAP**: Les analyses actives peuvent détecter cela si elles sont configurées correctement (par exemple, en testant différents rôles si ZAP peut gérer des sessions avec différents rôles). Les tests manuels sont très efficaces.
*   **Impact**: Violation de la confidentialité. Les utilisateurs à faibles privilèges peuvent consulter et potentiellement exfiltrer des données client sensibles, entraînant des violations de la vie privée et une atteinte à la réputation.
*   **Emplacement dans le code**: `routes/customers.js` (ligne ~20-25) - `authorizeRoles(['admin', 'user'])` alors qu'il devrait être `authorizeRoles(['admin'])`.

---

## 2. A03:2021 - Injection (Injection SQL)

*   **Vulnérabilité**: Injection SQL classique via le paramètre de recherche
*   **Point de terminaison**: `GET /api/services/search` (lorsque le paramètre de requête `query` est utilisé)
*   **Description**: Ce point de terminaison permet aux utilisateurs authentifiés de rechercher des services par nom ou description. Cependant, le paramètre `query` fourni par l'utilisateur est directement concaténé dans la chaîne de la requête SQL sans assainissement ni paramétrage approprié. Cela rend le point de terminaison vulnérable aux attaques par injection SQL.
*   **Comment détecter/exploiter**:
    1.  Connectez-vous en tant que n'importe quel utilisateur authentifié (admin ou utilisateur).
    2.  Obtenez un jeton JWT valide.
    3.  Effectuez une requête `GET` vers `http://localhost:3000/api/services/search?query=<payload>` avec une charge utile malveillante.
    4.  **Exemples de charges utiles**:
        *   `http://localhost:3000/api/services/search?query=' OR 1=1 --` (Devrait renvoyer tous les services)
        *   `http://localhost:3000/api/services/search?query=' UNION SELECT NULL, NULL, NULL, table_name, NULL FROM information_schema.tables --` (Selon le nombre de colonnes et les privilèges de la base de données, pourrait divulguer les noms des tables)
    *   **Détection ZAP**: Les scanners actifs sont très efficaces pour détecter les vulnérabilités d'injection SQL.
*   **Impact**:
    *   **Confidentialité des données**: Les attaquants peuvent récupérer des données sensibles d'autres tables de la base de données (par exemple, les informations d'identification des utilisateurs, les détails des clients).
    *   **Intégrité des données**: Les attaquants pourraient être en mesure de modifier ou de supprimer des données (moins probable avec `GET` mais possible avec des requêtes empilées ou des techniques spécifiques à la base de données).
    *   **Contournement de l'authentification**: Dans certains cas, l'injection SQL pourrait conduire à un contournement de l'authentification.
*   **Emplacement dans le code**: `routes/services.js` (dans le point de terminaison `router.get('/search', ...)` ) - concaténation directe de `query` dans la requête SQL.

---

## 3. A07:2021 - Échecs d'identification et d'authentification (Attaque par force brute)

*   **Vulnérabilité**: Absence de limitation de débit sur le point de terminaison d'authentification
*   **Point de terminaison**: `POST /api/auth/login`
*   **Description**: Le point de terminaison de connexion n'implémente aucun mécanisme de limitation de débit. Un attaquant peut effectuer un nombre illimité de tentatives de connexion dans un court laps de temps sans être bloqué ou ralenti. Cela rend le système sensible aux attaques par force brute, où un attaquant essaie systématiquement de nombreux mots de passe ou noms d'utilisateur jusqu'à ce qu'il trouve une combinaison valide.
*   **Comment détecter/exploiter**:
    1.  À l'aide d'un outil comme ZAP (ou Postman, curl en boucle), effectuez des requêtes `POST` répétées vers `http://localhost:3000/api/auth/login` avec diverses combinaisons de nom d'utilisateur/mot de passe.
    2.  Observez qu'aucun délai, CAPTCHA ou verrouillage de compte n'est déclenché après plusieurs tentatives infructueuses.
    *   **Détection ZAP**: Les scanners actifs peuvent identifier l'absence de limitation de débit, en particulier lors des tests de "fuzzing" ou de force brute. Les outils Brute Force et Fuzzer de ZAP sont idéaux.
*   **Impact**:
    *   **Compromission de compte**: Les attaquants peuvent finalement deviner des informations d'identification validées, conduisant à un accès non autorisé aux comptes d'utilisateur ou aux comptes d'administrateur.
    *   **Épuisement des ressources**: Un volume élevé de tentatives de connexion peut consommer les ressources du serveur, entraînant potentiellement un déni de service (DoS) pour les utilisateurs légitimes.
*   **Emplacement dans le code**: La vulnérabilité est l'*absence* de middleware de limitation de débit sur la route `/api/auth/login` dans `routes/auth.js` ou globalement dans `server.js`.

---

## 4. A04:2021 - Conception Insecure (Insecure Direct Object Reference - IDOR)

*   **Vulnérabilité**: Référence directe non sécurisée à un objet (IDOR)
*   **Point de terminaison**: `GET /api/feedback/{id}`
*   **Description**: Ce point de terminaison permet de récupérer un élément de feedback spécifique par son ID. Il est intentionnellement mal configuré pour permettre à tout utilisateur authentifié (non-administrateur) de récupérer *n'importe quel* feedback en modifiant simplement l'ID dans l'URL, sans vérifier la propriété de l'objet.
*   **Comment détecter/exploiter**:
    1.  Connectez-vous en tant qu'utilisateur `user` standard (par exemple, `user1` avec le mot de passe `userpass`).
    2.  Obtenez un jeton JWT valide à partir de la réponse de connexion.
    3.  Effectuez une requête `GET` vers `http://localhost:3000/api/feedback/1` (pour récupérer un feedback de votre compte ou un feedback connu).
    4.  Modifiez l'ID dans l'URL pour tenter de récupérer un feedback qui ne vous appartient pas (par exemple, `http://localhost:3000/api/feedback/2`).
    5.  Observez que les détails du feedback sont renvoyés sans aucune vérification que l'utilisateur est le propriétaire du feedback ou a le droit d'y accéder.
    *   **ZAP Detection**: Des outils comme ZAP peuvent détecter les IDOR par des tests de mutation des ID. Les tests manuels sont également très efficaces en variant les ID.
*   **Impact**: Violation de la confidentialité. Un attaquant peut accéder, visualiser ou potentiellement modifier des enregistrements appartenant à d'autres utilisateurs, compromettant la vie privée et l'intégrité des données.
*   **Emplacement dans le code**: `routes/feedback.js` (dans le point de terminaison `router.get('/:id', ...)` ) - absence de vérification de la propriété du `customer_id`.

---

## 5. A05:2021 - Mauvaise configuration de sécurité (Messages d'erreur verbeux)

*   **Vulnérabilité**: Divulgation d'informations sensibles via des messages d'erreur verbeux
*   **Point de terminaison**: N'importe quel point de terminaison générant une erreur non gérée
*   **Description**: Le serveur est configuré pour renvoyer des messages d'erreur détaillés, y compris les traces de pile (stack traces), directement au client en cas d'erreur. Ces informations verbeuses peuvent révéler des détails internes sur l'architecture du serveur, les versions des logiciels, les chemins de fichiers, les requêtes de base de données, et d'autres données sensibles qui pourraient aider un attaquant à mieux comprendre le système et à trouver de nouvelles vulnérabilités.
*   **Comment détecter/exploiter**:
    1.  Provoquez intentionnellement une erreur sur n'importe quel point de terminaison de l'API (par exemple, en envoyant des données invalides à un point de terminaison `POST` ou `PUT` ou en essayant d'accéder à une ressource inexistante avec un ID non valide).
    2.  Observez que la réponse d'erreur inclut une trace de pile détaillée ou des messages d'erreur techniques.
    *   **ZAP Detection**: Les scanners actifs de ZAP (comme l'Active Scan) peuvent souvent déclencher des erreurs et identifier les informations divulguées dans les réponses.
*   **Impact**: Divulgation d'informations. Un attaquant obtient des informations précieuses sur la configuration interne de l'application et du serveur, ce qui peut faciliter d'autres attaques ciblées.
*   **Emplacement dans le code**: `server.js` (middleware de gestion d'erreurs global, avant `app.listen`).

---

## 6. A03:2021 - Injection (Valeurs de prix de service négatives)

*   **Vulnérabilité**: Manque de validation des entrées pour les prix négatifs
*   **Point de terminaison**: `POST /api/services` et `PUT /api/services/{id}`
*   **Description**: L'application ne valide pas que le prix d'un service soit une valeur positive. Cela permet à un utilisateur, via les points de terminaison de création ou de mise à jour de service, de définir un prix négatif pour un service. Bien que la base de données PostgreSQL accepte techniquement les valeurs négatives pour un type `DECIMAL`, l'absence de validation au niveau de l'application est une faille dans la logique métier qui pourrait avoir des implications financières inattendues (par exemple, des factures où le garage "paie" le client).
*   **Comment détecter/exploiter**:
    1.  Connectez-vous en tant qu'utilisateur `admin` (utilisez l'enregistrement ou les informations d'identification par défaut si disponibles).
    2.  Obtenez un jeton JWT valide.
    3.  Effectuez une requête `POST` vers `http://localhost:3000/api/services` avec un corps JSON contenant un `price` négatif (par exemple, `{ "name": "Service Gratuit", "description": "Service avec un prix négatif", "price": -100.00 }`).
    4.  Effectuez une requête `PUT` vers `http://localhost:3000/api/services/{id}` avec un corps JSON contenant un `price` négatif pour un service existant.
    5.  Vérifiez que le service est créé/mis à jour avec le prix négatif.
    *   **Détection ZAP**: ZAP peut utiliser le "Fuzzer" pour tester des valeurs numériques négatives dans les champs de prix lors des requêtes `POST` ou `PUT` vers les points de terminaison de service.
*   **Impact**:
    *   **Fraude financière**: Un acteur malveillant pourrait manipuler les prix pour créer des scénarios où les clients reçoivent un "crédit" ou où les comptes financiers du garage sont faussés.
    *   **Incohérence des données**: Conduit à des données illogiques dans la base de données qui pourraient causer d'autres erreurs ou vulnérabilités.
*   **Emplacement dans le code**: `routes/services.js` (méthodes `POST /` et `PUT /:id`) - absence de validation explicite du prix.

---

## 7. A05:2021 - Mauvaise configuration de sécurité (Exposition des erreurs de base de données)

*   **Vulnérabilité**: Divulgation d'informations sensibles via les messages d'erreur de base de données
*   **Point de terminaison**: `POST /api/vehicles`
*   **Description**: En cas d'erreur de base de données lors de la création d'un véhicule (par exemple, une violation de contrainte unique pour la `license_plate` ou le `vin`), l'API renvoie directement le message d'erreur brut de la base de données au client. Cela expose des détails sur le schéma de la base de données, les noms de colonnes et la logique interne, qui peuvent être exploités par un attaquant.
*   **Comment détecter/exploiter**:
    1.  Connectez-vous en tant qu'utilisateur `admin`.
    2.  Obtenez un jeton JWT valide.
    3.  Tentez de créer un véhicule en envoyant une requête `POST` à `http://localhost:3000/api/vehicles` avec des données qui devraient provoquer une erreur de base de données (par exemple, en essayant de créer deux véhicules avec la même `license_plate` ou le même `vin`).
    4.  Examinez la réponse d'erreur et observez la présence de messages d'erreur SQL bruts.
    *   **ZAP Detection**: Les scanners actifs de ZAP peuvent identifier les informations divulguées dans les réponses d'erreur, surtout s'ils fuzzer des champs avec des valeurs dupliquées ou invalides.
*   **Impact**: Divulgation d'informations. Un attaquant obtient des informations précieuses sur la structure de la base de données et les contraintes, ce qui peut faciliter des attaques d'injection SQL ou d'autres exploits ciblés.
*   **Emplacement dans le code**: `routes/vehicles.js` (méthode `POST /`).

---

## 8. A04:2021 - Conception Insecure (Décalage d'ID sur les véhicules)

*   **Vulnérabilité**: Récupération d'un objet adjacent non intentionnel
*   **Point de terminaison**: `GET /api/vehicles/{id}`
*   **Description**: Ce point de terminaison est destiné à récupérer un véhicule spécifique en utilisant son identifiant numérique. Cependant, en raison d'une faille logique intentionnellement introduite, le serveur renvoie toujours le véhicule dont l'ID est `id + 1` plutôt que le véhicule dont l'ID est demandé. Cela peut conduire à un accès inattendu à des données de véhicules adjacents ou à une énumération des enregistrements.
*   **Comment détecter/exploiter**:
    1.  Connectez-vous en tant qu'utilisateur `admin`.
    2.  Obtenez un jeton JWT valide.
    3.  Récupérez un véhicule avec un ID connu (par exemple, `GET http://localhost:3000/api/vehicles/1`).
    4.  Observez que le véhicule renvoyé a un ID de `2` (ou `id + 1` de la requête initiale).
    5.  Cela peut être utilisé pour énumérer des enregistrements consécutifs ou pour découvrir des véhicules auxquels l'utilisateur n'est pas censé avoir accès en manipulant subtilement l'ID.
    *   **ZAP Detection**: Les tests manuels sont efficaces pour identifier cette faille. ZAP pourrait potentiellement aider à l'énumération une fois le comportement découvert.
*   **Impact**: Divulgation inattendue de données. Un attaquant peut accéder à des informations sur des véhicules non sollicités, ce qui peut potentiellement conduire à une énumération d'enregistrements.
*   **Emplacement dans le code**: `routes/vehicles.js` (méthode `GET /:id`) - L'ID est incrémenté avant la requête à la base de données.

---

## 9. A01:2021 - Contrôle d'accès défaillant / A08:2021 - Échecs d'intégrité logicielle et des données (Écrasement de compte lors de l'enregistrement)

*   **Vulnérabilité**: Écrasement de compte lors de l'enregistrement
*   **Point de terminaison**: `POST /api/auth/register`
*   **Description**: Ce point de terminaison permet la création de nouveaux utilisateurs. Cependant, si un utilisateur tente de s'enregistrer avec un nom d'utilisateur (username) qui existe déjà, le système ne rejette pas la demande mais met à jour le mot de passe et le rôle de l'utilisateur existant avec les nouvelles informations fournies. Cela signifie qu'un attaquant peut facilement prendre le contrôle de n'importe quel compte existant en connaissant simplement son nom d'utilisateur et en s'enregistrant à nouveau avec ce même nom d'utilisateur et un nouveau mot de passe.
*   **Comment détecter/exploiter**:
    1.  Enregistrez un nouvel utilisateur (par exemple, `testuser` avec `password123` et rôle `user`).
    2.  Tentez de vous enregistrer à nouveau avec le même nom d'utilisateur (`testuser`) mais avec un nouveau mot de passe (par exemple, `newpassword`) et potentiellement un nouveau rôle (`admin`).
    3.  Connectez-vous avec `testuser` et `newpassword`. Vous devriez réussir, prouvant que le compte a été écrasé.
    *   **ZAP Detection**: Les fuzzer de ZAP sur les formulaires d'enregistrement avec des noms d'utilisateur connus peuvent aider à détecter cette vulnérabilité. Les tests manuels sont très efficaces pour confirmer le comportement.
*   **Impact**:
    *   **Compromission totale de compte**: Un attaquant peut prendre le contrôle de n'importe quel compte existant.
    *   **Escalade de privilèges**: Si l'attaquant spécifie un rôle `admin`, il peut obtenir des privilèges d'administrateur.
    *   **Violation de l'intégrité des données**: Les informations du compte d'un utilisateur légitime sont modifiées sans son consentement.
*   **Emplacement dans le code**: `routes/auth.js` (méthode `POST /register`) - Utilisation de `ON CONFLICT (username) DO UPDATE` dans la requête SQL.

---

## 10. A07:2021 - Échecs d'identification et d'authentification (Authentification par n'importe quel mot de passe)

*   **Vulnérabilité**: Authentification non sécurisée - N'importe quel mot de passe fonctionne
*   **Point de terminaison**: `POST /api/auth/login`
*   **Description**: Le point de terminaison de connexion est intentionnellement configuré pour accepter n'importe quel mot de passe pour un nom d'utilisateur valide. Cela signifie que la vérification réelle du mot de passe est contournée. Un attaquant n'a qu'à connaître un nom d'utilisateur valide pour se connecter avec succès, quelle que soit la force du mot de passe réel.
*   **Comment détecter/exploiter**:
    1.  Enregistrez un nouvel utilisateur (par exemple, `anotheruser` avec `securepassword`).
    2.  Tentez de vous connecter avec le nom d'utilisateur `anotheruser` et un mot de passe incorrect (par exemple, `wrongpassword` ou même un mot de passe vide).
    3.  La connexion devrait réussir malgré le mot de passe incorrect.
    *   **ZAP Detection**: Les tests d'authentification de ZAP, en particulier les tests de force brute où le dictionnaire est très limité ou inexact, peuvent rapidement identifier cette faille.
*   **Impact**:
    *   **Contournement total de l'authentification**: N'importe qui peut se connecter en connaissant un nom d'utilisateur valide.
    *   **Accès non autorisé**: Accès complet à tous les comptes d'utilisateurs et aux fonctionnalités de l'API.
    *   **Violation des données**: Les données sensibles associées aux comptes peuvent être consultées ou manipulées.
*   **Emplacement dans le code**: `routes/auth.js` (méthode `POST /login`) - Le `bcrypt.compare` a été désactivé/contourné.

---

## 11. A05:2021 - Mauvaise configuration de sécurité (Exposition d'informations sensibles - App/DB)

*   **Vulnérabilité**: Exposition d'informations sensibles sur l'application et la base de données
*   **Point de terminaison**: `GET /api/info`
*   **Description**: Ce point de terminaison permet à tout utilisateur authentifié (qu'il soit admin ou non) de récupérer le nom et la version de l'application (tirées de `package.json`), ainsi que le port de la base de données (tiré de `.env`). Ces informations peuvent aider un attaquant à cibler des vulnérabilités spécifiques aux versions logicielles ou à trouver des services réseau exposés.
*   **Comment détecter/exploiter**:
    1.  Connectez-vous en tant qu'utilisateur `user` standard (ou `admin`).
    2.  Obtenez un jeton JWT valide.
    3.  Effectuez une requête `GET` vers `http://localhost:3000/api/info` en utilisant le jeton JWT.
    4.  Observez que le nom, la version de l'application et le port de la base de données sont renvoyés.
    *   **ZAP Detection**: ZAP peut identifier ce type de divulgation d'informations lors de son analyse active.
*   **Impact**: Divulgation d'informations techniques qui peuvent faciliter d'autres attaques ciblées, telles que la recherche de CVEs spécifiques à la version de l'application ou l'identification de points d'entrée potentiels vers la base de données.
*   **Emplacement dans le code**: `routes/info.js` (méthode `GET /`).

---

## 12. A07:2021 - Échecs d'identification et d'authentification (Vérification de jeton défaillante)

*   **Vulnérabilité**: Vérification de jeton JWT défaillante
*   **Point de terminaison**: Toutes les routes authentifiées (utilisant `authenticateToken`)
*   **Description**: Le middleware `authenticateToken` ne vérifie pas cryptographiquement la signature du jeton JWT. Il se contente de le décoder et d'extraire les informations qu'il contient. Cela signifie qu'un attaquant peut créer un jeton JWT arbitraire (avec n'importe quelle signature, même invalide) et se faire passer pour n'importe quel utilisateur en modifiant le contenu du jeton décodé (par exemple, son `id`, `username` ou `role`).
*   **Comment détecter/exploiter**:
    1.  Créez un faux jeton JWT avec un contenu arbitraire (par exemple, en utilisant un site comme jwt.io). Assurez-vous d'inclure les champs `id`, `username` et `role` (par exemple, `{"id": 1, "username": "admin", "role": "admin"}`). La signature n'a pas d'importance.
    2.  Utilisez ce faux jeton dans l'en-tête `Authorization: Bearer <faux_jeton>` pour accéder à n'importe quelle route authentifiée.
    3.  Observez que l'accès est accordé et que l'application croit que vous êtes l'utilisateur spécifié dans le jeton.
    *   **ZAP Detection**: Les scanners actifs peuvent tenter de manipuler les jetons JWT pour détecter cette vulnérabilité. Les tests manuels sont très efficaces pour confirmer le comportement.
*   **Impact**:
    *   **Contournement total de l'authentification**: Un attaquant peut usurper l'identité de n'importe quel utilisateur, y compris les administrateurs.
    *   **Accès non autorisé**: Accès complet à tous les comptes d'utilisateurs et aux fonctionnalités de l'API sans aucune authentification valide.
*   **Emplacement dans le code**: `middleware/authMiddleware.js` (fonction `authenticateToken`).

---

## 13. A01:2021 - Contrôle d'accès défaillant (Escalade de privilèges via manipulation du rôle)

*   **Vulnérabilité**: Escalade de privilèges via manipulation du rôle dans le jeton JWT
*   **Point de terminaison**: Toutes les routes utilisant `authorizeRoles`
*   **Description**: Le middleware `authorizeRoles` a une faille logique intentionnellement introduite. Si le rôle extrait du jeton JWT (qui n'est pas vérifié cryptographiquement, voir la vulnérabilité précédente) est "admin", le middleware accorde un accès, *même si* la route ne devrait normalement pas être accessible à ce rôle. En combinant cette vulnérabilité avec la "Vérification de jeton défaillante", un attaquant peut facilement se faire passer pour un administrateur en manipulant le rôle dans son jeton.
*   **Comment détecter/exploiter**:
    1.  Créez un faux jeton JWT (comme décrit dans la vulnérabilité précédente) avec un rôle défini sur "admin" (par exemple, `{"id": 123, "username": "attacker", "role": "admin"}`).
    2.  Utilisez ce faux jeton dans l'en-tête `Authorization: Bearer <faux_jeton>` pour accéder à une route qui devrait être limitée aux rôles "user" (par exemple, `GET /api/customers` qui est désormais accessible aux utilisateurs standard mais pas aux "vrais" admins si le token était valide). Ou mieux, utilisez-le pour accéder à une route admin-only si elle n'est pas censée être accessible du tout.
    3.  Ou, testez une route qui est normalement admin-only (par exemple, `DELETE /api/customers/{id}`). Un utilisateur non-admin, avec un jeton manipulé pour inclure `"role": "admin"`, devrait pouvoir y accéder.
    *   **ZAP Detection**: ZAP peut aider à tester les contrôles d'accès pour différents rôles, en particulier si l'on peut configurer les sessions pour simuler des rôles.
*   **Impact**:
    *   **Escalade de privilèges directe**: Un attaquant peut obtenir un accès complet aux fonctionnalités d'administrateur.
    *   **Compromission du système**: Possibilité d'effectuer des opérations sensibles (suppression de données, modification de configurations).
*   **Emplacement dans le code**: `middleware/authMiddleware.js` (fonction `authorizeRoles`).

---

## 14. A03:2021 - Injection (Injection SQL - Recherche de clients par nom)

*   **Vulnérabilité**: Injection SQL classique via le paramètre de recherche `last_name`
*   **Point de terminaison**: `GET /api/customers` (lorsque le paramètre `last_name` est utilisé)
*   **Description**: Le point de terminaison `GET /api/customers` accepte un paramètre de requête `last_name` pour filtrer les clients. Sa valeur est directement concaténée dans la clause `WHERE` de la requête SQL sans assainissement, le rendant vulnérable aux attaques par injection SQL.
*   **Comment détecter/exploiter**:
    1.  Connectez-vous en tant qu'utilisateur `admin` ou `user`.
    2.  Obtenez un jeton JWT valide.
    3.  Effectuez une requête `GET` vers `http://localhost:3000/api/customers?last_name=<payload>` avec une charge utile malveillante.
    4.  **Exemples de charges utiles**:
        *   `http://localhosts:3000/api/customers?last_name=' OR 1=1 --` (Devrait renvoyer tous les clients)
        *   `http://localhosts:3000/api/customers?last_name=' UNION SELECT NULL, NULL, NULL, table_name, NULL FROM information_schema.tables --` (Selon le nombre de colonnes et les privilèges de la base de données, pourrait divulguer les noms des tables).
    *   **ZAP Detection**: Les scanners actifs sont très efficaces pour détecter les vulnérabilités d'injection SQL.
*   **Impact**:
    *   **Confidentialité des données**: Les attaquants peuvent récupérer des données sensibles d'autres tables de la base de données.
    *   **Intégrité des données**: Les attaquants pourraient modifier ou supprimer des données.
*   **Emplacement dans le code**: `routes/customers.js` (dans le point de terminaison `router.get('/', ...)` ).

---

## 15. A01:2021 - Contrôle d'accès défaillant (Suppression non authentifiée)

*   **Vulnérabilité**: Suppression de ressources sans authentification ni autorisation
*   **Point de terminaison**: `DELETE /api/feedback/{id}`
*   **Description**: Le point de terminaison `DELETE /api/feedback/{id}` permet de supprimer un élément de feedback spécifique. Il est intentionnellement mal configuré pour ne nécessiter *aucune* authentification ni autorisation. N'importe qui peut supprimer n'importe quel feedback en connaissant son ID, sans être connecté.
*   **Comment détecter/exploiter**:
    1.  Identifiez l'ID d'un élément de feedback existant (par exemple, via `GET /api/feedback/{id}` en tant qu'utilisateur authentifié).
    2.  Effectuez une requête `DELETE` vers `http://localhost:3000/api/feedback/{id}` *sans* aucun en-tête `Authorization`.
    3.  Vérifiez que le feedback est supprimé avec succès.
    *   **ZAP Detection**: ZAP peut détecter les points de terminaison qui ne nécessitent pas d'authentification pour des opérations sensibles.
*   **Impact**: Violation de l'intégrité des données. Un attaquant peut supprimer arbitrairement des données, causant une perte d'informations ou une perturbation du service.
*   **Emplacement dans le code**: `routes/feedback.js` (méthode `DELETE /:id`) - absence de middlewares `authenticateToken` et `authorizeRoles`.

---

## 16. A05:2021 - Mauvaise configuration de sécurité (Désactivation des en-têtes de sécurité)

*   **Vulnérabilité**: Absence de protection par les en-têtes de sécurité HTTP
*   **Point de terminaison**: Global (tous les points de terminaison)
*   **Description**: L'application désactive intentionnellement des en-têtes de sécurité HTTP cruciaux tels que `X-Content-Type-Options`, `Content-Security-Policy (CSP)` et `Strict-Transport-Security (HSTS)`. L'absence de ces en-têtes rend l'application vulnérable à des attaques côté client (par exemple, MIME-sniffing, Cross-Site Scripting, clickjacking) qui seraient autrement atténuées.
*   **Comment détecter/exploiter**:
    1.  Effectuez une requête `GET` vers n'importe quel point de terminaison de l'API (par exemple, `/`).
    2.  Inspectez les en-têtes de la réponse HTTP.
    3.  Observez l'absence ou la désactivation explicite des en-têtes `X-Content-Type-Options`, `Content-Security-Policy`, et `Strict-Transport-Security`.
    *   **ZAP Detection**: ZAP peut analyser les en-têtes de sécurité HTTP et signaler les manquants ou mal configurés.
*   **Impact**: Augmentation de la vulnérabilité aux attaques côté client, pouvant mener à l'exécution de code arbitraire, au vol de sessions, ou à d'autres compromissions côté client.
*   **Emplacement dans le code**: `server.js` (middleware global `app.use` après `express.json()`).

---

## 17. A05:2021 - Mauvaise configuration de sécurité (Messages d'erreur verbeux spécifiques - Services)

*   **Vulnérabilité**: Divulgation d'informations sensibles via des messages d'erreur verbeux spécifiques
*   **Point de terminaison**: `GET /api/services/{id}`
*   **Description**: En plus du gestionnaire d'erreurs global, ce point de terminaison spécifique est configuré pour renvoyer des messages d'erreur détaillés, y compris les traces de pile, directement au client en cas d'erreur. Tenter d'accéder à un service avec un ID non valide (par exemple, une chaîne de caractères au lieu d'un nombre) révélera des détails internes précieux.
*   **Comment détecter/exploiter**:
    1.  Connectez-vous en tant qu'utilisateur `admin` ou `user`.
    2.  Obtenez un jeton JWT valide.
    3.  Effectuez une requête `GET` vers `http://localhosts:3000/api/services/abc` (où 'abc' est un ID non numérique).
    4.  Observez que la réponse d'erreur inclut une trace de pile détaillée, révélant la structure de l'application.
    *   **ZAP Detection**: Les scanners actifs de ZAP (comme l'Active Scan) peuvent identifier les informations divulguées dans les réponses d'erreur, notamment lors du fuzzing des paramètres.
*   **Impact**: Divulgation d'informations sur la structure de l'application, les requêtes SQL, et les technologies utilisées, facilitant d'autres attaques ciblées.
*   **Emplacement dans le code**: `routes/services.js` (méthode `GET /:id` spécifique).

---

## 18. A05:2021 - Mauvaise configuration de sécurité (Messages d'erreur verbeux spécifiques - Factures)

*   **Vulnérabilité**: Divulgation d'informations sensibles via des messages d'erreur verbeux spécifiques
*   **Point de terminaison**: `GET /api/invoices/{id}`
*   **Description**: Similaire à `/api/services/{id}`, ce point de terminaison pour les factures expose également des traces de pile détaillées en cas d'erreur (par exemple, ID non valide).
*   **Comment détecter/exploiter**:
    1.  Connectez-vous en tant qu'utilisateur `admin`.
    2.  Obtenez un jeton JWT valide.
    3.  Effectuez une requête `GET` vers `http://localhosts:3000/api/invoices/xyz` (où 'xyz' est un ID non numérique).
    4.  Observez la trace de pile détaillée dans la réponse d'erreur.
    *   **ZAP Detection**: Identique à la vulnérabilité précédente, les scanners actifs peuvent détecter ce type de divulgation.
*   **Impact**: Divulgation d'informations sur la structure de l'application et les requêtes SQL, aidant à cibler d'autres vulnérabilités.
*   **Emplacement dans le code**: `routes/invoices.js` (méthode `GET /:id` spécifique).

---

## 19. A02:2021 - Défaillances cryptographiques (Exposition du hachage de mot de passe)

*   **Vulnérabilité**: Exposition du hachage de mot de passe d'utilisateur
*   **Point de terminaison**: `GET /api/users/{id}`
*   **Description**: Ce nouveau point de terminaison permet aux administrateurs de récupérer les détails d'un utilisateur par son ID. Cependant, il expose intentionnellement le hachage complet du mot de passe de l'utilisateur. En production, les hachages de mots de passe ne devraient jamais être récupérables via une API, même par des administrateurs, car cela facilite les attaques par dictionnaire ou par force brute hors ligne si le hachage est compromis.
*   **Comment détecter/exploiter**:
    1.  Connectez-vous en tant qu'utilisateur `admin`.
    2.  Obtenez un jeton JWT valide.
    3.  Créez un nouvel utilisateur (par exemple, `someuser` avec `secretpass`).
    4.  Effectuez une requête `GET` vers `http://localhosts:3000/api/users/{id}` (où `{id}` est l'ID de `someuser`).
    5.  Observez que la réponse inclut le champ `password` contenant le hachage bcrypt complet du mot de passe de `someuser`.
    *   **ZAP Detection**: L'analyse active de ZAP pourrait identifier la divulgation d'informations sensibles telles que les hachages de mots de passe dans les réponses.
*   **Impact**: Divulgation de données sensibles. La révélation des hachages de mots de passe permet des attaques hors ligne, potentiellement conduisant à la récupération du mot de passe en texte clair et à la compromission du compte.
*   **Emplacement dans le code**: `routes/users.js` (méthode `GET /:id`).

---

## 20. A05:2021 - Mauvaise configuration de sécurité (CORS - Autoriser toutes les origines)

*   **Vulnérabilité**: Configuration CORS permissive
*   **Point de terminaison**: Global (tous les points de terminaison)
*   **Description**: L'application est configurée pour autoriser toutes les requêtes cross-origin (`*`) via l'en-tête `Access-Control-Allow-Origin`. Cette configuration permissive peut exposer l'application à des attaques telles que le vol de jetons d'authentification (si des en-têtes d'autorisation ou des cookies sont envoyés) ou d'autres attaques basées sur le navigateur (XSS) si une autre vulnérabilité est présente.
*   **Comment détecter/exploiter**:
    1.  Effectuez une requête `GET` vers n'importe quel point de terminaison de l'API (par exemple, `/`).
    2.  Inspectez les en-têtes de la réponse HTTP.
    3.  Observez l'en-tête `Access-Control-Allow-Origin: *`.
    *   **ZAP Detection**: ZAP peut analyser les en-têtes CORS et signaler les configurations permissives.
*   **Impact**: Vulnérabilité accrue aux attaques client-side comme le vol de session, l'exfiltration de données, ou l'exécution de scripts malveillants depuis un domaine tiers.
*   **Emplacement dans le code**: `server.js` (middleware `cors()`).

---

Ce document devrait servir de guide à vos étudiants pour identifier et signaler ces vulnérabilités.
