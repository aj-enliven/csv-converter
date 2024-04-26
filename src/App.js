import React, { useState } from 'react';
import Papa from 'papaparse';
import './App.css'

function App() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const processCSV = () => {
    if (file) {
      new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Processing timed out after 20 seconds"));
        }, 20000);

        Papa.parse(file, {
          complete: (result) => {
            clearTimeout(timeoutId);
            resolve(result);
          },
          error: (error) => {
            clearTimeout(timeoutId);
            reject(error);
          }
        });
      })
      .then(result => {
        console.log('Original Data:', result.data);
        const processedData = processData(result.data);
        downloadCSV(processedData);
      })
      .catch(error => {
        console.error('Error processing CSV:', error);
      });
    }
  };

  const processData = (data) => {
    const allowedCounties = ["CLARK", "FLOYD", "HARRISON", "WASHINGTON", "JEFFERSON", "JACKSON", "SCOTT", "CRAWFORD", "ORANGE"];
    const getIndex = (header) => data[0].indexOf(header);
    let newData = [];
    let previousDestinationPhone = "";
    let previousMemberName = "";

    data.forEach((row, index) => {
      if (index === 0) { // Modify the headers
        newData.push([
          "Date", "Trip No.", "Member's Name", "Appt Time", "Pick-up Time",
          "PU Address", "Drop-off Time", "Destination Address", "Member Signature",
          "Month", "Week", "Base Rate", "Mileage", "Driver", "D.O.B", "Driver",
          "Tolls", "Paid", "Notes"
        ]);
      } else if (allowedCounties.includes(row[getIndex("Pickup County")])) {
        const firstname = row[getIndex("Firstname")];
        const lastname = row[getIndex("Lastname")];
        const memberPhone = row[getIndex("Member Phone")];
        const destinationPhone = row[getIndex("Destination Phone")];
        let usePhone = previousDestinationPhone;

        if (previousMemberName !== `${lastname}, ${firstname}`) {
          usePhone = memberPhone;
          previousMemberName = `${lastname}, ${firstname}`;
        }

        previousDestinationPhone = destinationPhone;

        newData.push([
          new Date(row[getIndex("Trip Date")]).toLocaleDateString('en-US'), // "Date"
          row[getIndex("Trip Number")], // "Trip No."
          `${lastname}, ${firstname}`, // "Member's Name"
          row[getIndex("Appointment Time")] === "Will Call" ? "" : row[getIndex("Appointment Time")], // "Appt Time"
          "", // "Pick-up Time"
          `${row[getIndex("Pickup Address")]}\n${row[getIndex("Pickup Address 2")]}\n${usePhone}`, // "PU Address"
          "", // "Drop-off Time"
          `${row[getIndex("Destination Name")]}\n${row[getIndex("Destination Address")]}\n${row[getIndex("Destination Address 2")]}\n${destinationPhone}`, // "Destination Address"
          "", // "Member Signature"
          new Date(row[getIndex("Trip Date")]).toLocaleString('en-US', { month: 'long' }), // "Month"
          `Wk${getWeekNumber(new Date(row[getIndex("Trip Date")]))}`, // "Week"
          row[getIndex("Price")], // "Base Rate"
          row[getIndex("Mileage")], // "Mileage"
        ]);
      }
    });
    return newData;
  };

  const getWeekNumber = (date) => {
    const startOfYear = new Date(date.getFullYear(), 3, 1); // April 1
    const diff = date - startOfYear;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return 13 + Math.ceil(diff / oneWeek); // Adding 13 because April 1 is considered week 14
  };

  const downloadCSV = (data) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processed_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className='group-1'>
      <input className='choose' type="file" onChange={handleFileChange} accept=".csv" />
      <button className='button' onClick={processCSV}>Process and Download CSV</button>
    </div>
  );
}

export default App;
