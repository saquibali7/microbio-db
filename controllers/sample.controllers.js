const Sample = require("../models/sample.model");

// const Student = require('../models/student.models');
const axios = require("axios");
const { dialog } = require("electron");

const pdf = require("html-pdf");

exports.createSample = async (req, res) => {
  const sample = new Sample({
    sample_id: req.body.sampleId,
    patientName: req.body.patientName,
    age: req.body.age,
    sex: req.body.sex,
    cadsNumber: req.body.cadsNumber,
    specimen: req.body.specimen,
    sampleDate: req.body.specimenDate,
    department: req.body.department,
    physician: req.body.physician,
    diagnosis: req.body.diagnosis,
    examRequired: req.body.examRequired,
  });
  sample.save((err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send(err);
    } else {
      return res.json({
        status: true,
        message: "New entry created!",
        data: result,
      });
    }
  });
};

exports.updateSample = async (req, res) => {
  const sample_id = req.body.sample_id;
  delete req.body.sample_id;
  Sample.findOneAndUpdate({ sample_id: sample_id }, { $set: { ...req.body } }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (data) {
      return res.json({
        status: true,
        message: "Sample updated!",
        data: data,
      });
    }
  });
};

exports.getSample = async (req, res) => {
  console.log(req.params);
  Sample.findOne({ sample_id: req.params.sampleId }, (err, result) => {
    if (err) {
      return res.status(500).send(err);
    } else if (!result) {
      return res.status(404).json({
        message: "Sample not found!",
      });
    } else {
      return res.json({
        status: true,
        message: "Sample found!",
        data: result,
      });
    }
  });
};

exports.getByDate = async (req, res) => {
  console.log(req.query);
  const today = new Date();
  const past = new Date();
  past.setMonth(today.getMonth() - 3);

  let startDate = past.toISOString();
  let endDate = today.toISOString();
  if (req.query.startDate && req.query.endDate) {
    startDate = new Date(req.query.startDate);
    endDate = new Date(req.query.endDate);
  }

  console.log(startDate);
  console.log(endDate);

  Sample.find({ createdAt: { $gte: startDate, $lte: endDate } })
    .sort({ createdAt: -1 })
    .exec((err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send(err);
      }
      return res.json({
        status: true,
        message: result.length + " records retrieved!",
        data: result,
      });
    });
};

exports.generateReport = async (req, res) => {
  Sample.findOne({ sample_id: req.params.sampleId }, (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (!result) {
      return res.status(404).json({
        message: "Sample not found!",
      });
    } else {
      dialog.showOpenDialog({ properties: ["openFile", "openDirectory", "multiSelections"] }).then((result) => {
        const options = {
          width: "396mm",
          height: "280mm",
          orientation: "landscape",
        };
        axios
          .get("http://localhost:3000/printTemplate/" + req.params.sampleId)
          .then((response) => {
            console.log(response.data);
            pdf.create(response.data, options).toFile(result.filePaths[0] + "/" + req.params.sampleId + "_report.pdf", (err, pdfres) => {
              if (err) {
                console.log(err);
              }
              res.status(200).send(pdfres);
            });
          })
          .catch((error) => {
            res.send(error);
          });
      });
    }
  });
};

exports.findSample = async (req, res) => {
  console.log(req.body);
  if (req.body.patientName) {
    req.body.patientName = new RegExp(req.body.patientName, "i");
  }
  Sample.find(req.body, (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    return res.json({
      status: true,
      message: result.length + " records retrieved!",
      data: result,
    });
  });
};
