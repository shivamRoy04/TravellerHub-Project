module.exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next(); // ✅ allow access if authenticated
    }
    req.flash("error", "You must be logged in first");
    res.redirect("/login");
};
