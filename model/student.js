
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: Number,
  Standard: String
});

module.exports = mongoose.model('Student', studentSchema);
