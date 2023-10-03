const Jobs = require("../models/Jobs");
const userCompany = require("../models/userCompany");
const Aplicants = require("../models/Aplicants");
const { emptydatas } = require("../helpers/validations");
const { Publish } = require("../helpers/rabbitMQ");
const {MakeDecision}=require("../helpers/treeCART");
const mongoose = require('mongoose');
module.exports = {
  Fcreate: (req, res) => {
    res.render("jobs/Fcreate");
  },
  create: async (req, res) => {
    const {
      idUserCompany,
      title,
      description,
      sector,
      schedule,
      modality,
      pay,
      conocimientos,
      requisitos,
      responsabilidades,
      vacancies,
      country,
      state,
      city,
    } = req.body;

    const datasValid = [
      idUserCompany,
      title,
      description,
      sector,
      schedule,
      modality,
      pay,
      conocimientos,
      requisitos,
      responsabilidades,
      vacancies,
      country,
      state,
      city,
    ];
    if (!emptydatas(datasValid)) {
      let data={
        error:"No deje campos vacios"
      }
    res.send(data)
    } else {
      try {
        const about_job = {
          description: description,
          sector: sector,
          schedule: schedule,
          modality: modality,
          conocimientos: conocimientos,
          requisitos: requisitos,
          responsabilidades: responsabilidades,
        };
        const location = {
          country: country,
          state: state,
          city: city,
        };
        const job={
          idUserCompany,
          title,
          about_job,
          pay,
          vacancies,
          location,
        };
        const newJob = new Jobs(job);
        await newJob.save();
        const newAplicant = new Aplicants({ idJobs: newJob._id,titleJobs:title });
        await newAplicant.save();
        let data={
          ok:"Postulado Correctamente"
      }
      res.send(data);
      } catch (error) {
        return res.status(500).json({ error: error });
      }
     
    }
  },
  Fedit: async (req, res) => {
    let job;
    try {
      job = await Jobs.findById(req.params.id);
    } catch (error) {
      console.error(error);
    }
    res.render("jobs/fedit.hbs", { job });
  },
  edit: async (req, res) => {
    const _id = req.params.id;
    const {
      title,
      description,
      sector,
      schedule,
      modality,
      pay,
      conocimientos,
      requisitos,
      responsabilidades,
      vacancies,
      country,
      state,
      city,
    } = req.body;
    const datasValid = [
      title,
      description,
      sector,
      schedule,
      modality,
      pay,
      conocimientos,
      requisitos,
      responsabilidades,
      vacancies,
      country,
      state,
      city,
    ];
    if (!emptydatas(datasValid)) {
      let data={
        error:"No deje campos vacios"
      }
    res.send(data)
    } else {
      try {
        const about_job = {
          description: description,
          sector: sector,
          schedule: schedule,
          modality: modality,
          conocimientos: conocimientos,
          requisitos: requisitos,
          responsabilidades: responsabilidades,
        };
        const location = {
          country: country,
          state: state,
          city: city,
        };
        const job={
          title,
          about_job,
          pay,
          vacancies,
          location,
        }
        await Jobs.findByIdAndUpdate(_id, job);
  
        let data={
          ok:"Guardado"
        }
      res.send(data)
      } catch (error) {
        return res.status(500).json({ error: 'Failed to send message' });
      }
      
    }
  },
  delete: async (req, res) => {
    const headers = {
      tabla: "Jobs",
      peticion: "Delete",
      "x-match": "all",
    };
    Publish(headers, {
      _id: req.params.id,
    });
    const aplicants = await Aplicants.findOne({ idJobs: req.params.id });
    const headers1 = {
      tabla: "Aplicant",
      peticion: "Delete",
      "x-match": "all",
    };
    let idAplicants = aplicants._id;
    Publish(headers1, {
      _id: idAplicants,
    });
    res.send("OK");
  },
  showJobs: async (req, res) => {
  //  MakeDecision();
    let idCompanies = [];
    function checkID(_id) {
      let band = false;
      idCompanies.forEach((id) => {
        if (id === _id) {
          band = true;
          return;
        }
      });

      if (band == true) {
        return band;
      }
      idCompanies.push(_id);

      return false;
    }
    try {
      const jobs = await Jobs.find()
        .populate({ path: "idUserCompany", select: "nameCompany logo description" })
        .lean();

      jobs.forEach((job) => {
        if (!checkID(job.idUserCompany._id)) {

          job.idUserCompany.logo =
            job.idUserCompany.logo.buffer.toString("base64");
        }
      });

      res.json(jobs);
    } catch (error) {
      console.log(error);
    }
  },
  showJob: async (req, res) => {
    console.log("antes")
    if (mongoose.isValidObjectId(req.params.id)) {
      console.log("despues",req.params.id)
    let job;
    try {
      job = await Jobs.findById(req.params.id);
      if(job){
        console.log(job)
        res.send(job);
      }else{
        let data={
          error:"No se encontro el Trabajo"
        }
        
        res.send(data);
      }
    } catch (error) {
      console.error(error);
    }
  }
  },
  searchJobs: async (req, res) => {
    const { busqueda } = req.body;
    const jobs = await Jobs.find().lean();
    let filterjobs = jobs.filter(
      (job) => job.title.toLowerCase() == busqueda.toLowerCase()
    );
    res.json(filterjobs);
  },
  insertManyJobs: async (req, res) => {
    const jobsporCompany = 5;
    let contjobs=0;
    let contidUser=0;
    async function saveJobs(){
      for(let i =0;i<jobs.length;i++){
        jobs[i].idUserCompany=idCompanies[contidUser];
        jobs[i].vacancies=contidUser+1;
        const newJob = new Jobs(jobs[i]);
        await newJob.save();
        const newAplicant = new Aplicants({ idJobs: newJob._id,titleJobs:newJob.title });
        await newAplicant.save();
        contjobs++;
        if(contjobs==jobsporCompany){
          contidUser++;
          contjobs=0;
        }
      }
    } 
    let idCompanies = [];
   
    res.send("termino")
  },
  pruebaRabbit: async (req, res) => {
    const headers = {
      tabla: "Prueba",
      peticion: "Delete",
      "x-match": "all",
    };
    function sendRequests(index) {
      if (index >= 6) {
        return; // Terminar si hemos alcanzado el límite
      }

      sent(index).then((res) => {
        Publish(headers, {
          res,
        });

        // Programar la siguiente petición después de 8 segundos
        setTimeout(() => {
          sendRequests(index + 1);
        }, 3000);
      });
    }

    function sent(i) {
      return new Promise(async (resolve, reject) => {
        try {
          resolve(i);
        } catch (error) {
          reject(error);
        }
      });
    }

    // Iniciar el envío progresivo de las peticiones
    sendRequests(0);
    res.send("OK");
  },
  desicionTree: async(req, res) => {
    const id = req.params.id;
    let jobs = await MakeDecision(id);
    // console.log(jobs)
    res.json(jobs);
  },
};
