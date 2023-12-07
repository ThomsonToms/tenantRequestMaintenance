import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-analytics.js";
import { getDatabase, ref, push, onValue, query, orderByChild, equalTo, update, get, remove } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

// Predetermined IDs
const MANAGER_ID = 'Manager123'; // Replace with actual manager ID
const STAFF_ID = 'Staff456'; // Replace with actual staff ID

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAAgR-VE-7XAxBwLKn-wPYCz6sQNHnWgHU",
  authDomain: "p3-74aa7.firebaseapp.com",
  databaseURL: "https://p3-74aa7-default-rtdb.firebaseio.com",
  projectId: "p3-74aa7",
  storageBucket: "p3-74aa7.appspot.com",
  messagingSenderId: "1017967423801",
  appId: "1:1017967423801:web:24190ec7dc4f8f8d92b8e8",
  measurementId: "G-QW9QY2H9WT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);



// Function to submit a maintenance request
function submitMaintenanceRequest(requestData) {

  

    // Add a status field with the value "pending" to the requestData object
    requestData.status = "Pending";

    const newRequestRef = ref(db, 'requests');
    const newRequestKey = push(newRequestRef).key;
    const updates = {};
    updates['/requests/' + newRequestKey] = requestData;
    return update(ref(db), updates);
}


  

// Function to retrieve maintenance requests
function getMaintenanceRequests(filter, startDate, endDate) {
    let requestsQuery;
    if (filter && filter.key) {
        requestsQuery = query(ref(db, 'requests'), orderByChild(filter.key), equalTo(filter.value));
    } else {
        requestsQuery = query(ref(db, 'requests'));
    }

    onValue(requestsQuery, (snapshot) => {
        const data = snapshot.val();
        let filteredData = {};
        if (data) {
            Object.keys(data).forEach((key) => {
                const request = data[key];
                const requestDate = new Date(request.dateTime.split(" ")[0]); // Assuming dateTime is 'YYYY-MM-DD HH:MM:SS'
                const start = new Date(startDate);
                const end = new Date(endDate);

                console.log("Comparing dates:", { requestDate, start, end }); // Debugging log

                if ((!startDate || requestDate >= start) && (!endDate || requestDate <= end)) {
                    filteredData[key] = request;
                }
            });
            renderRequests(filteredData);
        } else {
            console.log("No requests found");
            const tableBody = document.getElementById('requestsTable').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '<tr><td colspan="7">No requests found</td></tr>';
        }
    }, (error) => {
        console.error("Error fetching requests: ", error);
    });
}

  

document.addEventListener("DOMContentLoaded", function() {

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const userId = document.getElementById('userId').value;

            // Check for Manager or Staff
            if (userId === MANAGER_ID) {
                window.location.href = 'manager.html'; // Manager screen
            } else if (userId === STAFF_ID) {
                window.location.href = 'staff.html'; // Staff screen
            } else {
                // Check if it's a Tenant ID
                checkTenantId(userId);
            }
        });
    }

    const addTenantForm = document.getElementById('addTenantForm');
    if (addTenantForm) {
        addTenantForm.addEventListener('submit', function(event) {
            event.preventDefault();

    // Capture the data from the form
    const tenantID = document.getElementById('tenantID').value;
    const tenantName = document.getElementById('tenantName').value;
    const tenantPhone = document.getElementById('tenantPhone').value;
    const tenantEmail = document.getElementById('tenantEmail').value;
    const checkInDate = document.getElementById('checkInDate').value;
    const checkOutDate = document.getElementById('checkOutDate').value;
    const apartmentNumber = document.getElementById('apartmentNumber').value;

    // Create a tenant object
    const newTenant = {
        tenantID,
        tenantName,
        tenantPhone,
        tenantEmail,
        checkInDate,
        checkOutDate,
        apartmentNumber
    };

    // Send this object to Firebase
    addTenant(newTenant);
    alert('Tenant Added Succesfully!');
        });
    }
    

const moveTenantForm = document.getElementById('moveTenantForm');
if (moveTenantForm) {
    moveTenantForm.addEventListener('submit', function(event) {
        event.preventDefault();

    // Capture the data from the form
    const moveTenantID = document.getElementById('moveTenantID').value;
    const newApartmentNumber = document.getElementById('newApartmentNumber').value;

    // Check if the tenant exists
    const tenantRef = ref(db, 'tenants/' + moveTenantID);
    get(tenantRef).then((snapshot) => {
        if (snapshot.exists()) {
            // Tenant exists, update the apartment number
            const updatedTenantData = {
                apartmentNumber: newApartmentNumber
            };

            updateTenant(moveTenantID, updatedTenantData);
            alert('Tenant Moved Succesfully!');
        } else {
            // Tenant does not exist, handle error or provide feedback
            console.error("Tenant not found");
            alert("Tenant not found. Please check the Tenant ID.");
        }
    }).catch((error) => {
        console.error("Error checking tenant: ", error);
        alert("There was an error checking the tenant.");
    });
    });
}



// Add an event listener to the "Delete Tenant" form
const deleteTenantForm = document.getElementById('deleteTenantForm');

