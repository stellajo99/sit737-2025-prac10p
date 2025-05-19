const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const winston = require('winston');
const fs = require('fs');
const client = require('prom-client');


const dbUser = process.env.MONGO_USER;
const dbPass = process.env.MONGO_PASSWORD;

mongoose.connect(`mongodb://${dbUser}:${dbPass}@mongodb:27017/calculator?authSource=admin`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("MongoDB connected");
})
.catch(err => {
  console.error("MongoDB connection error:", err);
});


const CalcLog = mongoose.model("CalcLog", {
  input: String,
  output: String,
  timestamp: { type: Date, default: Date.now }
});


const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'calculator-microservice' },
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

const app = express();
app.use(bodyParser.json());
const port = 3000;

client.collectDefaultMetrics();


app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});


function validateNumbers(num1, num2) {
  if (num1 === undefined || num2 === undefined || num1 === '' || num2 === '') {
    return 'Both num1 and num2 are required.';
  }
  if (isNaN(num1) || isNaN(num2)) {
    return 'Both num1 and num2 should be valid numbers.';
  }
  return null;
}


app.get('/', (req, res) => res.send("Task 10.1P - Updated!"));


function handleOperation(req, res, operator, func) {
  const { num1, num2 } = req.query;
  const inputLog = `${num1} ${operator} ${num2}`;
  logger.info(`Request: ${inputLog}`);
  console.log(`Request: ${inputLog}`);

  const error = validateNumbers(num1, num2);
  if (error) {
    logger.error(error);
    console.error(`Error: ${error}`);
    return res.status(400).json({ error });
  }

  try {
    const result = func(parseFloat(num1), parseFloat(num2));
    const resultLog = `${inputLog} = ${result}`;
    logger.info(`Result: ${resultLog}`);
    console.log(`Result: ${resultLog}`);
    res.json({ result });
  } catch (e) {
    logger.error(e.message);
    console.error(`Exception: ${e.message}`);
    res.status(400).json({ error: e.message });
  }
}

app.get('/add', (req, res) => handleOperation(req, res, '+', (a, b) => a + b));
app.get('/subtract', (req, res) => handleOperation(req, res, '-', (a, b) => a - b));
app.get('/multiply', (req, res) => handleOperation(req, res, '*', (a, b) => a * b));

app.get('/divide', (req, res) => {
  const { num1, num2 } = req.query;
  if (parseFloat(num2) === 0) {
    const msg = 'Cannot divide by zero.';
    logger.error(msg);
    console.error(`${msg}`);
    return res.status(400).json({ error: msg });
  }
  handleOperation(req, res, '/', (a, b) => a / b);
});

app.get('/power', (req, res) => handleOperation(req, res, '^', (a, b) => Math.pow(a, b)));

app.get('/modulo', (req, res) => {
  const { num1, num2 } = req.query;
  if (parseFloat(num2) === 0) {
    const msg = 'Cannot divide by zero in modulo operation.';
    logger.error(msg);
    console.error(`${msg}`);
    return res.status(400).json({ error: msg });
  }
  handleOperation(req, res, '%', (a, b) => a % b);
});

app.get('/sqrt', (req, res) => {
  const { num1 } = req.query;
  logger.info(`Request: sqrt(${num1})`);
  console.log(`Request: sqrt(${num1})`);

  if (num1 === undefined || num1 === '' || isNaN(num1)) {
    const error = 'num1 is required and should be a valid number.';
    logger.error(error);
    console.error(`Error: ${error}`);
    return res.status(400).json({ error });
  }

  const value = parseFloat(num1);
  if (value < 0) {
    const msg = 'Cannot take square root of a negative number.';
    logger.error(msg);
    console.error(`${msg}`);
    return res.status(400).json({ error: msg });
  }

  const result = Math.sqrt(value);
  logger.info(`Result: sqrt(${num1}) = ${result}`);
  console.log(`Result: sqrt(${num1}) = ${result}`);
  res.json({ result });
});

app.post('/api/log', async (req, res) => {
  try {
    const log = new CalcLog(req.body);
    await log.save();
    logger.info(`Log created: ${JSON.stringify(log)}`);
    console.log(`Log created: ${JSON.stringify(log)}`);
    res.json({ success: true, log });
  } catch (err) {
    logger.error(`POST /api/log failed: ${err.message}`);
    console.error(`POST Error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const logs = await CalcLog.find();
    logger.info(`${logs.length} logs retrieved`);
    console.log(`${logs.length} logs retrieved`);
    res.json(logs);
  } catch (err) {
    logger.error(`GET /api/logs failed: ${err.message}`);
    console.error(`GET Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/log/:id', async (req, res) => {
  try {
    const updated = await CalcLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    logger.info(`Log updated: ${req.params.id}`);
    console.log(`Log updated: ${req.params.id}`);
    res.json({ success: true, updated });
  } catch (err) {
    logger.error(`PUT /api/log/${req.params.id} failed: ${err.message}`);
    console.error(`PUT Error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/log/:id', async (req, res) => {
  try {
    await CalcLog.findByIdAndDelete(req.params.id);
    logger.info(`Log deleted: ${req.params.id}`);
    console.log(`Log deleted: ${req.params.id}`);
    res.json({ success: true, message: "Log deleted." });
  } catch (err) {
    logger.error(`DELETE /api/log/${req.params.id} failed: ${err.message}`);
    console.error(`DELETE Error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  logger.info(`Server running at http://0.0.0.0:${port}`);
  console.log(`Arithmetic microservice is running at http://0.0.0.0:${port}`);
});

