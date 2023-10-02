const helpers={};
const multer  = require('multer');
//La funcion de abajo permite bloqueras las vistas 
//a usuario no autorizados
helpers.isAuthenticated=(req,res,next)=>{
    if(req.isAuthenticated()){
        return next();
    }else{
        req.flash('error_msg', 'Not Autorized');
        res.redirect('/signin')
    }
};
helpers.Upload = () => {
  const storage = multer.memoryStorage();
  return multer({ storage });
}
module.exports=helpers;
