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
      // Wrap Papa.parse in a new Promise
      new Promise((resolve, reject) => {
        // Set a 20-second timeout
        const timeoutId = setTimeout(() => {
          reject(new Error("Processing timed out after 20 seconds"));
        }, 20000);

        Papa.parse(file, {
          complete: (result) => {
            clearTimeout(timeoutId); // Clear the timeout on successful completion
            resolve(result); // Resolve the promise with the result
          },
          error: (error) => {
            clearTimeout(timeoutId); // Clear the timeout on error
            reject(error); // Reject the promise with the error
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
        // Handle the timeout or parsing error (e.g., display an error message)
      });
    }
  };

  const processData = (data) => {
    const allowedCounties = ["CLARK", "FLOYD", "HARRISON", "WASHINGTON", "JEFFERSON", "JACKSON", "SCOTT"];
  
    // Create a new headers array based on the specified order and changes
    const newHeaders = [
      "Date", "Trip No.", "Member's Name", "Appt Time", "Pick-up Time", 
      "PU Address", "Drop-off Time", "Destination Address", "Member Signature", 
      "Month", "Week", "Base Rate", "Mileage", "Driver", "D.O.B", "Driver", 
      "Tolls", "Paid", "Notes"
    ];
  
    const getIndex = (header) => data[0].indexOf(header);
  
    // Assuming the first row of data contains headers
    let newData = data.filter((row, index) => {
      if (index === 0) return true; // Keep headers for now, will replace later
      return allowedCounties.includes(row[getIndex("Pickup County")]);
    }).map((row, index) => {
      if (index === 0) { // Modify the headers
        return newHeaders;
      } else {
        // Process each row based on new requirements
        const firstname = row[getIndex("Firstname")];
        const lastname = row[getIndex("Lastname")];
        const pickupAddress = row[getIndex("Pickup Address")];
        const pickupAddress2 = row[getIndex("Pickup Address 2")];
        const memberPhone = row[getIndex("Member Phone")];
        const destinationName = row[getIndex("Destination Name")];
        const destinationAddress = row[getIndex("Destination Address")];
        const destinationAddress2 = row[getIndex("Destination Address 2")];
        const destinationPhone = row[getIndex("Destination Phone")];
        const tripDate = new Date(row[getIndex("Trip Date")]);
        const appointmentTime = row[getIndex("Appointment Time")];
        const adjustedAppointmentTime = appointmentTime === "Will Call" ? "" : appointmentTime;
  
        const newDate = tripDate.toLocaleDateString('en-US');
        const month = tripDate.toLocaleString('en-US', { month: 'long' });
        const weekNumber = getWeekNumber(tripDate);
  
        return [
          newDate, // "Date"
          row[getIndex("Trip Number")], // "Trip No."
          `${lastname}, ${firstname}`, // "Member's Name"
          adjustedAppointmentTime,// "Appt Time"
          "", // "Pick-up Time"
          `${pickupAddress}\n${pickupAddress2}\n${memberPhone}`, // "PU Address"
          "", // "Drop-off Time"
          `${destinationName}\n${destinationAddress}\n${destinationAddress2}\n${destinationPhone}`, // "Destination Addres"
          "", // "Member Signature"
          month, // "Month"
          `Wk${weekNumber}`, // "Week"
          row[getIndex("Price")], // "Base Rate"
          row[getIndex("Mileage")], // "Mileag"
        ];
      }
    });
  
    return newData;
  };
  
  const getWeekNumber = (date) => {
    // Start with April 1 as the first week
    const startOfYear = new Date(date.getFullYear(), 3, 1); // April 1
    const diff = date - startOfYear;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekNumber = Math.ceil(diff / oneWeek);
    return 13 + weekNumber; // Adding 13 because April 1 is considered week 14
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

