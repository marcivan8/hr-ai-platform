# 🚀 HR AI Platform - Documentation Complète

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Utilisation](#utilisation)
6. [API Documentation](#api-documentation)
7. [Déploiement](#déploiement)

---

## 🎯 Vue d'ensemble

**HR AI Platform** est une application intelligente de gestion des demandes RH qui utilise l'IA conversationnelle (Claude Sonnet 4.5) pour aider les employés à formuler leurs demandes et assister les RH dans leur traitement.

### Fonctionnalités principales

- 🤖 **Assistant IA conversationnel** : Interview interactive pour collecter les informations
- 💼 **8 types de demandes** : Salaire, promotion, formation, harcèlement, etc.
- 📊 **Dashboard employé** : Suivi des demandes en temps réel
- 👥 **Dashboard RH** : Gestion centralisée et analytics
- 📄 **Génération PDF** : Rapports automatiques structurés
- 🔐 **Sécurité** : Authentification JWT, encryption, RGPD-compliant
- 📱 **Responsive** : Interface adaptée mobile et desktop

---

## 🏗️ Architecture

### Stack technique

**Backend**
```
- Node.js 18+
- Express.js
- TypeScript
- MongoDB + Mongoose
- Claude AI API (Anthropic)
- JWT + bcrypt
- PDFKit
```

**Frontend**
```
- React 18
- TypeScript
- Tailwind CSS
- Axios
- Lucide Icons
```

### Structure du projet

```
hr-ai-platform/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration (DB, AI, prompts)
│   │   ├── controllers/    # Logique métier
│   │   ├── models/         # Schémas MongoDB
│   │   ├── routes/         # Routes API
│   │   ├── services/       # Services (AI, PDF)
│   │   ├── middleware/     # Auth, validation, rate limiting
│   │   ├── utils/          # Helpers
│   │   └── server.ts       # Point d'entrée
│   ├── uploads/
│   │   └── reports/        # PDFs générés
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Application principale
│   └── package.json
│
└── README.md
```

---

## 📦 Installation

### Prérequis

- **Node.js** 18+ : [Télécharger](https://nodejs.org/)
- **MongoDB** : Local ou [Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** : [Télécharger](https://git-scm.com/)
- **VS Code** (recommandé) : [Télécharger](https://code.visualstudio.com/)

### Installation rapide

```bash
# 1. Cloner le projet
git clone 
cd hr-ai-platform

# 2. Installer le backend
cd backend
npm install

# 3. Installer le frontend
cd ../frontend
npm install

# 4. Revenir à la racine
cd ..
```

---

## ⚙️ Configuration

### 1. Configuration Backend

Créez `backend/.env` :

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/hr-ai-platform
# OU MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hr-ai-platform

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-votre-cle-api-ici

# JWT
JWT_SECRET=generez_une_cle_securisee_minimum_32_caracteres

# CORS
CORS_ORIGIN=http://localhost:3000

# Encryption
ENCRYPTION_KEY=votre_cle_encryption_32_caracteres_minimum
```

#### Obtenir la clé Anthropic

1. Créez un compte sur [console.anthropic.com](https://console.anthropic.com/)
2. Allez dans "API Keys"
3. Créez une nouvelle clé
4. Copiez-la dans `.env`

**Budget recommandé** : 10-20$ pour démarrer (Claude Sonnet 4.5 : ~3$/million tokens)

#### Générer les clés secrètes

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configuration Frontend

Créez `frontend/.env` :

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

### 3. Configuration MongoDB

#### Option A : Local (Développement)

**Mac :**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Windows :**
Téléchargez depuis [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)

**Vérification :**
```bash
mongosh
```

#### Option B : MongoDB Atlas (Recommandé - Gratuit)

1. Créez un compte sur [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un cluster gratuit (M0)
3. Dans "Network Access" : ajoutez `0.0.0.0/0` (dev uniquement)
4. Dans "Database Access" : créez un utilisateur
5. Cliquez "Connect" > "Connect your application"
6. Copiez l'URI dans `backend/.env`

---

## 🚀 Utilisation

### Démarrage du projet

**Terminal 1 - Backend** :
```bash
cd backend
npm run dev
```
✅ Serveur disponible sur `http://localhost:5000`

**Terminal 2 - Frontend** :
```bash
cd frontend
npm start
```
✅ Application disponible sur `http://localhost:3000`

### Tests de l'API

```bash
# Health check
curl http://localhost:5000/api/health

# Réponse attendue :
# {"status":"ok","timestamp":"..."}
```

### Créer un compte

1. Ouvrez `http://localhost:3000`
2. Cliquez sur "S'inscrire"
3. Remplissez le formulaire :
   - Email
   - Mot de passe (8+ caractères, 1 majuscule, 1 chiffre)
   - Prénom / Nom
   - Poste / Département

### Créer une demande RH

1. Connectez-vous
2. Cliquez sur "Nouvelle demande"
3. Sélectionnez le type de demande
4. Répondez aux questions de l'IA
5. Validez et envoyez

### Dashboard RH

1. Connectez-vous avec un compte RH (role: 'hr')
2. Accédez au "Dashboard RH"
3. Visualisez les statistiques
4. Gérez les demandes
5. Exportez les rapports

---

## 📡 API Documentation

### Authentification

#### POST `/api/auth/register`
Créer un compte utilisateur.

**Body** :
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe",
  "position": "Developer",
  "department": "IT"
}
```

**Response** :
```json
{
  "success": true,
  "message": "Utilisateur créé avec succès",
  "token": "jwt-token...",
  "user": { ... }
}
```

#### POST `/api/auth/login`
Se connecter.

**Body** :
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

#### GET `/api/auth/profile`
Récupérer le profil (authentifié).

**Headers** :
```
Authorization: Bearer <token>
```

### Demandes (Requests)

#### POST `/api/requests`
Créer une nouvelle demande.

**Headers** :
```
Authorization: Bearer <token>
```

**Body** :
```json
{
  "requestType": "salary_negotiation",
  "isAnonymous": false
}
```

#### POST `/api/requests/:requestId/messages`
Envoyer un message dans la conversation.

**Body** :
```json
{
  "message": "Je souhaite une augmentation de 10%"
}
```

#### POST `/api/requests/:requestId/finalize`
Finaliser et soumettre la demande.

**Body** :
```json
{
  "structuredData": { ... }
}
```

#### GET `/api/requests/my-requests`
Récupérer mes demandes.

#### GET `/api/requests/:requestId`
Détails d'une demande.

### RH (Admin uniquement)

#### GET `/api/hr/dashboard/stats`
Statistiques du dashboard RH.

#### GET `/api/hr/requests/:requestId`
Détails d'une demande (vue RH).

#### PUT `/api/hr/requests/:requestId/review`
Mettre à jour le statut d'une demande.

**Body** :
```json
{
  "status": "resolved",
  "hrNotes": "Demande acceptée",
  "resolution": {
    "decision": "Augmentation de 8%",
    "feedback": "Excellentes performances",
    "actionTaken": "Augmentation effective le 01/12"
  }
}
```

#### GET `/api/hr/analytics`
Analytiques détaillées.

#### GET `/api/hr/reports/export`
Exporter un rapport (JSON ou CSV).

**Query params** :
- `format`: json | csv
- `status`: draft | submitted | under_review | resolved
- `startDate`: ISO date
- `endDate`: ISO date

---

## 🚢 Déploiement

### Production - Backend (Render.com)

1. Créez un compte sur [render.com](https://render.com)
2. Connectez votre repo GitHub
3. Créez un Web Service :
   - **Build Command** : `cd backend && npm install && npm run build`
   - **Start Command** : `cd backend && npm start`
   - **Environment** : Node 18
4. Ajoutez les variables d'environnement (.env)
5. Déployez

### Production - Frontend (Vercel)

1. Créez un compte sur [vercel.com](https://vercel.com)
2. Importez votre repo GitHub
3. Configuration :
   - **Framework** : Create React App
   - **Root Directory** : frontend
   - **Build Command** : npm run build
   - **Output Directory** : build
4. Ajoutez les variables d'environnement :
   - `REACT_APP_API_URL` : URL de votre backend Render
5. Déployez

### Production - MongoDB Atlas

Utilisez MongoDB Atlas (déjà configuré si suivi le guide).

---

## 🔐 Sécurité

### Checklist de sécurité

- ✅ Variables sensibles dans `.env` (jamais commitées)
- ✅ JWT avec expiration (7 jours)
- ✅ Mots de passe hashés avec bcrypt (12 rounds)
- ✅ Rate limiting sur les endpoints
- ✅ Validation des inputs
- ✅ CORS configuré
- ✅ Encryption des données sensibles
- ✅ HTTPS en production
- ✅ Audit logs pour traçabilité

### RGPD Compliance

- Consentement obligatoire
- Droit à l'anonymisation
- Droit à la suppression
- Traçabilité des accès
- Données minimales collectées

---

## 🐛 Dépannage

### MongoDB ne se connecte pas

```bash
# Vérifier si MongoDB est lancé
brew services list

# Redémarrer
brew services restart mongodb-community
```

### Port déjà utilisé

```bash
# Mac/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID  /F
```

### Erreur "Module not found"

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Clé API Anthropic invalide

- Vérifiez que la clé commence par `sk-ant-`
- Vérifiez qu'elle est bien dans `backend/.env`
- Rechargez le serveur backend

---

## 📚 Ressources

- [Documentation Node.js](https://nodejs.org/docs/)
- [Documentation Express](https://expressjs.com/)
- [Documentation MongoDB](https://www.mongodb.com/docs/)
- [Documentation Anthropic Claude](https://docs.anthropic.com/)
- [Documentation React](https://react.dev/)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)

---

## 📞 Support

Pour toute question :
1. Consultez cette documentation
2. Vérifiez les logs : `npm run dev` dans les terminaux
3. Vérifiez MongoDB : `mongosh`
4. Vérifiez les variables d'environnement

---

## 📄 Licence

MIT License - Libre d'utilisation et de modification.

---

## 🎉 Contributeurs

Développé avec ❤️ pour améliorer la communication RH.

**Version** : 1.0.0  
**Dernière mise à jour** : Novembre 2024
