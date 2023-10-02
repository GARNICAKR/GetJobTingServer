
const express=require('express');
const router=express.Router();
const fs=require("fs");
const Controller=require('../controllers/userEmployee');
const UserEmployee=require("../models/UsersEmployee");
const {Upload,isAuthenticated}=require('../helpers/auth');
const upload=Upload();
const MultiUpload =upload.fields([
  {name:"photo",maxCount:1},
  {name:"CV",maxCount:1}
])

router.route("")
  .post(MultiUpload,Controller.Create)
  .get(Controller.Fcreate);
  router.get("/show/:id",Controller.Show);
router.route("/edit/:id")
  .put(Controller.Edit);
router.put("/editPhoto/:id",upload.single("photo"),Controller.editPhoto);
router.put("/editCV/:id",upload.single("CV"),Controller.editCV);
router.delete('/postulaciones/delete',Controller.deletePostulation);
router.get('/postulaciones/:id',Controller.showPostulations);
router.get("/notify/:id",Controller.getNotify);
router.post("/notify/:id",Controller.SeeNotify)
module.exports=router;