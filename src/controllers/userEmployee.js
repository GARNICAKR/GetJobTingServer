const UserEmployee = require("../models/UsersEmployee");
const User = require("../models/Users");
const Jobs = require("../models/Jobs");
const { userValidation, emptydatas, files } = require("../helpers/validations");
const mongoose = require('mongoose');

const { Publish } = require("../helpers/rabbitMQ");
const fs = require("fs");
module.exports = {
  Create: async (req, res) => {
    
      const {
        mail,
        password,
        type_user,
        name,
        last_name,
        phone_number,
        country,
        state,
        city,
        sector,
      } = req.body;

     
      let validacion = await userValidation(mail, password, type_user);
      if (validacion) {
        let data={
          error:validacion
        }
        res.send(data)
      } else {
        const datavalid = [
          name,
          last_name,
          phone_number,
          country,
          state,
          city,
          sector,

        ];

        if (!emptydatas(datavalid)) {
          let data={
            error:"No deje campos vacios"
          }
          res.send(data)
        } else {
          const location = {
            country: country,
            state: state,
            city: city,
          };

          let fileValidation = files(req.files.photo[0],"photo");
          if (fileValidation) {
            let data = {
              error: fileValidation,
            };
            res.send(data);
          } else {
            fileValidation = files(req.files.CV[0],"pdf");
            if (fileValidation) {
              let data = {
                error: fileValidation,
              };
              res.send(data);
            } else {
              try {
                const CV = req.files.CV[0].buffer
              const photo = req.files.photo[0].buffer
                        
              const user= {
                mail,
                password,
                type_user,
              }
              const newUser = new User(user);
              newUser.password = await newUser.encryptPassword(content.user.password);
              
              await newUser.save();
              const newUserEmployee = new UserEmployee({
                idUser: newUser._id,
                name:name,
                last_name:last_name,
                phone_number:phone_number,
                location:location,
                sector:sector,
                university:"",
                carrera:"",
                introduction:"",
                CV:CV,
                photo:photo
                
              });
              await newUserEmployee.save();
                let data={
                  ok:"ok"
                }            
              res.send(data);
              } catch (error) {
                return res.status(500).json({ error: 'Failed to send message' });
              }
              
            }

          }
        }
      }
   
  },
  Fcreate: (req, res) => {
    res.render("users/userEmployee");
  },
  Show: async (req, res) => {
    if (mongoose.isValidObjectId(req.params.id)) {
      try {
        const employee = await UserEmployee.findById(req.params.id)
          .populate({ path: "idUser", select: "mail" })
          .lean();
    
        if (employee) {
          employee.photo = employee.photo.toString("base64");
          employee.CV = employee.CV.buffer.toString("base64");
          res.json(employee);
        } else {
          let data = {
            error: "Usuario no Encontrado",
          };
          res.send(data);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      // req.params.id no es un ID válido de MongoDB
      let data = {
        error: "ID no válido ",
      };
      // res.status(400).json(data); // Puedes usar el código de estado 400 para indicar una solicitud incorrecta
      res.send(data);
    }  

  },
  Edit: async (req, res) => {
 
    const { name, last_name, phone_number, country, state, city,university,carrera,introduction,skills,sector } =
      req.body;
    const datavalid = [
      name,
      last_name,
      phone_number,
      country,
      state,
      city,
      sector,
    ];
    if (!emptydatas(datavalid)) {
      let data = {
        error: fileValidation,
      };
      res.json(data);
    } else {
      try {
        const location = {
          country: country,
          state: state,
          city: city,
        };
        let auxSkills=JSON.parse(skills)
       const Employee= {
          name,
          last_name,
          phone_number,
          location,
          university,
          carrera,
          introduction,
          sector,
          skills:auxSkills
        }
        await UserEmployee.findByIdAndUpdate(req.params.id,Employee);
        let data = {
          ok: "Msj"
        };
        res.json(data);
      } catch (error) {
        // return res.status(500).json({ error: error });
      }
    }
  },
  showPostulations: async (req, res) => {
    
    const Employee = await UserEmployee.findById(req.params.id);

    if (!Employee.postulations) {
      return res.json({ error: "No hay postulaciones" });
    }
    
    const postulationPromises = Employee.postulations.map(async (postulation) => {
      const job1 = await Jobs.findById(postulation.idJob)
        .populate({ path: "idUserCompany", select: "nameCompany logo" })
        .lean();
    
      job1.status = postulation.status;
      job1.fecha = postulation.fecha;
      job1.idUserCompany.logo = job1.idUserCompany.logo.buffer.toString("base64");
    
      return job1;
    });
    
    const postulaciones = await Promise.all(postulationPromises);
    
    res.json(postulaciones);
  },
  deletePostulation: async (req,res)=>{
    const {idEmployee,idJob}=req.body;
    try {
      await UserEmployee.findByIdAndUpdate(idEmployee, {
        $pull: { postulations: { idJob: idJob } }
      });   
      let data={
        ok:"ok"
      }
      res.send(data);  
    } catch (error) {
      return res.status(500).json({ error: 'Failed to send message' });
    }
 
  },
  editPhoto:async(req,res)=>{
    let fileValidation=files(req.file,"photo");
          if(fileValidation){
            let data={
              error:fileValidation
            }
            res.send(data)
          }else{
            try {
              const photo = req.file.buffer
              let auxPhoto= photo.toString("base64");   
              await UserEmployee.findByIdAndUpdate(req.params.id,{photo:photo});
              let data = {
                photo:auxPhoto
              };
              res.json(data);
            } catch (error) {
              return res.status(500).json({ error: 'Failed to send message' });
            }
          }
  },
  editCV:async(req,res)=>{
    let fileValidation=files(req.file,"pdf");
          if(fileValidation){
            let data={
              error:fileValidation
            }
            res.send(data)
          }else{
            try {
              const CV = req.file.buffer
              let auxCV= CV.toString("base64");   
              await UserEmployee.findByIdAndUpdate(req.params.id,{CV:CV});
              let data = {
                CV:auxCV
              };
              res.json(data);
            } catch (error) {
              return res.status(500).json({ error: 'Failed to send message' });
            }

          }

  },

  getNotify:async (req,res)=>{
    try {
      if (mongoose.isValidObjectId(req.params.id)) {
        const Employee = await UserEmployee.findById(req.params.id).lean();
        let groupNotifySee=[];
        let groupNotifyUnSee=[];
        let bandSee=false;
        let bandUnSee=false;
        Employee.notifications.forEach(notify => {
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
       await UserEmployee.findOneAndUpdate(
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
      console.error(error);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  },
};
