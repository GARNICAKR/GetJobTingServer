const UserCompany = require("../models/userCompany");
const User = require("../models/Users");
const Jobs = require("../models/Jobs");
const Aplicants=require("../models/Aplicants");
const UserEmployee = require("../models/UsersEmployee");
const { userValidation, emptydatas,files } = require("../helpers/validations");
const { Publish } = require("../helpers/rabbitMQ");
const mongoose = require('mongoose');
const fs = require("fs");
module.exports = {
  Create: async (req, res) => {
    const {
      mail,
      password,
      type_user,
      nameCompany,
      description,
      rfc,
      sat,
      country,
      state,
      city,
  
    } = req.body;
    let validacion = await userValidation(mail, password, type_user);

    if (validacion) {
      let data={
        error:validacion
      }
      res.send(data);
    } else {
      
      const datavalid = [
        nameCompany,
        description,
        rfc,
        sat,
        country,
        state,
        city,
      
      ];
      if (!emptydatas(datavalid)) {
        let data={
          error:"No dejar espacios vacios"
        }
        res.send(data);
      } else {

          const location = {
            country: country,
            state: state,
            city: city,
      
          };
         let fileValidation=files(req.file,"photo");
          if(fileValidation){
            let data={
              error:fileValidation
            }
            res.send(data)
          }else{
            try {
              const logo = req.file.buffer;
              const user={
                mail,
                password,
                type_user
               }
              const newUser = new User(user);
              newUser.password = await newUser.encryptPassword(user.password);
              await newUser.save();
            const newUserCompany = new UserCompany({
              idUser: newUser._id,
              nameCompany:nameCompany,
              description:description,
              rfc:rfc,
              sat:sat,
              location:location,
              logo:logo,
            });
            await newUserCompany.save();
              let data={
                ok:"ok"
              }     
            res.send(data);
            } catch (error) {
              return res.status(500).json({ error: error});
            }

          }  
      }
    }
  },
  Fcreate: (req, res) => {
    res.render("users/userEmployee");
  },

  ShowCompany: async (req, res) => {
    try {
      if (mongoose.isValidObjectId(req.params.id)) {
        const Company = await UserCompany.findById(req.params.id).lean();
        Company.logo =Company.logo.buffer.toString("base64");
                   
        res.json(Company);
      }else{
        let data={
          error:"Id Invalido"
        }
        res.send(data);
      }
    } catch (error) {
      console.error(error);
    }
    

  },
  Edit: async (req, res) => {
    const {
      nameCompany,
      description,
      rfc,
      sat,
      country,
      state,
      city,
      
    } = req.body;
    const datavalid = [
      nameCompany,
      description,
      rfc,
      sat,
      country,
      state,
      city,

    ];
    if (!emptydatas(datavalid)) {
      let data={
        error:"No dejar espacios vacios"
      }
      res.send(data);
    } else {
      try {
        const location = {
          country: country,
          state: state,
          city: city,
          
        };
        await UserCompany.findByIdAndUpdate(req.params.id, {
          nameCompany:nameCompany,
          description:description,
          rfc:rfc,
          sat:sat,
          location:location,
        });
        let data={
          ok:"ok"
        }     
    res.send(data);
      } catch (error) {
        return res.status(500).json({ error: error});
      }
 
    }
   
  },
  showCompanies:async(req,res)=>{
  
    try {
      const Companies = await UserCompany.find().lean();
      //console.log("Company",Companies[0].logo);
      Companies.forEach((company) => {   
       company.logo =company.logo.buffer.toString("base64");

        });

      res.json(Companies);
    } catch (error) {
      let data = {
        error: error,
      };
      res.send(data);
    }
  },
  showJobs: async (req, res) => {
    const jobs = await Jobs.find({ idUserCompany: req.params.id });
    if (jobs.length==0) {
      let data={
        error:"No ha publicado ofertas"
      }
      res.send(data);
    }else{
      res.json(jobs);
    }
    
  },
  changeStatus:async(req,res)=>{
    try {
    const {idJob,idEmployee,status}=req.body;
    const job=await Jobs.findById(idJob);
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString();
      const aplicant = await Aplicants.findOne({ idJobs:idJob });

      aplicant.idsEmployee = aplicant.idsEmployee.map(item => {
        if (item.idEmployee === idEmployee) {
          return { idEmployee: item.idEmployee, status: status, fecha: formattedDate};
        } else {
          return item;
        }
      });
       await aplicant.save();

        const employee = await UserEmployee.findById(idEmployee);
        employee.postulations = employee.postulations.map(item => {
          if (item.idJob === idJob) {
            return { idJob: item.idJob, status: status, fecha: formattedDate};
          } else {
            return item;
          }
        });   
         await employee.save();

          const notificacion={
            notificacion:"Hubo un cambio en tu postulacion",
            state:"No Visto",
            job:job.title,
            idJob:job._id,
        }

          await UserEmployee.findByIdAndUpdate(idEmployee,{
            $push:{
            notifications: {
            $each: [notificacion],
            $slice: -40
        }}})
      let data={
          ok:"Modificado Correctamente"
           }
res.send(data);
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: error});
    }
    
    
  }, 
  editLogo:async(req,res)=>{
      try {
        let fileValidation=files(req.file,"photo");
        if(fileValidation){
          let data={
            error:fileValidation
          }
          res.send(data)
        }else{
          const logo = req.file.buffer 
            let auxlogo= logo.toString("base64");   
            await UserCompany.findByIdAndUpdate(req.params.id,{logo:logo});
            let data = {
              logo:auxlogo
            };
            res.json(data);
        }
      } catch (error) {
        return res.status(500).json({ error: error});
      }
   
  },
  getNotify:async (req,res)=>{
    try {
      if (mongoose.isValidObjectId(req.params.id)) {
        const Company = await UserCompany.findById(req.params.id).lean();
        let groupNotifySee=[];
        let groupNotifyUnSee=[];
        let bandSee=false;
        let bandUnSee=false;
         Company.notifications.forEach(notify => {
          groupNotifyUnSee.forEach(group => {
             if(group.idJob==notify.idJob ){
              bandUnSee=true
               if(notify.state=="No Visto"){
                group.numNotify++;
               }
             }
           });
           groupNotifySee.forEach(group => {
            if(group.idJob==notify.idJob ){
              bandSee=true
              if(notify.state=="Visto"){
               group.numNotify++;
              }
            }
          });

           if(bandSee==false){
            if(notify.state=="Visto"){
              let auxNotify=notify;
              auxNotify.numNotify=1;
              groupNotifySee.push(auxNotify)
             }
           }
           if(bandUnSee==false){
            if(notify.state=="No Visto"){
              let auxNotify=notify;
              auxNotify.numNotify=1;
              groupNotifyUnSee.push(auxNotify)
             }
           }
           bandUnSee=false;
           bandSee=false;
         });   
        let groupNotify={
          groupNotifySee,
          groupNotifyUnSee
        }     

        res.json(groupNotify);
      }else{
        let data={
          error:"Id Invalido"
        }
        res.send(data);
      }
    } catch (error) {
      console.error(error);
    }
  },
  SeeNotify:async (req,res)=>{
     
    try {
      if (mongoose.isValidObjectId(req.params.id)) {
        UserCompany.findOneAndUpdate(
          { _id: req.params.id }, 
          { $set: { 'notifications.$[elem].state': 'Visto' } }, 
          {
            arrayFilters: [{ 'elem.state': 'No Visto' }], 
            multi: true, 
            new: true 
          },
        ).catch(err => {
          console.error("Error al actualizar las notificaciones:", err);
        });
        let data={
          ok:"Modificado"
        }
        res.send(data);
      }else{
        let data={
          error:"Id Invalido"
        }
        res.send(data);
      }
    } catch (error) {

      return res.status(500).json({ error: error});
    }
  },

};
