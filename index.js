// index.js
const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Mentor = require('./model/mentor');
const Student = require('./model/student');

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(error => console.error('Could not connect to MongoDB', error));

// Create a new mentor
app.post('/mentors', async (req, res) => {
  try {
    const mentor = new Mentor(req.body);
    await mentor.save();
    res.send(mentor);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});
// Create a new student
app.post('/students', async (req, res) => {
    try {
      const student = new Student(req.body);
      await student.save();
      res.send(student);
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  });
  app.get('/',(req,res)=>{
    res.send('Welcome To Student-Mentor');
}) 

// Assign a student to a mentor
app.put('/mentors/:mentorId/students/:studentId', async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.mentorId).populate({ path: 'students', options: { strictPopulate: false } });
    const student = await Student.findById(req.params.studentId);

    if (!mentor || !student) {
      return res.status(404).send('Mentor or student not found');
    }

    if (student.mentor) {
      return res.status(400).send('Student already has a mentor');
    }

    if (mentor.students.some(s => s._id.toString() === student._id.toString())) {
      return res.status(400).send('Student is already assigned to this mentor');
    }

    mentor.students.push(student);
    student.mentor = mentor;
    await mentor.save();
    await student.save();

    res.send(mentor);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});
// Select a mentor and add multiple students
app.post('/mentors/:mentorId/students', async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.mentorId);
    const students = await Student.find({ mentor: { $exists: false } });

    if (!mentor) {
      return res.status(404).send('Mentor not found');
    }

    if (students.length === 0) {
      return res.status(400).send('No students available');
    }

    mentor.students.push(...students);
    students.forEach(student => {
      student.mentor = mentor;
      student.save();
    });
    await mentor.save();

    res.send(mentor);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// Assign or change mentor for a particular student
app.put('/students/:studentId/mentor/:mentorId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId).populate('mentor');
    const newMentor = await Mentor.findById(req.params.mentorId);

    if (!student || !newMentor) {
      return res.status(404).send('Student or mentor not found');
    }

    // Remove student from old mentor's students array
    if (student.mentor) {
      const oldMentor = await Mentor.findById(student.mentor);
      if (oldMentor) {
        oldMentor.students.pull(student);
        await oldMentor.save();
      }
    }

    // Add student to new mentor's students array
    newMentor.students.push(student);
    student.mentor = newMentor;
    await newMentor.save();
    await student.save();

    res.send(student);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});
// Select one student and assign one mentor
app.post('/assign', async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.body.mentorId);
    const student = await Student.findOne({ mentor: { $exists: false } });

    if (!mentor || !student) {
      return res.status(404).send('Mentor or student not found');
    }

    mentor.students.push(student);
    student.mentor = mentor;
    await mentor.save();
    await student.save();

    res.send(student);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});
// Show all students for a particular mentor
app.get('/mentors/:mentorId/students', async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.mentorId).populate('students');

    if (!mentor) {
      return res.status(404).send('Mentor not found');
    }

    res.send(mentor.students);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});
// Show previously assigned mentor for a particular student
app.get('/students/:studentId/mentor', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId).populate('mentor');

    if (!student) {
      return res.status(404).send('Student not found');
    }

    const mentor = student.mentor;

    if (!mentor) {
      return res.status(404).send('Student has no mentor');
    }

    res.send(mentor);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