if (deleteTenantForm) {
    deleteTenantForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // Get the Tenant ID from the input field
        const tenantID = document.getElementById('deleteTenantID').value;
    
        // Construct a reference to the Firebase location of the tenant data
        const tenantRef = ref(db, 'tenants/' + tenantID);
    
        // Check if the tenant data exists before attempting deletion
        get(tenantRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    // Tenant data exists, proceed with deletion
                    remove(tenantRef)
                        .then(() => {
                            alert('Tenant deleted successfully');
                            // Optionally, update the UI to reflect the deletion
                        })
                        .catch((error) => {
                            console.error('Error deleting tenant:', error);
                            alert('An error occurred while deleting the tenant');
                        });
                } else {
                    // Tenant data does not exist, show an error message
                    alert('Tenant with ID ' + tenantID + ' does not exist');
                }
            })
            .catch((error) => {
                console.error('Error checking tenant existence:', error);
                alert('An error occurred while checking tenant existence');
            });
    });
}


    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }


    const maintenanceRequestForm = document.getElementById('maintenanceRequestForm');
    if (maintenanceRequestForm) {
        // Set the apartment number if it's the tenant maintenance request page
        const savedApartmentNumber = localStorage.getItem('apartmentNumber');
        if (savedApartmentNumber) {
            document.getElementById('apartmentNumber').value = savedApartmentNumber;
        }

        maintenanceRequestForm.addEventListener('submit', function(event) {
            event.preventDefault();

            // Get form values
            const apartmentNumber = document.getElementById('apartmentNumber').value;
            const problemArea = document.getElementById('problemArea').value;
            const problemDescription = document.getElementById('problemDescription').value;
            const photoFile = document.getElementById('photoUpload').files[0];

            // Get current date and time
            const currentDate = new Date();
            const dateTime = currentDate.getFullYear() + "-" + 
                             (currentDate.getMonth() + 1) + "-" + 
                             currentDate.getDate() + " " + 
                             currentDate.getHours() + ":" + 
                             currentDate.getMinutes() + ":" + 
                             currentDate.getSeconds();

            // Construct request data object
            const requestData = {
                apartmentNumber,
                problemArea,
                description: problemDescription,
                dateTime, // Add the date and time
                // handle photo upload if implemented
            };

            // Call  submit function
            submitMaintenanceRequest(requestData).then(() => {
                alert("Request submitted successfully!");
                // Reset the form or provide further user feedback
            }).catch(error => {
                console.error("Error submitting request: ", error);
                alert("There was an error submitting your request.");
            });
        });
    }

    loadAllRequests();
});

function loadAllRequests() {
    // Call getMaintenanceRequests with no filter to retrieve all requests
    getMaintenanceRequests({});
}

// Function to check if the entered ID is a Tenant ID
function checkTenantId(userId) {
    const tenantRef = ref(db, 'tenants/' + userId);
    get(tenantRef).then((snapshot) => {
        if (snapshot.exists()) {
            const tenantData = snapshot.val();
            // Save the apartment number in local storage
            localStorage.setItem('apartmentNumber', tenantData.apartmentNumber);
            window.location.href = 'P3.html'; // Tenant screen
        } else {
            alert("Invalid ID. Please try again.");
        }
    }).catch((error) => {
        console.error("Error checking tenant ID: ", error);
    });
}


// Function to apply filters and display requests
function applyFilters() {
    // Get filter values
    const apartmentNumber = document.getElementById('filterApartmentNumber').value;
    const problemArea = document.getElementById('filterProblemArea').value;
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    console.log("Applying filters:", { startDate, endDate }); // Debugging log

    const status = document.getElementById('filterStatus').value;

    let filter = {};

    // Prioritize filters
    if (apartmentNumber) {
        filter.key = 'apartmentNumber';
        filter.value = apartmentNumber;
    } else if (problemArea) {
        filter.key = 'problemArea';
        filter.value = problemArea;
    } else if (status) {
        filter.key = 'status';
        filter.value = status;
    }

    // Call getMaintenanceRequests with the constructed filter
    getMaintenanceRequests(filter, startDate, endDate);
}


// Function to update the request status
function updateRequestStatus(requestId, newStatus) {
    const updates = {};
    updates['/requests/' + requestId + '/status'] = newStatus;
  
    // Update the status in Firebase
    return update(ref(db), updates).then(() => {
      // Update the status locally and re-render the table
      currentData[requestId].status = newStatus;
      renderRequests(currentData);
    }).catch((error) => {
      console.error("Error updating status: ", error);
    });
  }
  
  // Global variable to store the current data
  let currentData = {};
  
// Function to render requests in the table
function renderRequests(data) {
    currentData = data;
    const requestsTable = document.getElementById('requestsTable');

    if (requestsTable) {
        const tableBody = requestsTable.getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';

        Object.keys(data).forEach((key) => {
            const request = data[key];
            let row = tableBody.insertRow();

            row.innerHTML = `
                <td>${key}</td>
                <td>${request.apartmentNumber}</td>
                <td>${request.problemArea}</td>
                <td>${request.description}</td>
                <td>${request.dateTime || 'N/A'}</td>
                <td>${request.status}</td>
            `;

            let btnCell = row.insertCell(-1); // Use -1 to append the cell at the end
            
            if (request.status === 'Pending') {
                let button = document.createElement('button');
                button.textContent = 'Mark as Completed';
                button.addEventListener('click', () => updateRequestStatus(key, 'Completed'));
                btnCell.appendChild(button);
            }
        });
    } else {
        console.log("Requests table not found. No data will be displayed.");
    }
}

//to add tenant
function addTenant(tenantData) {
    
    const tenantRef = ref(db, 'tenants/' + tenantData.tenantID);
    return update(tenantRef, tenantData).then(() => {
        console.log("Tenant added successfully");
        
    }).catch((error) => {
        console.error("Error adding tenant: ", error);
    });
}

// Function to update the tenant's data
function updateTenant(tenantID, updatedData) {
    // Reference to the specific tenant in the database
    const tenantRef = ref(db, 'tenants/' + tenantID);

    // Update the tenant data
    return update(tenantRef, updatedData).then(() => {
        console.log("Tenant moved successfully");
        
    }).catch((error) => {
        console.error("Error moving tenant: ", error);
        alert("There was an error moving the tenant.");
    });
}