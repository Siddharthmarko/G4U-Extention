const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');  
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1JdWl4uiK-zypDWPGfzw1wr4NGGoX2bFo/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */

async function SheetAPIData(auth) {
  const sheets = google.sheets({ version: 'v4', auth });

  // Fetching data from the sheet
  const fetchRes = await sheets.spreadsheets.values.get({
    spreadsheetId: '1P5S48d0WtB5X2ZF-EPBkDd-VXl7uk3eD77C7qXG1qBs',
    range: 'withGoogleImage!A1:C',
  });
  const rows = fetchRes.data.values;

  // Logging fetched data
  let data = [];
  if (!rows || rows.length === 0) {
    console.log('No data found.');
  } else {
    console.log('Fetched data:');
    rows.forEach((row) => {
      // data.push({[row[0]] : row[1], check: row[2]});
      data.push({barcode : row[0], content: row[1], check: row[2]});
      // data[row[0]] = row[1];
      // data.check = row[2];
    });
  }

  return data;
}
let sheetData = [];

// Fetch data from Google Sheets API
async function fetchData() {
    try {
        const auth = await authorize(); 
        const data = await SheetAPIData(auth);
        sheetData = data; // Store the fetched data in a global variable
        console.log('Data fetched successfully');
        return sheetData;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Save data to a JSON file
async function saveToJsonFile(data) {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    fss.writeFileSync('sheetData.json', jsonData);
    console.log('Data saved to sheetData.json');
  } catch (error) {
    console.error('Error saving data to file:', error);
    throw error;
  }
}

// Main function to fetch data and save it to JSON
async function main() {
  try {
    let data = await fetchData();
    console.log(data);
    // data = JSON.stringify(data);
    await saveToJsonFile(data);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Call the main function to start the process
main();
