/**
 * Middleware pour nettoyer les entrées utilisateur 
 * et prévenir les Format String Errors / Injections de base.
 */
const sanitizeInput = (req, res, next) => {
    const formatStringPattern = /%[snxdpif%]/g; // Détecte %s, %n, %x, etc.

    const scanAndClean = (obj) => {
        if (typeof obj === 'string') {
            // Option 1 : Bloquer la requête si on détecte un pattern suspect
            if (formatStringPattern.test(obj)) {
                const error = new Error(`Caractère de formatage non autorisé détecté.`);
                error.status = 400;
                throw error;
            }
            // Option 2 : Nettoyer (supprimer les %)
            // return obj.replace(/%/g, ''); 
        } else if (obj !== null && typeof obj === 'object') {
            for (let key in obj) {
                obj[key] = scanAndClean(obj[key]);
            }
        }
        return obj;
    };

    try {
        if (req.body) req.body = scanAndClean(req.body);
        if (req.query) req.query = scanAndClean(req.query);
        if (req.params) req.params = scanAndClean(req.params);
        next();
    } catch (err) {
        return res.status(err.status || 400).json({ 
            error: "Invalid Input", 
            message: err.message 
        });
    }
};

module.exports = sanitizeInput;