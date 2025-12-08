module.exports = function (req, res, next) {
    if (!req.user.isPremium) {
        return res.json({
            success: false,
            message: "Premium required"
        });
    }
    next();
};
