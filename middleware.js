module.exports.isLoggedIn = (req,res,next)=>{
        req.flash("error","You must be logged in first")
        return res.redirect("/login");
        next();

};