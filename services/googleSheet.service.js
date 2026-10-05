const {
  GOOGLE_SHEET_ID,
  GOOGLE_SHEET_API_KEY,
  GOOGLE_SHEET_FABRIC_STYLE_MAPPING_RANGE,
  GOOGLE_SHEET_BASE_URL,
  GOOGLE_SHEET_FABRIC_AVERAGE_RANGE,
  GOOGLE_SHEET_STYLE_AVERAGE_RANGE,
} = require('../config/env');
const axios = require('axios');

const fetchFabricNoFromFabricAverageSheet = async () => {
  try {
    const sheetId = GOOGLE_SHEET_ID;
    const apiKey = GOOGLE_SHEET_API_KEY;
    const range = GOOGLE_SHEET_FABRIC_AVERAGE_RANGE;
    const url = `${GOOGLE_SHEET_BASE_URL}/${sheetId}/values/${range}?key=${apiKey}`;

    const response = await axios.get(url);

    const rows = response.data.values || [];
    const fabrics = [];

    const hasValue = (v) => v !== undefined && v !== null && String(v).trim() !== '';

    for (let i = 1; i < rows.length; i++) {
      const [
        style_number,
        pattern_number,
        article_type,
        style_image,
        fabric_1_no,
        fabric_1_name,
        fabric_1_image,
        fabric_2_no,
        fabric_2_name,
        fabric_2_image,
        fabric_3_no,
        fabric_3_name,
        fabric_3_image,
      ] = rows[i];

      if (!hasValue(fabric_1_no)) continue;

      const fabric = {
        style_number,
        pattern_number,
        article_type,
        style_image,
        fabric_1_no,
        fabric_1_name,
        fabric_1_image,
      };

      if (hasValue(fabric_2_no)) {
        fabric.fabric_2_no = fabric_2_no;
        fabric.fabric_2_name = fabric_2_name;
        fabric.fabric_2_image = fabric_2_image;
      }

      if (hasValue(fabric_3_no)) {
        fabric.fabric_3_no = fabric_3_no;
        fabric.fabric_3_name = fabric_3_name;
        fabric.fabric_3_image = fabric_3_image;
      }

      fabrics.push(fabric);
    }

    return fabrics;
  } catch (error) {
    console.error(
      'Failed to fetch fabric no data from fabric average google sheet :: ',
      error?.message
    );
    throw error;
  }
};

// fetch fabric style mapping from google sheet
const fetchFabricStyleMappingFromGoogleSheet = async () => {
  try {
    const sheetId = GOOGLE_SHEET_ID;
    const apiKey = GOOGLE_SHEET_API_KEY;
    const range = GOOGLE_SHEET_FABRIC_STYLE_MAPPING_RANGE;
    const url = `${GOOGLE_SHEET_BASE_URL}/${sheetId}/values/${range}?key=${apiKey}`;

    const response = await axios.get(url);
    const fabricStyleMappings = [];

    for (let i = 1; i < response.data.values.length; i++) {
      const [fabric_name, fabric_no, style_numbers, vendor_source, blocked_days] =
        response.data.values[i];
      if (!fabric_no) continue;

      fabricStyleMappings.push({
        fabricNo: Number(fabric_no),
        styleNumbers: style_numbers ? style_numbers.split(',').map((s) => Number(s)) : [],
        fabricName: fabric_name?.trim(),
        vendorSource: vendor_source?.trim(),
        blockedDays: Number(blocked_days),
      });
    }

    // console.log('Fabric Style Mappings fetched from Google Sheet :: ', fabricStyleMappings);
    return fabricStyleMappings;
  } catch (error) {
    console.error('Failed to fetch fabric style mappings from Google Sheet :: ', error?.message);
    throw error;
  }
};

// FETCH STYLE AVERAGE DATA FROM GOOGLE SHEET
const fetchStyleAverageDataFromGoogleSheet = async () => {
  try {
    const sheetId = GOOGLE_SHEET_ID;
    const apiKey = GOOGLE_SHEET_API_KEY;
    const range = GOOGLE_SHEET_STYLE_AVERAGE_RANGE;

    const url = `${GOOGLE_SHEET_BASE_URL}/${sheetId}/values/${range}?key=${apiKey}`;

    const response = await axios.get(url);
    const rows = response.data.values || [];

    if (rows.length <= 1) {
      return [];
    }

    const styleAverageData = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const styleNumber = Number(row[0]);
      const pattern = row[1]?.trim();

      if (!styleNumber || !pattern) {
        continue;
      }

      const fabrics = [];

      // Starting from column 3
      // Every fabric has 6 columns
      for (let index = 2; index < row.length; index += 6) {
        const [average_xxs_xs, average_s_m, average_l_xl, average_2xl_3xl, average_4xl_5xl, width] =
          row.slice(index, index + 6);

        // Check whether this fabric group actually exists
        const hasFabricData = [
          average_xxs_xs,
          average_s_m,
          average_l_xl,
          average_2xl_3xl,
          average_4xl_5xl,
          width,
        ].some((value) => value !== undefined && value !== null && String(value).trim() !== '');

        if (!hasFabricData) {
          continue;
        }

        fabrics.push({
          average_xxs_xs: Number(average_xxs_xs) || 0,
          average_s_m: Number(average_s_m) || 0,
          average_l_xl: Number(average_l_xl) || 0,
          average_2xl_3xl: Number(average_2xl_3xl) || 0,
          average_4xl_5xl: Number(average_4xl_5xl) || 0,
          width: width?.trim() || 'Normal',
        });
      }

      if (fabrics.length === 0) {
        continue;
      }

      styleAverageData.push({
        styleNumber,
        pattern,
        fabrics,
      });
    }

    console.log(
      `Google Sheet :: Total rows = ${rows.length - 1}, Parsed records = ${styleAverageData.length}`
    );

    return styleAverageData;
  } catch (error) {
    console.error('Failed to fetch style average data from Google Sheet :: ', error?.message);

    throw error;
  }
};

module.exports = {
  fetchFabricNoFromFabricAverageSheet,
  fetchFabricStyleMappingFromGoogleSheet,
  fetchStyleAverageDataFromGoogleSheet,
};
