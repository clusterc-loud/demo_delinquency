const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Predict MSME credit health and other metrics
 * @param {Object} data - Input data for prediction
 * @returns {Promise<Object>} - Predicted results
 */
const predictMSME = async (data) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/msme`, data);
    return response.data;
  } catch (error) {
    console.error('Error calling ML service for MSME prediction:', error.message);
    throw error;
  }
};

/**
 * Predict retail EMI default and liquidity
 * @param {Object} data - Input data for prediction
 * @returns {Promise<Object>} - Predicted results
 */
const predictRetail = async (data) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/retail`, data);
    return response.data;
  } catch (error) {
    console.error('Error calling ML service for retail prediction:', error.message);
    throw error;
  }
};

/**
 * Check health status of the ML service
 * @returns {Promise<Object>} - Health status
 */
const checkMLHealth = async () => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/`);
    return response.data;
  } catch (error) {
    console.error('ML Service connection failed:', error.message);
    return { status: 'down', error: error.message };
  }
};

module.exports = {
  predictMSME,
  predictRetail,
  checkMLHealth,
};
