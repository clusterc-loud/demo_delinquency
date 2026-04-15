const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Get MSME Prediction from ML Service
 * @param {Object} data 
 * @returns {Object} Prediction result
 */
const predictMSME = async (data) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/msme`, data);
    return response.data;
  } catch (err) {
    console.error('Error hitting ML service predict/msme:', err.message);
    throw new Error('ML Service failed to process MSME prediction');
  }
};

/**
 * Get Retail Prediction from ML Service
 * @param {Object} data 
 * @returns {Object} Prediction result
 */
const predictRetail = async (data) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/retail`, data);
    return response.data;
  } catch (err) {
    console.error('Error hitting ML service predict/retail:', err.message);
    throw new Error('ML Service failed to process Retail prediction');
  }
};

module.exports = {
  predictMSME,
  predictRetail
};
